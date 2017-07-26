const on = require('./on')
const once = require('./once')
const PointerDown = require('./pointer-down')
const PointerMove = require('./pointer-move')
const noop = () => {}
const when = (predicate, whenTrueFn) => x => predicate(x) ? whenTrueFn(x) : x

const Drag = (element, { start = noop, end = noop, drag = noop, threshold = 0 }) => {
  return PointerDown(element, initialE => {
    let started = false

    const passedThreshold = e => started
      || Math.abs(initialE.clientX - e.clientX) > threshold
      || Math.abs(initialE.clientY - e.clientY) > threshold

    const makeDragInfo = (e) => ({
      distance: { x: e.clientX - initialE.clientX, y: e.clientY - initialE.clientY }
    })

    const startAndSetStarted = e => {
      started = true
      return start({
        mousedown: initialE,
        drag: e ? makeDragInfo(e) : null
      })
    }

    const dragOff = PointerMove(
      element,
      when(
        passedThreshold,
        e => {
          if (!started) { startAndSetStarted(e) }
          return drag({
            pointermove: e,
            drag: makeDragInfo(e)
          })
        }
      )
    )

    once(window, 'pointerup', e => {
      dragOff()
      return end(e)
    })

    if (!threshold) {
      return startAndSetStarted()
    }
  })
}

module.exports = Drag
