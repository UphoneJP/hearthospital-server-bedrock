const mongoose = require('mongoose')
const {Schema} = mongoose

const giftRequestSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  pointsUsed: {
    type: Number,
    default: 200
  },
  ownerCheck: {
    type: Boolean,
    default: false
  },
  requestedAt: {
    type: Date,
    default: ()=> new Date()
  }
})

module.exports = mongoose.model('GiftRequest', giftRequestSchema)


