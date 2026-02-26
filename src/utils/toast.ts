type ToastType = 'info' | 'success' | 'error' | 'warn'

export function showToast(message: string, type: ToastType = 'info', timeout = 4000) {
  try {
    const containerId = 'lighthouse-toast-container'
    let container = document.getElementById(containerId)
    if (!container) {
      container = document.createElement('div')
      container.id = containerId
      container.style.position = 'fixed'
      container.style.right = '16px'
      container.style.top = '16px'
      container.style.zIndex = '9999'
      container.style.display = 'flex'
      container.style.flexDirection = 'column'
      container.style.gap = '8px'
      document.body.appendChild(container)
    }

    const el = document.createElement('div')
    el.textContent = message
    el.style.minWidth = '200px'
    el.style.padding = '10px 14px'
    el.style.borderRadius = '8px'
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)'
    el.style.color = '#111827'
    el.style.fontSize = '14px'
    el.style.opacity = '0'
    el.style.transition = 'opacity 200ms ease, transform 200ms ease'
    el.style.transform = 'translateY(-6px)'

    switch (type) {
      case 'success':
        el.style.background = '#ecfdf5'
        el.style.border = '1px solid #bbf7d0'
        break
      case 'error':
        el.style.background = '#fff1f2'
        el.style.border = '1px solid #fecaca'
        break
      case 'warn':
        el.style.background = '#fffbeb'
        el.style.border = '1px solid #fde68a'
        break
      default:
        el.style.background = '#f0f9ff'
        el.style.border = '1px solid #bae6fd'
        break
    }

    container.appendChild(el)

    // force reflow then animate in
    window.requestAnimationFrame(() => {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })

    const hide = () => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(-6px)'
      setTimeout(() => { try { container?.removeChild(el) } catch (e) {} }, 220)
    }

    const t = setTimeout(hide, timeout)

    el.addEventListener('click', () => { clearTimeout(t); hide() })

  } catch (e) {
    // swallow errors silently in environments where DOM isn't available
  }
}

export default showToast
