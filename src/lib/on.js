const on = (element, eventName, listener, options) => {
  element.addEventListener(eventName, listener, options)
  return () => element.removeEventListener(eventName, listener)
}

module.exports = on
