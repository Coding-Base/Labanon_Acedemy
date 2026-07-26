import React, { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Search, Loader2, Calendar, User, ChevronRight, ChevronLeft, BookOpen, Megaphone, ArrowRight } from 'lucide-react'
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

function extractFirstImageSrc(content?: string) {
  if (!content) return undefined
  try {
    let m = content.match(/<img[^>]+(?:src|data-src)=['"]([^'"]+)['"]/i)
    if (m && m[1]) return m[1]
    m = content.match(/<img[^>]+(?:src|data-src)=([^\s>]+)/i)
    if (m && m[1]) return m[1].replace(/^['"]|['"]$/g, '')
    const mm = content.match(/!\[[^\]]*\]\(([^)]+)\)/)
    if (mm && mm[1]) return mm[1]
    return undefined
  } catch (err) {
    return undefined
  }
}

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
        const p = doc.createElement('p')
        p.textContent = node.textContent.trim()
        blocks.push(p)
      }
    }

    const container = doc.createElement('div')
    blocks.forEach(b => container.appendChild(b.cloneNode(true)))
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
  is_featured: boolean
  is_trending: boolean
  is_popular: boolean
}

interface BlogAd {
  id: number
  title: string
  description?: string
  badge_text?: string
  bullets?: string
  button_text?: string
  button_link: string
  image?: string
  is_active: boolean
}

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const fallbackAds = [
  {
    id: 'f1',
    title: 'WAEC Physics Formula Sheet',
    badge_text: 'FREE DOWNLOAD',
    description: 'Boost your exam score with our comprehensive physics formula sheet compiled by top-tier school tutors.',
    bullets: 'All core subjects topics, Quick reference guides, Practice tips & guidelines',
    button_text: 'Download Free',
    button_link: '/courses',
    image: ''
  },
  {
    id: 'f2',
    title: 'Certified Data Analyst Path',
    badge_text: 'SPECIAL OFFER',
    description: 'Jumpstart your tech career. Comprehensive analytics program with certification.',
    bullets: 'Python & SQL basics, Power BI & Tableau dashboards, Capstone project portfolio',
    button_text: 'Enroll Now',
    button_link: '/courses',
    image: ''
  }
]

