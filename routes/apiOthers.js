const express = require('express')
const router = express.Router()
const others = require('../controllers/apiOthers')

// 問い合わせ
router.post('/form', others.form)
// フィードバック
router.post('/feedback', others.feedback)
// メッセージボックス画面
router.post('/chatBox', others.chatBox)
// チャットルームのヘッダーとメッセージ取得
router.get('/chat/recieverName/:id', others.recieverName)
router.get('/chat/:senderId/:recieverId', others.getMessages)

// othersPage
router.post('/othersPage', others.othersPage)

module.exports = router
