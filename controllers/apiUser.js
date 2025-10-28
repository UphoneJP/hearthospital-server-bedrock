const jwt = require("jsonwebtoken")
const axios = require("axios")
// const nodemailer = require("nodemailer")
const User = require('../models/user')
const RefreshToken = require('../models/refreshToken')
const GiftRequest = require('../models/giftRequest')
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenFunction')

// const transporter = nodemailer.createTransport({
//   host: process.env.NODEMAILER_HOST,
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.NODEMAILER_USER,
//     pass: process.env._PASS
//   }
// })

// async function autoSender(toUser, nums) {
//   await transporter.sendMail({
//     from: 'support@hearthospital.jp',
//     to: toUser,
//     bcc: 'support@hearthospital.jp',
//     subject: "~先天性心疾患専用 病院口コミアプリ~ HeartHospital E-mail認証番号",
//     text: `※自動送信メールです。\n\nHeartHospitalをご利用いただきありがとうございます。\n認証番号を通知します。\n\n${nums}\n\n上記認証番号を所定の入力欄に入力してください。\n※認証番号は送信後10分間のみ有効です。\n\nHeartHospital\nhttps://www.hearthospital.jp`
//   })
// }

// function random6numbers(){
//   nums = Math.floor(Math.random()*1000000).toString().padStart(6, '0')
//   return nums
// }

// module.exports.checkEmail = async (req, res) => {
//   try {
//     const {email} = req.body
//     if(!email){
//       return res.status(400).json({newApiKey: req.newApiKey})
//     }
//     const nums = random6numbers()
//     const expire10min = Date.now() + 1000 * 60 * 10
//     await autoSender(email, nums)
//     return res.status(200).json({nums, expire10min, newApiKey: req.newApiKey})
//   } catch {
//     return res.status(400).json({newApiKey: req.newApiKey})
//   }
// }

module.exports.register = async (req, res) => {
  const { penName, email, password } = req.body
  if (!penName || !email || !password){
    return res.status(400).json({newApiKey: req.newApiKey})
  }
  const user = new User({ penName, email })
  try {
    await User.register(user, password)
    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      newApiKey: req.newApiKey
    })
  } catch {
    return res.status(500).json({newApiKey: req.newApiKey})
  }
}

module.exports.localLogin = async (req, res) => {
  const { email, password } = req.body
  if( !email || !password ){
    return res.status(400).json({newApiKey: req.newApiKey})
  }
  try  {
    const user = await User.findOne({email})
    if(!user || user.isDeleted){
      return res.status(401).json({newApiKey: req.newApiKey })
    }
    const isValidPassword = await user.authenticate(password)
    if (!isValidPassword){
      return res.status(401).json({newApiKey: req.newApiKey})
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
    return res.status(500).json({newApiKey: req.newApiKey})
  }
}

module.exports.googleLogin = async (req, res) => {
  const { accessToken } = req.body
  try {
    const googleUserRes = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
    if (googleUserRes.status !== 200) {
      console.log("Google認証が無効です。")
      return res.status(401).json({ error: "Google認証が無効です。", newApiKey: req.newApiKey })
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
      refreshToken: JWTrefreshToken,
      newApiKey: req.newApiKey
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Googleログインエラー", newApiKey: req.newApiKey })
  }
}

// module.exports.appleLogin = async (req, res) => {
//   const { username, identityToken } = req.body
//   if( !identityToken ){
//     return res.status(400).json({message: '必要情報が不足しています'})
//   }
//   const decodedToken = jwt.decode(identityToken, { complete: true })
//   if (!decodedToken || !decodedToken.header) {
//     return res.status(400).json({ success: false, message: '不正なトークンです' })
//   }
//   try {

//     // Appleの公開鍵を取得
//     const client = jwksClient({
//       jwksUri: 'https://appleid.apple.com/auth/keys',
//     })
//     const key = await new Promise((resolve, reject) => {
//       client.getSigningKey(decodedToken.header.kid, (err, key) => {
//         if (err) return reject(err)
//         resolve(key.getPublicKey())
//       })
//     })

//     // トークンの署名を検証
//     const payload = jwt.verify(identityToken, key, { algorithms: ['RS256'] })

//     // Apple ID固有ユーザーID（payload.sub）を使ってユーザー処理
//     const appleUserId = payload.sub

//     let user = await User.findOne({ appleUserId })
//     if (!user) {
//       user = new User({
//         appleUserId,
//         email: payload.email,
//         username
//       })
//       await user.save()
//     }
//     const JWTaccessToken = generateAccessToken(user)
//     const JWTrefreshToken = generateRefreshToken(user)
//     await RefreshToken.findOneAndDelete({ userId: user._id })
//     const newRefreshToken = new RefreshToken({
//       userId: user._id,
//       refreshToken: JWTrefreshToken
//     })
//     await newRefreshToken.save()
//     return res.json({
//       user,
//       accessToken: JWTaccessToken,
//       refreshToken: JWTrefreshToken
//     })
//   } catch (error) {
//     console.error('apple login error: ', error)
//     return res.status(500).json({ error: "Appleログインエラー" })
//   }
// }

module.exports.validateToken = async (req, res) => {
  const authHeader = req.body.Authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({newApiKey: req.newApiKey})
  }
  const token = authHeader.split(" ")[1] // "Bearer"を除去
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    if(decoded.exp < Date.now()){
      console.log('アクセストークンの有効期限を過ぎています。')
      return res.status(401).json({newApiKey: req.newApiKey})
    }
    const user = await User.findById(decoded.id)
    return res.status(200).json({ user })
  } catch {
    console.log('アクセストークンが無効です。')
    return res.status(401).json({newApiKey: req.newApiKey})
  }
}

