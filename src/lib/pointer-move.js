const on = require('./on')
const makeLikeMouseEvent = require('./make-touch-event-like-mouse-event')

const event = 'ontouchmove' in window
  ? {
    name: 'touchmove',
    normalize: e => e.touches.length > 1 ? false : makeLikeMouseEvent(e)
  }
  : { name: 'mousemove', normalize: e => e }

const pointerMove = (element, listener, options) => {
  return on(element, event.name, e => {
    e = event.normalize(e)
    if (e) {
      return listener(e)
    }
  }, options)
}

module.exports = pointerMove
