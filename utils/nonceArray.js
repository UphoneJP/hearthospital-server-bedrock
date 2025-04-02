let nonceArray = []

function getNonceArray(){
  return nonceArray
}

function addNonce(nonceObject) {
  nonceArray = nonceArray.filter(item => item.iat + 1000 * 60 * 5 > new Date().getTime())
  nonceArray.push(nonceObject)
  console.log(nonceArray)
}

module.exports = {
  getNonceArray,
  addNonce
}
