const express = require('express');
const router = express.Router({mergeParams : true});
const review = require('../controllers/review');
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isReviewAuthor, isResponseAuthor, validateReviews, validateResponses} = require('../utils/middleware');

// C 
router.post('/new', isLoggedIn, validateReviews, catchAsync(review.createReview));
router.post('/:reviewid/createResponse', isLoggedIn, validateResponses, catchAsync(review.createResponse));

router.route('/:reviewid')
    .get(catchAsync(review.showReview))// R 
    .delete(isLoggedIn, isReviewAuthor, catchAsync(review.deleteReview));// D 

router.delete('/:reviewid/:responseid', isLoggedIn, isResponseAuthor, catchAsync(review.deleteResponse))

// good
router.post('/:reviewid/countHeart', isLoggedIn, catchAsync(review.countHeart));
router.post('/:reviewid/pushFavorite', isLoggedIn, catchAsync(review.pushFavorite));
router.post('/:reviewid/:responseid', isLoggedIn, catchAsync(review.countResponseHeart));




module.exports = router;
