const on = require('./on')
const Drag = require('./drag')
const noop = () => {}

const getScrollY = node => node === window
  ? node.scrollY
  : node.scrollTop

const OverflowTopScrollDrag = ({
  touchElement,
  scrollableElement,
  onStart = noop,
  onEnd = noop,
  onOverflow
}) => {
  let initialE
  let lastMove
  let overflowAmount

  Drag(touchElement, {
    start: e => {
      initialE = e
      lastMove = e
      overflowAmount = 0
      return onStart(e)
    },
    end: onEnd,
    drag: e => {
      console.log(e.clientY, lastMove.clientY, getScrollY(scrollableElement), overflowAmount)
      if (e.clientY === lastMove.clientY || getScrollY(scrollableElement) !== 0) {
        return
      }

      const delta = e.clientY - lastMove.clientY
      overflowAmount = Math.max(0, overflowAmount + delta)

      if (overflowAmount) {
        e.overflow = { amount: overflowAmount }
        onOverflow(e)
      }

      lastMove = e
    }
  })
}

module.exports = OverflowTopScrollDrag
