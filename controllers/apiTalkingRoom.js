const TalkTheme = require('../models/talkTheme')
const Talk = require('../models/talk')
const User = require('../models/user')

module.exports.talkThemesList = async(req, res)=>{
  try{
    const talkThemes = await TalkTheme.find({})
    return res.status(200).json({talkThemes})
  } catch {
    return res.status(400).json({})
  }
}

module.exports.eachTheme = async(req, res)=> {
  try {
    const {id} = req.params
    const talkTheme = await TalkTheme.findById(id)
      .populate({
          path: 'talks',
          populate: {
            path: 'loggedInUser',
            model: 'User'
          }
      })
    if(!talkTheme){
      res.status(404).json({message: 'トークテーマが見つかりません'})
    }
    talkTheme.accessCount += 1
    await talkTheme.save()
    return res.status(200).json({talkTheme})
  } catch {
    return res.status(400).json({})
  }
}

module.exports.createNewTalkTheme = async(req, res)=> {
  try {
    const {title, detailNoSpace, userId} = req.body
    if( !title || !detailNoSpace || !userId ){
      return res.status(403).json({})
    }
    const user = await User.findById(userId)
    if(!user){ 
      return res.status(404).json({})
    }
    const talkTheme = new TalkTheme({
      author: user._id,
      title,
      detail: detailNoSpace,
      colorNum: Math.floor(Math.random()*12),
      touchAt: new Date()
    })
    await talkTheme.save()
    return res.status(200).json({})
  } catch {
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
