const mongoose = require('mongoose')
const {Schema} = mongoose

const responseSchema = new Schema({
  hospital: {
    type: Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  review : {
    type: Schema.Types.ObjectId,
    ref: 'Review'
  },
  comment : {
    type : String,
    required : [true, 'コメントを入力してください']
  },
  author : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  responseDate: {
    type: String,
    required: true
  },
  ownerCheck : Boolean,
  goodPushedUser: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
})

module.exports = mongoose.model('Response', responseSchema)
