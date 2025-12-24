const axios = require("axios")
const jwt = require("jsonwebtoken")

const Hospital = require('../models/hospital')
const Review = require('../models/review')
const User = require('../models/user')
const Response = require('../models/response')
const TalkTheme = require('../models/talkTheme')
const Talk = require('../models/talk')
const Form = require('../models/form')
const Message = require('../models/message')
const Feedback = require('../models/feedback')
const RefreshToken = require('../models/refreshToken')
const GiftRequest = require('../models/giftRequest')
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenFunction')


// hospital
module.exports.createReview = async (req, res)=>{
  try{
    const { id } = req.params
    const hospital = await Hospital.findById(id)
    if (!hospital) {
      return res.status(404).json({})
    }

    let { title, diseaseNames, url, treatmentTiming, comment, userId } = req.body
    if( !title || !diseaseNames || !treatmentTiming || !comment || !userId ){
      console.log('必要な情報が不足しています')
      return res.status(403).json({})
    }
    function formatCurrentDate() {
      const date = new Date();
      const year = date.getFullYear();
      const month = ("0" + (date.getMonth() + 1)).slice(-2);
      const day = ("0" + date.getDate()).slice(-2);
      return `${year}年${month}月${day}日`;
    }
    const tweetDate = formatCurrentDate()
    const delimiterRegex = /[\u3000\s、・,\/]+/
    diseaseNames = diseaseNames.trim().split(delimiterRegex)
    diseaseNames = diseaseNames.filter(name => name)
    diseaseNames = [...new Set(diseaseNames)]
    const review = new Review({
      hospital,
      title,
      diseaseNames,
      treatmentTiming,
      comment,
      url: url || null,
      author: userId,
      tweetDate,
      ownerCheck: false
    })
    await review.save()

    hospital.reviews.push(review)
    await hospital.save()

    const DBuser = await User.findById(userId)
    DBuser.reviews.push(review)
    await DBuser.save()

    return res.status(200).json({})
  } catch(e) {
    console.log('createReview関数のエラー: ', e)
    return res.status(400).json({})
  }
}
module.exports.deleteReview = async(req, res)=>{
  const { id, reviewid } = req.params
  const { user } = req.body

  let hospital = await Hospital.findById(id)
  .populate({
    path: 'reviews',
    populate: [
      {
        path: 'author'
      },
      {
        path: 'responses',
        populate: {
          path: 'author'
        }
      }]
  })
  if (!hospital) {
    return res.status(404).json({})
  }

  const review = await Review.findById(reviewid)
  if (!review) {
    return res.status(404).json({})
  }

  const author = await User.findById(review.author);
  if(!author || !user || user !== author){
    return res.status(401).json({})
  }
  
  hospital.reviews = hospital.reviews.filter(review => review._id.toString() !== reviewid)
  await hospital.save()

  await review.deleteOne()
  
  author.reviews = author.reviews.filter(_id => _id.toString() !== reviewid)
  await author.save()

  const responses = await Response.find({review})
  if (responses) {
    for(let response of responses){
      const responseAuthor = await User.findById(response.author)
      if (responseAuthor) {
        responseAuthor.responses = responseAuthor.responses.filter(_id => !_id.equals(response._id))
        await responseAuthor.save()
      }
    }
  }

  const reviews = await Review.find({ownerCheck:true}).populate('hospital').populate('author')

  return res.status(200).json({hospital, reviews})
}


