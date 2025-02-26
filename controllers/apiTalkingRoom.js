const TalkTheme = require('../models/talkTheme')
const Talk = require('../models/talk')

module.exports.talkThemesList = async(req, res)=>{
  try{
    const talkThemes = await TalkTheme.find({})
    res.status(200).json({talkThemes})
  } catch {
    res.status(400).json({message: 'エラーが発生しました'})
  }
}

module.exports.eachTheme = async(req, res)=> {
  try {
    const {id} = req.params
    const talkTheme = await TalkTheme.findById(id)
      .populate({
          path: 'talks',
          populate: {
            path: 'loggedInUser',
            model: 'User'
          }
      })
    if(!talkTheme){
      res.status(404).json({message: 'トークテーマが見つかりません'})
    }
    talkTheme.accessCount += 1
    await talkTheme.save()
    res.status(200).json({talkTheme})
  } catch {
    res.status(400).json({message: 'エラーが発生しました'})
  }
}

module.exports.createNewTalkTheme = async(req, res)=> {
  try {
    const {title, detailNoSpace, user} = req.body
    const talkTheme = new TalkTheme({
      author: user,
      title,
      detail: detailNoSpace,
      colorNum: Math.floor(Math.random()*12),
      touchAt: new Date()
    })
    await talkTheme.save()
    res.status(200).json({})
  } catch {
    res.status(400).json({message: 'トークテーマを作れませんでした'})
  }
}

module.exports.createNewTalk = async(req, res)=> {
  try{
    const {id} = req.params
    const talkTheme = await TalkTheme.findById(id)
    if(!talkTheme){
      res.status(404).json({message: 'talkThemeが見つかりません'})
    }
    const {reviewText, user} = req.body
    if(!reviewText || !user){
      res.status(404).json({message: '必要な情報が不足しています'})
    }
    const newTalk = new Talk({
      loggedInUser: user,
      content: reviewText,
      madeAt: new Date()
    })
    await newTalk.save()
    talkTheme.talks.unshift(newTalk)
    talkTheme.touchAt = new Date()
    await talkTheme.save()
    res.status(200).json({})
  } catch {
    res.status(400).json({message: 'エラーが発生しました'})
  }
}

module.exports.editTalkTheme = async(req, res)=> {
  const { id } = req.params
  const {talkThemeEdit, detailEdit} = req.body
  const talkTheme = await TalkTheme.findByIdAndUpdate(id, {
    title: talkThemeEdit.trim(), 
    detail: detailEdit.trim()
  })
  if(!talkTheme){
    res.status(404).json({message: 'talkThemeが見つかりません'})
  }
  res.status(200).json({})
}

module.exports.deleteTalkTheme = async(req, res)=> {
  const { id } = req.params
  const talkTheme = await TalkTheme.findById(id)
  if (!talkTheme) {
    return res.status(404).json({ message: 'talkThemeが見つかりません' })
  }
  await talkTheme.deleteOne()
  res.status(200).json({})
}

module.exports.deleteTalk = async(req, res)=> {
  try {
    const {talkId} = req.params
    const talk = await Talk.findById(talkId)
    talk.deleted = true
    await talk.save()
    res.status(200).json({})
  } catch {
    res.status(400).json({message: 'トークを削除できませんでした'})
  }
}
