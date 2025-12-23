const express = require('express')
const router = express.Router()
const allRoutes = require('../controllers/apiAllRoutes')
const Hospital = require('../models/hospital')
const Review = require('../models/review')
const TalkTheme = require('../models/talkTheme')
const { validateReviews, validateTalkTheme, validateEditTalkTheme, validateTalk, validateUserRegister, validateUserLogin, validatePenName, validatePromotion, validateForms, validateFeedbackForms } = require('../utils/apiMiddleware')

router.get('/allInfo', async ()=>{
  const [hospitals, reviews, talkThemes] = await Promise.all([
    Hospital.find({}).populate({
      path: 'reviews',
      populate: { path: 'author' }
    }),
    Review.find({ ownerCheck: true }).populate('hospital author'),
    TalkTheme.find({}).populate({
      path: 'talks',
      populate: {
        path: 'loggedInUser',
        model: 'User'
      }
    })
  ]);

  return res.status(200).json({ hospitals, reviews, talkThemes})
})


// hospital
router.post('/hospital/:id/new', validateReviews, allRoutes.createReview)
router.post('/hospital/:id/:reviewid', allRoutes.deleteReview)

// talkingRoom
router.post('/talkingRoom/new', validateTalkTheme, allRoutes.createNewTalkTheme)
router.patch('/talkingRoom/:id', validateEditTalkTheme, allRoutes.editTalkTheme)
router.post('/talkingRoom/:id', allRoutes.deleteTalkTheme)
router.post('/talkingRoom/:id/new', validateTalk, allRoutes.createNewTalk)
router.delete('/talkingRoom/:id/:talkId/:userId', allRoutes.deleteTalk)

// user
router.post('/user/register', validateUserRegister, allRoutes.register )
router.post('/user/login', validateUserLogin, allRoutes.localLogin )
router.post('/user/auth/google', allRoutes.googleLogin )
router.post('/user/validateToken', allRoutes.validateToken )
router.post('/user/refreshToken', allRoutes.refreshToken )
router.patch('/user/penName/:id', validatePenName, allRoutes.penName )
router.patch('/user/promotion/:id', validatePromotion, allRoutes.promotion )
router.delete('/user/:id', allRoutes.accountDelete )
router.post('/user/:id/earningPoint', allRoutes.earningPoint)
router.post('/user/usingPoints', allRoutes.usingPoints)

// others
router.post('/others/form', validateForms, allRoutes.form)
router.post('/others/feedback', validateFeedbackForms, allRoutes.feedback)
router.post('/others/chatBox', allRoutes.chatBox)
router.get('/others/chat/:senderId/:recieverId', allRoutes.getMessages)
router.post('/others/othersPage', allRoutes.othersPage)

module.exports = router
