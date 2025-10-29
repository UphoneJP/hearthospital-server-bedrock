const Form = require('../models/form')
const Message = require('../models/message')
const Feedback = require('../models/feedback')
const User = require('../models/user')

module.exports.form = async (req, res) => {
  try {
    const {formContent, authorId} = req.body;
    const newForm = new Form({
      formContent,
      author: authorId
    })
    await newForm.save();

    const newMessage = new Message({
      sender: authorId,
      reciever: process.env.ownerId,
      content: formContent
    })
    await newMessage.save();
    return res.status(200).json({});
  } catch(err) {
    console.log('フォームを保存できませんでした', err)
    return res.status(400).json({})
  }
}

module.exports.feedback = async(req, res)=>{
  try {
    const { feedbackContent } = req.body
    const feedback = new Feedback({feedbackContent})
    await feedback.save()
    return res.status(200).json({})
  } catch (err){
    console.log('フィードバックを保存できませんでした', err)
    return res.status(400).json({})
  }
}

module.exports.chatBox = async(req, res)=>{
  function removeDuplicates(array, _id) {
    return array.filter((obj, index, self) =>
      index === self.findIndex((o) => o[_id] === obj[_id])
    )
  }
  try {
    const { user } = req.body
    if(!user){
      res.status(400).json({})
    }
    const sentMessages = await Message.find({sender:user._id}).populate('reciever')
    const recievedPersons = sentMessages.filter(message => !message.reciever.isDeleted).map(messages => messages.reciever)
    const recievedMessages = await Message.find({reciever: user._id}).populate('sender')
    const sentPersons = recievedMessages.filter(message => !message.sender.isDeleted).map(messages => messages.sender)
    let contactPersons = [...recievedPersons, ...sentPersons]
    contactPersons = removeDuplicates(contactPersons, 'id')
    const contactPersonsData = []
    for(let person of contactPersons){
      const data = {
        _id: person._id,
        penName: person.penName||person.username,
      }
      contactPersonsData.push(data)
    }

    const allUsers = await User.find({})
    const usersExceptContactPersons = allUsers
      .filter(user=>!contactPersons.map(person=>person._id.toString()).includes(user._id.toString()))
      .filter(person=>person._id.toString() !== user._id.toString())
      .map((person)=>({_id: person._id, penName: person.penName||person.username}))
    
    return res.status(200).json({ 
      contactPersons: contactPersonsData,
      usersExceptContactPersons      
    })
  } catch(err) {
    console.log('連絡相手を取得できませんでした', err)
    return res.status(401).json({})
  }
}

module.exports.getMessages = async(req,res)=>{
  try {
    const { senderId, recieverId } = req.params
    const sender = await User.findById(senderId);
    if(!sender || sender.isDeleted){
      console.log('senderが見つかりません')
      return res.status(404).json({});
    }
    const reciever = await User.findById(recieverId);
    if(!reciever || reciever.isDeleted){
      console.log('recieverが見つかりません')
      return res.status(404).json({});
    }
    const senderMessages = await Message.find({sender, reciever}).populate('sender').populate('reciever');
    const recieverMessages = await Message.find({sender:reciever, reciever:sender}).populate('sender').populate('reciever');
    const messages = [...senderMessages, ...recieverMessages];
    messages.sort((a, b) => a.timestamp - b.timestamp);
  
    const messagesData = [];
    messages.forEach(message=>{
      const messageData = {
        sender: message.sender._id,
        reciever: message.reciever._id,
        content: message.content,
        timestamp: message.timestamp,
        shown: message.shown,
        _id: message._id
      }
      messagesData.push(messageData);
    })
    return res.status(200).json({
      messages: messagesData,
      penName: reciever.penName || reciever.username      
    })
  } catch(err) {
    console.log('メッセージを取得できませんでした', err)
    return res.status(401).json({})
  }
}

module.exports.othersPage = async (req, res) => {
  try {
    const { id } = req.body
    const other = await User.findById(id).populate('reviews')
    if(!other){
      return res.status(404).json({})
    }
    return res.status(200).json({other})
  } catch {
    return res.status(400).json({})
  }
}
