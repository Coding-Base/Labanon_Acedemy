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
  Building2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PaymentCheckout from '../components/PaymentCheckout'
import Footer from '../components/Footer'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

// Pre-enrollment form component
function DiplomaEnrollmentForm({ 
  diploma, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  diploma: any
  onSubmit: (formData: any) => Promise<void>
  onCancel: () => void
  loading: boolean
}) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    academic_status: '',
    address: '',
    institution: diploma.institution?.name || ''
  })
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.full_name.trim()) {
      setError('Full name is required')
      return
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }
    if (!formData.academic_status) {
      setError('Academic status is required')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err: any) {
      setError(err.message || 'Failed to submit form')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Enrollment Information</h2>
      <p className="text-gray-600 mb-6">Please fill out this form to proceed with enrollment. This information will be sent to the institution.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+234 or local number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Status *</label>
            <select
              name="academic_status"
              value={formData.academic_status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">-- Select --</option>
              <option value="high_school">High School</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="phd">PhD</option>
              <option value="doctorate">Doctorate</option>
              <option value="professional">Professional</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address / Location</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Your location/address (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-yellow-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue to Payment
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  )
}

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
  portfolio_token?: string
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
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
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

    // Paid or free diploma: show enrollment form first
    setShowEnrollmentForm(true)
  }

  async function handleEnrollmentFormSubmit(formData: any) {
    if (!diploma) return
    const token = localStorage.getItem('access')
    if (!token) {
      window.location.href = `/login?next=/diploma/${id}`
      return
    }

    setFormSubmitting(true)
    try {
      // Send enrollment information to backend
      // Backend sends emails to institution, platform admin, and student
      // For free diplomas, backend also creates the enrollment record
      const response = await axios.post(
        `${API_BASE}/diploma-enrollments/submit-enrollment-info/`,
        {
          diploma_id: diploma.id,
          ...formData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { enrolled } = response.data

      if (enrolled) {
        // Free diploma - enrollment completed immediately
        alert('Enrollment completed — you have access to this diploma program')
        navigate(`/student/diplomas/${diploma.id}`)
      } else {
        // Paid diploma - proceed to payment
        setShowEnrollmentForm(false)
        setShowPayment(true)
      }
    } catch (err: any) {
      console.error(err)
      const errorDetail = err.response?.data?.detail || 'Failed to submit enrollment information'
      alert(errorDetail)
      throw new Error(errorDetail)
    } finally {
      setFormSubmitting(false)
    }
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

            {/* Institution Info */}
            {diploma.institution && (
              <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-green-600" />
                      About the Institution
                    </h3>
                    <p className="text-gray-700 font-semibold mb-1">{diploma.institution.name}</p>
                    <p className="text-sm text-gray-600">Learn more about this institution before enrolling</p>
                  </div>
                  {diploma.portfolio_token ? (
                    <motion.a
                      href={`/portfolio/${diploma.portfolio_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                    >
                      View Portfolio
                      <ChevronRight className="w-4 h-4" />
                    </motion.a>
                  ) : (
                    <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap opacity-60 cursor-not-allowed">
                      Portfolio Not Available
                    </div>
                  )}
                </div>
              </div>
            )}

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

            {/* Show Enrollment Form or Checkout */}
            {showEnrollmentForm ? (
              <div>
                <DiplomaEnrollmentForm
                  diploma={diploma}
                  onSubmit={handleEnrollmentFormSubmit}
                  onCancel={() => setShowEnrollmentForm(false)}
                  loading={formSubmitting}
                />
              </div>
            ) : showPayment && diploma.price > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment</h2>
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
              <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">Ready to start this diploma program?</p>
                  <p className="font-bold text-gray-900">₦{diploma.price.toLocaleString()}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnroll}
                  disabled={enrolling || formSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-yellow-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
                >
                  {enrolling || formSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Enroll Now
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </motion.div>
  )
}
