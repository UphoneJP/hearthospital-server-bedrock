let signatureArray = []

function isValid(signature) {
  return signatureArray.some(item => 
    item.signature === signature && item.iat + 1000 * 60 * 5 > new Date().getTime()
  )
}

function addSignature(signatureObject) {
  signatureArray = signatureArray.filter(item => item.iat + 1000 * 60 * 5 > new Date().getTime())
  signatureArray.push(signatureObject);
}

module.exports = {
  isValid,
  addSignature
}
