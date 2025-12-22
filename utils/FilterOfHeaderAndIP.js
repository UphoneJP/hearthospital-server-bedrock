const BadUser = require('../models/badUser')

const FilterOfHeaderAndIP = (async (req, res, next) => {

  // ■ヘッダー
  const userAgent = req.headers['user-agent'] || ''

  // googleロボットとuptimerobotは許可
  if (req.path === '/robots.txt' || userAgent === "Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)" || userAgent.includes('Googlebot')){
    return next()
  }
  // ヘッダーが無かったりbotの場合は拒否
  if (!userAgent || userAgent.includes('curl') || userAgent.includes('bot')) {
    return res.status(403).send('Access denied')
  }


  // // ■IP
  // const realIp = req.headers["x-forwarded-for"] || req.connection.remoteAddres

  // // IPをDBから所得
  // const BadIPArray = []
  // const badUsers = await BadUser.find({})
  // badUsers.forEach(badUser => {
  //   const splitIpArray = badUser.ip.split(', ')
  //   BadIPArray.push(splitIpArray[0]) // 1つ目のIPだけを追加
  // })
  // const ipCountMap = BadIPArray.reduce((acc, ip) => {
  //   acc[ip] = (acc[ip] || 0) + 1  // IP の登場回数をカウント
  //   return acc
  // }, {})
  // // 2回以上登場するメインIP(最初の４つ)のみ抽出したものがfilteredIPs
  // const filteredIPs = Object.entries(ipCountMap)
  //   .filter(([_, count]) => count >= 2) // 2回以上登場するものだけ
  //   .map(([ip]) => ip)
  // // まったく同じIPで複数回攻撃してきているのがsameIPs
  // const sameIPs = badUsers
  //   .filter(badUser=>badUser.accessAt_UTC.length >= 2)
  //   .map(badUser=>badUser.ip)
  
  // if(filteredIPs.includes(realIp) || sameIPs.includes(realIp)){
  //   console.log(`【AGAIN IP】: ${realIp}`,`【Request URL】: ${req.originalUrl}`)
  //   console.log(`【header】: ${req.headers}`)
  //   return res.status(403).send('Access denied')
  // }
  next()
})

module.exports = FilterOfHeaderAndIP
