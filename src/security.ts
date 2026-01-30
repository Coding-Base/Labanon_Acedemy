// Frontend deterrents: prevents simple copy / right-click and attempts to block PrintScreen.
// NOTE: These are deterrents only — screenshots cannot be reliably prevented in browsers.

// Disable context menu
window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

// Block common copy shortcuts
window.addEventListener('keydown', (e) => {
  // Block PrintScreen (Note: not reliable), Ctrl/Cmd+P print, Ctrl/Cmd+S save, Ctrl/Cmd+C copy while holding Ctrl/Cmd
  if ((e.key === 'PrintScreen') ||
      ((e.ctrlKey || e.metaKey) && ['p', 's', 'c', 'u'].includes(e.key.toLowerCase())) ) {
    e.preventDefault()
    e.stopPropagation()
  }
})

// Hide content when window loses focus (attempt to deter screen capture tools)
window.addEventListener('blur', () => {
  const el = document.getElementById('root')
  if (el) el.style.filter = 'blur(6px) brightness(0.7)'
})
window.addEventListener('focus', () => {
  const el = document.getElementById('root')
  if (el) el.style.filter = ''
})

// Disable text selection on the page
document.documentElement.style.userSelect = 'none'
document.documentElement.style.webkitUserSelect = 'none'

export {};
