const express = require('express')
const router = express.Router()
const user = require('../controllers/apiUser')

// ローカル
router.post('/checkEmail', user.checkEmail)
router.post('/register', user.register )
router.post('/login', user.localLogin )

// googleログイン
router.post("/auth/google", user.googleLogin )

// 自動ログイン(アクセストークン)
router.post('/validateToken', user.validateToken )
// 自動ログイン(リフレッシュトークン)
router.post('/refreshToken', user.refreshToken )

// メール通知設定
router.get('/:id/notifyTrue', user.notifyTrue )
router.get('/:id/notifyFalse', user.notifyFalse )

// penName入力 修正
router.patch('/penName/:id', user.penName )

// promotion入力 修正
router.patch('/promotion/:id', user.promotion )

// アカウント論理的削除
router.delete('/:id', user.accountDelete )

// パスワード再設定
router.post('/resetPassword', user.resetPassword)


module.exports = router

