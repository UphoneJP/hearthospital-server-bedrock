const express = require('express')
const router = express.Router({mergeParams : true})
const talkingRoom = require('../controllers/apiTalkingRoom')
const { validateTalkTheme, validateEditTalkTheme, validateTalk } = require('../utils/apiMiddleware')

router.get('/', talkingRoom.talkThemesList)
router.get('/:id', talkingRoom.eachTheme)
router.post('/new', validateTalkTheme, talkingRoom.createNewTalkTheme)
router.patch('/:id', validateEditTalkTheme, talkingRoom.editTalkTheme)
router.post('/:id', talkingRoom.deleteTalkTheme)

router.post('/:id/new', validateTalk, talkingRoom.createNewTalk)
router.delete('/:id/:talkId/:userId', talkingRoom.deleteTalk)

module.exports = router
