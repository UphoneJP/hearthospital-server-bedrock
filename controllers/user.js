if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}
const User = require('../models/user');
const AppError = require('../utils/AppError');
const passport = require('passport');

// const nodemailer = require("nodemailer");
// const transporter = nodemailer.createTransport({
//     host: process.env.NODEMAILER_HOST,
//     port: 465,
//     secure: true, 
//     auth: {
//         user: process.env.NODEMAILER_USER,
//         pass: process.env.NODEMAILER_PASS,
//     },
// });

// async function autoSender(toUser, nums) {
//     await transporter.sendMail({
//         from: 'support@hearthospital.jp',
//         to: toUser, 
//         bcc: 'support@hearthospital.jp',
//         subject: "~先天性心疾患専用 病院口コミアプリ~ HeartHospital E-mail認証番号",
//         text: `※自動送信メールです。\n\nHeartHospitalをご利用いただきありがとうございます。\n認証番号を通知します。\n\n${nums}\n\n上記認証番号を所定の入力欄に入力してください。\n※認証番号は送信後10分間のみ有効です。\n\nHeartHospital\nhttps://www.hearthospital.jp`,
//     });
// }
// async function resetPasswordSender(toUser, req, crypto) {
//     await transporter.sendMail({
//         from: 'support@hearthospital.jp',
//         to: toUser, 
//         bcc: 'support@hearthospital.jp',
//         subject: "~先天性心疾患専用 病院口コミアプリ~ HeartHospital ログインパスワード再設定",
//         text: `※自動送信メールです。\n\nHeartHospitalをご利用いただきありがとうございます。\nログインパスワード再設定用URLを通知します。\n\nhttps://${req.headers.host}/resetPassword/${crypto}\n\nURLのパスワード再設定画面にて10分以内に再設定してください。\nまた、この通知に覚えがない場合はこのメールを破棄してください。\n\nHeartHospital\nhttps://www.hearthospital.jp`,
//     });
// }

function random6numbers(){
    nums = Math.floor(Math.random()*1000000).toString().padStart(6, '0');
    return nums;
}
function makeCrypto(n){
    const nums = '0123456789';
    const strs = 'abcdefghijklmnopqrstuvwxyz';
    const upperStrs = strs.toUpperCase();
    const seeds = [...nums.split(''), ...strs.split(''), ...upperStrs.split('')];
    let crypto = '';
    for(let i = 0; i < n; i++){
        const random = Math.floor(Math.random() * seeds.length);
        crypto += seeds[random];
    }
    return crypto;
}

// localユーザー登録
module.exports.registerPage = (req, res)=>{
    page = 'register';
    res.render('users/register', {page});
}
module.exports.register = async(req, res)=>{
    const {penName, password, email, authNum} = req.body;
    if(authNum === req.session.nums && Date.now() <= req.session.authTimestamp){
        delete req.session.nums;
        const user = new User({
            penName,
            email
        });
        const newUser = await User.register(user, password);
        req.login(newUser, err=>{
            if(err)return next(err);
            req.flash('success', 'ユーザー登録しログインしました');
            res.redirect(`/myPage/${newUser._id}`);
        });
    } else {
        throw new AppError('正規手順で時間内に登録してください。', 400)
    }
}

// 認証番号通知
// module.exports.checkEmail = async(req, res)=>{
//     const {email} = req.body;
//     const nums = random6numbers();
//     req.session.nums = nums;
//     req.session.authTimestamp = Date.now() + 1000 * 60 * 10;
//     await autoSender(email, nums)
//     .then(()=>{
//         res.json({
//             emailSent: true,
//             nums
//         })
//     })
//     .catch(()=>{
//         res.json({
//             emailSent: false
//         })
//     });
// }

//localログイン
module.exports.loginPage = (req, res)=>{
    const page = 'login';
    res.render('users/login', {page});
}
module.exports.localLogin = (req, res, next) => {
  const redirectUrl = req.session.returnTo || '/'
  delete req.session.returnTo
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err)
    if (!user) {
      req.flash('error', 'ログインに失敗しました。')
      return res.redirect('/loginForm')
    }
    if (user.isDeleted) {
      req.flash('error', '過去に削除されたアカウントの可能性があります。')
      return res.redirect('/loginForm')
    }
    req.login(user, (err) => {
      if (err) return next(err)
      req.flash('success', 'ログインに成功しました')
      return res.redirect(redirectUrl)
    })
  })(req, res, next)
}

