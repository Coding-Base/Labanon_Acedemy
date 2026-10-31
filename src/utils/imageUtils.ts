/**
 * Shared utility for resolving biomedia, question diagrams, and general media URLs.
 * Handles Cloudinary CDN URLs, local development (http://localhost:8000),
 * relative media paths, protocol-relative URLs, and production mixed-content prevention.
 */

export const resolveImageUrl = (url?: string | null): string => {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  // Protocol-relative URLs (e.g. //res.cloudinary.com/...)
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  // In local development, never force SSL on localhost or 127.0.0.1
  if (trimmed.startsWith('http://localhost') || trimmed.startsWith('http://127.0.0.1')) {
    return trimmed
  }

  // In production (when app is served over HTTPS), upgrade remote HTTP (e.g. Cloudinary) to HTTPS
  if (trimmed.startsWith('http://') && typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return trimmed.replace('http://', 'https://')
  }

  // Absolute http/https URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // Relative URLs (e.g. /media/cbt_questions/... or cbt_questions/...)
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
  const baseUrl = apiBase.replace(/\/api\/?$/, '')
  return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}

export default resolveImageUrl
