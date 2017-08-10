const Spacer = ({ ptrElement }) => {
  const node = document.createElement('div')
  node.style.visibility = 'hidden'
  node.style.pointerEvents = 'none'

  let currentHeight = 0

  const beFirstChild = () => ptrElement.insertBefore(node, ptrElement.firstElementChild)

  const justSetHeight = height => node.style.height = `${height}px`
  const setHeight = height => {
    beFirstChild()
    justSetHeight(height)
    if (height > currentHeight) {
      ptrElement.scrollTop = ptrElement.scrollTop - (height - currentHeight)
    }
    currentHeight = height
  }

  justSetHeight(currentHeight)

  return { setHeight, node }
}

export default Spacer
