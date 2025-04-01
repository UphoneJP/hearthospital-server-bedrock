const express = require('express')
const router = express.Router({mergeParams : true})
const talkingRoom = require('../controllers/apiTalkingRoom')
const { validateTalkTheme, validateTalk } = require('../utils/apiMiddleware')

router.get('/', talkingRoom.talkThemesList)
router.get('/:id', talkingRoom.eachTheme)
router.post('/new', validateTalkTheme, talkingRoom.createNewTalkTheme)
router.patch('/:id', validateTalkTheme, talkingRoom.editTalkTheme)
router.post('/:id', talkingRoom.deleteTalkTheme)

router.post('/:id', validateTalk, talkingRoom.createNewTalk)
router.post('/:id/:talkId', talkingRoom.deleteTalk)

module.exports = router
