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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tutors Management</h1>
            <p className="text-gray-600 mt-1">Manage and verify tutor accounts</p>
          </div>
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
                            onClick={() => navigate(`/admin/tutors/${tutor.id}`)}
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
