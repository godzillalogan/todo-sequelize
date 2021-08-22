const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const bcrypt = require('bcryptjs')

//載入User model
const db = require('../models')
const User = db.User

module.exports = app => {
  // 初始化 Passport 模組
  app.use(passport.initialize())
  app.use(passport.session())
  // 設定本地登入策略
  passport.use(new LocalStrategy({ 
    usernameField: 'email', passwordField: 'password', passReqToCallback: true, session: false }, 
    (req, email, password, done) => {
      User.findOne({ where: { email } })  //查詢特定email的User
        .then(user => {
          if (!user) {
            return done(null, false, req.flash('warning_msg', '這個Email還沒註冊!'))
          }
          return bcrypt.compare(password, user.password).then(isMatch => {
            if (!isMatch) {
              return done(null, false, req.flash('warning_msg', 'Email或Password不正確。'))
            }
            return done(null, user)
          })
        })
        .catch(err => done(err, false))
    }))
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK,
    profileFields: ['email', 'displayName']
  }, (accessToken, refreshToken, profile, done) => {
    const { name, email } = profile._json
    User.findOne({ where: { email } })
      .then(user => {
        if (user) return done(null, user)
        const randomPassword = Math.random().toString(36).slice(-8)
        bcrypt
          .genSalt(10)
          .then(salt => bcrypt.hash(randomPassword, salt))
          .then(hash => User.create({
            name,
            email,
            password: hash
          }))
          .then(user => done(null, user))
          .catch(err => done(err, false))
      })
  }))

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })
  //在做 passport.deserializeUser 的時候，由於這筆 User 物件常常會透過 req.user 傳到前端樣板，這裡要先轉成 plain object。
  passport.deserializeUser((id, done) => {
    User.findByPk(id)  //查詢特定id的User
      .then((user) => {
        //把user物件轉成plain object 回傳給req繼續使用
        user = user.toJSON()  
        done(null, user)
      }).catch(err => done(err, null))
  })
}