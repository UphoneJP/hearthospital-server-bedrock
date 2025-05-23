const BaseJoi = require('joi')
const sanitizeHtml = require('sanitize-html')
const user = require('./models/user')

const extention = (joi) =>({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.escapeHTML': '{{#label}} must not include HTML!'
  },
  rules: {
    escapeHTML: {
      validate(value, helpers){
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: [],
        })
        if(clean !== value) return helpers.error('string.escapeHTML', {value})
        return clean
      }
    }
  }
})
const Joi = BaseJoi.extend(extention)

// user
module.exports.emailSchema = Joi.object({
  email: Joi.string().required().escapeHTML()
})
module.exports.userRegisterSchema = Joi.object({
  penName: Joi.string().required().escapeHTML(),
  email: Joi.string().required().escapeHTML(),
  password: Joi.string().required().escapeHTML()
}).required()
module.exports.userLoginSchema = Joi.object({
  email: Joi.string().required().escapeHTML(),
  password: Joi.string().required().escapeHTML()
}).required()
module.exports.penNameSchema = Joi.object({
  penNameInput: Joi.string().required().escapeHTML()
})
module.exports.promotionSchema = Joi.object({
  promotionInput: Joi.string().required().escapeHTML()
})

//review, response
module.exports.reviewSchema = Joi.object({
  title: Joi.string().required().escapeHTML(),
  diseaseNames: Joi.string().required().escapeHTML(),
  treatmentTiming: Joi.string().required().escapeHTML(),
  comment: Joi.string().required().escapeHTML(),
  url: Joi.string().uri().allow('').optional(),
  userId: Joi.string().required(),
}).required()

// other
module.exports.messageSchema = Joi.object({
  userId: Joi.string().required().escapeHTML(),
  personId: Joi.string().required().escapeHTML(),
  content: Joi.string().min(1).required().escapeHTML()
}).required()
module.exports.formSchema = Joi.object({
  formContent: Joi.string().required().escapeHTML(),
  authorId: Joi.string().required(),
}).required()
module.exports.feedbackSchema = Joi.object({
  feedbackContent: Joi.string().required().escapeHTML()
}).required()

// talkingRoom
module.exports.talkThemeSchema = Joi.object({
  title: Joi.string().required().escapeHTML(),
  detailNoSpace: Joi.string().required().escapeHTML(),
  userId: Joi.string().required()
}).required()
module.exports.editTalkThemeSchema = Joi.object({
  title: Joi.string().required().escapeHTML(),
  detail: Joi.string().required().escapeHTML()
}).required()
module.exports.talkSchema = Joi.object({
  reviewText: Joi.string().required().escapeHTML(),
  userId: Joi.string().required()
}).required()

