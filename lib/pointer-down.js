const on = require('./on')
const event = 'touchstart' in window
  ? { name: 'touchstart', normalize: e => Object.assign(e, e.touches[0]) }
  : { name: 'mousedown', normalize: e => e }

const pointerDown = (element, listener, options) => {
  return on(element, event.name, e => {
    e.preventDefault()
    return listener(event.normalize(e))
  })
}

module.exports = pointerDown
