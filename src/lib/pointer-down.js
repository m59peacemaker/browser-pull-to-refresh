const on = require('./on')
const makeLikeMouseEvent = require('./make-touch-event-like-mouse-event')

const event = 'ontouchstart' in window
  ? {
    name: 'touchstart',
    normalize: e => e.touches.length > 1 ? false : makeLikeMouseEvent(e)
  }
  : { name: 'mousedown', normalize: e => e }

const pointerDown = (element, listener, options) => {
  return on(element, event.name, e => {
    e = event.normalize(e)
    if (e) {
      return listener(e)
    }
  }, options)
}

module.exports = pointerDown
