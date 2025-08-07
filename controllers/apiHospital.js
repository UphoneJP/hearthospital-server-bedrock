const Hospital = require('../models/hospital')
const Review = require('../models/review')
const User = require('../models/user')
const Response = require('../models/response')

module.exports.getReviews = async (req, res) => {
  const reviews = await Review.find({ownerCheck:true}).populate('hospital').populate('author')
  if(!reviews){
    return res.status(404).json({message:'reviewsが見つかりません'})
  }
  return res.status(200).json({reviews})
}

module.exports.aboutHospital = async (req, res)=>{
  const {id} = req.params
  const hospital = await Hospital.findById(id)
  .populate({
    path: 'reviews',
    populate: [
      {
        path: 'author'
      },
      {
        path: 'responses',
        populate: {
          path: 'author'
        }
      }]
  })
  if(!hospital){
    return res.status(404).json({newApiKey: req.newApiKey})
  }
  return res.status(200).json({hospital, newApiKey: req.newApiKey})
}

module.exports.createReview = async (req, res)=>{
  try{
    const { id } = req.params
    const hospital = await Hospital.findById(id)
    if (!hospital) {
      return res.status(404).json({newApiKey: req.newApiKey})
    }

    let { title, diseaseNames, url, treatmentTiming, comment, userId } = req.body
    if( !title || !diseaseNames || !treatmentTiming || !comment || !userId ){
      console.log('必要な情報が不足しています')
      return res.status(403).json({newApiKey: req.newApiKey})
    }
    function formatCurrentDate() {
      const date = new Date();
      const year = date.getFullYear();
      const month = ("0" + (date.getMonth() + 1)).slice(-2);
      const day = ("0" + date.getDate()).slice(-2);
      return `${year}年${month}月${day}日`;
    }
    const tweetDate = formatCurrentDate()
    const delimiterRegex = /[\u3000\s、・,\/]+/
    diseaseNames = diseaseNames.trim().split(delimiterRegex)
    diseaseNames = diseaseNames.filter(name => name)
    diseaseNames = [...new Set(diseaseNames)]
    const review = new Review({
      hospital,
      title,
      diseaseNames,
      treatmentTiming,
      comment,
      url: url || null,
      author: userId,
      tweetDate,
      ownerCheck: false
    })
    await review.save()

    hospital.reviews.push(review)
    await hospital.save()

    const DBuser = await User.findById(userId)
    DBuser.reviews.push(review)
    await DBuser.save()

    return res.status(200).json({newApiKey: req.newApiKey})
  } catch(e) {
    console.log('createReview関数のエラー: ', e)
    return res.status(400).json({newApiKey: req.newApiKey})
  }
}

module.exports.deleteReview = async(req, res)=>{
  const { id, reviewid } = req.params
  const { user } = req.body

  let hospital = await Hospital.findById(id)
  .populate({
    path: 'reviews',
    populate: [
      {
        path: 'author'
      },
      {
        path: 'responses',
        populate: {
          path: 'author'
        }
      }]
  })
  if (!hospital) {
    return res.status(404).json({newApiKey: req.newApiKey})
  }

  const review = await Review.findById(reviewid)
  if (!review) {
    return res.status(404).json({newApiKey: req.newApiKey})
  }

  const author = await User.findById(review.author);
  if(!author || !user || user !== author){
    return res.status(401).json({newApiKey: req.newApiKey})
  }
  
  hospital.reviews = hospital.reviews.filter(review => review._id.toString() !== reviewid)
  await hospital.save()

  await review.deleteOne()
  
  author.reviews = author.reviews.filter(_id => _id.toString() !== reviewid)
  await author.save()

  const responses = await Response.find({review})
  if (responses) {
    for(let response of responses){
      const responseAuthor = await User.findById(response.author)
      if (responseAuthor) {
        responseAuthor.responses = responseAuthor.responses.filter(_id => !_id.equals(response._id))
        await responseAuthor.save()
      }
    }
  }

  const reviews = await Review.find({ownerCheck:true}).populate('hospital').populate('author')

  return res.status(200).json({hospital, reviews, newApiKey: req.newApiKey})
}

module.exports.getHospitals = async (req, res) => {
  const hospitals = await Hospital.find({})
    .populate('reviews')
  if(!hospitals){
    return res.status(404).json({newApiKey: req.newApiKey})
  }
  const areas = [
    '北海道・東北地方',
    '関東地方',
    '中部地方',
    '近畿地方',
    '中国・四国地方',
    '九州・沖縄地方'
  ]
  return res.status(200).json({hospitals,areas, newApiKey: req.newApiKey})
}

