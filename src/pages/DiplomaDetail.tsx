import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Clock,
  MapPin,
  DollarSign,
  Award,
  ChevronRight,
  Calendar,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PaymentCheckout from '../components/PaymentCheckout'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1456513080510-3449c76e8b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
]

function getFallbackImage(id: number) {
  return FALLBACK_IMAGES[id % FALLBACK_IMAGES.length]
}

interface DiplomaData {
  id: number
  title: string
  description: string
  price: number
  duration: string
  start_date: string
  end_date: string
  meeting_place: string
  image: string
  institution?: {
    id: number
    name: string
  }
  creator?: {
    id: number
    username: string
  }
}

export default function DiplomaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [diploma, setDiploma] = useState<DiplomaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const res = await axios.get(`${API_BASE}/diplomas/${id}/`)
        setDiploma(res.data)
        setError('')
      } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.detail || 'Failed to load diploma')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function resolveImage(src?: string) {
    if (!src) return null
    if (src.startsWith('http://') || src.startsWith('https://')) return src
    try {
      let s = src.trim()
      s = s.replace(/(\/media\/)+/g, '/media/')
      if (s.startsWith('media/')) s = `/${s}`
      if (!s.startsWith('/')) s = `/${s}`
      const siteBase = API_BASE.replace(/\/api\/?$/, '')
      return `${siteBase}${s}`
    } catch (e) {
      return null
    }
  }

  async function handleEnroll() {
    if (!diploma) return
    const token = localStorage.getItem('access')
    if (!token) {
      window.location.href = `/login?next=/diploma/${id}`
      return
    }

    // Free diploma: create enrollment immediately
    if (diploma.price === 0) {
      setEnrolling(true)
      try {
        await axios.post(
          `${API_BASE}/diploma-enrollments/`,
          { diploma_id: diploma.id },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        alert('Enrollment completed — you have access to this diploma program')
        navigate(`/student/diplomas/${diploma.id}`)
      } catch (err: any) {
        console.error(err)
        alert(err.response?.data?.detail || 'Failed to enroll')
      } finally {
        setEnrolling(false)
      }
      return
    }

    // Paid diploma: show PaymentCheckout component
    setShowPayment(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (error || !diploma) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-green-600 hover:text-yellow-700 font-medium mb-6"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Marketplace
          </button>

          <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900">{error || 'Diploma not found'}</h3>
              <p className="text-sm text-gray-500 mt-1">The diploma program you're looking for doesn't exist or has been removed.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const imageUrl = imageError
    ? getFallbackImage(diploma.id)
    : resolveImage(diploma.image) || getFallbackImage(diploma.id)

  const token = localStorage.getItem('access')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50"
    >
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-green-600 hover:text-yellow-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Marketplace
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Hero Image */}
          <div className="relative h-96 w-full overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={diploma.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-4xl font-bold text-white mb-2">{diploma.title}</h1>
              {diploma.institution && (
                <p className="text-gray-100 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  {diploma.institution.name}
                </p>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₦{diploma.price.toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-1">
                  <DollarSign className="w-4 h-4 inline mr-1" />Price
                </p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{diploma.duration}</div>
                <p className="text-sm text-gray-600 mt-1">
                  <Clock className="w-4 h-4 inline mr-1" />Duration
                </p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 truncate">{diploma.meeting_place.split(',')[0]}</div>
                <p className="text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4 inline mr-1" />Location
                </p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Diploma</div>
                <p className="text-sm text-gray-600 mt-1">
                  <Award className="w-4 h-4 inline mr-1" />Certification
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Program</h2>
              <p className="text-gray-700 leading-relaxed">{diploma.description}</p>
            </div>

            {/* Details */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Program Details</h3>
                <ul className="space-y-3">
                  {diploma.start_date && (
                    <li className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Start Date</p>
                        <p className="font-medium text-gray-900">{new Date(diploma.start_date).toLocaleDateString()}</p>
                      </div>
                    </li>
                  )}
                  {diploma.end_date && (
                    <li className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">End Date</p>
                        <p className="font-medium text-gray-900">{new Date(diploma.end_date).toLocaleDateString()}</p>
                      </div>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Meeting Place</p>
                      <p className="font-medium text-gray-900">{diploma.meeting_place}</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">What You'll Get</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Professional diploma certification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Structured curriculum</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">In-person training</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Industry-recognized qualification</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Enrollment / Checkout */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Ready to start this diploma program?</p>
                <p className="font-bold text-gray-900">₦{diploma.price.toLocaleString()}</p>
              </div>
              {showPayment && diploma.price > 0 ? (
                <div className="w-full md:w-auto">
                  <PaymentCheckout
                    itemId={diploma.id}
                    itemType="diploma"
                    amount={diploma.price}
                    itemTitle={diploma.title}
                    onSuccess={() => {
                      alert('Payment successful — enrollment complete')
                      navigate(`/student/diplomas/${diploma.id}`)
                    }}
                  />
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      Enroll Now
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
