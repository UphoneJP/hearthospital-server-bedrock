const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, saveReturnTo, intoMyPage, intoDirectMessage, validateSearchForm, validateMessages, validateForms, validateNonAccountForms, validateFeedbackForms} = require('../utils/middleware');
const others = require('../controllers/others');
const path = require('path');


const articles = require('../views/others/articles');
router.get('/aboutUs', (req, res)=>{
    page = 'aboutUs';
    res.render('others/aboutUs', {page, articles});
});
router.get('/policy', (req, res)=>{
    page = 'policy';
    description = 'Terms and Conditions and Privacy Policy.'
    res.render('others/policy', {page, description});
});
router.get('/form', saveReturnTo, (req, res)=>{
    page = 'form';
    res.render('others/form', {page});
});
router.get('/link', catchAsync(others.link));
router.get('/hospitalData', saveReturnTo, catchAsync(others.hospitalData));


router.get('/diseaseNames', validateSearchForm, catchAsync(others.showDiseaseName));

// 口コミ記入時の索引
router.get('/allDiseases', catchAsync(others.allDiseases));

// マイページ
router.get('/myPage/:id', isLoggedIn, intoMyPage, catchAsync(others.showMyPage));

// メール通知設定
router.get('/notifyTrue/:id', isLoggedIn, intoMyPage, catchAsync(others.notifyTrue));
router.get('/notifyFalse/:id', isLoggedIn, intoMyPage, catchAsync(others.notifyFalse));

// 他の人のページ
router.get('/othersPage/:id', saveReturnTo, catchAsync(others.showOthersPage));

// ダイレクトメッセージ画面
router.get('/messages/:senderId/:recieverId', isLoggedIn, intoDirectMessage, catchAsync(others.showDirectMessagePage));

// ダイレクトメッセージ画面でメッセージ入力
router.post('/messages/:senderId/:recieverId', isLoggedIn, intoDirectMessage, validateMessages, catchAsync(others.postDirectMessage));

// 既読機能
router.post('/readReceipt', catchAsync(others.readReceipt));

// 問い合わせフォーム入力
router.post('/form', isLoggedIn, validateForms, catchAsync(others.createForm));
router.post('/form/nonAccount', validateNonAccountForms, catchAsync(others.createNonAccountForm));
router.post('/form/feedback', validateFeedbackForms, catchAsync(others.createFeedback));

module.exports = router;
