let cryptoArray = []

function getCryptoArray(){
  return cryptoArray
}

function addCrypto(cryptoObject) {
  cryptoArray = cryptoArray.filter(item => item.iat + 1000 * 60 * 5 > new Date().getTime())
  cryptoArray.push(cryptoObject)
  console.log(cryptoArray)
}

module.exports = {
  getCryptoArray,
  addCrypto
}
