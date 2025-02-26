const mongoose = require('mongoose')
const {Schema} = mongoose
const passportLocalMongoose = require('passport-local-mongoose')
const Review = require('../models/review')
const Response = require('../models/response')


const userSchema = new Schema({
  googleId: {
    type: String,
  },
  username: String,
  penName: String,
  email: {
    type : String,
    required : true,
    unique: [true, 'ご指定のメールアドレスはすでに使用されています']
  },
  promotion: String,
  notify: {
    type: Boolean,
    default: true
  },
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: 'Review'
  }],
  responses: [{
    type: Schema.Types.ObjectId,
    ref: 'Response'
  }],
  favorites: [{
    type: Schema.Types.ObjectId,
    ref: 'Review'
  }],
  forResetToken: String,
  forResetExpires: Date,
  isDeleted : {
    type: Boolean,
    default: false
  },
  num: {
    type: Number,
    default: Math.floor(Math.random()*30)
  }
})

userSchema.plugin(passportLocalMongoose,{
  errorMessages : {
    UserExistsError : '入力されたE-mailアドレスはすでに使われています',
    MissingPasswordError : 'パスワードを入力してください',
    AttemptTooSoonError : 'アカウントがロックされています。時間をあけて再度試してください',
    TooManyAttemptsError : 'ログインの失敗が続いたため、アカウントロックしました',
    NoSaltValueStoredError : '認証ができませんでした',
    IncorrectPasswordError : 'パスワードまたはEmailアドレスが間違っています',
    IncorrectUsernameError : 'パスワードまたはEmailアドレスが間違っています'
  },
  usernameField: 'email'
})

userSchema.post('findOneAndDelete', async function(user){
  if (user.reviews && user.reviews.length) {
    await Review.deleteMany({ _id: { $in: user.reviews } })
  }
  if (user.responses && user.responses.length) {
    await Response.deleteMany({ _id: { $in: user.responses } })
  }
})

module.exports = mongoose.model('User', userSchema)