// talkingRoom
module.exports.createNewTalkTheme = async(req, res)=> {
  try {
    const {title, detail, userId} = req.body
    if( !title || !detail || !userId ){
      return res.status(403).json({})
    }
    const user = await User.findById(userId)
    if(!user){ 
      return res.status(404).json({})
    }
    const talkTheme = new TalkTheme({
      author: user._id,
      title,
      detail,
      colorNum: Math.floor(Math.random()*12),
      touchAt: new Date()
    })
    await talkTheme.save()
    return res.status(200).json({})
  } catch(error) {
    console.log('createNewTalkThemeのエラー:', error)
    return res.status(400).json({})
  }
}
module.exports.createNewTalk = async(req, res)=> {
  try{
    const {id} = req.params
    const talkTheme = await TalkTheme.findById(id)
    if(!talkTheme){
      return res.status(404).json({})
    }
    const {reviewText, userId} = req.body
    if(!reviewText || !userId){
      return res.status(404).json({})
    }
    const DBuser = await User.findById(userId)
    if(!DBuser) {
      return res.status(404).json({})
    }
    const newTalk = new Talk({
      loggedInUser: userId,
      content: reviewText,
      madeAt: new Date()
    })
    await newTalk.save()
    talkTheme.talks.unshift(newTalk._id)
    talkTheme.touchAt = new Date()
    await talkTheme.save()

    if(!DBuser.points){
      DBuser.points = []
    }

    if(!DBuser.points.map(point => point.reward).includes(30)){
      DBuser.points.push({
        reward: 30,
        gettingFrom: 'おしゃべり場初回投稿',
        madeAt: new Date()
      })
      await DBuser.save()
    }
    return res.status(200).json({DBuser})
  } catch {
    return res.status(400).json({})
  }
}
module.exports.editTalkTheme = async(req, res)=> {
  const { id } = req.params
  const {title, detail} = req.body
  if( !title || !detail ){
    return res.status(404).json({})
  }
  const talkTheme = await TalkTheme.findByIdAndUpdate(id, {
    title, 
    detail
  })
  if(!talkTheme){
    return res.status(404).json({})
  }
  res.status(200).json({})
}
module.exports.deleteTalkTheme = async(req, res)=> {
  const { id } = req.params
  const { user } = req.body
  
  const talkTheme = await TalkTheme.findById(id)
  if (!talkTheme) {
    return res.status(404).json({})
  }
  if(!user || !talkTheme.author.equals(user._id)){
    return res.status(403).json({})
  }
  await talkTheme.deleteOne()
  return res.status(200).json({})
}
module.exports.deleteTalk = async(req, res)=> {
  try {
    const { talkId, userId } = req.params
    const talk = await Talk.findById(talkId)
    if(!talk.loggedInUser.equals(userId)){
      return res.status(403).json({})
    }
    talk.deleted = true
    await talk.save()
    return res.status(200).json({})
  } catch {
    return res.status(400).json({})
  }
}


