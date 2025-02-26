const User = require('../models/user');
const Hospital = require('../models/hospital');
const Message = require('../models/message');
const Review = require('../models/review');
const Form = require('../models/form');
const Feedback = require('../models/feedback');
const Link = require('../models/link');
const NonAccountUser = require('../models/nonAccountUser');
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
async function autoSender(nonAccount) {
    await transporter.sendMail({
        from: 'support@hearthospital.jp',
        to: nonAccount.email, 
        bcc: 'support@hearthospital.jp',
        subject: "~先天性心疾患専用 病院口コミアプリ~ HeartHospital お問い合わせ内容",
        text: `※自動送信メールです。このメールに返信いただいても対応しかねます。\n\nHeartHospitalにお問い合わせいただきありがとうございます。\n内容を確認し順番に対応しております。\n返答には通常数日要しますのでご了承下さい。\n\n-----お問い合わせ内容-----\n【問い合わせ番号】${nonAccount._id}\n【氏名】${nonAccount.username}\n【内容】${nonAccount.formContent}\n\n対応に至らない点もあると存じますが、\n悩んでいる人の力になれるようお力をお貸しください。\nよろしくお願いいたします。\n\nHeartHospital\nhttps://www.hearthospital.jp`,
    });
}
async function notifyToReciever(reciever) {
    await transporter.sendMail({
        from: 'support@hearthospital.jp',
        to: reciever.email, 
        bcc: 'support@hearthospital.jp',
        subject: "~先天性心疾患専用 病院口コミアプリ~ HeartHospital ダイレクトメッセージ受信のお知らせ",
        text: `※自動送信メールです。\n\nHeartHospitalをご利用いただきありがとうございます。\nダイレクトメッセージを受信しました。\nログインをした後、マイページの「ダイレクトメッセージを見る」でご確認下さい。\n\n悩んでいる人の力になれるようお力をお貸しください。\nよろしくお願いいたします。\nまた、何かお困りの際は問い合わせフォームにてご相談ください。\n\nHeartHospital\nhttps://www.hearthospital.jp`,
    });
}
function sortHospitalDPC(hospitals, codes, year) {
    let arrays = [];
    let name = `${year}DPCcode`;
    for(let hospital of hospitals){
        let sum = 0;
        for(let code of codes){
            if(hospital[name]&&hospital[name][code]){
                sum += hospital[name][code][1];
            }
        }
        if(sum>0){arrays.push({hospital,sum})}
    }
    arrays = arrays.sort((a, b)=> b.sum - a.sum)
    return arrays;
}
function calcPatientsDPC(hospital, codes, year) {
    let sum = 0;
    let name = `${year}DPCcode`;
    for(let code of codes){
        if(hospital[name]&&hospital[name][code]){
            sum += hospital[name][code][1];
        }
    }
    return sum;
}
function calcPatientsKcode(hospital, code, year) {
    let sum = 0;
    let name = `${year}Kcode`;
    if (hospital[name] && hospital[name][code]) {
        sum += hospital[name][code][0];
    }
}
const areas = [
    '北海道・東北地方',
    '関東地方',
    '中部地方',
    '近畿地方',
    '中国・四国地方',
    '九州・沖縄地方'
];
const KcodeName = {
    'K5541': '弁形成術(１弁)',
    'K5551': '弁置換術(１弁)',
    'K5601ﾊ': '大動脈瘤切除術(上行)(自己弁温存型基部置換術)',
    'K563': '肺動脈絞扼術',
    'K566': '体動脈肺動脈短絡(ブラロック，ウォーターストン)手術',
    'K5702': '肺動脈狭窄症手術、純型肺動脈弁閉鎖症手術等',
    'K5741': '心房中隔欠損閉鎖術(単独)',
    'K5761': '心室中隔欠損閉鎖術(単独)',
    'K5801': 'ファロー四徴症手術(右室流出路形成術を伴う)',
    'K5812': '肺動脈閉鎖症手術(ラステリ手術を伴う)',
    'K5861': '単心室症手術（両方向性グレン手術）等',
    'K5862': '単心室症手術(フォンタン手術) 等',
    'K5972': 'ペースメーカー交換術',
    'K604-24': '植込型補助人工心臓(非拍動流型)(９１日目以降)',
    'K6171': '下肢静脈瘤手術(抜去切除術)'
};
const DPCcodeName = [
    'x10100',// "大血管転位症手術 大血管血流転換術(ジャテーン手術)等",
    'x10101',// "大血管転位症手術 大血管血流転換術(ジャテーン手術)等",
    'x10110',// "大血管転位症手術 大血管血流転換術(ジャテーン手術)等",
    'x10111',// "大血管転位症手術 大血管血流転換術(ジャテーン手術)等",
    'x0020',// "ファロー四徴症手術等",
    'x0021',// "ファロー四徴症手術等",
    'x1020',// "ファロー四徴症手術等",
    'x0030',// "心室中隔欠損閉鎖術",
    'x1030',// "心室中隔欠損閉鎖術",
    'x1031',// "心室中隔欠損閉鎖術",
    'x1021',// "弁形成術等",
    'e14029xxx01x0xx',// "弁形成術等",
    'x0970',// "その他の手術"
    'e50210xx97000x',// "その他の手術"
];


