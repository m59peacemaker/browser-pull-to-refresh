const once = require('./lib/once')
const OverflowTopScrollDrag = require('./lib/overflow-top-scroll-drag')

// TODO: determine if drag is a pull-to-refresh or text selection asap, then gate off the other
// TODO: use svelte
// TODO: don't touch/modify/style the indicator at all, use a wrapper
// TODO: add pull resistance modifier

const Spacer = height => {
  const node = document.createElement('div')
  node.style.height = `${height}px`
  return node
}

const IndicatorDisplay = ({ indicator, distanceToRefresh, extraPullDistance, threshold }) => {
  const maxPullHeight = distanceToRefresh + extraPullDistance
  indicator.node.style.display = 'inline-block'

  const node = document.createElement('div')
  node.appendChild(indicator.node)
  node.appendChild(Spacer(maxPullHeight))
  node.style.pointerEvents = 'none'
  node.style.overflow = 'hidden'
  node.style.textAlign = 'center'
  node.style.position = 'absolute'
  node.style.top = 0
  node.style.left = 0
  node.style.right = 0

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

    const maxY = indicator.height + maxPullHeight
    const adjustedY = restingY + Math.min(y, maxY)
    const scale = y === 0 ? 0 : 1 //Math.min(1, y / maxY)
    indicator.node.style.transform = `translateY(${adjustedY}px) scale(${scale})`
  }

  placeIndicator(0)

  return {
    node,
    placeIndicator
  }
}

const pullToRefresh = ({
  element,
  indicator,
  distanceToRefresh = 40,
  extraPullDistance = 20,
  threshold = 10,
  onRefresh
}) => {
  // I hate having to do this...
  // maybe it should be required that the consumer code does this instead of hiding it in here
  element.style.position = 'relative'

  const indicatorDisplay = IndicatorDisplay({
    indicator,
    distanceToRefresh,
    extraPullDistance,
    threshold
  })

  element.appendChild(indicatorDisplay.node)

  const refreshAt = distanceToRefresh + indicator.height
  let refreshing = false
  let pullAmount = 0

  OverflowTopScrollDrag({
    touchElement: element,
    scrollableElement: window,
    threshold,
    onStart: () => {
      indicator.node.style.transition = null
    },
    onEnd: () => {
      indicator.setRefreshing(true)
      Promise.resolve(pullAmount >= refreshAt ? onRefresh() : undefined)
        .then(() => {
          indicator.setRefreshing(false)
          indicatorDisplay.placeIndicator(0, { smooth: true })
        })
    },
    onOverflow: e => {
      e.preventDefault()
      pullAmount = e.overflow.amount
      indicator.setTilRefreshRatio(pullAmount / refreshAt)
      indicatorDisplay.placeIndicator(pullAmount)
    }
  })
}

module.exports = pullToRefresh
