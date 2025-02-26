const mongoose = require('mongoose')
const {Schema} = mongoose

const messageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reciever: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  shown: {
    type: Boolean,
    default: false
  }
})

module.exports = mongoose.model('Message', messageSchema)


