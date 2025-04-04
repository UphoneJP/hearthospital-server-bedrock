const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const apiSchemas = require('../apiSchemas')
const BadUser = require("../models/badUser")
const { getNonceArray } = require("../utils/nonceArray")
const { getCryptoArray } = require("../utils/cryptoArray")

function validate(Schema, req, res, next) {
  const {error} = Schema.validate(req.body) || {}
  if(error){
    const msg = error.details.map(detail => detail.message).join(',')
    console.log("Validation error:", msg)
    res.status(400).json({msg})
  } else {
    next()
  }
}
// user
module.exports.validateEmail = (req, res, next)=>{
    validate(apiSchemas.emailSchema, req, res, next)
}
module.exports.validateUserRegister = (req, res, next)=>{
    validate(apiSchemas.userRegisterSchema, req, res, next)
}
module.exports.validateUserLogin = (req, res, next)=>{
    validate(apiSchemas.userLoginSchema, req, res, next)
}
module.exports.validatePenName = (req, res, next)=>{
    validate(apiSchemas.penNameSchema, req, res, next)
}
module.exports.validatePromotion = (req, res, next)=>{
    validate(apiSchemas.promotionSchema, req, res, next)
}
// review, response
module.exports.validateReviews = (req, res, next)=>{
    validate(apiSchemas.reviewSchema, req, res, next)
}
// other
module.exports.validateMessages = (req, res, next)=>{
    validate(apiSchemas.messageSchema, req, res, next)
}
module.exports.validateForms = (req, res, next)=>{
    validate(apiSchemas.formSchema, req, res, next)
}
module.exports.validateFeedbackForms = (req, res, next)=>{
    validate(apiSchemas.feedbackSchema, req, res, next)
}
// talkingRoom
module.exports.validateTalkTheme = (req, res, next) => {
    validate(apiSchemas.talkThemeSchema, req, res, next)
}
module.exports.validateTalk = (req, res, next) => {
    validate(apiSchemas.talkSchema, req, res, next)
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

  const apiKeyNeeded = req.headers["api-key-needed"]
  if (!apiKeyNeeded || apiKeyNeeded.trim() === 'Bearer') saveBadUser()
  const token = apiKeyNeeded.split(' ')[1]
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  if(!decoded || decoded.apiKey !== process.env.API_KEY || decoded.timestamp + 1000 * 60 * 3 < Date.now()) saveBadUser()

  next()
}

// google-play-integrity-api 
module.exports.checkIntegrity = async (req, res, next) => {
  try {
    const nonce = req.headers["nonce"]
    const timestamp = parseInt(req.headers["timestamp"])
    const deviceId = req.headers["deviceid"]
    const cryptoToken = req.headers["cryptotoken"]
    const signature = req.headers["signature"]

    if ( !nonce || !timestamp || !deviceId || !cryptoToken || !signature ) {
      console.log('checkIntegrity情報が不足しています')
      return res.status(400).json({ error: '情報が不足しています' })
    }

    // nonceがArrayに無い、もしくは有効期限切れの場合
    const nonceArray = getNonceArray()
    if(!nonceArray.some(item => item.nonce === nonce && item.iat + 1000 * 60 * 5 > new Date().getTime())){
      console.log("checkIntegrity: Invalid or expired nonce")
      return res.status(400).json({ error: "Invalid or expired nonce" })
    }

    // timestampが5分を過ぎていた場合
    if(timestamp + 1000 * 60 * 5 < new Date().getTime()){
      console.log("timestamp expired")
      return res.status(400).json({ error: "timestamp expired" })
    }

    // cryptoTokenが無い、もしくは有効期限切れの場合
    const cryptoArray = getCryptoArray()
    if(!cryptoArray.some(item => item.cryptoToken === cryptoToken && item.iat + 1000 * 60 * 5 > new Date().getTime())){
      console.log("checkIntegrity: Invalid or expired crypto")
      return res.status(400).json({ error: "Invalid or expired crypto" })
    }

    // 署名が一致しない場合は403エラー
    const expectedSignature = crypto
      .createHmac("sha256", deviceId)
      .update(`${nonce}:${timestamp}:${cryptoToken}`)
      .digest("hex")
    if (signature !== expectedSignature) {
      console.log("checkIntegrity: Invalid signature")
      return res.status(403).json({ error: "Invalid signature" })
    }

    next()

  } catch (error) {
    console.log('整合性エラー:', error)
    res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
