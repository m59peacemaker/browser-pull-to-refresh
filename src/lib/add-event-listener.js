import detectPassiveEvents from 'detect-passive-events'

const addEventListener = (element, name, listener, options) => {
  element.addEventListener(name, listener, detectPassiveEvents.hasSupport ? options : undefined)
  return () => element.removeEventListener(name, listener)
}

export default addEventListener
