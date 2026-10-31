import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Search,
  Settings,
  Trash2,
  ExternalLink,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Plus,
  AlertCircle,
  BarChart3,
  TrendingUp,
  ArrowLeft,
  Calendar,
  Mail,
  Award,
  Users,
  DollarSign,
  Star,
  Trophy,
  X,
  BookOpen,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Tutor {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_joined: string
  is_active: boolean
  verification_status: 'pending' | 'approved' | 'rejected'
  courses_count: number
  students_taught: number
  total_revenue: number
  average_rating: number
  custom_share_percentage?: number
}

interface TutorLeaderboardItem {
  rank: number
  id: number
  username: string
  name: string
  email: string
  sales: number
  students_taught: number
  courses_created: number
  total_revenue: number
  rating: number
  avatar_initial: string
}

interface TutorCourseDetail {
  id: number
  title: string
  category: string
  price: number
  enrollments_count: number
  rating: number
  status: string
  revenue: number
}

interface TutorDrilldownData {
  tutor_id: number
  name: string
  username: string
  email: string
  rank: number | null
  total_tutors_ranked: number
  total_courses: number
  total_students_taught: number
  total_revenue: number
  average_rating: number
  courses: TutorCourseDetail[]
}

export default function TutorsManagement() {
  const navigate = useNavigate()
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTutorId, setDeleteTutorId] = useState<number | null>(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [tutorLeaderboard, setTutorLeaderboard] = useState<TutorLeaderboardItem[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [selectedDrilldown, setSelectedDrilldown] = useState<TutorDrilldownData | null>(null)
  const [drilldownLoading, setDrilldownLoading] = useState(false)
  const [showDrilldownModal, setShowDrilldownModal] = useState(false)

  const [newSharePercentage, setNewSharePercentage] = useState<number | null>(null)
  const [newStatus, setNewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [rejectionReason, setRejectionReason] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [toast, setToast] = useState<{type: 'success' | 'error'; message: string} | null>(null)

  useEffect(() => {
    loadTutors()
  }, [])

  useEffect(() => {
    filterTutors()
  }, [searchTerm, statusFilter, tutors])

  async function loadTutors() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access')
        const res = await axios.get(`${API_BASE}/users/`, {
          params: { role: 'tutor' },
        headers: { Authorization: `Bearer ${token}` }
      })
        const payload = res.data
        const items = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : [])
        setTutors(items)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load tutors')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadGlobalLeaderboard() {
    setLeaderboardLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/courses/tutors/leaderboard/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const items = Array.isArray(res.data) ? res.data : (res.data?.leaderboard || [])
      setTutorLeaderboard(items)
      setShowLeaderboardModal(true)
    } catch (err: any) {
      console.error('Failed to load tutor leaderboard:', err)
      setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to load tutor leaderboard' })
    } finally {
      setLeaderboardLoading(false)
    }
  }

  async function openTutorDrilldown(tutorId: number) {
    setDrilldownLoading(true)
    setShowDrilldownModal(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/courses/tutors/leaderboard/?tutor_id=${tutorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSelectedDrilldown(res.data)
    } catch (err: any) {
      console.error('Failed to load tutor drill-down:', err)
      setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to load tutor performance' })
      setShowDrilldownModal(false)
    } finally {
      setDrilldownLoading(false)
    }
  }

  function filterTutors() {
    let filtered = tutors.filter(tutor => {
      const matchesSearch =
        `${tutor.first_name} ${tutor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || tutor.verification_status === statusFilter

      return matchesSearch && matchesStatus
    })

    setFilteredTutors(filtered)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'approved':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Verified
          </div>
        )
      case 'pending':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </div>
        )
      case 'rejected':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Rejected
          </div>
        )
      default:
        return null
    }
  }

  async function openSettings(tutor: Tutor) {
    setSelectedTutor(tutor)
    setNewSharePercentage(tutor.custom_share_percentage || null)
    setNewStatus(tutor.verification_status)
    setRejectionReason('')
    setSettingsError('')
    setShowSettings(true)
  }

  async function saveSettings() {
    if (!selectedTutor) return

    setSettingsSaving(true)
    setSettingsError('')

    try {
      const token = localStorage.getItem('access')
      const payload: any = {
        verification_status: newStatus,
        custom_share_percentage: newSharePercentage,
      }

      if (newStatus === 'rejected' && rejectionReason) {
        payload.rejection_reason = rejectionReason
      }

      await axios.patch(
        `${API_BASE}/users/${selectedTutor.id}/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setTutors(
        tutors.map(t =>
          t.id === selectedTutor.id
            ? {
                ...t,
                verification_status: newStatus,
                custom_share_percentage: newSharePercentage,
              }
            : t
        )
      )

      setShowSettings(false)
      setToast({type: 'success', message: 'Tutor settings updated successfully!'})
      loadTutors()
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setSettingsError(err.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  async function deleteTutor() {
    if (!deleteTutorId) return

    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/users/${deleteTutorId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTutors(tutors.filter(t => t.id !== deleteTutorId))
      setShowDeleteConfirm(false)
      setToast({type: 'success', message: 'Tutor deleted successfully!'})
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({type: 'error', message: err.response?.data?.detail || 'Failed to delete tutor'})
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading tutors...</div>
      </div>
    )
  }

  // Detail View
  if (showDetailView && selectedTutor) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowDetailView(false)
                  setSelectedTutor(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedTutor.first_name} {selectedTutor.last_name}
                </h1>
                <p className="text-gray-600 mt-1">Tutor Profile</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openTutorDrilldown(selectedTutor.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition shadow-sm"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard Stats
              </button>
              {getStatusBadge(selectedTutor.verification_status)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedTutor.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Status</p>
                    <p className="font-medium text-gray-900">{selectedTutor.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>

              {/* Teaching Analytics */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Teaching Analytics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Courses</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedTutor.courses_count}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Students Taught</p>
                    <p className="text-2xl font-bold text-green-600">{selectedTutor.students_taught}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
                      <Star className="w-5 h-5" />
                      {(selectedTutor.average_rating || 0).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Earnings Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Earnings
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₦{(selectedTutor.total_revenue || 0).toLocaleString()}
                    </p>
                  </div>
                  {selectedTutor.custom_share_percentage && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Custom Share</p>
                      <p className="text-lg font-medium text-gray-900">{selectedTutor.custom_share_percentage}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Account Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="text-gray-600">Joined</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedTutor.date_joined).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Verification Status</p>
                    <p className="font-medium text-gray-900 mt-2">
                      {selectedTutor.verification_status === 'approved' && 'Verified & Approved'}
                      {selectedTutor.verification_status === 'pending' && 'Pending Review'}
                      {selectedTutor.verification_status === 'rejected' && 'Rejected'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tutors Management</h1>
            <p className="text-gray-600 mt-1">Manage and verify tutor accounts</p>
          </div>
          <button
            onClick={loadGlobalLeaderboard}
            disabled={leaderboardLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Trophy className="w-5 h-5" />
            {leaderboardLoading ? 'Loading Leaderboard...' : 'Tutor Leaderboard'}
          </button>
        </div>

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

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tutor name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Verification</option>
              <option value="approved">Verified & Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Total Tutors</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{tutors.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Verified</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {tutors.filter(t => t.verification_status === 'approved').length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              ₦{tutors.reduce((sum, t) => sum + (t.total_revenue || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Avg Rating</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              ⭐ {(tutors.length > 0
                ? (tutors.reduce((sum, t) => sum + (t.average_rating || 0), 0) / tutors.length).toFixed(1)
                : 0)}
            </div>
          </div>
        </div>

        {/* Tutors Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredTutors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tutors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">
                      Tutor
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">
                      Courses
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">
                      Students
                    </th>
                    <th className="text-right py-3 px-6 text-sm font-semibold text-gray-900">
                      Revenue
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">
                      Rating
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTutors.map(tutor => (
                    <tr key={tutor.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">
                            {tutor.first_name} {tutor.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(tutor.date_joined).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{tutor.email}</td>
                      <td className="py-4 px-6 text-center font-medium text-gray-900">
                        {tutor.courses_count}
                      </td>
                      <td className="py-4 px-6 text-center font-medium text-gray-900">
                        {tutor.students_taught}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        ₦{(tutor.total_revenue || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="font-medium text-yellow-600">
                          ⭐ {(tutor.average_rating || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {getStatusBadge(tutor.verification_status)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openTutorDrilldown(tutor.id)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded transition"
                            title="Leaderboard Performance"
                          >
                            <Trophy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTutor(tutor)
                              setShowDetailView(true)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openSettings(tutor)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                            title="Settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTutorId(tutor.id)
                              setShowDeleteConfirm(true)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && selectedTutor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Tutor Settings: {selectedTutor.first_name} {selectedTutor.last_name}
              </h2>

              {settingsError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {settingsError}
                </div>
              )}

              {/* Custom Share Percentage */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Custom Share Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={newSharePercentage !== null ? newSharePercentage : ''}
                  onChange={(e) => setNewSharePercentage(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Leave empty to use platform default"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Verification Status */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Verification Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending Verification</option>
                  <option value="approved">Verified & Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Rejection Reason */}
              {newStatus === 'rejected' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why the tutor was rejected..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={settingsSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {settingsSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Tutor?</h2>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. The tutor account and all associated data will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteTutor}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Tutor Leaderboard Modal */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tutors Performance Leaderboard</h2>
                  <p className="text-sm text-gray-500">Rankings based on student enrollments and course revenue</p>
                </div>
              </div>
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {tutorLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No tutor rankings available yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4 text-center">Rank</th>
                        <th className="py-3 px-4">Tutor</th>
                        <th className="py-3 px-4 text-center">Courses</th>
                        <th className="py-3 px-4 text-center">Students</th>
                        <th className="py-3 px-4 text-right">Total Revenue</th>
                        <th className="py-3 px-4 text-center">Rating</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {tutorLeaderboard.map((item) => (
                        <tr key={item.id} className="hover:bg-amber-50/40 transition">
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              item.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-sm' :
                              item.rank === 2 ? 'bg-slate-300 text-slate-800' :
                              item.rank === 3 ? 'bg-amber-700/20 text-amber-900' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              #{item.rank}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                                {item.avatar_initial || (item.name ? item.name[0] : 'T')}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 leading-tight">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-gray-700">{item.courses_created}</td>
                          <td className="py-3 px-4 text-center font-medium text-gray-700">{item.students_taught}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">₦{(item.total_revenue || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                              ⭐ {(item.rating || 5.0).toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setShowLeaderboardModal(false)
                                openTutorDrilldown(item.id)
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition"
                            >
                              Drill Down
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutor Performance Drill-Down Modal */}
      {showDrilldownModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{selectedDrilldown?.name || 'Tutor Drilldown'}</h2>
                    {selectedDrilldown?.rank && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-amber-700 shadow-sm">
                        Rank #{selectedDrilldown.rank} of {selectedDrilldown.total_tutors_ranked}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-100">{selectedDrilldown?.email} • @{selectedDrilldown?.username}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDrilldownModal(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {drilldownLoading ? (
                <div className="text-center py-16 text-gray-500">
                  <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-500" />
                  Loading tutor performance metrics...
                </div>
              ) : selectedDrilldown ? (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Global Rank</p>
                      <p className="text-2xl font-bold text-amber-900 mt-1">
                        {selectedDrilldown.rank ? `#${selectedDrilldown.rank}` : 'Unranked'}
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">Top performing tutor</p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        ₦{(selectedDrilldown.total_revenue || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600 mt-0.5">From course sales</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Students Taught</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        {selectedDrilldown.total_students_taught}
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">Across all courses</p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-xs font-medium text-purple-700 uppercase tracking-wider">Avg Rating</p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        ⭐ {(selectedDrilldown.average_rating || 5.0).toFixed(1)}
                      </p>
                      <p className="text-xs text-purple-600 mt-0.5">{selectedDrilldown.total_courses} total courses</p>
                    </div>
                  </div>

                  {/* Courses Breakdown */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-amber-600" />
                      Courses Performance Breakdown ({selectedDrilldown.courses?.length || 0})
                    </h3>

                    {(!selectedDrilldown.courses || selectedDrilldown.courses.length === 0) ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
                        No courses published by this tutor yet.
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                              <th className="py-3 px-4">Course Title</th>
                              <th className="py-3 px-4 text-center">Category</th>
                              <th className="py-3 px-4 text-right">Price</th>
                              <th className="py-3 px-4 text-center">Enrollments</th>
                              <th className="py-3 px-4 text-right">Revenue</th>
                              <th className="py-3 px-4 text-center">Rating</th>
                              <th className="py-3 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                            {selectedDrilldown.courses.map((course) => (
                              <tr key={course.id} className="hover:bg-gray-50/70 transition">
                                <td className="py-3 px-4 font-medium text-gray-900">{course.title}</td>
                                <td className="py-3 px-4 text-center text-xs text-gray-600">{course.category || '—'}</td>
                                <td className="py-3 px-4 text-right text-gray-700">₦{(course.price || 0).toLocaleString()}</td>
                                <td className="py-3 px-4 text-center font-bold text-gray-900">{course.enrollments_count}</td>
                                <td className="py-3 px-4 text-right font-semibold text-green-700">₦{(course.revenue || 0).toLocaleString()}</td>
                                <td className="py-3 px-4 text-center text-amber-600 font-medium">⭐ {(course.rating || 5.0).toFixed(1)}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {course.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDrilldownModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
