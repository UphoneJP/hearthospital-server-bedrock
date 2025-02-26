const Review = require('../models/review');
const Hospital = require('../models/hospital');
const User = require('../models/user');
const Response = require('../models/response')
const AppError = require('../utils/AppError')

function formatTreatmentTiming(date) {
    const year = date.slice(0, 4);
    const month = date.slice(-2);
    return `${year}年${month}月頃`;
};
  
function formatCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}年${month}月${day}日`;
};
const delimiterRegex = /[\u3000\s、・,\/]+/;


module.exports.createReview = async(req, res)=>{
    const {id} = req.params;
    const hospital = await Hospital.findById(id);
    if (!hospital) {
        throw new AppError('hospitalが見つかりません', 404);
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new AppError('userが見つかりません', 404);
    }
    let {title, diseaseNames, treatmentTiming, comment, url} = req.body;
    diseaseNames = diseaseNames.trim().split(delimiterRegex);
    diseaseNames = diseaseNames.filter(name => name);
    diseaseNames = [...new Set(diseaseNames)];
    treatmentTiming = formatTreatmentTiming(treatmentTiming);
    let tweetDate = formatCurrentDate();
    const review = new Review({
        hospital : hospital._id,
        title,
        diseaseNames,
        treatmentTiming,
        comment,
        url,
        author: req.user._id,
        tweetDate,
        ownerCheck: false,
    });
    await review.save();
    hospital.reviews.push(review);
    await hospital.save();
    user.reviews.push(review);
    await user.save();
    req.flash('success', '口コミ投稿していただきありがとうございます。承認までお待ちください。');
    res.redirect(`/hospital/${id}`);
}

module.exports.createResponse = async (req, res) =>{
    const {id, reviewid} = req.params;
    const hospital = await Hospital.findById(id);
    if (!hospital) {
        throw new AppError('hospitalが取得できませんでした', 404)
    }
    const user = await User.findById(req.user._id);
    if(!user){
        throw new AppError('userが取得できませんでした', 404)
    }
    const review = await Review.findById(reviewid);
    if (!review) {
        throw new AppError('reviewが取得できませんでした', 404)
    }
    const {comment} = req.body;
    const responseDate = formatCurrentDate();

    const response = new Response ({
        hospital,
        review,
        comment,
        author: req.user._id,
        responseDate,
        ownerCheck: false,           
    });
    await response.save();
    review.responses.push(response);
    await review.save();
    user.responses.push(response);
    await user.save();
    res.redirect(`/hospital/${id}`);  
}

module.exports.showReview = async(req, res)=>{
    const {reviewid} = req.params;
    const review = await Review.findById(reviewid).populate('hospital').populate('author').populate({
        path: 'responses',
        populate: {
                path: 'author'
        },
    });
    if (!review || review.author.isDeleted) {
        throw new AppError('reviewが取得できませんでした', 404)
    }
    
    const responsesData = [];
    review.responses.forEach(response=> {
        const responseData = {
            comment: response.comment,
            author: {
                penName: response.author.penName||response.author.username,
                _id: response.author._id,
                isDeleted: response.author.isDeleted
            },
            responseDate: response.responseDate,
            ownerCheck: response.ownerCheck,
            goodPushedUser: response.goodPushedUser
        }
        responsesData.push(responseData);
    })
    const reviewData = {
        _id: review._id,
        hospital: {
            hospitalname: review.hospital.hospitalname,
            location: review.hospital.location,
            url: review.hospital.url,
            _id: review.hospital._id
        },
        title: review.title,
        diseaseNames: review.diseaseNames,
        treatmentTiming: review.treatmentTiming,
        comment: review.comment,
        url: review.url,
        author: {
            penName: review.author.penName||review.author.username,
            _id: review.author._id,
            isDeleted: review.author.isDeleted
        },
        tweetDate: review.tweetDate,
        ownerCheck: review.ownerCheck,
        goodPushedUser: review.goodPushedUser,      
        responses: responsesData
    }
    res.render('review/detail', {review: reviewData});
}

module.exports.deleteReview = async(req, res)=>{
    const {id, reviewid} = req.params;
    const hospital = await Hospital.findById(id);
    if (!hospital) {
        throw new AppError('hospitalが取得できませんでした', 404)
    }
    hospital.reviews = hospital.reviews.filter(_id => _id.toString() !== reviewid)
    await hospital.save();

    const review = await Review.findByIdAndDelete(reviewid);
    if (!review) {
        throw new AppError('reviewが取得できませんでした', 404)
    }
    
    const user = await User.findById(review.author);
    if (!user) {
        throw new AppError('userが取得できませんでした', 404)
    }
    user.reviews = user.reviews.filter(_id => _id.toString() !== reviewid)
    await user.save();

    const responses = await Response.find({review});
    if (!responses) {
        throw new AppError('responsesが取得できませんでした', 404)
    }
    for(let response of responses){
        const responseAuthor = await User.findById(response.author);
        if (!responseAuthor) {
            throw new AppError('responseAuthorが取得できませんでした', 404)
        }
        responseAuthor.responses = responseAuthor.responses.filter(_id => !_id.equals(response._id));
        await responseAuthor.save();
    }

    req.flash('success', 'コメントを削除しました')
    res.redirect(`/hospital/${id}`);
}

module.exports.deleteResponse = async(req, res)=>{
    const {id, reviewid, responseid} = req.params;
    const review = await Review.findById(reviewid);
    if (!review) {
        throw new AppError('reviewが取得できませんでした', 404)
    }
    review.responses =review.responses.filter(_id => _id.toString() !== responseid)
    await review.save();

    const response = await Response.findById(responseid);
    if (!response) {
        throw new AppError('responseが取得できませんでした', 404)
    }
    
    const user = await User.findById(response.author);
    if (!user) {
        throw new AppError('userが取得できませんでした', 404)
    }
    user.responses = user.responses.filter(_id => _id.toString() !== responseid)
    await user.save();

    await Response.findByIdAndDelete(responseid);

    req.flash('success', 'コメントを削除しました')
    res.redirect(`/hospital/${id}`);
}


// Axios 
module.exports.countHeart = async (req, res) => {
    const { reviewid } = req.params;
    const review = await Review.findById(reviewid);
    if (!review) {
        return res.status(404).json({ success: false, error: 'reviewが取得できませんでした' });
    }
    if (!review.goodPushedUser.includes(req.user._id)) {
        review.goodPushedUser.push(req.user._id);
        await review.save();
        res.json({
            success: true,
            hasPushedGood: true,
            goodCount: review.goodPushedUser.filter(user=>!user.isDeleted).length
        });
    } else {
        review.goodPushedUser = review.goodPushedUser.filter(id => String(id) !== String(req.user._id) );
        await review.save();
        res.json({ 
            success: true,
            hasPushedGood: false,
            goodCount: review.goodPushedUser.filter(user=>!user.isDeleted).length
        });
    }
}

module.exports.countResponseHeart = async (req, res) => {
    const { responseid } = req.params;
    const response = await Response.findById(responseid);
    if (!response) {
        res.status(404).json({
            success: false,
            error: 'responseが取得できませんでした。'
        });
    }
    if (!response.goodPushedUser.includes(req.user._id)) {
        response.goodPushedUser.push(req.user._id);
        await response.save();
        res.json({
            success: true,
            hasPushedGood: true,
            goodCount: response.goodPushedUser.filter(user=>!user.isDeleted).length
        });
    } else {
        response.goodPushedUser = response.goodPushedUser.filter(id => String(id) !== String(req.user._id) );
        await response.save();
        res.json({ 
            success: true,
            hasPushedGood: false,
            goodCount: response.goodPushedUser.filter(user=>!user.isDeleted).length
        });
    }
}

module.exports.pushFavorite = async (req, res) => {
    const { reviewid } = req.params;
    const review = await Review.findById(reviewid);
    if (!review) {
        return res.status(404).json({ success: false, error: 'reviewが取得できませんでした' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.stats(404).json({ success: false, error: 'userが取得できませんでした' });
    }
    if(!user.favorites.includes(review._id)){
        user.favorites.push(review._id);
        await user.save();
        res.json({
            hasPushedFavorite: true,
        });
    } else {
        user.favorites = user.favorites.filter(id => String(id) !== String(review._id) );
        await user.save();
        res.json({ 
            hasPushedFavorite: false,
        });
    }
}

