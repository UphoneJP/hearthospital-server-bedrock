const express = require('express')
const router = express.Router()
const hospital = require('../controllers/apiHospital')
// /api/hospital

router.get('/reviews', hospital.getReviews)
router.get('/:id', hospital.aboutHospital)
router.get('/', hospital.getHospitals)

router.post('/:id/new', hospital.createReview)
router.delete('/:id/:reviewid', hospital.deleteReview)

module.exports = router
