const objectify = require('./objectify')

const makeLikeMouseEvent = e => {
  const t = objectify(e.touches[0])
  delete t.target
  return Object.assign(e, t)
}

module.exports = makeLikeMouseEvent
