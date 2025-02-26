const jwt = require("jsonwebtoken")

function generateAccessToken (user) {
  return jwt.sign(
    { id: user._id || user.id, email: user.email }, 
    process.env.ACCESS_TOKEN_SECRET, 
    { expiresIn: Date.now() + 1000 * 60 * 60 }
  )
}
function generateRefreshToken (user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET, 
    { expiresIn: Date.now() + 1000 * 60 * 60 * 24 * 7 }
  )
}

module.exports={ generateAccessToken, generateRefreshToken }
