const objectify = jankyObj => {
  const obj = {}
  for (const key in jankyObj) {
    obj[key] = jankyObj[key]
  }
  return obj
}

module.exports = objectify
