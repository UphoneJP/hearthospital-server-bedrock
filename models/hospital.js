const mongoose = require('mongoose')
const {Schema} = mongoose
const Review = require('./review')

const hospitalSchema = new Schema({
  hospitalname : {
    type : String,
    required : [true, '病院名は必須です'],
    unique : true
  },
  location : {
    type : String,
    required : [true, '地域入力は必須です']
  },
  area: String,
  lat : Number,
  lng : Number,
  url: String,
  R3DPC: String,
  R3Kcode: Object,
  R3DPCcode: Object,
  R4DPC: String,
  R4Kcode: Object,
  R4DPCcode: Object,
  R5DPC: String,
  R5Kcode: Object,
  R5DPCcode: Object,
  reviews : [{
    type : Schema.Types.ObjectId,
    ref : 'Review'
  }],
  filteredReviewsCount: {
    type : Number,
    default: 0   
  }
})
hospitalSchema.post('findOneAndDelete', async function(hospital) {
  if (hospital.reviews && hospital.reviews.length) {
    await Review.deleteMany({ _id: { $in: hospital.reviews } })
  }
})

module.exports = mongoose.model('Hospital', hospitalSchema)