module.exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(401).json({newApiKey: req.newApiKey})
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    console.log('リフレッシュトークンでのdecoded:', decoded)
    const storedData = await RefreshToken.findOne({userId: decoded.id})
    if (
      (storedData.refreshToken !== refreshToken) ||
      (decoded.exp < Date.now())
    ) {
      return res.status(403).json({newApiKey: req.newApiKey})
    }
    const accessToken = generateAccessToken(decoded)
    return res.status(200).json({ accessToken, newApiKey: req.newApiKey })
  } catch (err) {
    console.log("リフレッシュトークンのエラー:", err)
    return res.status(403).json({newApiKey: req.newApiKey})
  }
}

module.exports.notifyTrue = async (req, res)=> {
  const {id} = req.params
  const user = await User.findByIdAndUpdate(id, {notify: true})
  if(!user || user.isDeleted){
    return res.status(401).json({success: false, newApiKey: req.newApiKey})
  }
  return res.status(200).json({success: true, newApiKey: req.newApiKey})
}

module.exports.notifyFalse = async (req, res)=> {
  const {id} = req.params
  const user = await User.findByIdAndUpdate(id, {notify: false})
  if(!user || user.isDeleted){
    return res.status(401).json({success: false, newApiKey: req.newApiKey})
  }
  return res.status(200).json({success: true, newApiKey: req.newApiKey})
}

module.exports.penName = async(req, res)=>{
  const {id} = req.params
  const {penNameInput} = req.body
  if(penNameInput.trim()){
    const user = await User.findByIdAndUpdate(id, { penName: penNameInput, username: '' }, { new: true })
    if(!user){
      return res.status(401).json({newApiKey: req.newApiKey})
    }
    return res.status(200).json({user, newApiKey: req.newApiKey})
  } else {
    return res.status(401).json({newApiKey: req.newApiKey})
  }
}

module.exports.promotion = async(req, res)=>{
  const {id} = req.params
  const {promotionInput} = req.body
  const user = await User.findByIdAndUpdate(id, { promotion: promotionInput }, { new: true })
  if(!user){
    return res.status(401).json({newApiKey: req.newApiKey})
  }
  return res.status(200).json({user, newApiKey: req.newApiKey})
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

module.exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({
      email,
      isDeleted: false
    })
    if(!user){
      return res.status(404).json({newApiKey: req.newApiKey})
    }
    await user.setPassword(password)
    return res.status(200).json({newApiKey: req.newApiKey})
  } catch {
    return res.status(400).json({newApiKey: req.newApiKey})
  }
}

module.exports.earningPoint = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if(!user) res.status(404).json({newApiKey: req.newApiKey})
    const point = {
      reward: 2,
      gettingFrom: '動画広告視聴',
      madeAt: new Date()
    }
    user.points.push(point)
    user.timeOfGotPoint = new Date()
    await user.save()
    return res.status(200).json({user, newApiKey: req.newApiKey})
  } catch {
    return res.status(400).json({newApiKey: req.newApiKey})
  }
}

module.exports.usingPoints = async (req, res) => {
  try {
    const {userId} = req.body
    const user = await User.findById(userId)
    if(!user) return res.status(404).json({newApiKey: req.newApiKey})
    const totalPoints = user.points.map(point => point.reward).reduce((sum, num) => sum + num, 0) || 0
    if(totalPoints<200) return res.status(401).json({newApiKey: req.newApiKey})
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
    return res.status(200).json({user, newApiKey: req.newApiKey})
  } catch {
    return res.status(400).json({newApiKey: req.newApiKey})
  }
}
