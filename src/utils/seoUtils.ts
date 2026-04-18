/**
 * SEO Utility Functions
 * Helps manage meta tags and page titles for better search engine optimization
 */

interface SEOConfig {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  author?: string
}

/**
 * Set page title and meta tags for SEO
 * This function updates the document.title and creates/updates meta tags
 */
export function setSEOTags(config: SEOConfig) {
  // Set page title
  document.title = config.title ? `${config.title} | LightHub Academy` : 'LightHub Academy'

  // Helper function to set/update meta tags
  const setMetaTag = (name: string, content: string, property?: boolean) => {
    let element = document.querySelector(`meta[${property ? 'property' : 'name'}="${name}"]`) as HTMLMetaElement | null
    
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(property ? 'property' : 'name', name)
      document.head.appendChild(element)
    }
    
    element.setAttribute('content', content || '')
  }

  // Standard meta tags
  setMetaTag('description', config.description)
  if (config.keywords) {
    setMetaTag('keywords', config.keywords)
  }

  // Open Graph tags for social media sharing
  setMetaTag('og:title', config.title, true)
  setMetaTag('og:description', config.description, true)
  setMetaTag('og:type', config.type || 'website', true)
  
  if (config.image) {
    setMetaTag('og:image', config.image, true)
  }
  
  if (config.url) {
    setMetaTag('og:url', config.url, true)
  }

  // Twitter Card tags
  setMetaTag('twitter:card', 'summary_large_image')
  setMetaTag('twitter:title', config.title)
  setMetaTag('twitter:description', config.description)
  
  if (config.image) {
    setMetaTag('twitter:image', config.image)
  }

  // Article specific tags
  if (config.type === 'article' && config.author) {
    setMetaTag('article:author', config.author, true)
  }
}

/**
 * Set canonical URL for SEO
 * Helps prevent duplicate content issues
 */
export function setCanonicalURL(url: string) {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  
  canonical.href = url
}

/**
 * Add JSON-LD structured data for rich snippets
 * Helps search engines better understand page content
 */
export function addStructuredData(data: any) {
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

/**
 * Remove any existing JSON-LD structured data scripts
 */
export function clearStructuredData() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  scripts.forEach(script => {
    if (script !== document.querySelector('script[type="application/ld+json"]:first-child')) {
      script.remove()
    }
  })
}

/**
 * Generate JSON-LD for Organization
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LightHub Academy',
    url: window.location.origin,
    logo: `${window.location.origin}/src/pages/labanonlogo.png`,
    description: 'Africa\'s premier digital learning ecosystem transforming education through technology',
    sameAs: [
      'https://www.facebook.com/lighthubacademy',
      'https://www.youtube.com/lighthubacademy'
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Lagos',
      addressCountry: 'Nigeria'
    }
  }
}

/**
 * Generate JSON-LD for Course
 */
export function getCourseSchema(course: {
  id: string | number
  title: string
  description: string
  image?: string
  rating?: number
  price?: number
  currency?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    url: `${window.location.origin}/course/${course.id}`,
    image: course.image,
    provider: {
      '@type': 'Organization',
      name: 'LightHub Academy',
      url: window.location.origin
    },
    ...(course.rating && { aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: course.rating,
      bestRating: 5
    }}),
    ...(course.price && { offers: {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: course.currency || 'NGN'
    }})
  }
}

/**
 * Generate JSON-LD for Educational Organization
 */
export function getEducationalOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'LightHub Academy',
    url: window.location.origin,
    logo: `${window.location.origin}/src/pages/labanonlogo.png`,
    description: 'Digital Learning Platform offering courses, certifications, and CBT practice',
    founder: {
      '@type': 'Person',
      name: 'LightHub Academy Team'
    }
  }
}

/**
 * Generate JSON-LD for LocalBusiness/Educational Institution
 */
export function getInstitutionSchema(institution: {
  name: string
  image?: string
  description?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    name: institution.name,
    image: institution.image,
    description: institution.description || 'Educational Institution',
    url: window.location.href,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'Nigeria'
    }
  }
}