module.exports.link = async(req, res)=>{
    page = 'link';
    const links = await Link.find();
    const linksData = [];
    links.forEach(link=>{
        const linkData = {
            category: link.category,
            linkName: link.linkName,
            linkUrl: link.linkUrl
        }
        linksData.push(linkData);
    })
    res.render('others/link', {links:linksData, page});
}

module.exports.hospitalData = async(req, res)=>{
    page = 'hospitalData';
    const hospitals = await Hospital.find({}); 
    const hospitalsData = [];
    hospitals.forEach(hospital=>{
        const hospitalData = {
            hospitalname: hospital.hospitalname,
            _id: hospital._id,
            area: hospital.area,
            R3Kcode: hospital.R3Kcode,
            R3DPCcode: hospital.R3DPCcode,
            R3DPC: hospital.R3DPC,
            R4Kcode: hospital.R4Kcode,
            R4DPCcode: hospital.R4DPCcode,
            R4DPC: hospital.R4DPC,
            R5Kcode: hospital.R5Kcode,
            R5DPCcode: hospital.R5DPCcode,
            R5DPC: hospital.R5DPC,
        }
        hospitalsData.push(hospitalData);
    })  
    res.render('others/hospitalData', {
        page, 
        hospitals: hospitalsData, 
        areas, 
        KcodeName, 
        DPCcodeName, 
        sortHospitalDPC, 
        calcPatientsDPC,
        calcPatientsKcode
    });
}

module.exports.showDiseaseName = async(req,res)=>{
    page = 'diseaseNames';
    description = 'Search for Reviews by Medical Condition.'

    let reviews = await Review.find({ownerCheck:true}).populate('author');
    if(!reviews){
        throw new AppError('口コミ投稿が見つかりません', 404);
    }
    reviews = reviews.filter(review => !review.author.isDeleted);
    const diseases = reviews.map(review => review.diseaseNames).flat();
    const diseaseNames = [...new Set(diseases)];

    const {diseaseName} = req.query;
    if(diseaseName){
        let limitedReviews = await Review.find({
            ownerCheck: true,
            diseaseNames: {$in: [diseaseName]}
        }).populate('author');
        limitedReviews = limitedReviews.filter(review => !review.author.isDeleted);

        const limitedReviewsData = [];
        limitedReviews.forEach(review=>{
            const reviewData = {
                diseaseNames: review.diseaseNames,
                hospital: review.hospital,
                _id: review._id,
                title: review.title,
                treatmentTiming: review.treatmentTiming,
                comment: review.comment,
                tweetDate: review.tweetDate,
                author: {
                    _id: review.author._id,
                    penName: review.author.penName||review.author.username
                },
                url: review.url,
            }
            limitedReviewsData.push(reviewData);
        })
        res.render('others/diseaseNames', {
            limitedReviews: limitedReviewsData,
            diseaseName,
            diseaseNames,
            page,
            description
        });

    } else {
        const reviewsData = [];
        reviews.forEach(review=>{
            const reviewData = {
                diseaseNames: review.diseaseNames,
                hospital: review.hospital,
                _id: review._id,
                title: review.title,
                treatmentTiming: review.treatmentTiming,
                comment: review.comment,
                tweetDate: review.tweetDate,
                author: {
                    _id: review.author._id,
                    penName: review.author.penName||review.author.username
                },
                url: review.url,
            }
            reviewsData.push(reviewData);
        })
        res.render('others/diseaseNames', {
            reviews: reviewsData,
            limitedReviews:false,
            diseaseNames,
            page,
            description
        });
    }
}
module.exports.allDiseases = async(req, res)=>{
    let reviews = await Review.find({ownerCheck:true}).populate('author');
    if(!reviews){
        throw AppError('口コミ投稿が見つかりません', 404);
    }
    reviews = reviews.filter(review => !review.author.isDeleted);
    const diseases = reviews.map(review => review.diseaseNames).flat();
    const allDiseases = [...new Set(diseases)];
    res.json(allDiseases);
}

