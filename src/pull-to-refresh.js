import noop from 'nop'
import ontouchpan from './lib/ontouchpan'

// TODO: on iOS can/should the scroll event be used instead of touch?
// TODO: maybe add `aggressive` option to determine whether window has to be scrolled to top to start
  // when touch starts
  // most native apps with pull to refresh are like this, but it isn't good for mobile browsers that have the url bar that hides when scrolling down
  // aggressive: true means that the pull to refresh will start even if the page was scrolled down when the touch began, if the touchmove causes a scroll to the top and then begins overscroll
  // in code, simply skip the pageYOffset check
const pullToRefresh = ({
  indicator,
  onRefresh = () => Promise.resolve(),
  element = document.body
}) => {
  const {
    distanceToRefresh = indicator.height || 60,
    progressOffset = 0,
    maxOverscroll = Infinity,
    elasticOverscroll = false,
    onPullStart = noop,
    onPullMove = noop,
    onPullCancel = noop,
    onRefreshStart = noop,
    onRefreshEnd = noop
  } = indicator

  const offsetDistanceToRefresh = distanceToRefresh - progressOffset
  let pulling, busy, tilRefreshRatio, initialScrollTop, lastOverscroll, canBePtr

  const reset = () => {
    canBePtr = false
    pulling = false
    busy = false
    tilRefreshRatio = 0
    lastOverscroll = 0
  }

  const calcOverscrollAmount = e => {
    return -(elasticOverscroll ? element.scrollTop : initialScrollTop - e.distanceY)
  }

  const refresh = () => {
    busy = true
    onRefreshStart()
    return Promise.resolve(onRefresh())
      .then(() => onRefreshEnd())
      .then(() => busy = false)
  }

  // TODO: this doesn't filter out left/right motions
    // I like the idea of having a threshold that needs to be crossed on the Y axis before X axis in order to be counted as a pull
    // though this is irrelevant in elasticOverscroll situations
  const end = ontouchpan({
    element,
    passive: {
      touchstart: true,
      touchmove: elasticOverscroll
    },
    onpanstart: e => {
      if (busy || pulling) { return }

      /* canBePtr also serves to gate off the case where a touch starts while busy,
           then the busy state completes, then a move occurs
      */
      canBePtr = elasticOverscroll || window.pageYOffset === 0
      lastOverscroll = 0
      initialScrollTop = element.scrollTop
    },
    onpanmove: e => {
      const unrestrainedOverscrollDistance = calcOverscrollAmount(e)
      const overscrollDistance = Math.min(maxOverscroll, unrestrainedOverscrollDistance)
      const isPtr = !busy
        && overscrollDistance > 0
        && canBePtr

      if (!isPtr) {
        return
      }

      if (!pulling) {
        onPullStart({ target: element })
        pulling = true
      }

      if (!elasticOverscroll) {
        // stop pan up from scrolling the page
        e.preventDefault()
      }

      const extraOverscroll = unrestrainedOverscrollDistance - overscrollDistance
      initialScrollTop += extraOverscroll

      const tilRefreshDistance = distanceToRefresh - overscrollDistance
      tilRefreshRatio = (offsetDistanceToRefresh - tilRefreshDistance)
        / offsetDistanceToRefresh

      const overscrollDelta = overscrollDistance - lastOverscroll
      lastOverscroll = overscrollDistance

      onPullMove({
        tilRefreshRatio,
        tilRefreshDistance,
        overscrollDistance,
        overscrollDelta
      })
    },
    onpanend: () => {
      // the `busy` check here is likely redundant, just being safe
      if (!pulling || busy) { return }
      pulling = false
      busy = true

      ;(tilRefreshRatio >= 1
        ? refresh()
        : Promise.resolve(onPullCancel())
      )
        .then(reset)
        .catch(err => {
          reset()
          throw err
        })
    }
  })

  return {
    end,
    refresh
  }
}

export default pullToRefresh
