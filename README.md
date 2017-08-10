# pull-to-refresh

Trying to be, but it is not yet: Android / Chrome / Material like pull to refresh for mobile and browser that doesn't block text selection.

It works on mobile browsers. Desktop/mouse situations have a lot of annoying edge cases. There is code in this repo that deals with desktop, but it needs work to have a nice API that handles desktop considerations and yet is not ridiculous to configure for mobile also.

[View the demo.](https://m59peacemaker.github.io/pull-to-refresh/)

## install

```sh
$ npm install p-t-r
```

## example

```js
import pullToRefresh from 'p-t-r'
import Indicator from 'p-t-r/indicator'
import ElasticIndicator from 'p-t-r/elastic-indicator'
import disableChromePtr from 'disable-chrome-ptr'
import bowser from 'bowser'

const enableChromePtr = (bowser.mobile && bowser.chrome) ? disableChromePtr() : () => {}

const ptr = pullToRefresh({
  element: document.body,
  indicator: (bowser.webkit ? ElasticIndicator : Indicator)({ target: document.body }),
  onRefresh: () => { return promiseFromSomeAsyncThing() }
})

// do an initial load if you want
ptr.refresh()

// to remove pull to refresh
ptr.end()
enableChromePtr()
```
