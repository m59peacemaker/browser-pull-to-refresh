const style = document.createElement('style')
style.textContent = `::selection { background: transparent; }`

const selectionVisibility = {
  on: () => { try { document.head.removeChild(style) } catch (err) { } },
  off: () => document.head.appendChild(style)
}

module.exports = selectionVisibility
