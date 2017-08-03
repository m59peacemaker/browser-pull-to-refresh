const on = require('./on')
const Drag = require('./drag')
const noop = () => {}
const selectionVisibility = require('./selection-visibility')

const getScrollY = node => node === window
  ? node.scrollY
  : node.scrollTop

// TODO: this would ideally be derived from a drag restricted to the Y axis via a threshold
  // i.e. VerticalDrag(touchElement, etc)
  // for now, this function has to deal with it itself
// TODO: probably all gestures should be handled with streams / async transduce
const threshold = 20
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
  let isYDrag

  Drag(touchElement, {
    threshold,
    start: e => {
      initialE = e
      lastMove = e
      overflowAmount = 0
      isYDrag = undefined
      selectionVisibility.off()
    },
    end: e => {
      selectionVisibility.on()
      return onEnd(e)
    },
    drag: e => {
      if (isYDrag === undefined) {
        isYDrag = Math.abs(e.clientY - initialE.clientY) >= threshold
        if (isYDrag) {
          onStart(initialE)
        }
      }

      if (!isYDrag) {
        selectionVisibility.on()
        return
      }

      if (e.clientY === lastMove.clientY || getScrollY(scrollableElement) !== 0) {
        return
      }

      const delta = e.clientY - lastMove.clientY
      overflowAmount = Math.max(0, overflowAmount + delta)

      if (overflowAmount) {
        window.getSelection().removeAllRanges()
        e.overflow = { amount: overflowAmount }
        onOverflow(e)
      }

      lastMove = e
    }
  })
}

module.exports = OverflowTopScrollDrag
