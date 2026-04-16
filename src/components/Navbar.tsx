import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react'
import SearchInput from './SearchInput'
import labanonLogo from '../pages/labanonlogo.png'

// Explore categories data
const EXPLORE_CATEGORIES = [
  {
    id: 'institutions',
    label: 'Browse Institutions',
    subcategories: [
      'All Institutions', 'Universities', 'Online Schools', 'Training Centers',
      'Corporate Training', 'Professional Development', 'Certification Programs'
    ],
    route: '/institutions'
  },
  {
    id: 'roles',
    label: 'Explore roles',
    subcategories: [
      'Data Analyst', 'Project Manager', 'Cyber Security Analyst', 'Data Scientist',
      'Business Intelligence Analyst', 'Digital Marketing Specialist',
      'UI / UX Designer', 'Machine Learning Engineer', 'Social Media Specialist'
    ]
  },
  {
    id: 'categories',
    label: 'Explore categories',
    subcategories: [
      'Artificial Intelligence', 'Business', 'Data Science', 'Information Technology',
      'Computer Science', 'Healthcare', 'Physical Science and Engineering',
      'Personal Development', 'Social Sciences', 'Language Learning', 'Arts and Humanities'
    ]
  },
  {
    id: 'trending',
    label: 'Trending skills',
    subcategories: [
      'Python', 'Artificial Intelligence', 'Excel', 'Machine Learning',
      'SQL', 'Project Management', 'Power BI', 'Marketing'
    ]
  },
  {
    id: 'certificate',
    label: 'Earn a professional certificate',
    subcategories: [
      'Business', 'Computer Science', 'Data Science', 'Information Technology'
    ]
  },
  {
    id: 'degree',
    label: 'Earn an online degree',
    subcategories: [
      "Bachelor's Degrees", "Master's Degrees", "Postgraduate Programs"
    ]
  },
  {
    id: 'exam',
    label: 'Prepare for a certification exam',
    subcategories: [
      'IELTS', 'TOEFL', 'PMP', 'CompTIA', 'AWS Certified', 'Cisco CCNA'
    ]
  }
]

const NAV_ITEMS = [
  { label: 'Courses', path: '/marketplace' },
  { label: 'CBT Practice', path: '/register' },
  { label: 'Interview Questions', path: '/register' },
  { label: 'Reviews', path: '/reviews' },
  { label: 'Blog', path: '/blog' },
  { label: 'Documentation', path: '/documentation' },
  { label: 'About', path: '/about' },
  { label: 'Find a Tutor', path: '/online-tutorial-for-student-application' },
]

interface NavbarProps {
  showBackButton?: boolean
}

