const apiSchemas = require('../apiSchemas')
const BadUser = require("../models/badUser")
const jwt = require("jsonwebtoken")
const { nonceArray } = require("../utils/nonceArray")
const { isValid, addSignature } = require("../utils/signatureArray")

function validate(Schema, req, next) {
  const {error} = Schema.validate(req.body) || {}
  if(error){
    const msg = error.details.map(detail => detail.message).join(',')
    res.status(400).json({msg})
  } else {
    next()
  }
}
// user
module.exports.validateEmail = (req, res, next)=>{
    validate(apiSchemas.emailSchema, req, next)
}
module.exports.validateUserRegister = (req, res, next)=>{
    validate(apiSchemas.userRegisterSchema, req, next)
}
module.exports.validateUserLogin = (req, res, next)=>{
    validate(apiSchemas.userLoginSchema, req, next)
}
module.exports.validatePenName = (req, res, next)=>{
    validate(apiSchemas.penNameSchema, req, next)
}
module.exports.validatePromotion = (req, res, next)=>{
    validate(apiSchemas.promotionSchema, req, next)
}

// review, response
module.exports.validateReviews = (req, res, next)=>{
    validate(apiSchemas.reviewSchema, req, next)
}

// other
module.exports.validateMessages = (req, res, next)=>{
    validate(apiSchemas.messageSchema, req, next)
}
module.exports.validateForms = (req, res, next)=>{
    validate(apiSchemas.formSchema, req, next)
}
module.exports.validateFeedbackForms = (req, res, next)=>{
    validate(apiSchemas.feedbackSchema, req, next)
}

// talkingRoom
module.exports.validateTalkTheme = (req, res, next) => {
    validate(apiSchemas.talkThemeSchema, req, next)
}
module.exports.validateTalk = (req, res, next) => {
    validate(apiSchemas.talkSchema, req, next)
}

module.exports.originalSecurity = async (req, res, next) => {
  async function saveBadUser() {
    const realIp = req.headers["x-forwarded-for"] || req.connection.remoteAddres
    let badUser = await BadUser.findOne({ip: realIp})
    if(badUser){
      badUser.accessAt_UTC.push(new Date().toLocaleString('ja-JP'))
    } else {
      badUser = new BadUser({
        ip: realIp,
        accessAt_UTC: [new Date().toLocaleString('ja-JP')]
      })
    }
    await badUser.save()
    console.log("bad user detected")
    return res.status(403).json({ message: "Access denied. Saved your Info." })
  }

  // 旧型で削除予定
  const apiKeyIni = req.headers["api-key-ini"]
  if(apiKeyIni && apiKeyIni === process.env.API_KEY_INI) return next()

  const apiKeyNeeded = req.headers["api-key-needed"]
  if (!apiKeyNeeded || apiKeyNeeded.trim() === 'Bearer') saveBadUser()
  const token = apiKeyNeeded.split(' ')[1]
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  if(!decoded || decoded.apiKey !== process.env.API_KEY || decoded.timestamp + 1000 * 60 * 3 < Date.now()) saveBadUser()

  console.log("good user")
  next()
}

// google-play-integrity-api 
module.exports.googlePlayIntegrityApi = async (req, res, next) => {
  const nonce = req.headers["nonce"]
  const timestamp = req.headers["timestamp"]
  const deviceId = req.headers["deviceid"]
  const integrityToken = req.headers["integritytoken"]
  const signature = req.headers["signature"]
  console.log("Request Headers:", req.headers)
  if ( !nonce || !timestamp || !deviceId || !integrityToken || !signature ) {
    console.log('情報が不足しています')
    return res.status(400).json({ error: '情報が不足しています' })
  }

  // 開発環境ならスルー
  if(
    process.env.NODE_ENV !== 'production' &&
    nonce === 'thisIsTestNonce' &&
    timestamp === 1800000000000 &&
    integrityToken === "thisIsTestIntegrityToken" &&
    signature === "thisIsTestSignature"
  ) {
    console.log('開発環境のためintegrityAPIはスルー')
    return next()
  }

  // nonceがArrayに無い、もしくは有効期限切れの場合
  if(!nonceArray.find(item => item.nonce === nonce && item.iat + 1000 * 60 * 5 > new Date().getTime())){
    return res.status(400).json({ error: "Invalid or expired nonce" })
  }

  // timestampが5分を過ぎていた場合
  if(timestamp + 1000 * 60 * 5 < new Date().getTime()){
    return res.status(400).json({ error: "timestamp expired" })
  }

  // 署名が一致しない場合は403エラー
  const expectedSignature = crypto
    .createHmac("sha256", deviceId)
    .update(`${nonce}:${timestamp}:${integrityToken}`)
    .digest("hex")
  if (signature !== expectedSignature) {
    return res.status(403).json({ error: "Invalid signature" })
  }

  try {
    if(isValid(signature)){
      return next()
    }

    const integrityJSON = JSON.parse((await axios.post(
      `https://playintegrity.googleapis.com/v1/validateIntegrityToken?key=${process.env.PLAY_INTEGRITY_API_KEY}`, 
      { integrityToken }
    )).data)
    if(
      integrityJSON.requestDetails.requestPackageName !== process.env.PACKAGE_NAME || 
      !nonceArray.find(item => item.nonce === integrityJSON.requestDetails.nonce && item.iat + 1000 * 60 * 5 > integrityJSON.requestDetails.timestampMillis) ||
      integrityJSON.appIntegrity.appRecognitionVerdict !== "PLAY_RECOGNIZED" ||
      integrityJSON.appIntegrity.packageName !== process.env.PACKAGE_NAME ||
      integrityJSON.deviceIntegrity.recentDeviceActivity.deviceActivityLevel === "LEVEL_3" ||
      integrityJSON.accountDetails.appLicensingVerdict !== "LICENSED" ||
      integrityJSON.environmentDetails?.appAccessRiskVerdict?.appsDetected?.includes("UNKNOWN_CAPTURING")
    ){
      console.log("想定外環境からの利用です。")
      return res.status(403).json({ error: "想定外環境からの利用と判断しました。" })
    }

    addSignature({ signature, iat: new Date().getTime() })
    next()

  } catch (error) {
    console.error('APIエラー:', error)
    res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
