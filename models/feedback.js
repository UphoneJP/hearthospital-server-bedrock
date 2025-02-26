const mongoose = require('mongoose')
const {Schema} = mongoose

const feedbackSchema = new Schema({
  feedbackContent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ownerCheck: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model('Feedback', feedbackSchema)
