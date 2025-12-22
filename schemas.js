const BaseJoi = require('joi')
const sanitizeHtml = require('sanitize-html')

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
  penName: Joi.string().required().escapeHTML()
})
module.exports.promotionSchema = Joi.object({
  promotion: Joi.string().required().escapeHTML()
})
module.exports.resetPasswordSchema = Joi.object({
  authNum: Joi.string().escapeHTML(),
  passwordA: Joi.string().escapeHTML(),
  passwordB: Joi.string().escapeHTML()
})

// hospital
module.exports.hospitalSchema = Joi.object({
  hospitalname: Joi.string().required().escapeHTML(),
  location: Joi.string().required().escapeHTML(),
  url: Joi.string().required().escapeHTML(),
  area: Joi.string().required().escapeHTML(),
}).required()

//review, response
module.exports.reviewSchema = Joi.object({
  title: Joi.string().required().escapeHTML(),
  diseaseNames: Joi.string().required().escapeHTML(),
  treatmentTiming: Joi.string().required().escapeHTML(),
  comment: Joi.string().required().escapeHTML(),
  url: Joi.string().allow('').uri()
}).required()
module.exports.responseSchema = Joi.object({
  comment: Joi.string().required().escapeHTML(),
}).required()

// other
module.exports.messageSchema = Joi.object({
  content: Joi.string().required().escapeHTML()
}).required()
module.exports.formSchema = Joi.object({
  formContent: Joi.string().required().escapeHTML()
}).required()
module.exports.nonAccountFormSchema = Joi.object({
  firstname: Joi.string().required().escapeHTML(),
  lastname: Joi.string().required().escapeHTML(),
  email: Joi.string().required().escapeHTML(),
  authNum: Joi.string().required().escapeHTML(),
  formContent: Joi.string().required().escapeHTML()
}).required()
module.exports.feedbackSchema = Joi.object({
  feedbackContent: Joi.string().required().escapeHTML()
}).required()
module.exports.linkSchema = Joi.object({
  category: Joi.string().escapeHTML(),
  linkName: Joi.string().required().escapeHTML(),
  linkUrl: Joi.string().required().escapeHTML(),
  manager: Joi.string().escapeHTML(),
  DateOfPermission: Joi.string().escapeHTML()
}).required()

// talkingRoom
module.exports.talkThemeSchema = Joi.object({
  title: Joi.string().escapeHTML(),
  detail: Joi.string().escapeHTML(),
}).required()
module.exports.talkSchema = Joi.object({
  content: Joi.string().escapeHTML(),
}).required()
module.exports.guestTalkSchema = Joi.object({
  guestName: Joi.string().escapeHTML(),
  content: Joi.string().escapeHTML(),
  "g-recaptcha-response": Joi.string().escapeHTML()
}).required()

