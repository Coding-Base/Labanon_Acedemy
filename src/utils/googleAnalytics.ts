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

export async function sendServerPageView(path: string) {
  try {
    const apiBase = (import.meta.env as any).VITE_API_BASE || '/api'
    const fullUrl = window.location.href
    const referrer = document.referrer || ''
    const params = new URLSearchParams(window.location.search)
    const payload: Record<string, any> = {
      page_path: path,
      full_url: fullUrl,
      referrer,
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_term: params.get('utm_term') || undefined,
      utm_content: params.get('utm_content') || undefined,
    }

    // Trim undefined fields
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

    // Fire-and-forget; don't block navigation
    fetch(`${apiBase}/analytics/track/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {})
  } catch (e) {
    // ignore
  }
}
