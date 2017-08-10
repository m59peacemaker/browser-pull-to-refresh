import addEventListener from 'addeventlistener'
import RefreshIndicator from 'svelte-refresh-indicator'
import Spacer from './lib/spacer'
import transition from './lib/transition'

const refreshIndicatorHeight = 38
const totalHeight = 48

const Container = ({ indicator }) => {
  const node = document.createElement('div')

  // webkit bugs without this. The element will often just not render.
  node.style.height = `${totalHeight}px`

  node.style.pointerEvents = 'none'
  node.style.display = 'flex'
  node.style.justifyContent = 'center'
  node.style.position = 'fixed'
  node.style.top = 0
  node.style.left = 0
  node.style.right = 0

  const setY = y => node.style.transform = `translateY(${y}px)`

  return { node, setY }
}

const Indicator = ({ target, color = '#2196f3' }) => {
  const spacer = Spacer({ ptrElement: target })

  const indicatorNode = document.createElement('div')
  indicatorNode.style.paddingTop = `10px`

  const indicator = new RefreshIndicator({
    target: indicatorNode,
    data: {
      color,
      size: refreshIndicatorHeight,
      emphasized: false
    }
  })

  const container = Container({ indicator })

  const setY = y => container.setY(Math.min(0, y))
  setY(-totalHeight)

  const onPullMove = ({ tilRefreshRatio, tilRefreshDistance }) => {
    setY(-tilRefreshDistance)

    // max rotation
    const ratio = Math.min(1.4, tilRefreshRatio)

    // adjust animation to start a little later so that it is in view when it starts
    const progressRatio = ratio < 0.4 ? 0 : ratio - (1 - ratio)

    indicator.set({ progressRatio })
  }

  const onPullCancel = () => {
    setY(-totalHeight)
  }

  const onRefreshStart = () => {
    indicator.set({ progressRatio: undefined })
    setY(0)
    spacer.setHeight(totalHeight)
  }

  const onRefreshEnd = () => {
    setY(-totalHeight)
    indicator.set({ progressRatio: 0 })
    return transition(() => spacer.setHeight(0), 150, spacer.node)
  }

  container.node.appendChild(indicatorNode)
  target.appendChild(container.node)

  return {
    node: container.node,
    height: totalHeight,
    distanceToRefresh: totalHeight,
    elasticOverscroll: true,
    onPullMove,
    onPullCancel,
    onRefreshStart,
    onRefreshEnd
  }
}

export default Indicator