module.exports.showMyPage = async(req, res)=>{
    function removeDuplicates(array, _id) {
        return array.filter((obj, index, self) =>
            index === self.findIndex((o) => o[_id] === obj[_id])
        );
    }

    const {id} = req.params;
    const user = await User.findById(id).populate({
        path: 'reviews',
        populate:{
            path: 'hospital'
        }
    }).populate({
        path: 'responses',
        populate: {
            path: 'review'
        }
    }).populate({
        path: 'favorites',
        populate: {
            path: 'author'
        }
    });
    if(!user){
        throw new AppError('ユーザーが見つかりません', 404);
    }
    if(user.isDeleted){
        throw new AppError('ユーザーが見つかりません。削除された可能性があります。', 404);
    }

    const sentMessages = await Message.find({sender:user._id}).populate('reciever');
    const recievedPersons = sentMessages.filter(message => !message.reciever.isDeleted).map(messages => messages.reciever);
    const recievedMessages = await Message.find({reciever: id}).populate('sender');
    const sentPersons = recievedMessages.filter(message => !message.sender.isDeleted).map(messages => messages.sender);
    let contactPersons = [...recievedPersons, ...sentPersons];
    contactPersons = removeDuplicates(contactPersons, 'id');
    const senders = [];
    for(let person of contactPersons){
        const unread = await Message.find({
            reciever: req.user._id,
            sender: person._id,
            shown: false
        });
        senders.push({_id: person._id, count: unread.length});
    }
    const reviewsData = [];
    user.reviews.forEach(review=>{
        const reviewData = {
            _id: review._id,
            hospital: {
                _id: review.hospital._id,
                hospitalname: review.hospital.hospitalname,
            },
            title: review.title,
            tweetDate: review.tweetDate,
            ownerCheck: review.ownerCheck,
            comment: review.comment
        }
        reviewsData.push(reviewData);
    })
    const responsesData = [];
    user.responses.forEach(response=>{
        const responseData = {
            _id: response._id,
            hospital: {
                _id: response.hospital._id,
                hospitalname: response.hospital.hospitalname
            },
            review: {
                _id: response.review._id,
                title: response.review.title
            },
            responseDate: response.responseDate,
            ownerCheck: response.ownerCheck,
            comment: response.comment
        };
        responsesData.push(responseData)
    });
    const favoritesData = [];
    user.favorites.forEach(review=>{
        const reviewData = {
            _id: review._id,
            hospital: {
                _id: review.hospital._id,
                hospitalname: review.hospital.hospitalname,
            },
            title: review.title,
            tweetDate: review.tweetDate,
            comment: review.comment,
            author: {
                _id: review.author._id,
                penName: review.author.penName||review.author.username
            }
        }
        favoritesData.push(reviewData);
    })
    const userData = {
        _id: user._id,
        username: user.username,
        penName: user.penName,
        email: user.email,
        googleId: user.googleId,
        notify: user.notify,
        promotion: user.promotion,
        reviews: reviewsData,
        responses: responsesData,
        favorites: favoritesData
    }
    const contactPersonsData = [];
    contactPersons.forEach(person=>{
        const personData = {
            _id: person._id,
            penName: person.penName||person.username,
        }
        contactPersonsData.push(personData);
    })

    res.render('others/myPage', {
        user: userData, 
        page:'myPage', 
        contactPersons: contactPersonsData, 
        senders
    });
}

module.exports.notifyTrue = async(req, res)=>{
    const {id} = req.params;
    const user = await User.findByIdAndUpdate(id, {notify: true});
    if(!user || user.isDeleted){
        res.json({sent: false});
    }
    res.json({sent: true});
}
module.exports.notifyFalse = async(req, res)=>{
    const {id} = req.params;
    const user = await User.findByIdAndUpdate(id, {notify: false});
    if(!user || user.isDeleted){
        res.json({sent: false});
    }
    res.json({sent: true});
}

