const objectify = require('./objectify')

const makeLikeMouseEvent = e => {
  const regularE = objectify(e)
  regularE.preventDefault = () => e.preventDefault()
  return Object.assign(regularE, objectify(e.touches[0]))
}

module.exports = makeLikeMouseEvent