export default function BlogPage() {
  const navigate = useNavigate()
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null)
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([])
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([])
  const [popularPosts, setPopularPosts] = useState<BlogPost[]>([])
  const [ads, setAds] = useState<BlogAd[]>([])
  const [topCategories, setTopCategories] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null, current: 1 })
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadBlogs(1)
  }, [selectedCategory, debouncedSearch])

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
      
      const processPost = (b: any) => {
        if (!b) return b
        if (b.content) {
          b.content = b.content.replace(/src=(['"])(\/[^'"]*)\1/g, `src="${BACKEND_ORIGIN}$2"`)
        }
        if (b.excerpt) {
          b.excerpt = b.excerpt.replace(/src=(['"])(\/[^'"]*)\1/g, `src="${BACKEND_ORIGIN}$2"`)
        }
        return b
      }

      // Fetch featured, trending, popular sections and active ads
      const [featRes, trendRes, popRes, adsRes] = await Promise.all([
        publicApi.get('/blog/published/?is_featured=true'),
        publicApi.get('/blog/published/?is_trending=true'),
        publicApi.get('/blog/published/?is_popular=true'),
        publicApi.get('/blog/ads/')
      ])

      // Build paginated latest/filtered articles url
      let latestUrl = `/blog/published/?page=${page}&page_size=${BLOG_PAGE_SIZE}`
      if (selectedCategory) {
        latestUrl += `&category=${encodeURIComponent(selectedCategory)}`
      }
      if (debouncedSearch) {
        latestUrl += `&search=${encodeURIComponent(debouncedSearch)}`
      }
      const latestRes = await publicApi.get(latestUrl)

      const rawFeat = featRes.data.results || featRes.data || []
      const rawTrend = trendRes.data.results || trendRes.data || []
      const rawPop = popRes.data.results || popRes.data || []
      const rawLatest = latestRes.data.results || latestRes.data || []
      const rawAds = adsRes.data.results || adsRes.data || []

      const feat = rawFeat.length > 0 ? processPost(rawFeat[0]) : null
      const trend = rawTrend.map(processPost)
      const pop = rawPop.map(processPost)
      const latest = rawLatest.map(processPost)
      const activeAds = rawAds.filter((ad: any) => ad.is_active)

      setFeaturedPost(feat || latest[0] || null)
      setTrendingPosts(trend)
      setPopularPosts(pop)
      setLatestPosts(latest)
      setAds(activeAds)

      setCurrentPage(page)
      setPageInfo({
        count: latestRes.data.count || latest.length || 0,
        next: latestRes.data.next || null,
        previous: latestRes.data.previous || null,
        current: page
      })
    } catch (err) {
      console.error('Failed to load blogs:', err)
      setLatestPosts([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleAdClick = (link: string) => {
    if (link.startsWith('http')) {
      window.open(link, '_blank', 'noopener,noreferrer')
    } else {
      navigate(link)
    }
  }

  const isFilteredOrPaginated = !!selectedCategory || !!debouncedSearch || currentPage > 1

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-20 md:pt-24 transition-colors duration-200">
      <Navbar />

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-r from-green-600 via-green-700 to-yellow-600 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-16 px-4 text-center border-b border-gray-100 dark:border-slate-800 shadow-sm"
      >
        <div className="max-w-6xl mx-auto">
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4"
          >
            LightHub Academy Blog
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-green-50 max-w-2xl mx-auto font-medium"
          >
            Discover educational tips, expert career guidance, and academic research articles.
          </motion.p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Search Bar */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-10"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles by title or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 transition-all shadow-sm text-sm"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-yellow-600 dark:text-yellow-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Content Area (8 cols) */}
            <div className="lg:col-span-8 space-y-16">
              {isFilteredOrPaginated ? (
                // Filtered results or pages 2+
                <section>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-yellow-500 rounded"></span>
                    {selectedCategory ? `Category: ${selectedCategory.toUpperCase()}` : 'Search Results'}
                  </h2>
                  
                  {latestPosts.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
                      <BookOpen className="w-16 h-16 text-gray-350 dark:text-gray-650 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">No articles matched your criteria</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try updating your filters or search keyword.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {latestPosts.map((blog) => {
                        const imgSrc = blog.image ? getImageSrc(blog.image) : extractFirstImageSrc(blog.content)
                        return (
                          <div
                            key={blog.id}
                            onClick={() => navigate(`/blog/${blog.slug}`, { state: { blog } })}
                            className="group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
                          >
                            <div>
                              {imgSrc && (
                                <div className="relative w-full aspect-video bg-gray-100 dark:bg-slate-800 overflow-hidden">
                                  <img
                                    src={getImageSrc(imgSrc)}
                                    alt={blog.title}
                                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                    loading="lazy"
                                  />
                                  {blog.category_name && (
                                    <span className="absolute top-3 left-3 bg-yellow-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow">
                                      {blog.category_name}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="p-5">
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                                  <span>{blog.author_username}</span>
                                  <span>•</span>
                                  <span>{formatDate(blog.published_at || blog.created_at)}</span>
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors line-clamp-2">
                                  {blog.title}
                                </h3>
                                <div
                                  className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.excerpt || buildExcerptHtml(blog.content)).replace(/<img[^>]*>/gi, '') }}
                                />
                              </div>
                            </div>
                            <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-slate-800/50 flex items-center justify-between text-xs text-yellow-600 dark:text-yellow-500 font-bold group-hover:text-yellow-700 dark:group-hover:text-yellow-400">
                              <span>Read Article</span>
                              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              ) : (
                // STANDARD CATEGORIZED BLOG HOMEPAGE LAYOUT
                <div className="space-y-16">
                  
                  {/* 1. Featured Article (Big Header) */}
                  {featuredPost && (
                    <section>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-yellow-500 rounded"></span>
                        Featured Article
                      </h2>
                      <div
                        onClick={() => navigate(`/blog/${featuredPost.slug}`, { state: { blog: featuredPost } })}
                        className="group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-850 p-6 md:p-8 hover:shadow-xl transition-all duration-300 cursor-pointer"
                      >
                        <div className="lg:col-span-7 relative w-full aspect-video lg:aspect-auto lg:h-[350px] bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
                          {(() => {
                            const src = featuredPost.image ? getImageSrc(featuredPost.image) : extractFirstImageSrc(featuredPost.content)
                            return src ? (
                              <img
                                src={getImageSrc(src)}
                                alt={featuredPost.title}
                                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400"><BookOpen className="w-12 h-12" /></div>
                            )
                          })()}
                          {featuredPost.category_name && (
                            <span className="absolute top-4 left-4 bg-yellow-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shadow">
                              {featuredPost.category_name}
                            </span>
                          )}
                        </div>
                        <div className="lg:col-span-5 flex flex-col justify-between h-full py-2">
                          <div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-450 mb-3 font-semibold">
                              <span>By {featuredPost.author_username}</span>
                              <span>•</span>
                              <span>{formatDate(featuredPost.published_at || featuredPost.created_at)}</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors mb-4">
                              {featuredPost.title}
                            </h3>
                            <div
                              className="text-sm text-gray-650 dark:text-gray-350 line-clamp-4 leading-relaxed mb-6"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(featuredPost.excerpt || buildExcerptHtml(featuredPost.content)).replace(/<img[^>]*>/gi, '') }}
                            />
                          </div>
                          <button className="flex items-center gap-2 px-6 py-3 bg-yellow-600 dark:bg-yellow-600 text-white font-bold rounded-xl text-xs hover:shadow-lg transition-all w-max">
                            Read Full Article
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* 2. Trending This Week (3-Column Grid) */}
                  {trendingPosts.length > 0 && (
                    <section>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-yellow-500 rounded"></span>
                        Trending This Week
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {trendingPosts.slice(0, 4).map((blog) => {
                          const imgSrc = blog.image ? getImageSrc(blog.image) : extractFirstImageSrc(blog.content)
                          return (
                            <div
                              key={blog.id}
                              onClick={() => navigate(`/blog/${blog.slug}`, { state: { blog } })}
                              className="group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
                            >
                              <div>
                                {imgSrc && (
                                  <div className="relative w-full aspect-video bg-gray-100 dark:bg-slate-800 overflow-hidden">
                                    <img
                                      src={getImageSrc(imgSrc)}
                                      alt={blog.title}
                                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                      loading="lazy"
                                    />
                                    {blog.category_name && (
                                      <span className="absolute top-3 left-3 bg-yellow-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow">
                                        {blog.category_name}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="p-5">
                                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mb-2 font-semibold">
                                    <span>{blog.author_username}</span>
                                    <span>•</span>
                                    <span>{formatDate(blog.published_at || blog.created_at)}</span>
                                  </div>
                                  <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors line-clamp-2">
                                    {blog.title}
                                  </h3>
                                  <div
                                    className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.excerpt || buildExcerptHtml(blog.content)).replace(/<img[^>]*>/gi, '') }}
                                  />
                                </div>
                              </div>
                              <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-slate-800/50 flex items-center justify-between text-xs text-yellow-600 dark:text-yellow-500 font-bold group-hover:text-yellow-700 dark:group-hover:text-yellow-400">
                                <span>Read Article</span>
                                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {/* 3. Popular Articles Carousel */}
                  {popularPosts.length > 0 && (
                    <section>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-yellow-500 rounded"></span>
                        Popular Articles
                      </h2>
                      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin snap-x scroll-smooth">
                        {popularPosts.map((blog) => {
                          const imgSrc = blog.image ? getImageSrc(blog.image) : extractFirstImageSrc(blog.content)
                          return (
                            <div
                              key={blog.id}
                              onClick={() => navigate(`/blog/${blog.slug}`, { state: { blog } })}
                              className="min-w-[280px] md:min-w-[340px] max-w-[340px] snap-start group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer flex flex-col justify-between"
                            >
                              <div>
                                {imgSrc && (
                                  <div className="relative w-full aspect-video bg-gray-100 dark:bg-slate-800 overflow-hidden">
                                    <img
                                      src={getImageSrc(imgSrc)}
                                      alt={blog.title}
                                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                      loading="lazy"
                                    />
                                    {blog.category_name && (
                                      <span className="absolute top-3 left-3 bg-yellow-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow">
                                        {blog.category_name}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="p-5">
                                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mb-2 font-semibold">
                                    <span>{blog.author_username}</span>
                                    <span>•</span>
                                    <span>{formatDate(blog.published_at || blog.created_at)}</span>
                                  </div>
                                  <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors line-clamp-2">
                                    {blog.title}
                                  </h3>
                                </div>
                              </div>
                              <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-slate-800/50 flex items-center justify-between text-xs text-yellow-600 dark:text-yellow-500 font-bold group-hover:text-yellow-700 dark:group-hover:text-yellow-400">
                                <span>Read Article</span>
                                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )}

                  {/* 4. Latest Articles list */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-yellow-500 rounded"></span>
                      Latest Articles
                    </h2>
                    
                    {latestPosts.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No articles found in this category.</p>
                    ) : (
                      <div className="space-y-6">
                        {latestPosts.map((blog) => {
                          const imgSrc = blog.image ? getImageSrc(blog.image) : extractFirstImageSrc(blog.content)
                          return (
                            <div
                              key={blog.id}
                              onClick={() => navigate(`/blog/${blog.slug}`, { state: { blog } })}
                              className="group bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col sm:flex-row gap-5 items-center"
                            >
                              {imgSrc && (
                                <div className="relative w-full sm:w-48 shrink-0 aspect-[4/3] bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner">
                                  <img
                                    src={getImageSrc(imgSrc)}
                                    alt={blog.title}
                                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                              <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mb-2 font-semibold">
                                    {blog.category_name && (
                                      <span className="text-yellow-600 dark:text-yellow-500 font-extrabold uppercase tracking-wide mr-2">
                                        {blog.category_name}
                                      </span>
                                    )}
                                    <span>By {blog.author_username}</span>
                                    <span>•</span>
                                    <span>{formatDate(blog.published_at || blog.created_at)}</span>
                                  </div>
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors mb-2">
                                    {blog.title}
                                  </h3>
                                  <div
                                    className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.excerpt || buildExcerptHtml(blog.content)).replace(/<img[^>]*>/gi, '') }}
                                  />
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500 font-bold group-hover:gap-3 transition-all">
                                  <span>Read Full Article</span>
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>

            {/* Right Sidebar (4 cols) */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
              {/* Category Widget */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-gray-250 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-3 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Top Categories
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition ${
                      !selectedCategory
                        ? 'bg-yellow-600 text-white shadow-sm'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>All Posts</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${!selectedCategory ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                      {pageInfo.count || latestPosts.length}
                    </span>
                  </button>
                  {topCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.slug || selectedCategory === cat.name
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition ${
                          isSelected
                            ? 'bg-yellow-600 text-white shadow-sm'
                            : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}`}>
                          {cat.blogs_count || 0}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Ads Banners */}
              {(ads.length > 0 ? ads : fallbackAds).map((ad: any) => (
                <motion.div
                  key={ad.id}
                  whileHover={{ y: -5 }}
                  className="relative group bg-gradient-to-br from-yellow-50/50 to-green-50/30 dark:from-slate-900/60 dark:to-slate-900/20 border border-yellow-250 dark:border-yellow-900/35 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col justify-between transition-colors"
                >
                  <div>
                    {ad.badge_text && (
                      <span className="inline-block bg-yellow-600 dark:bg-yellow-500 text-white text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full mb-4 shadow-sm">
                        {ad.badge_text}
                      </span>
                    )}
                    
                    <h4 className="text-base font-extrabold text-slate-855 dark:text-slate-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                      {ad.title}
                    </h4>
                    
                    {ad.description && (
                      <p className="text-xs text-slate-650 dark:text-slate-350 mt-2 leading-relaxed">
                        {ad.description}
                      </p>
                    )}

                    {ad.bullets && (
                      <ul className="my-4 space-y-2">
                        {ad.bullets.split(',').map((bullet: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <span className="text-green-600 dark:text-green-455 font-bold shrink-0 text-sm">✓</span>
                            <span>{bullet.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {ad.image && (
                      <div className="w-full h-32 rounded-lg overflow-hidden my-4 shadow-inner">
                        <img src={getImageSrc(ad.image)} alt={ad.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleAdClick(ad.button_link)}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 dark:from-yellow-600 dark:to-yellow-500 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold rounded-xl text-xs hover:shadow-md transition-all text-center flex items-center justify-center gap-2"
                  >
                    <span>{ad.button_text || 'Enroll Now'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </aside>
          </div>
        )}

        {/* Pagination Bar */}
        {(pageInfo.count > BLOG_PAGE_SIZE || pageInfo.next || pageInfo.previous) && (
          <div className="mt-12 flex flex-col gap-3 items-center justify-between sm:flex-row bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-gray-650 dark:text-gray-400 font-semibold">Page {currentPage} of {Math.max(1, Math.ceil(pageInfo.count / BLOG_PAGE_SIZE))}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  loadBlogs(Math.max(1, currentPage - 1))
                  window.scrollTo({ top: 400, behavior: 'smooth' })
                }}
                disabled={!pageInfo.previous}
                className={`px-4 py-2 rounded-lg font-bold transition text-xs flex items-center gap-1 ${
                  pageInfo.previous
                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-250 dark:hover:bg-slate-700'
                    : 'bg-gray-50 dark:bg-slate-900/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => {
                  loadBlogs(currentPage + 1)
                  window.scrollTo({ top: 400, behavior: 'smooth' })
                }}
                disabled={!pageInfo.next}
                className={`px-4 py-2 rounded-lg font-bold transition text-xs flex items-center gap-1 ${
                  pageInfo.next
                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-250 dark:hover:bg-slate-700'
                    : 'bg-gray-50 dark:bg-slate-900/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}


