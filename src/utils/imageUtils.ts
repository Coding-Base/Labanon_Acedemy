/**
 * Shared utility for resolving biomedia, question diagrams, blog images, and general media URLs.
 * Handles Cloudinary CDN URLs, local development (http://localhost:8000),
 * relative media paths, protocol-relative URLs, extension-less Cloudinary delivery,
 * and production mixed-content prevention.
 */

export const DEFAULT_AVATAR_FALLBACK = '/labanonlogo.png'

export const resolveImageUrl = (url?: string | null): string => {
  if (!url) return ''
  let trimmed = url.trim()
  if (!trimmed) return ''

  // Protocol-relative URLs (e.g. //res.cloudinary.com/...)
  if (trimmed.startsWith('//')) {
    trimmed = `https:${trimmed}`
  }

  // In production (when app is served on lighthubacademy.org), replace localhost backend references
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    (trimmed.startsWith('http://localhost:8000') || trimmed.startsWith('https://localhost:8000'))
  ) {
    trimmed = trimmed.replace(/^https?:\/\/localhost:8000/i, 'https://api.lighthubacademy.org')
  }

  // In local development, never force SSL on localhost or 127.0.0.1
  if (trimmed.startsWith('http://localhost') || trimmed.startsWith('http://127.0.0.1')) {
    return trimmed
  }

  // In production (when app is served over HTTPS), upgrade remote HTTP (e.g. Cloudinary) to HTTPS
  if (trimmed.startsWith('http://') && typeof window !== 'undefined' && window.location.protocol === 'https:') {
    trimmed = trimmed.replace('http://', 'https://')
  }

  // Ensure Cloudinary image delivery URLs have a valid format extension (.jpg)
  // This prevents browser MIME-type confusion or ad-blocker filtering on extension-less URLs
  if (trimmed.includes('res.cloudinary.com') && !/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)) {
    const [path, query] = trimmed.split('?')
    trimmed = `${path}.jpg${query ? `?${query}` : ''}`
  }

  // Absolute http/https URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // Relative URLs (e.g. /media/... or media/...)
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
  let baseUrl = apiBase.replace(/\/api\/?$/, '')
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    baseUrl.includes('localhost')
  ) {
    baseUrl = 'https://api.lighthubacademy.org'
  }

  return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}

/**
 * Replaces and resolves all <img src="..."> tags in HTML strings
 * (used in blog bodies, rich text content, and forum posts).
 */
export const formatRichContentImages = (content?: string): string => {
  if (!content) return ''
  return content.replace(
    /<img([^>]+)src=(["'])([^"']+)\2([^>]*)>/gi,
    (_match, prefix, _quote, src, suffix) => {
      const resolved = resolveImageUrl(src)
      return `<img${prefix}src="${resolved}"${suffix}>`
    }
  )
}

/**
 * Generic image error handler for React img elements.
 * Handles Cloudinary connection resets (ERR_CONNECTION_RESET), ad-blocker blocking,
 * and falls back gracefully to a designated fallback or hides the broken element.
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = DEFAULT_AVATAR_FALLBACK
) => {
  const target = e.currentTarget
  if (!target) return

  const retryCount = Number(target.dataset.retryCount || '0')
  if (retryCount >= 1) {
    if (fallbackSrc && target.src !== fallbackSrc && !target.src.endsWith(fallbackSrc)) {
      target.src = fallbackSrc
      return
    }
    // If fallback also fails, hide broken icon and reveal parent placeholder if any
    target.style.display = 'none'
    return
  }

  target.dataset.retryCount = String(retryCount + 1)
  const currentSrc = target.src || ''

  // If Cloudinary connection was reset or failed, switch to fallback avatar directly
  if (currentSrc.includes('res.cloudinary.com')) {
    if (fallbackSrc) {
      target.src = fallbackSrc
      return
    }
    target.style.display = 'none'
    return
  }

  // Attempt: If HTTP, upgrade to HTTPS
  if (currentSrc.startsWith('http://')) {
    target.src = currentSrc.replace('http://', 'https://')
    return
  }

  // If fallback provided
  if (fallbackSrc && target.src !== fallbackSrc && !target.src.endsWith(fallbackSrc)) {
    target.src = fallbackSrc
    return
  }

  // Fallback: hide broken icon cleanly
  target.style.display = 'none'
}

export default resolveImageUrl