module.exports.showOthersPage = async(req, res)=>{
    const {id} = req.params;
    const user = await User.findById(id).populate({
        path: 'reviews',
        populate:{
            path: 'hospital'
        }
    }).populate({
        path: 'responses',
        populate: {
            path: 'review'
        }
    });
    if(!user || user.isDeleted){
        throw new AppError('userが見つかりません。', 404)
    }
    const reviewsData = [];
    user.reviews.forEach(review=>{
        const reviewData = {
            _id: review._id,
            ownerCheck: review.ownerCheck,
            hospital: {
                _id: review.hospital._id,
                hospitalname: review.hospital.hospitalname
            },
            title: review.title,
            tweetDate: review.tweetDate,
            comment: review.comment,
        }
        reviewsData.push(reviewData);
    })
    const responsesData = [];
    user.responses.forEach(response=>{
        const responseData = {
            _id: response._id,
            ownerCheck: response.ownerCheck,
            hospital: {
                _id: response.hospital._id,
                hospitalname: response.hospital.hospitalname
            },
            responseDate: response.responseDate,
            comment: response.comment,
            review: {
                _id: response.review._id,
                title: response.review.title,
            }
        }
        responsesData.push(responseData);
    })
    const userData = {
        _id: user._id,
        penName: user.penName||user.username,
        promotion: user.promotion,
        reviews: reviewsData,
        responses: responsesData
    }
    res.render('others/othersPage', {user: userData});
}

module.exports.showDirectMessagePage = async(req,res)=>{
    const {senderId, recieverId} = req.params;
    const sender = await User.findById(senderId);
    if(!sender || sender.isDeleted){
        throw new AppError('senderが見つかりません', 404);
    }
    const reciever = await User.findById(recieverId);
    if(!reciever || reciever.isDeleted){
        throw new AppError('recieverが見つかりません', 404);
    }
    const senderMessages = await Message.find({sender, reciever}).populate('sender').populate('reciever');
    const recieverMessages = await Message.find({sender:reciever, reciever:sender}).populate('sender').populate('reciever');
    const messages = [...senderMessages, ...recieverMessages];
    messages.sort((a, b) => a.timestamp - b.timestamp);

    const messagesData = [];
    messages.forEach(message=>{
        const messageData = {
            sender: {
                _id: message.sender._id,
                penName: message.sender.penName||message.sender.username
            },
            reciever: {
                _id: message.reciever._id,
                penName: message.reciever.penName||message.reciever.username
            },
            content: message.content,
            timestamp: message.timestamp,
            shown: message.shown,
            _id: message._id
        };
        messagesData.push(messageData);
    })
    const senderData = {
        _id: sender._id,
        penName: sender.penName||sender.username,
    }
    const recieverData = {
        _id: reciever._id,
        penName: reciever.penName||reciever.username,
    }
    res.render('others/chat', {
        messages: messagesData, 
        sender: senderData, 
        reciever: recieverData
    });
}

module.exports.postDirectMessage = async(req,res)=>{
    const {senderId, recieverId} = req.params;
    let {content} = req.body;
    const sender = await User.findById(senderId);
    if(!sender || sender.isDeleted){
        throw new AppError('senderが見つかりません', 404)
    }
    const reciever = await User.findById(recieverId);
    if(!reciever || reciever.isDeleted){
        throw new AppError('recieverが見つかりません', 404)
    }
    const newMessage = new Message({
        sender,
        reciever,
        content
    });
    await newMessage.save();
    if(reciever.notify){
        await notifyToReciever(reciever);
    }
    res.redirect(`/messages/${senderId}/${recieverId}`);
}

module.exports.readReceipt = async(req, res)=>{
    const {id} = req.body;
    const message = await Message.findByIdAndUpdate(id, {shown: true});
    if(!message){
        res.json({
            shown: false,
            message: 'messageが見つかりません'
        })
    }
    res.json({
        shown: true,
    })
}

module.exports.createForm = async(req, res)=>{
    const {formContent} = req.body;
    const newForm = new Form({
        formContent,
        author: req.user._id
    })
    await newForm.save();

    const newMessage = new Message({
        sender: req.user._id,
        reciever: process.env.ownerId,
        content: formContent
    })
    await newMessage.save();
    req.flash('success','お問い合わせいただきありがとうございます。当サイトの「マイページ>>ダイレクトメッセージを見る」ページにて返答いたします。しばらくお待ちください。（通常ご返答まで数日要します。）')
    res.redirect(`/messages/${req.user._id}/${process.env.ownerId}`);
}

module.exports.createNonAccountForm = async(req, res)=>{
    const {lastname, firstname, email, authNum, formContent} = req.body;
    if(authNum === req.session.nums && Date.now() - req.session.authTimestamp <= 1000 * 60 * 10){
        const nonAccount = new NonAccountUser({
            username: [lastname, firstname].join(' '),
            email,
            formContent
        });
        await nonAccount.save();
        await autoSender(nonAccount);
        res.render('others/formSent', {nonAccount}); 
    } else {
        res.render('others/formSent', {nonAccount:false, formContent});
    }
}

module.exports.createFeedback = async(req, res)=>{
    const {feedbackContent} = req.body;
    const feedback = new Feedback({feedbackContent});
    await feedback.save(); 
    res.render('others/feedbackSent');
}
