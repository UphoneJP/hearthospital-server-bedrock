const Hospital = require('../models/hospital');
const { normalize } = require('@geolonia/normalize-japanese-addresses');
const AppError = require('../utils/AppError');


module.exports.newHospital = (req, res)=>{
    page = 'newhospital';
    res.render('hospital/new', {page});
}

module.exports.createHospital = async (req, res)=>{
    const {hospitalname, location, area, url} = req.body;
    const {lat, lng} = await normalize(location);
    const hospital = new Hospital({
        hospitalname,
        location,
        lat,
        lng,
        area,
        url
    });
    hospital.save()
    .then(()=>{
        req.flash('success', '病院を新しく登録しました。');
        res.redirect(`/hospital/${hospital._id}`);
    })
    .catch(()=>{
        req.flash('error', 'エラーが発生したため登録できませんでした');
        res.redirect('/hospital');
    });
}

module.exports.showHospital = async (req, res)=>{
    const {id} = req.params;
    const hospital = await Hospital.findById(id).populate({
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
            }
        ]
    });
    if(!hospital){
        throw new AppError('指定の病院はデータベースにはありません。削除された可能性があります。', 404);
    }
    const currentPage = parseInt(req.query.page) || 1;
    const allReviews = hospital.reviews.filter(review => review.ownerCheck && !review.author.isDeleted).sort((a,b)=>b.goodPushedUser.filter(user => !user.isDeleted).length - a.goodPushedUser.filter(user => !user.isDeleted).length);
    const limit = 10;
    const totalPage = Math.ceil(allReviews.length / limit);
    if((totalPage && currentPage > totalPage) || parseInt(req.query.page) <= 0){
        throw new AppError('指定のページが存在しません', 400);
    }
    const skip = (currentPage - 1) * limit;
    const reviews = allReviews.slice(skip, skip + limit);
    description = `Detailed Page of ${hospital.hospitalname}`;

    const hospitalData = {
        hospitalname: hospital.hospitalname,
        location: hospital.location,
        lat: hospital.lat,
        lng: hospital.lng,
        url: hospital.url,
        _id: hospital._id
    }
    const reviewsData = [];
    reviews.forEach(review=>{
        const responsesData = [];
        review.responses.forEach(response=>{
            const responseData = {
                comment: response.comment,
                author: {
                    penName: response.author.penName||response.author.username,
                    _id: response.author._id
                },
                responseDate: response.responseDate,
                ownerCheck: response.ownerCheck,
                goodPushedUser: response.goodPushedUser
            }
            responsesData.push(responseData)
        })
        const reviewData = {
            title: review.title,
            diseaseNames: review.diseaseNames,
            treatmentTiming: review.treatmentTiming,
            comment: review.comment,
            url: review.url,
            author: {
                penName: review.author.penName||review.author.username,
                _id: review.author._id
            },
            tweetDate: review.tweetDate,
            ownerCheck: review.ownerCheck,
            goodPushedUser: review.goodPushedUser,
            responses: responsesData,
            _id: review._id
        }
        reviewsData.push(reviewData)
    });

    res.render('hospital/detail', {
        hospital: hospitalData,
        allReviewsLength: allReviews.length,
        reviews: reviewsData,
        totalPage,
        currentPage,
        skip,
        limit,
        description
    });
}

module.exports.editPageHospital = async(req, res)=>{
    const {id} = req.params;
    const hospital = await Hospital.findById(id);
    if(!hospital){
        throw new AppError('hospitalが見つかりません', 404)
    }
    res.render('hospital/edit', {hospital});
}

module.exports.editHospital = async (req, res)=>{
    const {id} = req.params;
    const {hospitalname, location, url} = req.body;
    const {lat, lng} = await normalize(location);
    const hospital = Hospital.findByIdAndUpdate(id, {hospitalname, location, lat, lng, url})
    if(!hospital){
        throw new AppError('エラーが発生したため編集できませんでした', 400);
    }
    req.flash('success', '病院情報を編集しました');
    res.redirect(`/hospital/${id}`);
}

module.exports.deleteHospital = async(req, res)=>{
    const {id} = req.params;
    const hospital = await Hospital.findByIdAndDelete(id);
    if(!hospital){
        throw new AppError('hospitalが見つかりませんでした。', 404);
    }
    req.flash('success', '病院を削除しました');
    res.redirect('/hospital');
}

module.exports.indexHospital = async (req, res) => {
    const hospitals = await Hospital.find({}).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    });
    page = 'list';
    description = 'List of Hospitals in Japan Performing Pediatric Cardiac Surgery';
    const sortedHospitals = hospitals.sort((a, b) => b.reviews.filter(review => review.ownerCheck && !review.author.isDeleted).length - a.reviews.filter(review => review.ownerCheck && !review.author.isDeleted).length);
    const top10Hospitals = sortedHospitals.slice(0, 10);
    const areas = [
        '北海道・東北地方',
        '関東地方',
        '中部地方',
        '近畿地方',
        '中国・四国地方',
        '九州・沖縄地方'
    ]
    const hospitalsData = [];
    hospitals.forEach(hospital =>{
        const hospitalData = {
            _id: hospital._id,
            hospitalname: hospital.hospitalname,
            area: hospital.area,
            lat: hospital.lat,
            lng: hospital.lng,
            filteredReviewsCount: hospital.reviews.filter(review=>review.ownerCheck&&!review.author.isDeleted).length
        }
        hospitalsData.push(hospitalData);
    })
    const top10HospitalsData = [];
    top10Hospitals.forEach(hospital =>{
        const hospitalData = {
            _id: hospital._id,
            hospitalname: hospital.hospitalname,
            filteredReviewsCount: hospital.reviews.filter(review=>review.ownerCheck&&!review.author.isDeleted).length
        }
        top10HospitalsData.push(hospitalData)
    })

    res.render('hospital/list', {
        hospitals: hospitalsData,
        top10Hospitals: top10HospitalsData, 
        page,
        description,
        areas
    });
}

