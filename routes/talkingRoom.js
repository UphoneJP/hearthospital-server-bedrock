const express = require('express');
const router = express.Router({mergeParams : true});
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const {isLoggedIn, saveReturnTo, isTalkThemeAuthor, validateTalkTheme, isTalkAuthor, validateTalk, validateGuestTalk, isOwner} = require('../utils/middleware');
const recaptcha = require('../utils/recaptcha');
const rateLimit = require('express-rate-limit');
const postLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5分間のウィンドウ
    max: 3, // 1つのIPから3回まで投稿可能
    message: "短時間での投稿が多すぎます。少し待ってから再度お試しください。"
});

const TalkTheme = require('../models/talkTheme');
const Talk = require('../models/talk');

const colors = [
    "blue.jpg",
    "pink.jpg",
    "green.jpg",
    "yellow.jpg",
    "blue2.jpg",
    "pink2.jpg",
    "green2.jpg",
    "yellow2.jpg",
    "blue3.jpg",
    "pink3.jpg",
    "green3.jpg",
    "yellow3.jpg",
];
const bgcolors = [
    'rgba(255, 99, 132, 0.8)',   // 赤
    'rgba(54, 162, 235, 0.8)',   // 青
    'rgba(255, 206, 86, 0.8)',   // 黄色
    'rgba(75, 192, 192, 0.8)',   // 水色
    'rgba(153, 102, 255, 0.8)',  // 紫
    'rgba(255, 159, 64, 0.8)',   // オレンジ
    'rgba(190, 190, 190, 0.8)',  // グレー
    'rgba(83, 102, 255, 0.8)',   // ディープブルー
    'rgba(120, 200, 246, 0.8)',  // ライトブルー
    'rgba(255, 193, 7, 0.8)',    // ゴールド
    'rgba(139, 195, 74, 0.8)',   // 緑
    'rgba(255, 87, 34, 0.8)',    // ディープオレンジ
    'rgba(158, 158, 158, 0.8)',  // ミディアムグレー
    'rgba(233, 30, 99, 0.8)',    // ピンク
    'rgba(121, 85, 72, 0.8)',    // ブラウン
    'rgba(96, 125, 139, 0.8)',   // ブルーグレー
    'rgba(244, 67, 54, 0.8)',    // レッド
    'rgba(0, 150, 136, 0.8)',    // ティール
    'rgba(103, 58, 183, 0.8)',   // ディープパープル
    'rgba(33, 150, 243, 0.8)',   // ライトブルー
    'rgba(156, 39, 176, 0.8)',   // 紫（ダーク）
    'rgba(0, 188, 212, 0.8)',    // シアン
    'rgba(190, 210, 57, 0.8)',   // ライム
    'rgba(3, 169, 244, 0.8)',    // ライトスカイブルー
    'rgba(255, 235, 59, 0.8)',   // イエロー
    'rgba(170, 170, 170, 0.8)',  // グレイッシュホワイト
    'rgba(255, 140, 0, 0.8)',    // ダークオレンジ
    'rgba(220, 0, 78, 0.8)',     // ディープピンク
    'rgba(76, 175, 80, 0.8)',    // グリーン
    'rgba(124, 179, 66, 0.8)'    // ライトグリーン
];
  

// talkingRoom

// C
router.post('/new', isLoggedIn, validateTalkTheme, catchAsync(async(req, res)=> {
    const {title, detail} = req.body;
    const talkTheme = new TalkTheme({
        author: req.user,
        title,
        detail,
        colorNum: Math.floor(Math.random()*12),
        touchAt: new Date()
    });
    await talkTheme.save();
    res.redirect('/talkingRoom')
}));

// R
router.get('/:id', saveReturnTo, recaptcha.middleware.render, catchAsync(async(req, res)=> {
    const {id} = req.params;
    const talkTheme = await TalkTheme.findById(id)
        .populate({
            path: 'talks',
            populate: {
                path: 'loggedInUser',
                model: 'User'
            }
        });
    if(!talkTheme){
        throw new AppError('talkThemeが見つかりません', 404)
    }
    talkTheme.accessCount += 1;
    await talkTheme.save();

    const talksData = [];
    talkTheme.talks.forEach(talk =>{
        if(talk.loggedInUser){
            const talkData = {
                _id: talk._id,
                loggedInUser: {
                    _id: talk.loggedInUser._id,
                    username: talk.loggedInUser.username,
                    penName: talk.loggedInUser.penName,
                    num: talk.loggedInUser.num
                },
                content: talk.content,
                madeAt: talk.madeAt,
                deleted: talk.deleted,
            }
            talksData.push(talkData);
        } else {
            const talkData = {
                _id: talk._id,
                guestName: talk.guestName,
                content: talk.content,
                madeAt: talk.madeAt,
                deleted: talk.deleted,
            }
            talksData.push(talkData);
        }
    });
    const talkThemeData = {
        _id: talkTheme._id,
        title: talkTheme.title,
        talks: talksData,
        accessCount: talkTheme.accessCount
    };
    res.render('talkingRoom/eachTheme', {
        talkTheme:talkThemeData,
        bgcolors,
        captcha: res.recaptcha
    });
}))