// googleログイン
module.exports.googleLogin = (req, res, next) => {
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    passport.authenticate('google', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', 'Google認証に失敗しました');
            return res.redirect('/loginForm');
        }
        if (user.isDeleted) {
            req.flash('error', '過去に削除されたアカウントの可能性があります。');
            return res.redirect('/loginForm');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', `ログインに成功しました。${user.penName?"":"マイページからペンネームを設定してください。"}`);
            return res.redirect(redirectUrl);
        });
    })(req, res, next);
}

// パスワード再設定
// module.exports.sendEmail = async(req, res)=>{
//     const token = makeCrypto(24);
    
//     const {email} = req.body;
//     const user = await User.findOneAndUpdate({email}, {
//         forResetToken: token,
//         forResetExpires: Date.now() + 1000 * 60 * 10
//     });
//     if(!user){
//         res.json({
//             sent: false,
//             message: 'E-mailアドレスがデータベースにありません。',
//         });
//     }
//     await resetPasswordSender(email, req, token);
//     res.json({
//         sent: true,
//         message: '送信されたメール内のURLにてパスワードを再設定してください。'
//     })
// }
// module.exports.resetPasswordForm = async(req, res)=>{
//     const {token} = req.params;
//     const user = await User.find({
//         forResetToken: token,
//         forResetExpires: {$gt: Date.now()},
//         isDeleted: false
//     });
//     if(!user){
//         throw new AppError('エラーが発生しました。再度パスワード再設定手続きを行い、制限時間内にお手続きをお済ませください。それでも解決しない場合は問い合わせフォームにてお知らせください。', 400);
//     }
//     res.render('users/resetPasswordForm', {token});
// }
// module.exports.sendAuthNum = async(req, res)=>{
//     const {token} = req.params;
//     const user = await User.findOne({
//         forResetToken: token,
//         forResetExpires: {$gt: Date.now()},
//         isDeleted: false
//     });
//     if(!user){
//         res.json({
//             sent: false,
//             message: '※エラーが発生しました。制限時間内にお手続きをお済ませください。',
//         });
//     }
//     const nums = random6numbers();
//     await autoSender(user.email, nums);
//     req.session.authNum = nums;
//     req.session.timestamp = Date.now() + 1000 * 60 * 10;
//     res.json({
//         sent: true,
//         nums,
//         timestamp: Date.now() + 1000 * 60 * 10,
//         message: 'メールを送信しました。メール内の認証番号を入力してください。'
//     });
// }
// module.exports.resetPWcomplete = async (req, res, next)=>{
//     const {token} = req.params;
//     const {passwordA, passwordB, authNum} = req.body;
//     const user = await User.findOne({
//         forResetToken: token,
//         forResetExpires: {$gt: Date.now()},
//         isDeleted: false
//     })
//     if(!user){
//         throw new AppError('エラーが発生しました。URLの有効制限時間内に手続きを完了させてください。', 400);
//     }
//     if(passwordA === passwordB && authNum === req.session.authNum && Date.now() <= req.session.timestamp){
//         await user.setPassword(passwordA);
//         user.forResetToken = undefined;
//         user.forResetExpires = undefined;
//         await user.save();
//         req.login(user, err=>{
//             if(err)return next(err);
//             req.flash('success', 'パスワードを再設定しログインしました');
//             res.redirect(`/myPage/${user._id}`);
//         });
//     } else {
//         throw new AppError('この方法でのアクセスは認められていません。', 400);
//     }
// }


// penName入力　修正
module.exports.penName = async(req, res)=>{
    const {id} = req.params;
    const {penName} = req.body;
    const user = await User.findByIdAndUpdate(id, { penName });
    if(!user){
      throw new AppError('userが見つかりません', 404);
    }
    req.flash('success', `ペンネームを${penName}にしました。`);
    res.redirect(`/myPage/${id}`);
}

// promotion入力　修正
module.exports.promotion = async(req, res)=>{
    const {id} = req.params;
    const {promotion} = req.body;
    const user = await User.findByIdAndUpdate(id, { promotion });
    if(!user){
      throw new AppError('userが見つかりません', 404);
    }
    req.flash('success', `自己紹介文を設定しました。`);
    res.redirect(`/myPage/${id}`);
}

// アカウント論理的削除
module.exports.deleteAccount = async(req, res, next)=>{
    const {id} = req.params;
    const user = await User.findByIdAndUpdate(id, {isDeleted: true});
    if(!user){
        res.json({
            delete: false
        });
    }
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie('session');
            res.json({
                delete : true
            });
        });
    });
}

// ログアウト
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie('session');
            res.redirect('/');
        });
    });
}
