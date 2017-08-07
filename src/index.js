import ontouchpan from './ontouchpan'
import Spacer from './lib/spacer'

// on chrome android, see if we can catch the beforeunload or something for native ptr
  // maybe we can watch for the gesture that triggers it and then do our own thing instead of page refresh

// We should embrace the browser default behavior and design around it

// NOTE: It might be ideal to not use this on chrome android where there is native pull to refresh
  // preventDefault() has to be called to gate off the native

// maybe there's a way to figure out which kind of pull logic to use
  // maybe see how the user is gesturing and compare with how it scrolls
    // if the gesture should have lead to a negative scrollTop but scrollTop === 0, then
    // we're not in an environment with rubber banding

export default ({
  element = document.body,
  indicator,
  distanceToRefresh,
  onRefresh = () => Promise.resolve()
}) => {
  distanceToRefresh = distanceToRefresh || indicator.height || 58

  let pulling, busy, tilRefreshRatio

  const spacer = Spacer({ prtElement: element })
  element.append(indicator.node)

  const reset = () => {
    pulling = false
    busy = false
    tilRefreshRatio = 0
  }

  // TODO: this doesn't filter out left/right motions
    // it's better to have a threshold that needs to be crossed on the Y axis before X axis in order to be counted as a pull
  return ontouchpan({
    element,
    onpanstart: e => {},
    onpanmove: e => {
      const isTopRubberScroll = element.scrollTop < 0
      if (!isTopRubberScroll || busy) {
        return
      }

      pulling = true

      const rubberDistance = Math.abs(element.scrollTop)
      const tilRefreshDistance = distanceToRefresh - rubberDistance
      tilRefreshRatio = 1 - (tilRefreshDistance / distanceToRefresh)

      indicator.onPullMove({ tilRefreshRatio, tilRefreshDistance })
    },
    onpanend: () => {
      if (!pulling) { return }
      pulling = false
      busy = true

      ;(tilRefreshRatio >= 1
        ? Promise.resolve(indicator.onRefreshStart({ spacer }))
          .then(() => onRefresh())
          .then(() => indicator.onRefreshEnd({ spacer }))
        : Promise.resolve(indicator.onPullCancel({ spacer }))
      ).then(reset)
    }
  })
}
