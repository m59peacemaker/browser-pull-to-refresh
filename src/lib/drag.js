const on = require('./on')
const once = require('./once')
const PointerDown = require('./pointer-down')
const PointerMove = require('./pointer-move')
const PointerUp = require('./pointer-up')
const noop = () => {}
const when = (predicate, whenTrueFn) => x => predicate(x) ? whenTrueFn(x) : x
const isUsefulSelection = s => s.toString().trim().length

const Drag = (element, { start = noop, end = noop, drag = noop, threshold = 0 }) => {
  return PointerDown(element, initialE => {
    const sel = window.getSelection()

    if (isUsefulSelection(sel)) {
      return
    }

    sel.removeAllRanges()

    let started = false

    const passedThreshold = e => started
      || Math.abs(initialE.clientX - e.clientX) > threshold
      || Math.abs(initialE.clientY - e.clientY) > threshold

    const startAndSetStarted = () => {
      started = true
      return start(initialE)
    }

    const pointerMoveOff = PointerMove(
      /* use the window so that movement beyond the bounds of the element where the drag originated
        will still work */
      window,
      when(
        passedThreshold,
        e => {
          if (!started) { startAndSetStarted() }
          return drag(e)
        }
      ),
      // must NOT be passive to prevent default, like android chrome's native pull to refresh
      { passive: false }
    )

    let pointerUpOff
    let windowBlurOff
    const onUp = e => {
      pointerMoveOff()
      pointerUpOff()
      windowBlurOff()
      return end(e)
    }

    pointerUpOff = PointerUp(window, onUp)
    windowBlurOff = on(window, 'blur', onUp)

    if (!threshold) {
      return startAndSetStarted()
    }
    // must NOT be passive or android chrome's native pull to refresh causes problems in some cases
      // i.e. element is body with no height
  }, { passive: false })
}

module.exports = Drag
