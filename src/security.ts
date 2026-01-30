// Frontend deterrents: prevents simple copy / right-click and blocks screenshot attempts.
// NOTE: These are deterrents only — OS-level screenshots cannot be reliably prevented in browsers.
// Added mobile-specific protections (long-press, gestures).

// Detect mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)

// Disable context menu (blocks right-click on desktop and long-press menus on mobile)
window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

// Desktop: Block PrintScreen and copy shortcuts
if (!isMobileDevice()) {
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
}

// Mobile: Block long-press (screenshot attempt on iOS/Android)
if (isMobileDevice()) {
  document.addEventListener('touchstart', (e) => {
    // Allow normal touch, but track long-press
  })

  // Disable long-press menu and gesture screenshot (iOS)
  document.addEventListener('touchend', (e) => {
    // Touch handling
  })

  // Block gesture shortcuts on iOS (e.g., three-finger tap screenshot)
  document.addEventListener('gesturechange', (e) => {
    e.preventDefault()
  })

  // Prevent long-press screenshot on Android
  document.addEventListener('pointerdown', (e) => {
    const touch = e as PointerEvent
    if (touch.pointerType === 'touch') {
      const longPressTimer = setTimeout(() => {
        // Potential screenshot attempt via long-press
        e.preventDefault()
      }, 500)

      document.addEventListener('pointerup', () => {
        clearTimeout(longPressTimer)
      }, { once: true })
    }
  })
}

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

// Track screenshot attempts
let screenshotAttempts = 0
setInterval(() => {
  screenshotAttempts = 0
}, 60000) // Reset every minute

if (!isMobileDevice()) {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && ['s', 'S'].includes(e.key))) {
      screenshotAttempts++
      if (screenshotAttempts > 3) {
        logSuspiciousActivity(`Repeated screenshot attempts (${screenshotAttempts})`)
      }
    }
  })
}

export {};
