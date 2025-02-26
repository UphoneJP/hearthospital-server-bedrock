const Hospital = require('../models/hospital');
const Review = require('../models/review');
const Response = require('../models/response');
const User = require('../models/user');
const Form = require('../models/form');
const Link = require('../models/link');
const NonAccountUser = require('../models/nonAccountUser');
const Feedback = require('../models/feedback');
const AppError = require('../utils/AppError');

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: 465,
    secure: true, 
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
    },
});
async function autoSender(nonAccount, formContent) {
    await transporter.sendMail({
        from: 'support@hearthospital.jp',
        to: nonAccount.email, 
        bcc: 'support@hearthospital.jp',
        subject: "~先天性心疾患専用 病院口コミアプリ~ HeartHospital お問い合わせの返答",
        text: `${nonAccount.username}様\n\nHeartHospitalにお問い合わせいただきありがとうございます。\n返答までお待たせいたしました。\n\n${formContent}\nまたご質問・ご意見・ご要望等ございましたら、\n再度お問い合わせフォームにてお問合せ下さい。\n\n-----お問い合わせ内容-----\n【問い合わせ番号】${nonAccount._id}\n【問い合わせ日時】${nonAccount.timestamp.toLocaleString()}\n【氏名】${nonAccount.username}\n【内容】${nonAccount.formContent}\n\nHeartHospital\nhttps://www.hearthospital.jp`,
    });
}

module.exports.showList = async (req, res)=>{
    const reviews = await Review.find({ownerCheck: false})
        .populate('author')
        .populate('hospital')
        .where('author.isDeleted').ne(true);
    const responses = await Response.find({ownerCheck : false})
        .populate('author')
        .populate('hospital')
        .populate({
            path: 'review',
            populate: {
                path: 'author'
            }
        })
        .where('author.isDeleted').ne(true);;
    const forms = await Form.find({ownerCheck: false})
        .populate('author')
        .where('author.isDeleted').ne(true);
    const nonAccountForms = await NonAccountUser.find({ownerCheck: false});
    const feedbacks = await Feedback.find({ownerCheck: false});
    page = 'admin';
    res.render('admin/admin', {reviews, responses, forms,nonAccountForms, feedbacks, page});
}

module.exports.approveReviews = async(req, res)=>{
    const {reviewid} = req.params;
    await Review.findByIdAndUpdate(reviewid, {ownerCheck : true});
    
    const hospital = await Hospital.findOne({reviews: {$in: reviewid}}).populate('reviews');
    const filteredReviews = hospital.reviews.filter(review => review.ownerCheck);
    hospital.filteredReviewsCount = filteredReviews.length;
    await hospital.save();

    req.flash('success', '口コミの承認をしました')
    res.redirect('/admin');
}

module.exports.reviewEditPage = async(req, res)=>{
    const {reviewid} = req.params;
    const review = await Review.findById(reviewid).populate('author').populate('hospital');
    page = 'adminEdit'
    res.render('admin/editReview', {review, page});
}

module.exports.reviewEdit = async(req, res)=>{
    const delimiterRegex = /[\u3000\s、・,\/]/;
    const {reviewid} = req.params;
    let {title, diseaseNames, treatmentTiming, comment} = req.body;
    diseaseNames = diseaseNames.split(delimiterRegex);
    await Review.findByIdAndUpdate(reviewid, {
        title,
        diseaseNames,
        treatmentTiming,
        comment,
        ownerCheck: true
    });

    const hospital = await Hospital.findOne({reviews: {$in: reviewid}}).populate('reviews');
    const filteredReviews = hospital.reviews.filter(review => review.ownerCheck);
    hospital.filteredReviewsCount = filteredReviews.length;
    await hospital.save();
    
    req.flash('success', '口コミを編集し承認しました')
    res.redirect('/admin');
}

module.exports.deleteReview = async(req, res)=>{
    const {reviewid} = req.params;
    const review = await Review.findById(reviewid).populate('hospital');
    
    const hospital = await Hospital.findById(review.hospital._id);
    hospital.reviews.filter(_id => _id !== reviewid);
    await hospital.save();

    const user = await User.findById(review.author);
    user.reviews.filter(_id => _id !== reviewid);
    await user.save();
    
    await Review.findByIdAndDelete(reviewid);
    req.flash('success', '口コミを削除しました');
    res.redirect('/admin');
}

module.exports.approveResponses = async(req, res)=>{
    const {id} = req.params;
    await Response.findByIdAndUpdate(id, {ownerCheck : true});
    req.flash('success', 'レス投稿を承認しました');
    res.redirect('/admin');
}

module.exports.deleteResponses = async(req, res)=>{
    const {id} = req.params;
    await Response.findByIdAndDelete(id);
    req.flash('success', 'レス投稿を拒否して削除しました')
    res.redirect('/admin');
}

module.exports.formDone = async(req, res)=>{
    const {id} = req.params;
    await Form.findByIdAndUpdate(id, {ownerCheck : true});
    req.flash('success', '対応済みにしました');
    res.redirect('/admin');
}

module.exports.nonAccountForm = async(req, res)=>{
    const {id} = req.params;
    const {formContent} = req.body;
    const nonAccount = await NonAccountUser.findById(id);
    await autoSender(nonAccount, formContent);
    nonAccount.ownerCheck = true;
    await nonAccount.save();
    req.flash('success', 'emailを送信し対応済みにしました。');
    res.redirect('/admin');
}

module.exports.feedback = async(req, res)=>{
    const {id} = req.params;
    await Feedback.findByIdAndUpdate(id, {ownerCheck: true});
    req.flash('success', 'フィードバックを確認済みにしました。');
    res.redirect('/admin');
}

module.exports.createLink = async(req, res)=>{
    const {
        linkName,
        linkUrl,
        category,
        DateOfPermission,
        manager
    } = req.body;
    const link = new Link({linkName, linkUrl, category, DateOfPermission, manager});
    await link.save();
    req.flash('success', 'リンクを掲載しました');
    res.redirect('/link');
}

module.exports.editLink = async(req, res)=>{
    const {id} = req.params;
    const {
        category,
        linkName,
        linkUrl,
        manager,
        DateOfPermission
    } = req.body;
    const link = await Link.findByIdAndUpdate(id, {
        category,
        linkName,
        linkUrl,
        manager,
        DateOfPermission
    });
    if(!link){
        throw new AppError('linkが見つかりませんでした。', 404);
    }
    req.flash('success', 'リンクを編集しました。')
    res.redirect('/link');
}

module.exports.deleteLink = async(req, res)=>{
    const {id} = req.params;
    const link = await Link.findByIdAndDelete(id);
    if(!link){
        throw new AppError('削除するリンクが見つかりませんでした。', 404);
    }
    req.flash('success', 'リンクを削除しました。')
    res.redirect('/link');
}
