const mongoose = require('mongoose')
const {Schema} = mongoose

const deviceSchema = new Schema({
  deviceId: {
    type: String,
    require: true
  },
  apiKey: {
    type: String,
    require: true
  },
  timestamp: Number  
})

module.exports = mongoose.model('Device', deviceSchema)
