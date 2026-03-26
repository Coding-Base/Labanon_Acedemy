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
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Institution {
  id: number
  name: string
  owner: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  email: string
  phone: string
  verification_status: 'pending' | 'approved' | 'rejected'
  verified_at?: string
  verified_by?: number
  custom_share_percentage?: number
  rejection_reason?: string
  courses_count: number
  is_active: boolean
}

interface InstitutionDetails extends Institution {
  description: string
  signer_name?: string
  signer_position?: string
  created_at: string
}

export default function InstitutionsManagement() {
  const navigate = useNavigate()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionDetails | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInstitutionId, setDeleteInstitutionId] = useState<number | null>(null)

  // Settings form state
  const [newSharePercentage, setNewSharePercentage] = useState<number | null>(null)
  const [newStatus, setNewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [rejectionReason, setRejectionReason] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [toast, setToast] = useState<{type: 'success' | 'error'; message: string} | null>(null)

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    filterInstitutions()
  }, [searchTerm, statusFilter, institutions])

  async function loadInstitutions() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/users/`, {
        params: { role: 'institution' },
        headers: { Authorization: `Bearer ${token}` }
      })
      const payload = res.data
      const items = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : [])
      setInstitutions(items)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load institutions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function filterInstitutions() {
    const q = (searchTerm || '').toLowerCase()
    let filtered = institutions.filter(inst => {
      const name = (inst.name || '').toString()
      const ownerEmail = (inst.owner && (inst.owner.email || `${inst.owner.first_name || ''} ${inst.owner.last_name || ''}`)) || ''
      const email = (inst.email || '').toString()

      const matchesSearch =
        name.toLowerCase().includes(q) ||
        ownerEmail.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q)

      const matchesStatus = statusFilter === 'all' || inst.verification_status === statusFilter

      return matchesSearch && matchesStatus
    })

    setFilteredInstitutions(filtered)
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

  async function openSettings(institution: Institution) {
    setSelectedInstitution(institution as InstitutionDetails)
    setNewSharePercentage(institution.custom_share_percentage || null)
    setNewStatus(institution.verification_status)
    setRejectionReason(institution.rejection_reason || '')
    setSettingsError('')
    setShowSettings(true)
  }

  async function saveSettings() {
    if (!selectedInstitution) return

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

      if (newStatus === 'approved') {
        payload.verified_by = (JSON.parse(localStorage.getItem('user') || '{}')).id
      }

      await axios.patch(
        `${API_BASE}/users/${selectedInstitution.id}/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Update local state
      setInstitutions(
        institutions.map(inst =>
          inst.id === selectedInstitution.id
            ? {
                ...inst,
                verification_status: newStatus,
                custom_share_percentage: newSharePercentage,
              }
            : inst
        )
      )

      setShowSettings(false)
      // Show success message
      setToast({type: 'success', message: 'Institution settings updated successfully!'})
      loadInstitutions()
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setSettingsError(err.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  async function deleteInstitution() {
    if (!deleteInstitutionId) return

    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/users/${deleteInstitutionId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setInstitutions(institutions.filter(inst => inst.id !== deleteInstitutionId))
      setShowDeleteConfirm(false)
      setToast({type: 'success', message: 'Institution deleted successfully!'})
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({type: 'error', message: err.response?.data?.detail || 'Failed to delete institution'})
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading institutions...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Institutions Management</h1>
            <p className="text-gray-600 mt-1">Manage and verify institution accounts</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" />
            Add Institution
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
              placeholder="Search by institution name, email, or phone..."
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
            <div className="text-sm text-gray-600">Total Institutions</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{institutions.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Pending Verification</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {institutions.filter(i => i.verification_status === 'pending').length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Verified</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {institutions.filter(i => i.verification_status === 'approved').length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Rejected</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {institutions.filter(i => i.verification_status === 'rejected').length}
            </div>
          </div>
        </div>

        {/* Institutions Table (mirrors Tutors layout) */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredInstitutions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No institutions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Institution</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">Email</th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">Courses</th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">Share</th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstitutions.map(inst => (
                    <tr key={inst.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">
                            { (inst as any).institution_name || inst.name || `${inst.first_name || ''} ${inst.last_name || ''}` }
                          </p>
                          <p className="text-xs text-gray-500">Owner: {((inst as any).owner?.first_name ? `${(inst as any).owner.first_name} ${(inst as any).owner.last_name}` : (inst.first_name || inst.username || ''))}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{inst.email}</td>
                      <td className="py-4 px-6 text-center font-medium text-gray-900">{inst.courses_count || 0}</td>
                      <td className="py-4 px-6 text-center font-medium text-gray-900">{inst.custom_share_percentage ? `${inst.custom_share_percentage}%` : '-'}</td>
                      <td className="py-4 px-6 text-center">{getStatusBadge(inst.verification_status)}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/institutions/${inst.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openSettings(inst)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                            title="Settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setDeleteInstitutionId(inst.id); setShowDeleteConfirm(true); }}
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
      {showSettings && selectedInstitution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Institution Settings: {selectedInstitution.name}
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
                <p className="text-xs text-gray-500 mt-1">
                  Percentage of revenue this institution will receive from course sales
                </p>
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

              {/* Rejection Reason (shown only if rejected) */}
              {newStatus === 'rejected' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why the institution was rejected..."
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
              <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Institution?</h2>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. The institution and all associated data will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteInstitution}
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
