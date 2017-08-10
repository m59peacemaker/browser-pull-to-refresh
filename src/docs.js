import { pullToRefresh, Indicator, ElasticIndicator } from '../'
import disableChromePtr from 'disable-chrome-ptr'
import bowser from 'bowser'
import pTimeout from 'p-timeout'
import noop from 'nop'

// TODO: a UI for changing the ptr parameters would be nice

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const contentElem = document.createElement('div')
contentElem.className = 'content'
document.body.appendChild(contentElem)
const contentUrl = 'https://baconipsum.com/api/?type=all-meat&paras=15&start-with-lorem=1&format=html'

const fetchHtml = fetch(contentUrl)
  .then(resp => resp.text())

const refreshContent = () => pTimeout(fetchHtml, 2000)
  .catch(err => {
    return `<p>The request to get nice filler content failed, so here's a random number: <b>${Math.random()}</b></p>

<p>And here's the thing that happened with the request: <b>${err}</b></p>`
  })
  .then(html => contentElem.innerHTML = html)

const enableChromePtr = (bowser.mobile && bowser.chrome) ? disableChromePtr() : noop

const ptr = pullToRefresh({
  element: document.body,
  indicator: (bowser.webkit ? ElasticIndicator : Indicator)({ target: document.body }),
  onRefresh: () => wait(900) // some artificial delay
    .then(() => pTimeout(refreshContent(), 2000))
})

ptr.refresh()
