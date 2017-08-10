import noop from 'nop'
import addEventListener from 'addeventlistener'

const ontouchpan = ({
  element,
  onpanstart,
  onpanmove,
  onpanend,
  threshold = 0,
  passive
}) => {
  passive = Object.assign({
    touchstart: true,
    touchmove: true
  }, passive)

  let firstTouch, lastMove, started

  const findTouch = e => Array.prototype.slice.call(e.changedTouches)
    .filter(touch => touch.identifier === firstTouch.identifier)
    [0]

  const decorateEvent = (e, touch) => {
    const distanceX = touch.clientX - firstTouch.clientX
    const distanceY = touch.clientY - firstTouch.clientY
    const deltaX = distanceX - lastMove.distanceX
    const deltaY = distanceY - lastMove.distanceY
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
    addEventListener(element, 'touchstart', touchstart, { passive: passive.touchstart }),
    onpanmove ? addEventListener(window, 'touchmove', touchmove, { passive: passive.touchmove }) : nop,
    onpanend ? addEventListener(window, 'touchend', touchend) : nop
  ]

  return () => offs.forEach(off => off())
}

export default ontouchpan
