import React, { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Search, Loader2, Calendar, User, ChevronRight, Heart, MessageCircle, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000/api'
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

function getImageSrc(img?: string) {
  if (!img) return undefined
  if (img.startsWith('http') || img.startsWith('data:')) return img
  if (img.startsWith('/')) return `${BACKEND_ORIGIN}${img}`
  return `${BACKEND_ORIGIN}/${img}`
}

// Fallback: extract first image src from HTML content (if present)
// Fallback: extract first image src from HTML content (if present)
function extractFirstImageSrc(content?: string) {
  if (!content) return undefined
  try {
    // HTML <img src="..."> or <img data-src='...'>
    let m = content.match(/<img[^>]+(?:src|data-src)=['"]([^'"]+)['"]/i)
    if (m && m[1]) return m[1]

    // HTML img without quotes (rare but possible)
    m = content.match(/<img[^>]+(?:src|data-src)=([^\s>]+)/i)
    if (m && m[1]) return m[1].replace(/^['"]|['"]$/g, '')

    // Markdown image ![alt](url)
    const mm = content.match(/!\[[^\]]*\]\(([^)]+)\)/)
    if (mm && mm[1]) return mm[1]

    return undefined
  } catch (err) {
    return undefined
  }
}

// Build a short HTML excerpt from full HTML content preserving block tags (headings, paragraphs)
function buildExcerptHtml(content?: string, maxBlocks = 3) {
  if (!content) return ''
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const body = doc.body
    if (!body) return ''

    const blocks: Element[] = []
    for (let i = 0; i < body.childNodes.length && blocks.length < maxBlocks; i++) {
      const node = body.childNodes[i]
      if (node.nodeType === Node.ELEMENT_NODE) {
        blocks.push(node as Element)
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
        // wrap stray text nodes in <p>
        const p = doc.createElement('p')
        p.textContent = node.textContent.trim()
        blocks.push(p)
      }
    }

    const container = doc.createElement('div')
    blocks.forEach(b => container.appendChild(b.cloneNode(true)))
    // Sanitize before returning
    return DOMPurify.sanitize(container.innerHTML)
  } catch (e) {
    return ''
  }
}

interface BlogPost {
  id: number
  title: string
  excerpt: string
  content: string
  image?: string
  slug: string
  author_username: string
  published_at: string
  created_at: string
  likes_count?: number
  comments_count?: number
  shares_count?: number
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

export default function BlogPage() {
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null })

  useEffect(() => {
    loadBlogs()
  }, [])

  async function loadBlogs(page = 1) {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/blog/published/?page=${page}`)
      
      const rawBlogs = Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : []
      // Convert any relative image src in content to absolute backend origin so cards display images correctly
      const blogsData = rawBlogs.map((b: any) => {
        if (b.content) {
          b.content = b.content.replace(/src=(['"])(\/[^'"]*)\1/g, `src="${BACKEND_ORIGIN}$2"`)
        }
        if (b.excerpt) {
          b.excerpt = b.excerpt.replace(/src=(['"])(\/[^'"]*)\1/g, `src="${BACKEND_ORIGIN}$2"`)
        }
        return b
      })

      setBlogs(blogsData)
      setPageInfo({
        count: response.data.count || blogsData.length || 0,
        next: response.data.next || null,
        previous: response.data.previous || null
      })
    } catch (err) {
      console.error('Failed to load blogs:', err)
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }

  const filteredBlogs = blogs.filter(blog => {
    if (!searchTerm) return true // Show all if search is empty
    const title = (blog.title || '').toLowerCase()
    const excerpt = (blog.excerpt || '').toLowerCase()
    const search = searchTerm.toLowerCase()
    return title.includes(search) || excerpt.includes(search)
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-green-600 to-yellow-600 py-12 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            LightHub Academy Blog
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-lg text-green-50 max-w-2xl"
          >
            Discover insights, tips, and stories from our community of educators and learners
          </motion.p>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Search Bar */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
            />
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </motion.div>

        ) : filteredBlogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try a different search term' : 'Check back soon for new content'}
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {filteredBlogs.map((blog) => {
              // Use only the featured `image` for the card — do NOT use content images
              const imgSrc = blog.image ? getImageSrc(blog.image) : undefined
              return (
              <div
                key={blog.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/blog/${blog.slug}`, { state: { blog } })}
              >
                {/* Featured Image */}
                {imgSrc && (
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-green-400 to-yellow-500">
                    <img
                      src={imgSrc}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(blog.published_at || blog.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {blog.author_username}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-yellow-600 transition-colors line-clamp-2">
                    {blog.title}
                  </h2>

                  {/* Excerpt (render sanitized HTML without images) */}
                  <div
                    className="text-gray-600 mb-6 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: (() => {
                      // prefer explicit excerpt; otherwise build from content
                      const raw = (blog.excerpt && blog.excerpt.trim()) ? blog.excerpt : buildExcerptHtml(blog.content || '')
                      // sanitize and remove any embedded images so cards don't show content images
                      const sanitized = DOMPurify.sanitize(raw || '')
                      return sanitized.replace(/<img[^>]*>/gi, '')
                    })() }}
                  />

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-6 pb-6 border-t pt-4">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{blog.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{blog.comments_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" />
                      <span>{blog.shares_count || 0}</span>
                    </div>
                  </div>

                  {/* Read More Link */}
                  <div className="flex items-center gap-2 text-green-600 font-semibold group-hover:gap-3 transition-all">
                    <span>Read More</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            )})}
          </div>
          
        )}

        {/* Empty State */}
        {!loading && blogs.length === 0 && !searchTerm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="mb-4 text-5xl">📝</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Blog Posts Yet</h3>
            <p className="text-gray-600">
              Check back soon for interesting articles and insights from our community
            </p>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  )
}
