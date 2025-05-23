const { Server } = require('socket.io')
const nodemailer = require('nodemailer');
const Message = require('../models/message')
const User = require('../models/user')
const { validateMessages } = require('../utils/apiMiddleware')

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: 465,
  secure: true, 
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  }
})
async function notifyToReciever(reciever) {
  await transporter.sendMail({
    from: 'support@hearthospital.jp',
    to: reciever.email, 
    bcc: 'support@hearthospital.jp',
    subject: "~先天性心疾患専用 病院口コミアプリ~ HeartHospital ダイレクトメッセージ受信のお知らせ",
    text: `※自動送信メールです。\n\nHeartHospitalをご利用いただきありがとうございます。\n『ダイレクトメッセージ』を受信しました。\nモバイルアプリHeartHospitalのメニュータブ内、【メッセージBOX】でご確認下さい。\n\n悩んでいる人の力になれるようお力をお貸しください。\nよろしくお願いいたします。\nまた、何かお困りの際は問い合わせフォームにてご相談ください。\n\nHeartHospital\nブラウザ版: https://www.hearthospital.jp`,
  });
}

function customSocket(server){
  const io = new Server(server, {
    cors: {
      origin: "*" ,
      methods: ["GET", "POST", "PATCH", "DELETE"]
    }
  })

  const clients = {}
  
  io.on('connection', (socket) => {
    
    // ①初回登録・通信開始
    socket.on('register', (userId) => {
      clients[userId] = socket.id
    })

    // ②未読数取得request
    socket.on('requestUnReadMessages', async (userId) => {
      const userSocketId = clients[userId]
      if (userSocketId) {
        const unReadArray = await Message.find({
          reciever: userId,
          shown: false
        })
        // ③未読数取得return
        io.to(userSocketId).emit("returnUnReadArray", unReadArray)
      }
    })

    // ④自分が既読した
    socket.on('markAsRead', async ({userId, personId, messageId})=>{
      try {
        await Message.findByIdAndUpdate(messageId, {shown: true})
        const updatedUnReadArray = await Message.find({
          reciever: userId,
          shown: false
        })
        const userSocketId = clients[userId]
        if(userSocketId){
          // ⑤自分の未読数を更新
          io.to(userSocketId).emit('messageReadToMe', updatedUnReadArray)
        }
        const friendSocketId = clients[personId]
        if(friendSocketId){
          // ⑥相手に既読を通知
          io.to(friendSocketId).emit('messageReadToFriend', messageId)
        }
      } catch (err) {
        console.log('既読にできませんでした', err)
      }
    })

    // ⑦自分がメッセージを送信した
    socket.on('sendMessage', async (data, callback) => {
      const validate = validateMessages()
      validate(data, async (err) => {
        if (err) {
          if (callback) return callback(err); // フロントに返す
          return console.log('Validation error:', err.msg)
        }
  
        const { userId, personId, content } = data

        try {
          const sender = await User.findById(userId);
          if(!sender || sender.isDeleted){
            return callback?.({ status: 404, msg: '送信者が見つかりません' })
          }
          const reciever = await User.findById(personId)
          if(!reciever || reciever.isDeleted){
            return callback?.({ status: 404, msg: '受信者が見つかりません' })
          }
          const newMessage = new Message({
            sender: sender._id,
            reciever: reciever._id,
            content
          })
          await newMessage.save()
          if(reciever.notify){
            await notifyToReciever(reciever)
          }
  
          // ⑧送信したら自分も更新
          const userScocketId = clients[userId]
          if (userScocketId) {
            io.to(userScocketId).emit("sentMessage", newMessage)
          }
          // ⑨newMessageを受信側へ通知
          const friendSocketId = clients[personId]
          if (friendSocketId) {          
            const unReadArray = await Message.find({
              reciever: { _id: personId},
              shown: false
            })
            io.to(friendSocketId).emit("recieveMessage", newMessage, unReadArray)
          } 
          callback?.({ status: 200, msg: 'Message sent successfully' })
        } catch (err) {
          console.log('メッセージを投稿できませんでした', err)
          callback?.({ status: 500, msg: 'サーバーエラー' })
        }
      }) 
    })

    socket.on('disconnect', () => {
      for (const userId in clients) {
        if (clients[userId] === socket.id) {
          delete clients[userId]
          break
        }
      }
    })
  })
}

module.exports = customSocket
