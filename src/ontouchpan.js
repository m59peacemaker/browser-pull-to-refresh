import noop from 'nop'
import addEventListener from './lib/add-event-listener'

const ontouchpan = ({ element, onpanstart, onpanmove, onpanend, threshold = 0 }) => {
  let firstTouch, lastMove, started

  const findTouch = e => Array.prototype.slice.call(e.changedTouches)
    .filter(touch => touch.identifier === firstTouch.identifier)
    [0]

  const decorateEvent = (e, touch) => {
    const distanceX = firstTouch.clientX - touch.clientX
    const distanceY = firstTouch.clientY - touch.clientY
    const deltaX = lastMove.distanceX - distanceX
    const deltaY = lastMove.distanceY - distanceY
    Object.assign(e, { distanceX, distanceY, deltaX, deltaY })
  }

  const passedThreshold = e => Math.abs(e.distanceY) > threshold || Math.abs(e.distanceX) > threshold

  const touchstart = e => {
    started = false
    firstTouch = e.changedTouches[0]
    lastMove = Object.assign(e, { distanceX: 0, distanceY: 0 })
  }

  const touchmove = e => {
    const touch = findTouch(e)

    if (!touch) { return }

    decorateEvent(e, touch)
    lastMove = e

    if (!started && passedThreshold(e)) {
      onpanstart && onpanstart(e)
      started = true
    }

    if (started) {
      onpanmove && onpanmove(e)
    }
  }

  const touchend = e => {
    if (findTouch(e)) {
      onpanend && onpanend(e)
    }
  }

  const offs = [
    addEventListener(element, 'touchstart', touchstart,{ passive: true }),
    onpanmove ? addEventListener(window, 'touchmove', touchmove, { passive: true }) : nop,
    onpanend ? addEventListener(window, 'touchend', touchend) : nop
  ]

  return () => offs.forEach(off => off())
}

export default ontouchpan
