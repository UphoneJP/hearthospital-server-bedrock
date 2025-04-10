const sanitizeHtml = require('sanitize-html')
const Review = require('../models/review')
const Response = require('../models/response')
const TalkTheme = require('../models/talkTheme')
const Talk = require('../models/talk')
const AppError = require('./AppError')
const schemas = require('../schemas')

module.exports.isLoggedIn = (req , res, next)=>{
    if(!req.isAuthenticated()){
        req.flash('error', 'ログインしてください')        
        return res.redirect('/loginForm')
    }
    next()
}
module.exports.saveReturnTo = (req, res, next)=>{
    if (!req.user && req.session) {
        req.session.returnTo = req.originalUrl
    }
    next()
}
module.exports.isReviewAuthor = async(req, res, next)=>{
    const {reviewid} = req.params
    const review = await Review.findById(reviewid)
    if (!review) {
        throw new AppError('指定された口コミは存在しません', 404)
    }
    const isOwner = process.env.ownerId === req.user._id.toString()
    const isAuthor = review.author.equals(req.user._id)
    if (!isAuthor && !isOwner) {
        throw new AppError('そのアクションの権限がありません', 401)
    }
    next()
}
module.exports.isResponseAuthor = async(req, res, next)=>{
    const {responseid} = req.params
    const response = await Response.findById(responseid)
    if (!response) {
        throw new AppError('指定のコメントが存在しません', 404)
    }
    const isOwner = process.env.ownerId === req.user._id.toString()
    const isAuthor = response.author.equals(req.user._id)
    if (!isAuthor && !isOwner) {
        throw new AppError('そのアクションの権限がありません', 401)
    }
    next()
}
module.exports.isTalkThemeAuthor = async(req, res, next)=>{
    const {id} = req.params
    const talkTheme = await TalkTheme.findById(id)
    if (!talkTheme) {
        throw new AppError('指定のトークテーマが存在しません', 404)
    }
    const isOwner = process.env.ownerId === req.user._id.toString()
    const isAuthor = talkTheme.author === req.user._id.toString()
    if (!isAuthor && !isOwner) {
        throw new AppError('そのアクションの権限がありません', 401)
    }
    next()
}
module.exports.isTalkAuthor = async(req, res, next)=>{
    const {talkId} = req.params
    const talk = await Talk.findById(talkId)
    if (!talk) {
        throw new AppError('指定のトークが存在しません', 404)
    }
    const isAuthor = talk.loggedInUser._id === req.user._id
    const isOwner = process.env.ownerId === req.user._id.toString()
    
    if (!isAuthor && !isOwner) {
        throw new AppError('そのアクションの権限がありません', 401)
    }
    next()
}
module.exports.isOwner = async(req, res, next)=>{
    if(process.env.ownerId !== req.user._id.toString()){
        throw new AppError('そのアクションの権限がありません', 401)
    }
    next()
}
module.exports.intoMyPage = async(req, res, next)=>{
    const {id} = req.params
    if(id !== req.user._id.toString() && req.user._id.toString() !== process.env.ownerId){
        throw new AppError('そのアクションの権限がありません', 401)
    }
    next()
}
module.exports.intoDirectMessage = async(req, res, next)=>{
    const {senderId} = req.params
    if(senderId !== req.user._id.toString() && senderId !== process.env.ownerId){
        throw new AppError('そのアクションの権限がありません', 401)
    }
    next()
}

function validate(Schema, req, next) {
    const {error} = Schema.validate(req.body) || {}
    if(error){
        const msg = error.details.map(detail => detail.message).join(',')
        throw new AppError(msg, 400)
    } else {
        next()
    }
}
// user
module.exports.validateEmail = (req, res, next)=>{
    validate(schemas.emailSchema, req, next)
}
module.exports.validateUserRegister = (req, res, next)=>{
    validate(schemas.userRegisterSchema, req, next)
}
module.exports.validateUserLogin = (req, res, next)=>{
    validate(schemas.userLoginSchema, req, next)
}
module.exports.validatePenName = (req, res, next)=>{
    validate(schemas.penNameSchema, req, next)
}
module.exports.validatePromotion = (req, res, next)=>{
    validate(schemas.promotionSchema, req, next)
}
module.exports.validateResetPassword = (req, res, next)=>{
    validate(schemas.resetPasswordSchema, req, next)
}

// hospital
module.exports.validateHospital = (req, res, next) =>{
    validate(schemas.hospitalSchema, req, next)
}

// review, response
module.exports.validateReviews = (req, res, next)=>{
    validate(schemas.reviewSchema, req, next)
}
module.exports.validateResponses = (req, res, next)=>{
    validate(schemas.responseSchema, req, next)
}

// other
module.exports.validateMessages = (req, res, next)=>{
    validate(schemas.messageSchema, req, next)
}
module.exports.validateForms = (req, res, next)=>{
    validate(schemas.formSchema, req, next)
}
module.exports.validateNonAccountForms = (req, res, next)=>{
    validate(schemas.nonAccountFormSchema, req, next)
}
module.exports.validateFeedbackForms = (req, res, next)=>{
    validate(schemas.feedbackSchema, req, next)
}
module.exports.validateLinkForm = (req, res, next)=>{
    validate(schemas.linkSchema, req, next)
}
module.exports.validateSearchForm = (req, res, next) => {
    if (req.query.diseaseName) {
        req.query.diseaseName = sanitizeHtml(req.query.diseaseName, {
            allowedTags: [],
            allowedAttributes: [],
        })
    }
    next()
}

// talkingRoom
module.exports.validateTalkTheme = (req, res, next) => {
    validate(schemas.talkThemeSchema, req, next)
}
module.exports.validateTalk = (req, res, next) => {
    validate(schemas.talkSchema, req, next)
}
module.exports.validateGuestTalk = (req, res, next) => {
    validate(schemas.guestTalkSchema, req, next)
    console.log('hello')
}

module.exports.checkUser = (req, res, next) => {
  const {userid} = req.params
  if(!req.user || userid !== req.user._id.toString()){
    return res.json({error:true})
  }
  next()
}

