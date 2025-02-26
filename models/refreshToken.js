const mongoose = require('mongoose')
const {Schema} = mongoose

const refreshTokenSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('RefreshToken', refreshTokenSchema)
