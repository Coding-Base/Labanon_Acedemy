import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { ChevronRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000/api'
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

function getImageSrc(img?: string) {
  if (!img) return undefined
  if (img.startsWith('http') || img.startsWith('data:')) return img
  if (img.startsWith('/')) return `${BACKEND_ORIGIN}${img}`
  return `${BACKEND_ORIGIN}/${img}`
}

interface BlogAd {
  id: string | number
  title: string
  description?: string
  badge_text?: string
  bullets?: string
  button_text?: string
  button_link: string
  image?: string
  is_active?: boolean
}

const fallbackAds: BlogAd[] = [
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

interface BlogAdCardsProps {
  /** Pre-fetched ads (from parent). If not provided, component fetches its own. */
  ads?: BlogAd[]
  /** Layout mode: 'vertical' for sidebar column, 'horizontal' for grid row */
  layout?: 'vertical' | 'horizontal'
  /** Whether to show the section header */
  showHeader?: boolean
}

export default function BlogAdCards({ ads: externalAds, layout = 'vertical', showHeader = true }: BlogAdCardsProps) {
  const navigate = useNavigate()
  const [internalAds, setInternalAds] = useState<BlogAd[]>([])
  const [loaded, setLoaded] = useState(false)

  // If no external ads provided, self-fetch
  useEffect(() => {
    if (externalAds !== undefined) {
      setLoaded(true)
      return
    }
    let mounted = true
    ;(async () => {
      try {
        const res = await axios.get(`${API_BASE}/blog/ads/`)
        const activeAds = (res.data?.results || res.data || []).filter((ad: any) => ad.is_active)
        if (mounted) {
          setInternalAds(activeAds)
          setLoaded(true)
        }
      } catch {
        if (mounted) setLoaded(true)
      }
    })()
    return () => { mounted = false }
  }, [externalAds])

  const displayAds = externalAds !== undefined
    ? (externalAds.length > 0 ? externalAds : fallbackAds)
    : (internalAds.length > 0 ? internalAds : fallbackAds)

  const handleAdClick = (link: string) => {
    if (link.startsWith('http')) {
      window.open(link, '_blank', 'noopener,noreferrer')
    } else {
      navigate(link)
    }
  }

  if (!loaded && externalAds === undefined) return null

  const isHorizontal = layout === 'horizontal'

  return (
    <div className={isHorizontal ? 'w-full' : ''}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <h3 className={`font-bold text-slate-800 dark:text-slate-100 ${isHorizontal ? 'text-lg' : 'text-sm uppercase tracking-wider'}`}>
            {isHorizontal ? 'Recommended For You' : 'Sponsored'}
          </h3>
        </div>
      )}

      <div className={
        isHorizontal
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-6'
      }>
        {displayAds.map((ad) => (
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
      </div>
    </div>
  )
}
