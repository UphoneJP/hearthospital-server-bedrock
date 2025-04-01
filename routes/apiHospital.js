const express = require('express')
const router = express.Router()
const hospital = require('../controllers/apiHospital')
const { validateReviews } = require('../utils/apiMiddleware')
// /api/hospital

router.get('/reviews', hospital.getReviews)
router.get('/:id', hospital.aboutHospital)
router.get('/', hospital.getHospitals)

router.post('/:id/new', validateReviews, hospital.createReview)
router.post('/:id/:reviewid', hospital.deleteReview)

module.exports = router
