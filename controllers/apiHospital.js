const Hospital = require('../models/hospital')
const Review = require('../models/review')
const User = require('../models/user')
const Response = require('../models/response')

module.exports.getReviews = async (req, res) => {
  const reviews = await Review.find({ownerCheck:true}).populate('hospital').populate('author')
  if(!reviews){
    res.status(404).json({message:'reviewsが見つかりません'})
  }
  res.status(200).json({reviews})
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
    res.status(404).json({message:'hospitalが見つかりません'})
  }
  res.status(200).json({hospital})
}

module.exports.createReview = async (req, res)=>{
  try{
    const { id } = req.params
    const hospital = await Hospital.findById(id)
    if (!hospital) {
      res.status(404).json({message: 'hospitalが見つかりません'})
    }

    let { title, diseaseNames, url, treatmentTiming, comment, user } = req.body
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
      url,
      author: user._id,
      tweetDate,
      ownerCheck: false
    })
    await review.save()

    hospital.reviews.push(review)
    await hospital.save()

    const DBuser = await User.findById(user._id)
    DBuser.reviews.push(review)
    await DBuser.save()

    res.status(200).json({message: '投稿しました'})
  } catch {
    res.status(400).json({message: '投稿できませんでした'})
  }
}

module.exports.deleteReview = async(req, res)=>{
  const {id, reviewid} = req.params
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
    res.status(404).json({message: 'hospitalが取得できませんでした'})
  }
  hospital.reviews = hospital.reviews.filter(review => review._id.toString() !== reviewid)
  await hospital.save();

  const review = await Review.findByIdAndDelete(reviewid);
  if (!review) {
    res.status(404).json({message: 'reviewが取得できませんでした'})
  }
  
  const user = await User.findById(review.author);
  if (!user) {
    res.status(404).json({message: 'userが取得できませんでした'})
  }
  user.reviews = user.reviews.filter(_id => _id.toString() !== reviewid)
  await user.save()

  const responses = await Response.find({review})
  if (!responses) {
    res.status(404).json({message: 'responsesが取得できませんでした'})
  }
  for(let response of responses){
    const responseAuthor = await User.findById(response.author)
    if (!responseAuthor) {
      res.status(404).json({message: 'responseAuthorが取得できませんでした'})
    }
    responseAuthor.responses = responseAuthor.responses.filter(_id => !_id.equals(response._id));
    await responseAuthor.save()
  }

  const reviews = await Review.find({ownerCheck:true}).populate('hospital').populate('author')
  if(!reviews){
    res.status(404).json({message:'reviewsが見つかりません'})
  }

  res.status(200).json({hospital, reviews})
}

module.exports.getHospitals = async (req, res) => {
  const hospitals = await Hospital.find({})
    .populate('reviews')
  if(!hospitals){
    res.status(404).json({message:'hospitalsが見つかりません'})
  }
  const areas = [
    '北海道・東北地方',
    '関東地方',
    '中部地方',
    '近畿地方',
    '中国・四国地方',
    '九州・沖縄地方'
  ]
  res.status(200).json({hospitals,areas})
}