export default function Navbar({ showBackButton = false }: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false)
  const [activeExploreCategory, setActiveExploreCategory] = useState<string>(EXPLORE_CATEGORIES[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const exploreMenuRef = useRef<HTMLDivElement>(null)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setExploreMenuOpen(false)
  }, [location])

  // Close explore menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exploreMenuRef.current && !exploreMenuRef.current.contains(e.target as Node)) {
        setExploreMenuOpen(false)
      }
    }
    if (exploreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [exploreMenuOpen])

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleSubCategoryClick = (subCategory: string, categoryId?: string) => {
    setExploreMenuOpen(false)
    setMobileMenuOpen(false)

    const category = EXPLORE_CATEGORIES.find(c => c.id === categoryId)
    if (category && 'route' in category && category.route) {
      navigate(category.route)
    } else {
      navigate(`/marketplace?search=${encodeURIComponent(subCategory)}`)
    }
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Left: Logo & Explore Button */}
          <div className="flex items-center gap-2 md:gap-6">
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                ←
              </button>
            )}

            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <img src={labanonLogo} alt="LightHub Academy logo" width={40} height={40} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              <div className="ml-2 mr-2 sm:mr-0">
                <h1 className="text-sm sm:text-base md:text-xl font-serif font-semibold text-brand-700 leading-none">
                  LightHub Academy
                </h1>
              </div>
            </Link>

            {/* Desktop Explore Button */}
            <div className="hidden md:block relative" ref={exploreMenuRef}>
              <button
                onClick={() => setExploreMenuOpen(!exploreMenuOpen)}
                className={`explore-btn flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  exploreMenuOpen ? 'bg-brand-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                <Menu className="w-5 h-5" />
                <span>Explore</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${exploreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Explore Mega Menu Dropdown */}
              <AnimatePresence>
                {exploreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="explore-menu-container absolute top-full left-0 mt-2 w-[800px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                  >
                    <div className="grid grid-cols-12 h-[500px]">
                      {/* Left Column: Categories */}
                      <div className="col-span-4 bg-gray-50 border-r border-gray-100 py-2 overflow-y-auto">
                        {EXPLORE_CATEGORIES.map(cat => (
                          <div
                            key={cat.id}
                            onMouseEnter={() => setActiveExploreCategory(cat.id)}
                            className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors text-sm font-medium ${
                              activeExploreCategory === cat.id
                                ? 'bg-white text-brand-700 border-l-4 border-brand-600'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {cat.label}
                            {activeExploreCategory === cat.id && <ChevronRight className="w-4 h-4" />}
                          </div>
                        ))}
                      </div>
                      {/* Right Column: Subcategories */}
                      <div className="col-span-8 p-6 overflow-y-auto">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                          {EXPLORE_CATEGORIES.find(c => c.id === activeExploreCategory)?.label}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {EXPLORE_CATEGORIES.find(c => c.id === activeExploreCategory)?.subcategories.map(sub => (
                            <div
                              key={sub}
                              onClick={() => handleSubCategoryClick(sub, activeExploreCategory)}
                              className="text-sm text-gray-600 hover:text-brand-600 cursor-pointer p-2 hover:bg-brand-50 rounded transition-colors"
                            >
                              {sub}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4 relative">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onDebounced={() => {}}
              onEnter={handleSearchSubmit}
              placeholder="What do you want to learn?"
              className="w-full"
            />
            <button
              onClick={handleSearchSubmit}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-brand-600 rounded-full text-white hover:bg-brand-700 transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Actions & Nav Links */}
          <div className="flex items-center gap-3">
            {/* Desktop Nav Items */}
            <div className="hidden xl:flex items-center gap-4 mr-2">
              {NAV_ITEMS.slice(0, 3).map(item => (
                <Link key={item.label} to={item.path} className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-300 hidden xl:block mx-1"></div>

            <Link to="/login" className="hidden md:inline px-4 py-2 text-gray-700 hover:text-brand-600 font-medium text-sm">
              Log In
            </Link>
            <Link to="/register" className="px-3 py-1.5 bg-brand-700 text-white rounded-lg font-semibold text-sm hover:bg-brand-800 transition-colors shadow-md">
              Join for Free
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSearchSubmit()
                }}
                className="relative"
              >
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onEnter={handleSearchSubmit}
                  placeholder="Search..."
                  className="w-full"
                />
              </form>

              <div className="space-y-1">
                <div className="font-semibold text-gray-900 px-2 py-2">Explore</div>
                {EXPLORE_CATEGORIES.map(cat => (
                  <div key={cat.id} className="border-l-2 border-gray-200 ml-2 pl-4 py-1">
                    <div className="font-medium text-gray-700 text-sm mb-1">{cat.label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {cat.subcategories.slice(0, 4).map(sub => (
                        <div
                          key={sub}
                          onClick={() => {
                            setMobileMenuOpen(false)
                            handleSubCategoryClick(sub, cat.id)
                          }}
                          className="text-xs text-gray-500 truncate cursor-pointer"
                        >
                          {sub}
                        </div>
                      ))}
                    </div>
                    <div
                      onClick={() => {
                        setMobileMenuOpen(false)
                        navigate('/marketplace')
                      }}
                      className="text-xs text-brand-700 mt-1 cursor-pointer"
                    >
                      View all...
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="block text-gray-700 font-medium hover:text-brand-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/login"
                  className="block text-brand-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
