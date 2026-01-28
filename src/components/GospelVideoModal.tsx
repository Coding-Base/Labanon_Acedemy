import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import api from '../utils/axiosInterceptor'

interface Gospel {
  id: number
  youtube_url: string
  scheduled_time: string
  title: string
  description: string
  is_active: boolean
}

export default function GospelVideoModal() {
  const [gospel, setGospel] = useState<Gospel | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const checkAndShowGospel = async () => {
      try {
        // Fetch current gospel video
        const res = await api.get('/gospel-videos/current/')
        if (!res.data) return

        const video = res.data
        setGospel(video)

        const today = new Date().toDateString()

        // Check per-video seen state in localStorage (so different videos can show same day)
        let lastSeen = null
        try {
          const raw = localStorage.getItem('gospel_last_seen')
          lastSeen = raw ? JSON.parse(raw) : null
        } catch (e) {
          lastSeen = null
        }

        if (lastSeen && lastSeen.id === video.id && lastSeen.date === today) {
          // already seen this video today
          return
        }

        // Parse scheduled time (supports "HH:MM" or "HH:MM:SS")
        const parts = String(video.scheduled_time).split(':').map(Number)
        const schedHour = parts[0] ?? 0
        const schedMinute = parts[1] ?? 0

        const now = new Date()

        // Build scheduled times both as local and as UTC to be tolerant of server timezone
        const scheduledLocal = new Date(now)
        scheduledLocal.setHours(schedHour, schedMinute, 0, 0)

        const scheduledUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), schedHour, schedMinute, 0))

        // Show if current time >= scheduledLocal OR current time >= scheduledUTC
        if (now.getTime() >= scheduledLocal.getTime() || now.getTime() >= scheduledUTC.getTime()) {
          setShowModal(true)
        }
      } catch (err) {
        console.error('Failed to fetch gospel video:', err)
      }
    }

    // Run immediately and poll frequently while dashboard is open
    checkAndShowGospel()
    const interval = setInterval(checkAndShowGospel, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleClose = () => {
    setShowModal(false)
    // Mark this video as seen today (store id + date)
    try {
      const payload = { id: gospel?.id ?? null, date: new Date().toDateString() }
      localStorage.setItem('gospel_last_seen', JSON.stringify(payload))
    } catch (e) {
      // fallback to plain date
      localStorage.setItem('gospel_last_seen_date', new Date().toDateString())
    }
  }

  const extractYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : ''
  }

  if (!gospel || !showModal) return null

  const youtubeId = extractYouTubeId(gospel.youtube_url)

  return (
    <AnimatePresence>
      {showModal && (
        <>
          {/* Blurred Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-600 to-yellow--600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{gospel.title}</h2>
                  {gospel.description && (
                    <p className="text-yellow-100 text-sm mt-1">{gospel.description}</p>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Video */}
              <div className="aspect-video bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                  title={gospel.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Brought to you with love by Lebanon Academy
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow--600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
