import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setCanonicalURL } from '../utils/seoUtils'

/**
 * Global SEO manager that automatically sets the canonical URL
 * on every route change. Mount this inside <Router>.
 */
export default function SEOManager() {
  const location = useLocation()

  useEffect(() => {
    const baseUrl = 'https://lighthubacademy.org'
    const canonicalUrl = `${baseUrl}${location.pathname}`
    setCanonicalURL(canonicalUrl)
  }, [location.pathname])

  return null
}
