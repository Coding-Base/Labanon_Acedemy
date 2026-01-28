// src/shared/CoursesList.tsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ShoppingCart, ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

// Curated list of high-quality Unsplash images for education/tech
const PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60', // Digital/Laptop
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=60', // Study/Coffee
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=60', // Library/Books
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60', // Writing/Notes
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60', // Group Study
  'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&auto=format&fit=crop&q=60', // Notes/Clean
  'https://images.unsplash.com/photo-1513258496098-882605922721?w=800&auto=format&fit=crop&q=60', // Abstract/Geometry
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop&q=60'  // White Book
]

type Course = {
  id: number
  title: string
  description: string
  price: string
  slug?: string
  image?: string
  isDiploma?: boolean
}

export default function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(9)
  const [count, setCount] = useState(0)
  
  // URL Params hook to read 'search' from URL
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Initialize search state from URL param
  const [search, setSearch] = useState(searchParams.get('search') || '')
  
  const [loading, setLoading] = useState(false)
  const [addingIds, setAddingIds] = useState<number[]>([])

  // Sync state with URL params if they change externally (e.g. navigation)
  useEffect(() => {
    const query = searchParams.get('search') || ''
    if (query !== search) {
        setSearch(query)
        setPage(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  async function load() {
    setLoading(true)
    try {
      // fetch courses
      const [coursesRes, diplomasRes] = await Promise.all([
        axios.get(`${API_BASE}/courses/`, { params: { page, page_size: pageSize, search } }),
        axios.get(`${API_BASE}/diplomas/`, { params: { page, page_size: pageSize, search } }),
      ])

      const courseResults = coursesRes.data.results || []
      const diplomaResults = (diplomasRes.data.results || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        price: d.price,
        image: d.image,
        isDiploma: true,
      }))

      const merged = [...courseResults, ...diplomaResults]
      setCourses(merged)
      // approximate count as combined count (backend pagination differs), fall back to courses count
      setCount((coursesRes.data.count || 0) + (diplomasRes.data.count || 0))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Handle typing in search box
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    setPage(1)
    // Update URL query param to reflect local state (optional but good UX)
    setSearchParams(val ? { search: val } : {})
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  function normalizeSrc(src?: string) {
    if (!src) return null
    try {
      let s = src.trim()
      if (s.startsWith('http://') || s.startsWith('https://')) return s
      s = s.replace(/(\/media\/)+/g, '/media/')
      if (s.startsWith('media/')) s = `/${s}`
      if (!s.startsWith('/')) s = `/${s}`
      return s
    } catch (e) {
      return src
    }
  }

  function resolveImage(src?: string) {
    if (!src) return null
    if (src.startsWith('http://') || src.startsWith('https://')) return src
    const normalized = normalizeSrc(src)
    if (!normalized) return null
    const siteBase = API_BASE.replace(/\/api\/?$/, '')
    return `${siteBase}${normalized}`
  }

  // Deterministic placeholder based on ID
  function getCourseImage(course: Course) {
    const resolved = resolveImage(course.image)
    if (resolved) return resolved
    // Use modulo to pick a placeholder consistently based on ID
    return PLACEHOLDERS[course.id % PLACEHOLDERS.length]
  }

  const handleAddToCart = async (e: React.MouseEvent, c: Course) => {
    e.preventDefault()
    e.stopPropagation()
    
    const token = localStorage.getItem('access')
    if (!token) { 
      window.location.href = `/register?next=/marketplace/${c.id}`
      return 
    }
    
    if (addingIds.includes(c.id)) return
    setAddingIds((cur) => [...cur, c.id])
    
    try {
      const res = await fetch(`${API_BASE}/cart/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: c.id }),
      })
      if (!res.ok) throw new Error('Failed')
      alert('Added to cart')
    } catch (err) {
      console.error(err)
      alert('Failed to add to cart')
    } finally {
      setAddingIds((cur) => cur.filter((id) => id !== c.id))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Explore Courses</h2>
          <p className="text-gray-500 mt-1">Find the perfect course to upgrade your skills.</p>
        </div>
        
        <div className="relative w-full md:w-72 lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition duration-150 ease-in-out" 
            placeholder="Search courses (e.g. Python, Business)..." 
            value={search} 
            onChange={handleSearchChange} 
          />
        </div>
      </div>

      {loading ? (
        // Skeleton Loader Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-xl p-4 bg-white shadow-sm animate-pulse">
              <div className="bg-gray-200 h-48 w-full rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex justify-between items-center mt-auto">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {courses.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
              <p className="text-gray-500">Try adjusting your search terms.</p>
            </div>
          ) : (
            // Course Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <Link 
                  key={c.id} 
                  to={c.isDiploma ? `/diploma/${c.id}` : `/marketplace/${c.id}`} 
                  className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image Section */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img 
                      src={getCourseImage(c)} 
                      alt={c.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-5 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-700 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                      {c.description}
                    </p>
                    
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Price</p>
                        <p className="text-xl font-bold text-gray-900">₦{c.price}</p>
                      </div>
                      
                      <button
                        onClick={(e) => handleAddToCart(e, c)}
                        disabled={addingIds.includes(c.id)}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                          ${addingIds.includes(c.id) 
                            ? 'bg-brand-100 text-green-700 cursor-not-allowed' 
                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow'
                          }
                        `}
                      >
                        {addingIds.includes(c.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <div className="text-sm text-gray-600">
                Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={page <= 1} 
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </button>
                <button 
                  className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={page >= totalPages} 
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}