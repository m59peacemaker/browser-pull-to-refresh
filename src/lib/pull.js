const Pan = require('./pan')
const noop = () => {}

const describe = {
  x: x => x < 0 ? 'left' : 'right',
  y: y => y < 0 ? 'up' : 'down'
}

// A "pull" is a drag focused on a single direction (up, right, down, left)
// once you pull, you can "unpull" as far as you want
// but it is easy to make a layer on top of this to gate that off
const Pull = (element, {
  start = noop,
  end = noop,
  onPull,
  threshold = 10
}) => {
  let started
  let axis
  let direction

  Pan(element, {
    start: e => {
      started = false
    },
    end,
    onPan: e => {
      if (!started && Math.abs(e.pan.distance) > threshold) {
        axis = e.pan.axis
        direction = describe[axis](e.pan.distance)
        start({ pull: { direction, distance: e.pan.distance } })
        started = true
      }
      if (e.pan.axis === axis) {
        return onPull(Object.assign({ pull: { direction, distance: e.pan.distance } }, e))
      }
    },
    threshold
  })
}

module.exports = Pull