// user
module.exports.register = async (req, res) => {
  const { penName, email, password } = req.body
  if (!penName || !email || !password){
    return res.status(400).json({})
  }
  const user = new User({ penName, email })
  try {
    await User.register(user, password)
    return res.status(201).json({
      message: "User registered successfully",
      success: true
    })
  } catch {
    return res.status(500).json({})
  }
}
module.exports.localLogin = async (req, res) => {
  const { email, password } = req.body
  if( !email || !password ){
    return res.status(400).json({})
  }
  try  {
    const user = await User.findOne({email})
    if(!user || user.isDeleted){
      return res.status(401).json({ })
    }
    const isValidPassword = await user.authenticate(password)
    if (!isValidPassword){
      return res.status(401).json({})
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)
    await RefreshToken.findOneAndDelete({userId: user._id})
    const newRefreshToken = new RefreshToken({
      userId: user._id,
      refreshToken
    })
    await newRefreshToken.save()
    return res.json({ accessToken, refreshToken, user })
  } catch (err) {
    console.error(err)
    return res.status(500).json({})
  }
}
module.exports.googleLogin = async (req, res) => {
  const { accessToken } = req.body
  try {
    const googleUserRes = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
    if (googleUserRes.status !== 200) {
      console.log("Google認証が無効です。")
      return res.status(401).json({ error: "Google認証が無効です。" })
    }
    const profile = googleUserRes.data

    let user = await User.findOne({ googleId: profile.id })
    if (!user) {
      user = new User({
        googleId: profile.id,
        username: profile.name,
        email: profile.email
      })
      await user.save()
    }
    const JWTaccessToken = generateAccessToken(user)
    const JWTrefreshToken = generateRefreshToken(user)
    await RefreshToken.findOneAndDelete({ userId: user._id })
    const newRefreshToken = new RefreshToken({
      userId: user._id,
      refreshToken: JWTrefreshToken
    })
    await newRefreshToken.save()
    return res.status(200).json({
      user,
      accessToken: JWTaccessToken,
      refreshToken: JWTrefreshToken
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Googleログインエラー" })
  }
}
module.exports.validateToken = async (req, res) => {
  const authHeader = req.body.Authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({})
  }
  const token = authHeader.split(" ")[1] // "Bearer"を除去
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    if(decoded.exp < Date.now()){
      console.log('アクセストークンの有効期限を過ぎています。')
      return res.status(401).json({})
    }
    const user = await User.findById(decoded.id)
    return res.status(200).json({ user })
  } catch {
    console.log('アクセストークンが無効です。')
    return res.status(401).json({})
  }
}
module.exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(401).json({})
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    console.log('リフレッシュトークンでのdecoded:', decoded)
    const storedData = await RefreshToken.findOne({userId: decoded.id})
    if (
      (storedData.refreshToken !== refreshToken) ||
      (decoded.exp < Date.now())
    ) {
      return res.status(403).json({})
    }
    const accessToken = generateAccessToken(decoded)
    return res.status(200).json({ accessToken })
  } catch (err) {
    console.log("リフレッシュトークンのエラー:", err)
    return res.status(403).json({})
  }
}
module.exports.penName = async(req, res)=>{
  const {id} = req.params
  const {penNameInput} = req.body
  if(penNameInput.trim()){
    const user = await User.findByIdAndUpdate(id, { penName: penNameInput, username: '' }, { new: true })
    if(!user){
      return res.status(401).json({})
    }
    return res.status(200).json({user})
  } else {
    return res.status(401).json({})
  }
}
module.exports.promotion = async(req, res)=>{
  const {id} = req.params
  const {promotionInput} = req.body
  const user = await User.findByIdAndUpdate(id, { promotion: promotionInput }, { new: true })
  if(!user){
    return res.status(401).json({})
  }
  return res.status(200).json({user})
}
module.exports.accountDelete = (req, res) => {
  const { id } = req.params
  User.findByIdAndUpdate(id, {isDeleted: true})
  .then(()=>{
    RefreshToken.findOneAndDelete({userId: id})
    .then(()=>{
      return res.json({delete: true})
    })
    .catch((e)=>{
      console.log('リフレッシュトークンを削除できませんでした', e)
    })
  })
  .catch((e)=>{
    console.log('userが見つかりません', e)
    return res.json({delete: false})
  })
}
module.exports.earningPoint = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if(!user) res.status(404).json({})
    const point = {
      reward: 2,
      gettingFrom: '動画広告視聴',
      madeAt: new Date()
    }
    user.points.push(point)
    user.timeOfGotPoint = new Date()
    await user.save()
    return res.status(200).json({user})
  } catch {
    return res.status(400).json({})
  }
}
module.exports.usingPoints = async (req, res) => {
  try {
    const {userId} = req.body
    const user = await User.findById(userId)
    if(!user) return res.status(404).json({})
    const totalPoints = user.points.map(point => point.reward).reduce((sum, num) => sum + num, 0) || 0
    if(totalPoints<200) return res.status(401).json({})
    user.points.push({
      reward: -200,
      gettingFrom: 'ポイント交換申請',
      madeAt: new Date()
    })
    await user.save()
    const giftRequest = new GiftRequest({
      user,
      pointsUsed: 200,
      ownerCheck: false,
      requestedAt: new Date()
    })
    await giftRequest.save()
    return res.status(200).json({user})
  } catch {
    return res.status(400).json({})
  }
}


