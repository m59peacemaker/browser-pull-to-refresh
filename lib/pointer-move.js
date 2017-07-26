const on = require('./on')
const event = 'touchmove' in window
  ? { name: 'touchmove', normalize: e => Object.assign(e, e.touches[0]) }
  : { name: 'mousemove', normalize: e => e }

const pointerMove = (element, listener, options) => {
  return on(element, event.name, e => {
    return listener(event.normalize(e))
  }, options)
}

module.exports = pointerMove
