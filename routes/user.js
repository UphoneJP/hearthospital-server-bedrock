const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const user = require('../controllers/user');
const {isLoggedIn, saveReturnTo, intoMyPage, validateEmail, validateUserRegister, validateUserLogin, validateResetPassword, validatePenName, validatePromotion} = require('../utils/middleware');

// localユーザー登録
router.get('/register', user.registerPage);
router.post('/checkEmail', validateEmail, user.checkEmail)
router.post('/register', validateUserRegister, catchAsync(user.register));


//localログイン
router.get('/loginForm', user.loginPage);
router.post('/login', validateUserLogin, user.localLogin);

// googleログイン
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));    
router.get('/login/callback', user.googleLogin);

// パスワード再設定
router.get('/resetPassword', (req, res)=>{
    res.render('users/resetPassword');
})
router.post('/resetPassword', validateEmail, catchAsync(user.sendEmail));
router.get('/resetPassword/:token', catchAsync(user.resetPasswordForm));
router.get('/sendAuthNum/:token', catchAsync(user.sendAuthNum));
router.patch('/resetPassword/:token', validateResetPassword, catchAsync(user.resetPWcomplete));


// penName入力　修正
router.patch('/penName/:id', isLoggedIn, intoMyPage, validatePenName, catchAsync(user.penName));
// promotion入力　修正
router.patch('/promotion/:id', isLoggedIn, intoMyPage, validatePromotion, catchAsync(user.promotion));

// アカウント論理的削除
router.delete('/:id', isLoggedIn, intoMyPage, catchAsync(user.deleteAccount));

// ログアウト
router.get('/logout', user.logout);



module.exports = router;

