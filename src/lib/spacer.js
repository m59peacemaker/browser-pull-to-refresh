const Spacer = ({ prtElement }) => {
  const node = document.createElement('div')
  node.style.visibility = 'hidden'
  node.style.pointerEvents = 'none'

  let currentHeight = 0

  const beFirstChild = () => prtElement.insertBefore(node, prtElement.firstElementChild)

  const justSetHeight = height => node.style.height = `${height}px`
  const setHeight = height => {
    beFirstChild()
    justSetHeight(height)
    if (height > currentHeight) {
      prtElement.scrollTop = prtElement.scrollTop - (height - currentHeight)
    }
    currentHeight = height
  }

  justSetHeight(currentHeight)

  return { setHeight, node }
}

export default Spacer
