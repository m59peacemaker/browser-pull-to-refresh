import addEventListener from 'addeventlistener'

const transition = (fn, ms, node) => new Promise(resolve => {
  node.style.transition = `all ${ms}ms`
  const off = addEventListener(node, 'transitionend', () => {
    node.style.transition = ''
    off()
    resolve()
  })
  fn(node)
})

export default transition
