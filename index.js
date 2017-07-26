const Drag = require('./lib/drag')
const Pull = require('./lib/pull')
const once = require('./lib/once')

const setY = (y, node) => node.style.transform = `translateY(${y}px)`

const Indicator = () => {
  const node = document.createElement('div')
  node.style.height = '70px'
  node.style.width = '70px'
  node.style.background = 'blue'
  const onDown = () => {

  }
  const onUp = () => {

  }
  return {
    node,
    height: 70,
    onDown,
    onUp
  }
}

const Spacer = height => {
  const node = document.createElement('div')
  node.style.height = `${height}px`
  return node
}

const IndicatorDisplay = ({ indicator, distanceToRefresh, threshold }) => {
  indicator.node.style.marginLeft = 'auto'
  indicator.node.style.marginRight = 'auto'

  const node = document.createElement('div')
  node.appendChild(indicator.node)
  node.appendChild(Spacer(distanceToRefresh))
  node.style.pointerEvents = 'none'
  node.style.overflow = 'hidden'

  const restingY = -(indicator.height + threshold)
  let indicatorY
  const placeIndicator = (y, { smooth = false } = {}) => {
    y = Math.max(y, 0)

    if (indicatorY === y) { return }

    indicatorY = y

    if (smooth) {
      indicator.node.style.transition = 'transform 300ms'
      once(indicator.node, 'transitionend', () => {
        indicator.node.style.transition = null
      })
    }

    setY(restingY + Math.min(y, indicator.height + distanceToRefresh), indicator.node)
  }

  placeIndicator(0)

  return {
    node,
    placeIndicator
  }
}

const pullToRefresh = ({
  element,
  distanceToRefresh = 60,
  threshold = 10
}) => {

  // I hate having to do this...
  // maybe it should be required that the consumer code does this instead of hiding it in here
  element.style.position = 'relative'
  const indicator = Indicator()
  const indicatorDisplay = IndicatorDisplay({ indicator, distanceToRefresh, threshold })

  element.appendChild(indicatorDisplay.node)

  Pull(element, {
    threshold,
    onPull: e => {
      if (e.pull.direction === 'down') {
        indicatorDisplay.placeIndicator(e.pull.distance)
      }
    },
    end: () => {
      indicatorDisplay.placeIndicator(0, { smooth: true })
    }
  })
/*  const describe = {
    x: x => x < 0 ? 'left' : 'right',
    y: y => y < 0 ? 'up' : 'down',
  }
  let axis
  let previousValue
  const axisValue = e => e.drag.distance[axis]
  Drag(element, {
    threshold: 10,
    start: e => {
      console.log(e)
      // prefer 'y' in the case that x and y are the same (exactly 45deg drag will be considered a y)
      axis = (Math.abs(e.drag.distance.x) > Math.abs(e.drag.distance.y)) ? 'x' : 'y'
      previous = e.drag.distance[axis]
    },
    drag: e => {
      if (axisValue(e) === previousValue) { return }

      console.log(axisValue(e))
      previousValue = axisValue(e)
    }
  })*/
}

const div = document.createElement('div')
div.style.height = '1000px'
div.style.marginBottom = '40px'
div.style.background = '#888'
document.body.appendChild(div)
pullToRefresh({ element: div })
