import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Settings,
  CheckCircle,
  Clock,
  XCircle,
  Edit2,
  Save,
  X,
  AlertCircle,
  Mail,
  Phone,
  Globe,
  User,
  Calendar,
  TrendingUp,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Institution {
  id: number
  name: string
  description: string
  email: string
  phone: string
  owner: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  verification_status: 'pending' | 'approved' | 'rejected'
  verified_at?: string
  verified_by?: number
  custom_share_percentage?: number
  rejection_reason?: string
  courses_count: number
  total_students: number
  total_revenue: number
  is_active: boolean
  created_at: string
  signer_name?: string
  signer_position?: string
  logo_image?: string
}

interface Course {
  id: number
  title: string
  price: number
  students_count: number
  revenue: number
  rating: number
}

export default function InstitutionDetailView() {
  const { institutionId } = useParams<{ institutionId: string }>()
  const navigate = useNavigate()
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Institution>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadInstitutionDetails()
  }, [institutionId])

  async function loadInstitutionDetails() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(
        `${API_BASE}/institutions/${institutionId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setInstitution(res.data)
      setEditData(res.data)

      // Load courses
      const coursesRes = await axios.get(
        `${API_BASE}/institutions/${institutionId}/courses/`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setCourses(coursesRes.data.results || coursesRes.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load institution details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function saveChanges() {
    if (!institution) return

    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('access')
      const res = await axios.patch(
        `${API_BASE}/institutions/${institution.id}/`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setInstitution(res.data)
      setIsEditing(false)
      alert('Institution updated successfully!')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading institution details...</div>
      </div>
    )
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/admin/institutions')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Institutions
          </button>
          <div className="text-center text-gray-600">Institution not found</div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Verified
          </div>
        )
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Pending Verification
          </div>
        )
      case 'rejected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejected
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin/institutions')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Institutions
        </button>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
              <p className="text-gray-600 mt-1">{institution.description}</p>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(institution.verification_status)}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="font-medium text-gray-900">{institution.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                <p className="font-medium text-gray-900">{institution.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Owner</p>
                <p className="font-medium text-gray-900">
                  {institution.owner.first_name} {institution.owner.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Joined</p>
                <p className="font-medium text-gray-900">
                  {new Date(institution.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Institution Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Description
                </label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Certificate Signer Name
                  </label>
                  <input
                    type="text"
                    value={editData.signer_name || ''}
                    onChange={(e) => setEditData({ ...editData, signer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Certificate Signer Position
                  </label>
                  <input
                    type="text"
                    value={editData.signer_position || ''}
                    onChange={(e) => setEditData({ ...editData, signer_position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Rejection Reason Display */}
              {institution.verification_status === 'rejected' && institution.rejection_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                  <p className="text-sm text-red-700 mt-1">{institution.rejection_reason}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Courses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{institution.courses_count}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{institution.total_students}</p>
              </div>
              <User className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₦{(institution.total_revenue || 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Share %</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {editData.custom_share_percentage || 'Default'}
                </p>
              </div>
              <Globe className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Courses ({courses.length})</h2>
          {courses.length === 0 ? (
            <p className="text-gray-600">No courses yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                      Course
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                      Price (₦)
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                      Students
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                      Revenue (₦)
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{course.title}</p>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        ₦{course.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {course.students_count}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        ₦{course.revenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        ⭐ {course.rating.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
