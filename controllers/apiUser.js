const jwt = require("jsonwebtoken")
const axios = require("axios")
const nodemailer = require("nodemailer")
const User = require('../models/user')
const RefreshToken = require('../models/refreshToken')
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenFunction')

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: 465,
  secure: true, 
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS
  }
})

async function autoSender(toUser, nums) {
  await transporter.sendMail({
    from: 'support@hearthospital.jp',
    to: toUser, 
    bcc: 'support@hearthospital.jp',
    subject: "~先天性心疾患専用 病院口コミアプリ~ HeartHospital E-mail認証番号",
    text: `※自動送信メールです。\n\nHeartHospitalをご利用いただきありがとうございます。\n認証番号を通知します。\n\n${nums}\n\n上記認証番号を所定の入力欄に入力してください。\n※認証番号は送信後10分間のみ有効です。\n\nHeartHospital\nhttps://www.hearthospital.jp`
  })
}

function random6numbers(){
  nums = Math.floor(Math.random()*1000000).toString().padStart(6, '0')
  return nums
}

module.exports.checkEmail = async (req, res) => {
  try {
    const {email} = req.body
    const nums = random6numbers()
    const expire10min = Date.now() + 1000 * 60 * 10
    await autoSender(email, nums)
    res.status(200).json({nums, expire10min})
  } catch {
    res.status(400).json({message: '認証メールが送信できませんでした'})
  }
}

module.exports.register = async (req, res) => {
  const { penName, email, password } = req.body
  if (!penName || !email || !password){
    return res.status(400).json({ message: "All fields are required" })
  }
  const user = new User({ penName, email })
  try {
    await User.register(user, password)
    res.status(201).json({ 
      message: "User registered successfully",
      success: true
    })
  } catch {
    res.status(500).json({ message: "Error creating user" })
  }
}

module.exports.localLogin = async (req, res) => {
  const { email, password, expoPushToken } = req.body
  try  {
    const user = await User.findOne({email})
    if(!user || user.isDeleted){
      return res.status(401).json({ message: 'not Found user' })
    }
    const isValidPassword = await user.authenticate(password)
    if (!isValidPassword){
      return res.status(401).json({ message: "Invalid email or password" })
    }
    if(expoPushToken){
      if(!user.expoPushToken || (user.expoPushToken&&user.expoPushToken !== expoPushToken)){
        user.expoPushToken = expoPushToken
        await user.save()
      }
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)
    await RefreshToken.findOneAndDelete({userId: user._id})
    const newRefreshToken = new RefreshToken({
      userId: user._id,
      refreshToken
    })
    await newRefreshToken.save()
    res.json({ accessToken, refreshToken, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Internal server error" })
  }
}

module.exports.googleLogin = async (req, res) => {
  const { accessToken, expoPushToken } = req.body
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
    if(expoPushToken){
      if(!user.expoPushToken || (user.expoPushToken&&user.expoPushToken !== expoPushToken)){
        user.expoPushToken = expoPushToken
        await user.save()
      }
    }
    const JWTaccessToken = generateAccessToken(user)
    const JWTrefreshToken = generateRefreshToken(user)
    await RefreshToken.findOneAndDelete({ userId: user._id })
    const newRefreshToken = new RefreshToken({
      userId: user._id,
      refreshToken: JWTrefreshToken
    })
    await newRefreshToken.save()
    res.json({ 
      user, 
      accessToken: JWTaccessToken, 
      refreshToken: JWTrefreshToken 
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Googleログインエラー" })
  }
}

module.exports.validateToken = async (req, res) => {
  const authHeader = req.body.Authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "トークンがありません。" })
  }
  const token = authHeader.split(" ")[1] // "Bearer"を除去
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    if(decoded.exp < Date.now()){
      console.log('アクセストークンの有効期限を過ぎています。')
      return res.status(401).json({ message: "アクセストークンの有効期限を過ぎています。" })
    }
    const user = await User.findById(decoded.id)
    return res.status(200).json({ user })
  } catch {
    console.log('アクセストークンが無効です。')
    return res.status(401).json({ message: "アクセストークンが無効です。" })
  }
}

module.exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(401).json({ message: "リフレッシュトークンがありません。" })
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    console.log('リフレッシュトークンでのdecoded:', decoded)
    const storedData = await RefreshToken.findOne({userId: decoded.id})
    if (
      (storedData.refreshToken !== refreshToken) || 
      (decoded.exp < Date.now()) 
    ) {
      return res.status(403).json({ message: "リフレッシュトークンが無効です。" })
    }
    const accessToken = generateAccessToken(decoded)
    return res.status(200).json({ accessToken })
  } catch (err) {
    console.log("リフレッシュトークンのエラー:", err)
    return res.status(403).json({ message: "リフレッシュトークンが無効です。" })
  }
}

module.exports.notifyTrue = async (req, res)=> {
  const {id} = req.params
  const user = await User.findByIdAndUpdate(id, {notify: true})
  if(!user || user.isDeleted){
    res.status(401).json({success: false})
  }
  res.status(200).json({success: true})
}

module.exports.notifyFalse = async (req, res)=> {
  const {id} = req.params
  const user = await User.findByIdAndUpdate(id, {notify: false})
  if(!user || user.isDeleted){
    res.status(401).json({success: false})
  }
  res.status(200).json({success: true})
}

module.exports.penName = async(req, res)=>{
  const {id} = req.params
  const {penNameInput} = req.body
  if(penNameInput.trim()){
    const user = await User.findByIdAndUpdate(id, { penName: penNameInput, username: '' }, { new: true })
    if(!user){
      res.status(401).json({message: "ユーザーが見つかりません"})
    }
    res.status(200).json({user})
  } else {
    res.status(401).json({message: 'ペンネームの入力が空欄です'})
  }
}

module.exports.promotion = async(req, res)=>{
  const {id} = req.params
  const {promotionInput} = req.body
  const user = await User.findByIdAndUpdate(id, { promotion: promotionInput }, { new: true })
  if(!user){
    res.status(401).json({message: "ユーザーが見つかりません"})
  }
  res.status(200).json({user})
}

module.exports.accountDelete = (req, res) => {
  const { id } = req.params
  User.findByIdAndUpdate(id, {isDeleted: true})
  .then(()=>{
    RefreshToken.findOneAndDelete({userId: id})
    .then(()=>{
      res.json({delete: true})
    })
    .catch((e)=>{
      console.log('リフレッシュトークンを削除できませんでした', e)
    })
  })
  .catch((e)=>{
    console.log('userが見つかりません', e)
    res.json({delete: false})
  })  
}

module.exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({
      email,
      isDeleted: false
    })
    if(!user){
      res.status(404).json({message: 'ユーザーが見つかりません'})
    }
    await user.setPassword(password)
    res.status(200).json({})
  } catch {
    res.status(400).json({message: 'パスワードの再設定に失敗しました'})
  }
}
