const express = require('express')
const router = express.Router()
const others = require('../controllers/apiOthers')
const { validateForms, validateFeedbackForms } = require('../utils/apiMiddleware')

// 問い合わせ
router.post('/form', validateForms, others.form)
// フィードバック
router.post('/feedback', validateFeedbackForms, others.feedback)
// メッセージボックス画面
router.post('/chatBox', others.chatBox)
// チャットルームのヘッダーとメッセージ取得
router.get('/chat/:senderId/:recieverId', others.getMessages)

// othersPage
router.post('/othersPage', others.othersPage)

module.exports = router
