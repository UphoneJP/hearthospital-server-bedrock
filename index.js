// module
if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const express = require('express')
const {createServer} = require('http')
const mongoose = require("mongoose")
const MongoStore = require('connect-mongo')
const mongoSanitize = require('express-mongo-sanitize')
const passport = require("passport")
const GoogleStrategy = require('passport-google-oauth20').Strategy
const rateLimit = require('express-rate-limit')
const ejsMate = require('ejs-mate')
const path = require('path')
const methodOverride = require('method-override')
const session = require('express-session')
const flash = require('connect-flash')
const crypto = require('crypto')
const favicon = require('serve-favicon')

// custom module
const User = require('./models/user')
const Message = require('./models/message')
const { checkApiKeyIni } = require('./utils/middleware')
const catchAsync = require('./utils/catchAsync')
const AppError = require('./utils/AppError')
const customSocket = require('./controllers/customSocket')

// env
const URL = process.env.MONGO_URI || process.env.MONGO_LOCAL_URI
const secret = process.env.SECRET || 'mysecret'
const PORT = process.env.PORT || 5131

// call
const app = express()
const server = createServer(app)
mongoose.connect(URL)
.then(()=>console.log('mongoDB接続中'))
.catch((e)=>console.log('エラー発生', e))
const store = MongoStore.create({
  mongoUrl: URL,
  crypto: { secret },
  touchAfter: 24 * 3600
})
store.on('error', e =>console.log('セッションストアエラー', e))
let viewCount = 0
app.use('*', (req, res, next)=>{
    viewCount++
    next()
})
let page = 'initial'
customSocket(server)

// middleware static
app.use(favicon(path.join(__dirname, 'public', 'css/pictures/icon-192x192.png')))
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }))

// middleware
app.use(express.urlencoded({extended : true}))
app.use(express.json())
app.use(methodOverride('_method'))
app.use(mongoSanitize())
app.use(rateLimit({
  windowMs: 1000 * 60,
  max: 20,
  message: "Too many requests from this IP."
}))
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || ''
  if (req.path === '/robots.txt' || userAgent === "Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)" || userAgent.includes('Googlebot')){
    return next()
  }
  if (!userAgent || userAgent.includes('curl') || userAgent.includes('bot')) {
      return res.status(403).send('Access denied')
  }
  next()
})
app.use(session({
  store,
  name: 'session',
  secret,
  resave : false,
  saveUninitialized : true,
  cookie : {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    // secure: process.env.NODE_ENV === 'production',
    // sameSite: 'Lax'
  }
}))
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
app.use((req, res, next)=>{
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIANT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIANT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production'?
        `https://${req.headers.host}/login/callback`  //product用
        :'/login/callback' //local開発用
    },
    async function(accessToken, refreshToken, profile, done) {
      try {
        let user = await User.findOne({googleId: profile.id})
        if (!user) {
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
          })
          await user.save()
        } else {
          user = await User.findOneAndUpdate({googleId: profile.id}, {
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
          })
        }
        done(null, user)
      } catch (error) {
        done(error)
      }
    }
  ))
  next()
})
passport.serializeUser((user, done) => {
  done(null, user._id)
})
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (error) {
    done(error)
  }
})
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
app.use(catchAsync(async(req, res, next)=>{
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  res.locals.currentUser = req.user
  res.locals.ownerId = process.env.ownerId
  res.locals.page = page
  res.locals.port = process.env.PORT
  res.locals.viewCount = viewCount
  res.locals.nonce = crypto.randomBytes(16).toString('base64')
  if(req.isAuthenticated()){
    const unreadArray = await Message.find({
      reciever: req.user._id,
      shown: false
    })
    res.locals.unreadCount = unreadArray.length || 0
  } else {
    res.locals.unreadCount = 0
  }
  next()
}))

// app.all('*', (req, res)=>{
//     throw new AppError('現在メンテナンス中です。しばらくお待ちください。', 503)
// })

const apiUserRoutes = require('./routes/apiUser')
const apiHospitalRoutes = require('./routes/apiHospital')
const apiTalkingRoomRoutes = require('./routes/apiTalkingRoom')
const apiOtherRoutes = require('./routes/apiOthers')
app.use('/api/user', checkApiKeyIni, apiUserRoutes)
app.use('/api/hospital', checkApiKeyIni, apiHospitalRoutes)
app.use('/api/talkingRoom', checkApiKeyIni, apiTalkingRoomRoutes)
app.use('/api/others', checkApiKeyIni, apiOtherRoutes)

const userRoutes = require('./routes/user')
const hospitalRoutes = require('./routes/hospital')
const reviewRoutes = require('./routes/review')
const adminRoutes = require('./routes/admin')
const othersRoutes = require('./routes/others')
const whatsNewRoutes = require('./routes/whatsNew')
const talkingRoomRoutes = require('./routes/talkingRoom')
app.use('/', userRoutes)
app.use('/hospital', hospitalRoutes)
app.use('/hospital/:id/review', reviewRoutes)
app.use('/admin', adminRoutes)
app.use('/whatsNew', whatsNewRoutes)
app.use('/talkingRoom', talkingRoomRoutes)
app.use('/', othersRoutes)

app.get('/',  (req, res)=>{
  page = 'home'
  return res.render('main/home', {page})
})

// Errorハンドリング $npm i serve-favicon
app.all('*', (req, res)=>{
  throw new AppError('不正なリクエストです', 400)
})
app.use((err, req, res, next) => {
  console.log(`【Errorメッセージ】: ${err.message}`)
  console.log(`【Statusコード】: ${err.status}`)
  console.log(`【Stack trace】: ${err.stack}`)
  console.log(`【Request URL】: ${req.originalUrl}`)
  const { status = 500, message = 'エラー発生' } = err
  res.status(status).render('error', { message, status , page:'error'})
})

server.listen(PORT, (req, res) => {
console.log(`http://localhost:${PORT} で待ち受け中`)
})
