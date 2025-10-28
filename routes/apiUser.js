const express = require('express')
const router = express.Router()
const user = require('../controllers/apiUser')
const { validateEmail, validateUserRegister, validateUserLogin, validatePenName, validatePromotion } = require('../utils/apiMiddleware')

// ローカル
// router.post('/checkEmail', validateEmail, user.checkEmail)
router.post('/register', validateUserRegister, user.register )
router.post('/login', validateUserLogin, user.localLogin )

// googleログイン
router.post("/auth/google", user.googleLogin )

// appleログイン
// router.post("/auth/apple", user.appleLogin)

// 自動ログイン(アクセストークン)
router.post('/validateToken', user.validateToken )
// 自動ログイン(リフレッシュトークン)
router.post('/refreshToken', user.refreshToken )

// メール通知設定
router.get('/:id/notifyTrue', user.notifyTrue )
router.get('/:id/notifyFalse', user.notifyFalse )

// penName入力 修正
router.patch('/penName/:id', validatePenName, user.penName )

// promotion入力 修正
router.patch('/promotion/:id', validatePromotion, user.promotion )

// アカウント論理的削除
router.delete('/:id', user.accountDelete )

// パスワード再設定
router.post('/resetPassword', validateUserLogin, user.resetPassword)

// ポイントゲット
router.post('/:id/earningPoint', user.earningPoint)

// ポイント消費
router.post('/usingPoints', user.usingPoints)

module.exports = router

