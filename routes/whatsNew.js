const express = require('express');
const router = express.Router({mergeParams : true});
 
router.get('/addHospitalChuukyo', (req, res)=>{
  res.render('whatsNew/addHospitalChuukyo');
})
router.get('/changePolicy04', (req, res)=>{
  res.render('whatsNew/changePolicy04');
})
router.get('/changePolicy03', (req, res)=>{
  res.render('whatsNew/changePolicy03');
})
router.get('/talkingRoom2', (req, res)=>{
    res.render('whatsNew/talkingRoom2');
})
router.get('/changePolicy02', (req, res)=>{
    res.render('whatsNew/changePolicy02');
})
router.get('/talkingRoom', (req, res)=>{
    res.render('whatsNew/talkingRoom');
})
router.get('/renewalHospitalData', (req, res)=>{
    res.render('whatsNew/renewalHospitalData');
})
router.get('/allAtOnce', (req, res)=>{
    res.render('whatsNew/allAtOnce');
})
router.get('/changePolicy01', (req, res)=>{
    res.render('whatsNew/changePolicy01');
})
router.get('/hospitalData', (req, res)=>{
    res.render('whatsNew/hospitalData');
})
router.get('/addHospitalNisseki', (req, res)=>{
    res.render('whatsNew/addHospitalNisseki');
})
// router.get('/amazonGift', (req, res)=>{
//     res.render('whatsNew/amazonGift');
// })
router.get('/established', (req, res)=>{
    res.render('whatsNew/established');
})


module.exports = router;
