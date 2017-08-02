const on = require('./on')
const makeLikeMouseEvent = require('./make-touch-event-like-mouse-event')

const event = 'ontouchend' in window
  ? {
    name: 'touchend',
    normalize: e => e.touches.length > 1 ? false : makeLikeMouseEvent(e)
  }
  : { name: 'mouseup', normalize: e => e }

const pointerUp = (element, listener, options) => {
  return on(element, event.name, e => {
    e = event.normalize(e)
    if (e) {
      return listener(e)
    }
  }, options)
}

module.exports = pointerUp
