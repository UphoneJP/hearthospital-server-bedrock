const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const hospital = require('../controllers/hospital')
const {isLoggedIn, saveReturnTo, isOwner, validateHospital} = require('../utils/middleware');


// C 
router.route('/new')
    .get(isLoggedIn, isOwner, hospital.newHospital)
    .post(isLoggedIn, isOwner, validateHospital, catchAsync(hospital.createHospital));

router.route('/:id')
    .get(saveReturnTo, catchAsync(hospital.showHospital))// R 
    .put(isLoggedIn, isOwner, validateHospital, catchAsync(hospital.editHospital))// U 
    .delete(isLoggedIn, isOwner, catchAsync(hospital.deleteHospital))// D 

router.get('/:id/edit', isLoggedIn, isOwner, catchAsync(hospital.editPageHospital));

// 一覧
router.get('/', catchAsync(hospital.indexHospital));


module.exports = router;