// U
router.get('/:id/edit', isLoggedIn, isTalkThemeAuthor, catchAsync(async(req, res)=>{
    const {id} = req.params;
    const talkTheme = await TalkTheme.findById(id);
    if(!talkTheme){
        throw new AppError('talkThemeが見つかりません', 404)
    }
    res.render('talkingRoom/editTheme', {talkTheme});
}))
router.patch('/:id', isLoggedIn, isTalkThemeAuthor, validateTalkTheme, catchAsync(async(req, res)=> {
    const {id} = req.params;
    const {title, detail} = req.body;
    const talkTheme = await TalkTheme.findByIdAndUpdate(id, {title, detail});
    if(!talkTheme){
        throw new AppError('talkThemeが見つかりません', 404);
    }
    res.redirect('/talkingRoom');
}))

//D
router.get('/:id/delete', isLoggedIn, isTalkThemeAuthor, catchAsync(async(req, res)=>{
    const {id} = req.params;
    const talkTheme = await TalkTheme.findById(id);
    if(!talkTheme){
        throw new AppError('talkThemeが見つかりません', 404)
    }
    res.render('talkingRoom/deleteTheme', {talkTheme});
}))
router.delete('/:id', isLoggedIn, isTalkThemeAuthor, catchAsync(async(req, res)=> {
    const {id}= req.params
    const talkTheme = await TalkTheme.findById(id)
    if(!talkTheme){
      throw new AppError('talkThemeが見つかりません', 404)
    }
    await talkTheme.deleteOne()
    req.flash('success', 'トークテーマを削除しました。');
    res.redirect('/talkingRoom');
}))

// List
router.get('/', saveReturnTo, catchAsync(async(req, res)=>{
    page='talkingRoom';
    const talkThemes = await TalkTheme.find({});
    res.render('talkingRoom/talkingRoom', {talkThemes, colors, page});
}));



// eachTheme

// C
router.post('/:id/newTalk', isLoggedIn, validateTalk, catchAsync(async(req, res)=> {
    const {id} = req.params;
    const {content} = req.body;
    const talkTheme = await TalkTheme.findById(id);
    if(!talkTheme){
        throw new AppError('talkThemeが見つかりません', 404)
    }
    const talk = new Talk({
        loggedInUser: req.user,
        content,
        madeAt: new Date()
    });
    await talk.save();
    talkTheme.talks.unshift(talk);
    talkTheme.touchAt = new Date();
    await talkTheme.save();
    res.redirect(`/talkingRoom/${id}`);
}));
router.post('/:id/guestNewTalk', postLimiter, validateGuestTalk, recaptcha.middleware.verify, catchAsync(async(req, res)=> {
    if (!req.recaptcha.error) {
        const {id} = req.params;
        const {guestName, content} = req.body;
        const guestIp = req.ip
        const talkTheme = await TalkTheme.findById(id);
        if(!talkTheme){
            throw new AppError('talkThemeが見つかりません', 404)
        }
        const talk = new Talk({
            guestName,
            guestIp,
            content,
            madeAt: new Date()
        });
        await talk.save();
        talkTheme.talks.unshift(talk);
        talkTheme.touchAt = new Date();
        await talkTheme.save();
        res.redirect(`/talkingRoom/${id}`);
    } else {
        throw new AppError('ロボットでの入力は許容していません', 401)
    }    
}));

// D
router.delete('/:id/:talkId/forGuest', isLoggedIn, isOwner, catchAsync(async(req, res)=> {
    const {id, talkId} = req.params;
    const talk = await Talk.findById(talkId);
    talk.deleted = true;
    await talk.save();
    res.redirect(`/talkingRoom/${id}`);
}));
router.delete('/:id/:talkId', isLoggedIn, isTalkAuthor, catchAsync(async(req, res)=> {
    const {id, talkId} = req.params;
    await Talk.findByIdAndUpdate(talkId,{deleted: true});
    res.redirect(`/talkingRoom/${id}`);
}));


module.exports = router;

