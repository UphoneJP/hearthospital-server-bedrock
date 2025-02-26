const mongoose = require('mongoose')
const {Schema} = mongoose

const linkSchema = new Schema({
  category: {
    type: String,
    enum: ['group', 'personal'],
    required: true
  },
  linkName: {
    type: String,
    required: true
  },
  linkUrl: {
    type: String,
    required: true
  },
  manager: String,
  DateOfPermission: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Link', linkSchema)
