import addEventListener from 'addeventlistener'
import RefreshIndicator from 'svelte-refresh-indicator'
import transition from './lib/transition'
const clamp = (lower, higher, n) => Math.min(higher, Math.max(lower, n))

// TODO: using svelte would make all this cleaner and provide an api to update values
  // i.e. change the size of the indicator later

const refreshIndicatorHeight = 38
const totalHeight = 46

/* this sits at the top of the target element and hides the overflowing indicator
  it lets the indicator sit above it and be hidden and then come down into view
  sort of like being above the page, but for elements
*/
const VisibleArea = () => {
  const node = document.createElement('div')
  node.style.pointerEvents = 'none'
  node.style.overflow = 'hidden'
  node.style.position = 'absolute'
  node.style.top = 0
  node.style.left = 0
  node.style.right = 0
  node.style.bottom = 0

  const setActive = beActive => node.style.height = beActive ? 'auto' : 0
  setActive(false)

  return { node, setActive }
}

const Container = ({ indicator }) => {
  const node = document.createElement('div')

 // webkit bugs without this. The element will often just not render.
  node.style.height = `${refreshIndicatorHeight}px`
  node.style.width = '100%'
  node.style.pointerEvents = 'none'
  node.style.display = 'flex'
  node.style.justifyContent = 'center'
  node.style.position = 'absolute'
  node.style.paddingBottom = '8px'

  const setY = y => node.style.transform = `translateY(${y}px)`

  return { node, setY }
}

const Indicator = ({ target, color = '#2196f3' }) => {
  target.style.position = 'relative' // NOTE: ugly side-effect :/

  const indicatorNode = document.createElement('div')
  indicatorNode.style.transform = 'scale(1)'
  indicatorNode.style.opacity = 1

  const indicator = new RefreshIndicator({
    target: indicatorNode,
    data: {
      color,
      size: refreshIndicatorHeight,
      emphasized: true
    }
  })

  const visibleArea = VisibleArea()
  const container = Container({ indicator })

  let y = 0
  const setY = newY => {
    y = newY
    container.setY(newY - totalHeight)
  }
  setY(0)

  const onPullStart = () => visibleArea.setActive(true)

  const maxY = 300
  const onPullMove = ({
    tilRefreshRatio,
    tilRefreshDistance,
    overscrollDistance,
    overscrollDelta
  }) => {
    const resistance = clamp(0.1, 0.75, (maxY - overscrollDistance) / maxY)
    setY(y + overscrollDelta * resistance)

    // max rotation
    const ratio = Math.min(1.8, tilRefreshRatio)
    indicator.set({ progressRatio: ratio })
  }

  const onPullCancel = () => {
    return transition(node => node.style.transform = 'scale(0)', 250, indicatorNode)
      .then(() => {
        setY(0)
        indicatorNode.style.transform = 'scale(1)'
        visibleArea.setActive(false)
      })
  }

  const onRefreshStart = () => {
    indicator.set({ progressRatio: undefined })
    transition(() => setY(totalHeight + 15), 200, container.node)
  }

  const onRefreshEnd = onPullCancel

  visibleArea.node.appendChild(container.node)
  container.node.appendChild(indicatorNode)
  target.append(visibleArea.node)

  return {
    node: visibleArea.node,
    height: totalHeight,
    distanceToRefresh: totalHeight + 50,
    maxOverscroll: 300,
    progressOffset: 35,
    elasticOverscroll: false,
    onPullStart,
    onPullMove,
    onPullCancel,
    onRefreshStart,
    onRefreshEnd
  }
}

export default Indicator
