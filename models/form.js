const mongoose = require('mongoose')
const {Schema} = mongoose

const formSchema = new Schema({
  formContent: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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

module.exports = mongoose.model('Form', formSchema)
