// Lightweight Google Analytics (GA4) helper.
// Usage: set `VITE_GA_MEASUREMENT_ID` in your Vite env and call `initGA(id)` on app/dashboard mount.

export function initGA(measurementId: string | undefined) {
  if (!measurementId) return
  const w = window as any
  if (w.gtagInitialized) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  const inline = document.createElement('script')
  inline.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${measurementId}', { send_page_view: false });`
  document.head.appendChild(inline)

  w.gtagInitialized = true
}

export function sendPageView(path: string) {
  const w = window as any
  if (!w.gtagInitialized || typeof w.gtag !== 'function') return
  w.gtag('event', 'page_view', { page_path: path })
}

export function sendEvent(name: string, params?: Record<string, any>) {
  const w = window as any
  if (!w.gtagInitialized || typeof w.gtag !== 'function') return
  w.gtag('event', name, params || {})
}
