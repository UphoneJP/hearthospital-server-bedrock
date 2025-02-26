const mongoose = require('mongoose')
const {Schema} = mongoose

const talkSchema = new Schema({
  loggedInUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  guestName: String,
  guestIp: String,
  content: {
    type: String,
    require: true
  },
  madeAt: Date,
  deleted: {
    type: Boolean,
    default: false,
  }
})


module.exports = mongoose.model('Talk', talkSchema)
