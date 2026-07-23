import React, { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Search, Loader2, Calendar, User, ChevronRight, Heart, MessageCircle, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import useDebounce from '../utils/useDebounce'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000/api'
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '')
const BLOG_PAGE_SIZE = 10

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
  category_name?: string
  category_slug?: string
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
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null, current: 1 })
  const [topCategories, setTopCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadBlogs(1)
  }, [selectedCategory])

  async function loadCategories() {
    try {
      const publicApi = axios.create({ baseURL: API_BASE })
      const res = await publicApi.get('/blog/categories/top/')
      setTopCategories(Array.isArray(res.data) ? res.data : [])
    } catch (e) {}
  }

  async function loadBlogs(page = 1) {
    setLoading(true)
    try {
      const publicApi = axios.create({ baseURL: API_BASE })
      let url = `/blog/published/?page=${page}&page_size=${BLOG_PAGE_SIZE}`
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }
      const response = await publicApi.get(url)
      
      const rawBlogs = Array.isArray(response.data.results) ? response.data.results : Array.isArray(response.data) ? response.data : []
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
      setCurrentPage(page)
      setPageInfo({
        count: response.data.count || blogsData.length || 0,
        next: response.data.next || null,
        previous: response.data.previous || null,
        current: page
      })
    } catch (err) {
      console.error('Failed to load blogs:', err)
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }

  const filteredBlogs = blogs.filter(blog => {
    if (!debouncedSearch) return true
    const title = (blog.title || '').toLowerCase()
    const excerpt = (blog.excerpt || '').toLowerCase()
    const catName = (blog.category_name || '').toLowerCase()
    const search = debouncedSearch.toLowerCase()
    return title.includes(search) || excerpt.includes(search) || catName.includes(search)
  })


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-20 md:pt-24">
      <Navbar />
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

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Search & Filter Bar */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-8 flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles by title, content, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all shadow-sm"
            />
          </div>

          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="px-4 py-3.5 bg-yellow-100 text-yellow-800 font-semibold rounded-xl hover:bg-yellow-200 transition text-sm flex items-center justify-center gap-2"
            >
              Clear Filter: {selectedCategory} ✕
            </button>
          )}
        </motion.div>

        {/* Main Content Area with Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Main Feed (3 Columns) */}
          <div className="lg:col-span-3">
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
                className="text-center py-20 bg-white rounded-2xl border border-gray-200"
              >
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedCategory ? 'Try adjusting your search or category filter' : 'Check back soon for new content'}
                </p>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="px-5 py-2.5 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition"
                  >
                    View All Categories
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBlogs.map((blog) => {
                  const imgSrc = blog.image ? getImageSrc(blog.image) : undefined
                  return (
                    <div
                      key={blog.id}
                      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 flex flex-col"
                      onClick={() => navigate(`/blog/${blog.slug}`, { state: { blog } })}
                    >
                      {/* Featured Image */}
                      {imgSrc && (
                        <div className="relative w-full bg-gradient-to-br from-green-400 to-yellow-500 overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
                          <img
                            src={imgSrc}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {blog.category_name && (
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                              {blog.category_name}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(blog.published_at || blog.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {blog.author_username}
                          </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors line-clamp-2">
                          {blog.title}
                        </h2>

                        {/* Excerpt */}
                        <div
                          className="text-xs text-gray-600 mb-4 line-clamp-3 flex-1"
                          dangerouslySetInnerHTML={{ __html: (() => {
                            const raw = (blog.excerpt && blog.excerpt.trim()) ? blog.excerpt : buildExcerptHtml(blog.content || '')
                            const sanitized = DOMPurify.sanitize(raw || '')
                            return sanitized.replace(/<img[^>]*>/gi, '')
                          })() }}
                        />

                        {/* Read More Link */}
                        <div className="flex items-center gap-2 text-sm text-green-600 font-semibold group-hover:gap-3 transition-all pt-3 border-t border-gray-100 mt-auto">
                          <span>Read full article</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar - Top 5 Categories Widget */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 sticky top-28">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                Top Categories
              </h3>

              {topCategories.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No categories created yet.</p>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition ${
                      !selectedCategory
                        ? 'bg-yellow-500 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>All Posts</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${!selectedCategory ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {pageInfo.count || blogs.length}
                    </span>
                  </button>

                  {topCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.slug || selectedCategory === cat.name
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-yellow-500 text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {cat.blogs_count || 0}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {(pageInfo.count > BLOG_PAGE_SIZE || pageInfo.next || pageInfo.previous) && (
          <div className="mt-8 flex flex-col gap-3 items-center justify-between sm:flex-row bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 font-medium">Page {currentPage} of {Math.max(1, Math.ceil(pageInfo.count / BLOG_PAGE_SIZE))}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadBlogs(Math.max(1, currentPage - 1))}
                disabled={!pageInfo.previous}
                className={`px-4 py-2 rounded-lg font-medium transition text-sm ${pageInfo.previous ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
              >
                Previous
              </button>
              <button
                onClick={() => loadBlogs(currentPage + 1)}
                disabled={!pageInfo.next}
                className={`px-4 py-2 rounded-lg font-medium transition text-sm ${pageInfo.next ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

