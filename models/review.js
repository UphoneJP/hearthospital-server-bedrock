const mongoose = require('mongoose')
const {Schema} = mongoose
const Response = require('../models/response')

const reviewSchema = new Schema({
  hospital : {
    type : Schema.Types.ObjectId,
    ref : 'Hospital'
  },
  title : {
    type: String,
    required : [true, '題名は必須です']
  },
  diseaseNames : [
    {
      type: String,
      required: [true, '病名を1つ以上入力し、病名を複数入力する場合は半角スペースまたは全角スペースを区切りとしてお使いください。']
    }
  ],
  treatmentTiming: {
    type: String,
    required: [true, '治療時期を入力してください']
  },
  comment : {
    type : String,
    required : [true, 'コメントを入力してください']
  },
  url : String,
  author : {
    type : Schema.Types.ObjectId,
    ref : 'User'
  },
  tweetDate: {
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
  responses: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Response'            
    }
  ]
})

reviewSchema.post('findOneAndDelete', async function(review) {
  if (review.responses && review.responses.length) {
    await Response.deleteMany({ _id: { $in: review.responses } })
  }
})

module.exports = mongoose.model('Review', reviewSchema)
