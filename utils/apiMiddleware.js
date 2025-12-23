const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const apiSchemas = require('../apiSchemas')
const BadUser = require("../models/badUser")
const Device = require("../models/device")

function validate(Schema, req, res, next) {
  const {error} = Schema.validate(req.body) || {}
  if(error){
    const msg = error.details.map(detail => detail.message).join(',')
    console.log("Validation error:", msg)
    return res.status(400).json({msg})
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
module.exports.validateMessages = () => {
  return (data, callback) => {
    const { error } = apiSchemas.messageSchema.validate(data)
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ')
      return callback({ status: 400, msg: message })
    }
    callback() // 問題なければ何も返さず次へ
  }
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
module.exports.validateEditTalkTheme = (req, res, next) => {
    validate(apiSchemas.editTalkThemeSchema, req, res, next)
}
module.exports.validateTalk = (req, res, next) => {
    validate(apiSchemas.talkSchema, req, res, next)
}

module.exports.originalSecurity = async (req, res, next) => {
  // async function saveBadUser() {
  //   const realIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress
  //   let badUser = await BadUser.findOne({ip: realIp})
  //   if(badUser){
  //     badUser.accessAt_UTC.push(new Date().toLocaleString('ja-JP'))
  //   } else {
  //     badUser = new BadUser({
  //       ip: realIp,
  //       accessAt_UTC: [new Date().toLocaleString('ja-JP')]
  //     })
  //   }
  //   await badUser.save()
  //   console.log("bad user detected")
  //   return res.status(403).json({ message: "Access denied. Saved your Info." })
  // }

  try {
    const deviceId = req.headers["deviceid"]
    const apiKeyNeeded = req.headers["api-key-needed"]
    if (!apiKeyNeeded || apiKeyNeeded.trim() === 'Bearer' || !deviceId){
      // return await saveBadUser()
      console.log("originalSecurity: missing headers")
      return res.status(403).json({ message: "Access denied." })
    }
    const token = apiKeyNeeded.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if(
      !decoded 
      || !decoded.timestamp 
      || !decoded.apiKey 
      || decoded.timestamp + 1000 * 60 * 5 < Date.now()
    ) {
      // return await saveBadUser()
      console.log("originalSecurity: apiKey verification failed")
      return res.status(403).json({ message: "Access denied." })
    }

    const savedDevice = await Device.findOne({deviceId, apiKey:decoded.apiKey})
    if( savedDevice && savedDevice.timestamp ){
      if( Date.now() > savedDevice.timestamp + 1000 * 60 * 15 ){
        console.log("originalSecurity: apiKey expired")
        return res.status(400).json({ message: "Error Occured" })
      } else {
        savedDevice.timestamp = Date.now();
        await savedDevice.save();
      }
      return next()
    } else {
      // return await saveBadUser()
      console.log("originalSecurity: device not found")
      return res.status(403).json({ message: "Access denied." })
    }
  } catch (error) {
    // return await saveBadUser()
    console.error("originalSecurity error:", error);
    return res.status(403).json({ message: "Access denied." })
  }
}

