import RefreshIndicator from 'svelte-refresh-indicator'
import addEventListener from './lib/add-event-listener'

const transition = (fn, ms, node) => new Promise(resolve => {
  node.style.transition = `all ${ms}ms`
  const off = addEventListener(node, 'transitionend', () => {
    node.style.transition = ''
    off()
    resolve()
  })
  fn(node)
})

const refreshIndicatorHeight = 38
const totalHeight = 48

const Container = ({ indicator }) => {
  const node = document.createElement('div')
  node.style.height = '100%' // webkit bugs without this. The element will often just not render.
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

const Indicator = () => {
  const indicatorNode = document.createElement('div')
  indicatorNode.style.paddingTop = `10px`

  const indicator = new RefreshIndicator({
    target: indicatorNode,
    data: {
      size: refreshIndicatorHeight,
      emphasized: false
    }
  })

  const container = Container({ indicator })
  container.node.appendChild(indicatorNode)

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

  const onPullCancel = ({ spacer }) => {
    setY(-totalHeight)
  }

  const onRefreshStart = ({ spacer}) => {
    indicator.set({ progressRatio: undefined })
    spacer.setHeight(totalHeight)
  }

  const onRefreshEnd = ({ spacer }) => {
    setY(-totalHeight)
    indicator.set({ progressRatio: 0 })
    return transition(() => spacer.setHeight(0), 150, spacer.node)
  }

  return {
    node: container.node,
    height: totalHeight,
    onPullMove,
    onPullCancel,
    onRefreshStart,
    onRefreshEnd
  }
}

export default Indicator
