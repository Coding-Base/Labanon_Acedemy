/**
 * SEO Helper Functions
 * Manages meta tags, Open Graph tags, and structured data for lessons
 */

export interface SeoConfig {
  title: string
  description: string
  keywords?: string
  ogImage?: string
  url?: string
  lessonAuthor?: string
}

/**
 * Set SEO meta tags for a lesson page
 */
export const setSeoTags = (config: SeoConfig) => {
  // Set title
  document.title = config.title

  // Set or update meta description
  let metaDescription = document.querySelector('meta[name="description"]')
  if (!metaDescription) {
    metaDescription = document.createElement('meta')
    metaDescription.setAttribute('name', 'description')
    document.head.appendChild(metaDescription)
  }
  metaDescription.setAttribute('content', config.description)

  // Set keywords
  if (config.keywords) {
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.setAttribute('name', 'keywords')
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.setAttribute('content', config.keywords)
  }

  // Open Graph tags
  setOpenGraphTags({
    title: config.title,
    description: config.description,
    image: config.ogImage,
    url: config.url
  })
}

/**
 * Set Open Graph meta tags for social sharing
 */
export const setOpenGraphTags = (config: {
  title: string
  description: string
  image?: string
  url?: string
}) => {
  const ogTags = [
    { property: 'og:title', content: config.title },
    { property: 'og:description', content: config.description },
    { property: 'og:type', content: 'article' },
    ...(config.url ? [{ property: 'og:url', content: config.url }] : []),
    ...(config.image ? [{ property: 'og:image', content: config.image }] : [])
  ]

  ogTags.forEach(tag => {
    let metaTag = document.querySelector(`meta[property="${tag.property}"]`)
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute('property', tag.property)
      document.head.appendChild(metaTag)
    }
    metaTag.setAttribute('content', tag.content)
  })
}

/**
 * Create JSON-LD structured data for a lesson (schema.org)
 */
export const createLessonSchema = (lessonData: {
  title: string
  description: string
  content: string
  author: string
  datePublished: string
  dateModified: string
  url?: string
  image?: string
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EducationContent',
    headline: lessonData.title,
    description: lessonData.description,
    bibo: lessonData.content,
    author: {
      '@type': 'Person',
      name: lessonData.author
    },
    datePublished: lessonData.datePublished,
    dateModified: lessonData.dateModified,
    ...(lessonData.url && { url: lessonData.url }),
    ...(lessonData.image && { image: lessonData.image }),
    inLanguage: 'en'
  }

  return schema
}

/**
 * Inject structured data (JSON-LD) into the document head
 */
export const injectStructuredData = (schema: Record<string, any>) => {
  // Remove old structured data if exists
  const oldScript = document.querySelector('script[type="application/ld+json"]')
  if (oldScript) {
    oldScript.remove()
  }

  // Create and inject new script
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(schema)
  document.head.appendChild(script)
}

/**
 * Generate a canonical URL for a lesson
 */
export const generateCanonicalUrl = (lessonSlug: string, subject?: string, topic?: string): string => {
  const baseUrl = window.location.origin
  const path = `/learn/${subject || 'lesson'}/${topic || 'content'}/${lessonSlug}`
  return `${baseUrl}${path}`
}

/**
 * Generate a plain text excerpt from HTML content (for meta description)
 */
export const generateExcerpt = (htmlContent: string, maxLength: number = 160): string => {
  // Remove HTML tags
  const plainText = htmlContent.replace(/<[^>]*>/g, '')
  // Remove extra whitespace
  const cleaned = plainText.replace(/\s+/g, ' ').trim()
  // Truncate to maxLength and add ellipsis if needed
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) + '...' : cleaned
}