// others
module.exports.form = async (req, res) => {
  try {
    const {formContent, authorId} = req.body;
    const newForm = new Form({
      formContent,
      author: authorId
    })
    await newForm.save();

    const newMessage = new Message({
      sender: authorId,
      reciever: process.env.ownerId,
      content: formContent
    })
    await newMessage.save();
    return res.status(200).json({});
  } catch(err) {
    console.log('フォームを保存できませんでした', err)
    return res.status(400).json({})
  }
}
module.exports.feedback = async(req, res)=>{
  try {
    const { feedbackContent } = req.body
    const feedback = new Feedback({feedbackContent})
    await feedback.save()
    return res.status(200).json({})
  } catch (err){
    console.log('フィードバックを保存できませんでした', err)
    return res.status(400).json({})
  }
}
module.exports.chatBox = async(req, res)=>{
  function removeDuplicates(array, _id) {
    return array.filter((obj, index, self) =>
      index === self.findIndex((o) => o[_id] === obj[_id])
    )
  }
  try {
    const { user } = req.body
    if(!user){
      res.status(400).json({})
    }
    const sentMessages = await Message.find({sender:user._id}).populate('reciever')
    const recievedPersons = sentMessages.filter(message => !message.reciever.isDeleted).map(messages => messages.reciever)
    const recievedMessages = await Message.find({reciever: user._id}).populate('sender')
    const sentPersons = recievedMessages.filter(message => !message.sender.isDeleted).map(messages => messages.sender)
    let contactPersons = [...recievedPersons, ...sentPersons]
    contactPersons = removeDuplicates(contactPersons, 'id')
    const contactPersonsData = []
    for(let person of contactPersons){
      const data = {
        _id: person._id,
        penName: person.penName||person.username,
      }
      contactPersonsData.push(data)
    }

    const allUsers = await User.find({})
    const usersExceptContactPersons = allUsers
      .filter(user=>!contactPersons.map(person=>person._id.toString()).includes(user._id.toString()))
      .filter(person=>person._id.toString() !== user._id.toString())
      .map((person)=>({_id: person._id, penName: person.penName||person.username}))
    
    return res.status(200).json({ 
      contactPersons: contactPersonsData,
      usersExceptContactPersons      
    })
  } catch(err) {
    console.log('連絡相手を取得できませんでした', err)
    return res.status(401).json({})
  }
}
module.exports.getMessages = async(req,res)=>{
  try {
    const { senderId, recieverId } = req.params
    const sender = await User.findById(senderId);
    if(!sender || sender.isDeleted){
      console.log('senderが見つかりません')
      return res.status(404).json({});
    }
    const reciever = await User.findById(recieverId);
    if(!reciever || reciever.isDeleted){
      console.log('recieverが見つかりません')
      return res.status(404).json({});
    }
    const senderMessages = await Message.find({sender, reciever}).populate('sender').populate('reciever');
    const recieverMessages = await Message.find({sender:reciever, reciever:sender}).populate('sender').populate('reciever');
    const messages = [...senderMessages, ...recieverMessages];
    messages.sort((a, b) => a.timestamp - b.timestamp);
  
    const messagesData = [];
    messages.forEach(message=>{
      const messageData = {
        sender: message.sender._id,
        reciever: message.reciever._id,
        content: message.content,
        timestamp: message.timestamp,
        shown: message.shown,
        _id: message._id
      }
      messagesData.push(messageData);
    })
    return res.status(200).json({
      messages: messagesData,
      penName: reciever.penName || reciever.username      
    })
  } catch(err) {
    console.log('メッセージを取得できませんでした', err)
    return res.status(401).json({})
  }
}
module.exports.othersPage = async (req, res) => {
  try {
    const { id } = req.body
    const other = await User.findById(id).populate('reviews')
    if(!other){
      return res.status(404).json({})
    }
    return res.status(200).json({other})
  } catch {
    return res.status(400).json({})
  }
}
