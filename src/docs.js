import pullToRefresh from './'
// import Indicator from './indicator'

const contentElem = document.createElement('div')
document.body.appendChild(contentElem)
const contentUrl = 'https://baconipsum.com/api/?type=all-meat&paras=15&start-with-lorem=1&format=html'
const refreshContent = () => fetch(contentUrl)
  .then(resp => resp.text())
  .then(html => contentElem.innerHTML = html)

refreshContent()

pullToRefresh({
  element: document.body,
  //indicator: Indicator(),
  onRefresh: () => new Promise(resolve => setTimeout(resolve, 900))
    .then(refreshContent)
})
