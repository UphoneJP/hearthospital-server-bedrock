const mongoose = require('mongoose')
const {Schema} = mongoose

const badUserSchema = new Schema({
  ip: {
    type: String,
    required: true
  },
  accessAt_JST:  [String]
})

module.exports = mongoose.model('BadUser', badUserSchema)
