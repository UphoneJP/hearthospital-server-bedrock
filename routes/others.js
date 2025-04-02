const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, saveReturnTo, intoMyPage, intoDirectMessage, validateSearchForm, validateMessages, validateForms, validateNonAccountForms, validateFeedbackForms} = require('../utils/middleware');
const others = require('../controllers/others');
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { addNonce } = require("../utils/nonceArray")

const articles = require('../views/others/articles');
router.get('/aboutUs', (req, res)=>{
    page = 'aboutUs';
    res.render('others/aboutUs', {page, articles});
});
router.get('/policy', (req, res)=>{
    page = 'policy';
    res.render('others/policy', {page});
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

// firstLaunch
router.post('/firstLaunch', async (req, res) => {
  try {
    const { deviceId, timestamp, signature } = req.body
    if(!deviceId || !timestamp || !signature) {
      return res.status(400).json({ error: "Invalid request" });
    }
  
    // 3分を過ぎたリクエストは無効
    if(Number(timestamp) + 1000 * 60 * 3 < Date.now()) {
      return res.status(403).json({ error: "Invalid timestamp" });
    }
  
    // 正しい署名を作成
    const expectedSignature = crypto
      .createHmac("sha256", process.env.API_KEY_INI)
      .update(`${deviceId}:${timestamp}`)
      .digest("hex");
  
    // 署名が一致しない場合は403エラー
    if (signature.trim() !== expectedSignature.trim()) {
      return res.status(403).json({ error: "Invalid signature" });
    }
  
    const apiKey = process.env.API_KEY
    const JWTSecret = process.env.JWT_SECRET
    const payload = { apiKey, JWTSecret, deviceId }
  
    const token = jwt.sign(payload, deviceId)
    res.status(200).json({ token })
  } catch(e) {
    console.log('firstLaunch Error: ', e)
    res.status(400).json({ error: "firstLaunch missed"})
  }
})

// nonce生成
router.get('/getRandomBytes', (req, res)=>{
  console.log('nonce function called')
  const randomBytes = crypto.randomBytes(16)
  const nonce = Buffer.from(randomBytes).toString("base64")
  const nonceObject = {
    nonce,
    iat: new Date().getTime()
  }
  addNonce(nonceObject)
  res.status(200).json({nonceObject})
})



module.exports = router
