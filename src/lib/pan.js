const Drag = require('./drag')
const axes = [ 'x', 'y' ]
const noop = () => {}

const Pan = (element, {
  start = noop,
  end = noop,
  onPan = noop,
  threshold = 10
}) => {
  let started
  let previousDistance

  Drag(element, {
    threshold,
    start: () => {
      started = false
      previousDistance = { x: 0, y: 0 }
    },
    end,
    drag: e => {
      const events = axes.reduce((acc, axis) => {
        const currentDistance = e.drag.distance[axis]
        if (previousDistance[axis] !== currentDistance) {
          acc[axis] = Object.assign({ pan: { axis, distance: currentDistance } }, e)
        }
        return acc
      }, {})

      if (!started) {
        start(events.y ? events.y : events.x)
        started = true
      }

      previousDistance = e.drag.distance

      return Object.keys(events)
        .map(axis => onPan(events[axis]))
        .reduce((acc, result) => acc && result)
    }
  })
}

module.exports = Pan
