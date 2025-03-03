const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isOwner, validateReviews, validateLinkForm} = require('../utils/middleware');
const admin = require('../controllers/admin')


// list
router.get('/', isLoggedIn, isOwner, catchAsync(admin.showList));

// review
router.patch('/review/:reviewid', isLoggedIn, isOwner, catchAsync(admin.approveReviews));
router.get('/review/:reviewid/edit', isLoggedIn, isOwner, catchAsync(admin.reviewEditPage))
router.put('/review/:reviewid', isLoggedIn, isOwner, validateReviews, catchAsync(admin.reviewEdit));
router.delete('/review/:reviewid', isLoggedIn, isOwner, catchAsync(admin.deleteReview));

// response
router.patch('/response/:id', isLoggedIn, isOwner, catchAsync(admin.approveResponses));
router.delete('/response/:id', isLoggedIn, isOwner, catchAsync(admin.deleteResponses));

// form 
router.patch('/form/:id', isLoggedIn, isOwner, catchAsync(admin.formDone));

// nonAccountForm
router.post('/nonAccountForm/:id', isLoggedIn, isOwner, catchAsync(admin.nonAccountForm));

// feedback
router.patch('/feedback/:id', isLoggedIn, isOwner, catchAsync(admin.feedback));

// giftRequest
router.patch('/giftRequest/:id', isLoggedIn, isOwner, catchAsync(admin.giftRequest))

// link
router.post('/link', isLoggedIn, isOwner, validateLinkForm, catchAsync(admin.createLink));
router.put('/link/:id', isLoggedIn, isOwner, validateLinkForm, catchAsync(admin.editLink));
router.delete('/link/:id', isLoggedIn, isOwner, catchAsync(admin.deleteLink));

module.exports = router;
