const RefreshIndicator = require('svelte-refresh-indicator')

const Indicator = () => {
  const node = document.createElement('div')
  const indicator = new RefreshIndicator({ target: node })

  const setTilRefreshRatio = ratio => indicator.set({ progressRatio: ratio })
  const setRefreshing = isRefreshing => isRefreshing && indicator.set({ progressRatio: undefined })

  return {
    node,
    height: 50,
    setTilRefreshRatio,
    setRefreshing
  }
}

module.exports = Indicator
