// Frontend deterrents: prevents simple copy / right-click and attempts to block screenshot tools.
// NOTE: These are deterrents only — OS-level screenshots cannot be reliably prevented in browsers.
// However, aggressive blurring, key blocking, and visibility detection make capturing useful content difficult.

// Disable context menu
window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

// Aggressive screenshot & copy prevention
window.addEventListener('keydown', (e) => {
  // Block PrintScreen, Ctrl/Cmd+P (print), Ctrl/Cmd+S (save), Ctrl/Cmd+C (copy), Ctrl/Cmd+U (view source)
  // Also block Windows+Shift+S (screenshot tool), Shift+PrintScreen, Ctrl+PrintScreen
  if (
    (e.key === 'PrintScreen') ||
    (e.shiftKey && e.key === 'PrintScreen') ||
    (e.ctrlKey && e.key === 'PrintScreen') ||
    (e.metaKey && e.shiftKey && ['s', 'S'].includes(e.key)) || // Win+Shift+S
    ((e.ctrlKey || e.metaKey) && ['p', 's', 'c', 'u'].includes(e.key.toLowerCase()))
  ) {
    e.preventDefault()
    e.stopPropagation()
  }
})

// Detect visibility changes (tab switch, alt+tab) and blur content
document.addEventListener('visibilitychange', () => {
  const el = document.getElementById('root')
  if (!el) return

  if (document.hidden) {
    // When tab is hidden, aggressively blur and darken
    el.style.filter = 'blur(12px) brightness(0.3) grayscale(100%)'
    el.style.pointerEvents = 'none'
  } else {
    // When tab returns to focus, restore
    el.style.filter = ''
    el.style.pointerEvents = 'auto'
  }
})

// Hide content when window loses focus (attempt to deter screen capture tools)
window.addEventListener('blur', () => {
  const el = document.getElementById('root')
  if (el) {
    el.style.filter = 'blur(10px) brightness(0.4)'
    el.style.pointerEvents = 'none'
  }
})

window.addEventListener('focus', () => {
  const el = document.getElementById('root')
  if (el) {
    el.style.filter = ''
    el.style.pointerEvents = 'auto'
  }
})

// Disable text selection and drag
document.documentElement.style.userSelect = 'none'
document.documentElement.style.webkitUserSelect = 'none'
document.addEventListener('dragstart', (e) => e.preventDefault())

// Prevent print preview/printing
window.addEventListener('beforeprint', () => {
  const el = document.getElementById('root')
  if (el) {
    el.style.display = 'none'
  }
})
window.addEventListener('afterprint', () => {
  const el = document.getElementById('root')
  if (el) {
    el.style.display = 'block'
  }
})

// Log suspicious activity for monitoring
const logSuspiciousActivity = (action: string) => {
  const timestamp = new Date().toISOString()
  console.warn(`[SECURITY] ${action} at ${timestamp}`)
}

// Track access time and warn if user tries repeated screenshot attempts
let screenshotAttempts = 0
const screenshotAttemptsKey = Symbol('screenshot_attempts')
const resetAttemptsTimer = setInterval(() => {
  screenshotAttempts = 0
}, 60000) // Reset every minute

window.addEventListener('keydown', (e) => {
  if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && ['s', 'S'].includes(e.key))) {
    screenshotAttempts++
    if (screenshotAttempts > 3) {
      logSuspiciousActivity(`Repeated screenshot attempts (${screenshotAttempts})`)
    }
  }
})

export {};
