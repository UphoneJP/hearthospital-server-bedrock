const express = require('express')
const router = express.Router({mergeParams : true})
const talkingRoom = require('../controllers/apiTalkingRoom')
// /api/talkingRoom

router.get('/', talkingRoom.talkThemesList)
router.get('/:id', talkingRoom.eachTheme)
router.post('/new', talkingRoom.createNewTalkTheme)
router.patch('/:id', talkingRoom.editTalkTheme)
router.delete('/:id', talkingRoom.deleteTalkTheme)

router.post('/:id', talkingRoom.createNewTalk)
router.delete('/:id/:talkId', talkingRoom.deleteTalk)

module.exports = router
