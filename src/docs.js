const pullToRefresh = require('./')
const RefreshIndicator = require('../../svelte-refresh-indicator')

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

const contentElem = document.createElement('div')
document.body.appendChild(contentElem)
const contentUrl = 'https://baconipsum.com/api/?type=all-meat&paras=15&start-with-lorem=1&format=html'
const refreshContent = () => fetch(contentUrl)
  .then(resp => resp.text())
  .then(html => contentElem.innerHTML = html)

refreshContent()

pullToRefresh({
  element: document.body,
  indicator: Indicator(),
  onRefresh: () => new Promise(resolve => setTimeout(resolve, 900))
    .then(refreshContent)
})
