import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, ArrowRight, Building2, Star } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { setSEOTags, setCanonicalURL, addStructuredData, getEducationalOrganizationSchema } from '../utils/seoUtils'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Portfolio {
  id: number
  title: string
  description: string
  overview: string
  image: string
  website: string
  location: string
  phone: string
  email: string
  published: boolean
  public_token: string
  institution_name: string
  institution: number
}

export default function InstitutionPortfolios() {
  const navigate = useNavigate()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // SEO Optimization
  useEffect(() => {
    setSEOTags({
      title: 'Student Institutions & Portfolios',
      description: 'Explore verified educational institutions and student portfolios. Discover verified tutors and institutions offering quality education.',
      keywords: 'institutions, portfolios, tutors, educational organizations, student portfolios, verified institutions',
      type: 'website',
      url: window.location.href
    })
    setCanonicalURL(window.location.href)
    
    // Add structured data for rich snippets
    addStructuredData({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Educational Institutions',
      description: 'Verified educational institutions and portfolios',
      url: window.location.href,
      publisher: getEducationalOrganizationSchema()
    })
  }, [])

  // Fetch all published portfolios (public endpoint - no auth required)
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setLoading(true)
        // Create a public axios instance without interceptors for public endpoints
        const publicApi = axios.create({ baseURL: API_BASE })
        const response = await publicApi.get(`/portfolios/`, {
          params: { published: true }
        })
        // Filter only published portfolios
        const publishedPortfolios = response.data.filter((p: Portfolio) => p.published)
        setPortfolios(publishedPortfolios)
      } catch (error) {
        console.error('Failed to fetch portfolios:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolios()
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter portfolios based on search
  const filteredPortfolios = useMemo(() => {
    if (!debouncedQuery.trim()) return portfolios

    const query = debouncedQuery.toLowerCase()
    return portfolios.filter(
      (portfolio) =>
        portfolio.institution_name.toLowerCase().includes(query) ||
        portfolio.title.toLowerCase().includes(query) ||
        portfolio.location.toLowerCase().includes(query) ||
        portfolio.overview.toLowerCase().includes(query) ||
        portfolio.description.toLowerCase().includes(query)
    )
  }, [portfolios, debouncedQuery])

  // Extract short description (first 150 chars of overview or description)
  const getShortDescription = (portfolio: Portfolio) => {
    const text = portfolio.overview || portfolio.description || ''
    // Remove HTML tags if present
    const cleanText = text.replace(/<[^>]*>/g, '')
    return cleanText.length > 150 ? cleanText.substring(0, 150) + '...' : cleanText
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-white py-16 px-4 mt-16 md:mt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center gap-4 mb-4">
            <Building2 className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Institution Portfolios</h1>
          </div>
          <p className="text-lg text-yellow-100 max-w-3xl">
            Explore verified institutions and their educational programs. Discover excellence in learning from organizations across the globe.
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-12"
        >
          <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by institution name, location, or program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg outline-none bg-transparent"
            />
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </motion.button>
            )}
          </div>
          {debouncedQuery && (
            <p className="mt-2 text-sm text-slate-600">
              Found {filteredPortfolios.length} institutions matching "{debouncedQuery}"
            </p>
          )}
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mb-4" />
            <p className="text-slate-600 text-lg">Loading institutions...</p>
          </div>
        ) : filteredPortfolios.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            {portfolios.length === 0 ? (
              <>
                <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-700 mb-2">No Institutions Yet</h3>
                <p className="text-slate-600 mb-6">
                  Be the first to register your institution portfolio!
                </p>
              </>
            ) : (
              <>
                <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-700 mb-2">
                  No Results Found
                </h3>
                <p className="text-slate-600 mb-6">
                  Try refining your search with different keywords.
                </p>
              </>
            )}
            <button
              onClick={() => setSearchQuery('')}
              className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Clear Search
            </button>
          </motion.div>
        ) : (
          <>
            {/* Portfolio Cards Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
            >
              <AnimatePresence>
                {filteredPortfolios.map((portfolio, index) => (
                  <motion.div
                    key={portfolio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
                  >
                    {/* Card Image */}
                    <div className="relative h-48 bg-gradient-to-br from-yellow-200 to-slate-200 overflow-hidden">
                      {portfolio.image ? (
                        <img
                          src={portfolio.image}
                          alt={portfolio.institution_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-50">
                          <Building2 className="w-16 h-16 text-yellow-300 opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      {/* Institution Name */}
                      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                        {portfolio.institution_name}
                      </h3>

                      {/* Title */}
                      {portfolio.title && (
                        <p className="text-xs font-semibold text-yellow-600 mb-2 line-clamp-1">
                          {portfolio.title}
                        </p>
                      )}

                      {/* Location */}
                      {portfolio.location && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-1">
                          📍 {portfolio.location}
                        </p>
                      )}

                      {/* Short Description */}
                      <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                        {getShortDescription(portfolio)}
                      </p>

                      {/* Footer with Stats */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-slate-600">Verified</span>
                        </div>

                        {/* See More Button */}
                        <button
                          onClick={() =>
                            navigate(`/portfolio/${portfolio.public_token}`)
                          }
                          className="inline-flex items-center gap-1 text-yellow-600 hover:text-yellow-700 font-semibold text-sm transition-colors"
                        >
                          See More <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {/* Registration CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-yellow-50 via-white to-yellow-50 rounded-2xl border-2 border-yellow-200 p-12 text-center mb-8"
        >
          <div className="max-w-2xl mx-auto">
            <Building2 className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-slate-900 mb-3">
              Want to Showcase Your Institution?
            </h3>
            <p className="text-lg text-slate-700 mb-8">
              Register your institution on LightHub Academy and reach students worldwide. 
              Create a professional portfolio, manage courses, and track student progress 
              all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register?from=institutions')}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg"
              >
                Register Your Institution <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/documentation')}
                className="inline-flex items-center justify-center gap-2 border-2 border-yellow-600 text-yellow-600 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-50 transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
        </motion.section>

        {/* Additional Info Section */}
        {filteredPortfolios.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Why Choose LightHub Academy?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Global Reach',
                  description: 'Connect with students from around the world'
                },
                {
                  title: 'Easy Management',
                  description: 'Manage courses, students, and payments effortlessly'
                },
                {
                  title: 'Analytics',
                  description: 'Track student progress and course performance'
                }
              ].map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      <Footer />
    </div>
  )
}
