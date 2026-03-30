import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertCircle, CheckCircle, XCircle, Loader2, Download, Filter, Search, User, Mail, Phone, FileText } from 'lucide-react'
import showToast from '../utils/toast'
import useDebounce from '../utils/useDebounce'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface VerificationSubmission {
  id: number
  entity_id: number
  entity_type: 'institution' | 'tutor'
  entity_name: string
  owner_name: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  documents: VerificationDocument[]
  comments?: string
}

interface VerificationDocument {
  id: number
  filename: string
  file_type: string
  uploaded_at: string
  file_url: string
}

export default function VerificationDashboard() {
  const [submissions, setSubmissions] = useState<VerificationSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<VerificationSubmission | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [approvalReason, setApprovalReason] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    loadSubmissions()
  }, [filterStatus])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      const params = filterStatus !== 'all' ? { status: filterStatus } : {}
      const res = await axios.get(`${API_BASE}/admin/compliance/dashboard/`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })

      // Normalize various backend response shapes:
      const payload = res.data
      let items: any[] = []

      if (Array.isArray(payload)) {
        items = payload
      } else if (payload?.pending_tutor_documents || payload?.pending_institution_documents) {
        // Admin compliance dashboard shape — merge pending tutor and institution docs into unified submissions
        const tutors = (payload.pending_tutor_documents || []).map((d: any) => ({
          id: d.id || (d.tutor || 0),
          entity_id: d.tutor || null,
          entity_type: 'tutor',
          entity_name: d.tutor_username || (d.tutor && d.tutor.username) || 'Tutor',
          owner_name: d.tutor_username || '',
          email: d.tutor_email || '',
          phone: '',
          status: d.status || 'pending',
          submitted_at: d.submitted_at || d.reviewed_at || d.created_at || null,
          reviewed_at: d.reviewed_at || null,
          documents: [
            {
              id: d.id,
              filename: d.document_name || '',
              file_type: d.document_type || '',
              uploaded_at: d.submitted_at || d.created_at || null,
              file_url: d.document_file || ''
            }
          ]
        }))

        const inst = (payload.pending_institution_documents || []).map((d: any) => ({
          id: d.id || (d.institution || 0),
          entity_id: d.institution || null,
          entity_type: 'institution',
          entity_name: d.institution_name || (d.institution && d.institution.name) || 'Institution',
          owner_name: d.institution_owner_name || (d.institution && d.institution.owner && d.institution.owner.username) || '',
          email: d.institution_owner_email || '',
          phone: '',
          status: d.status || 'pending',
          submitted_at: d.submitted_at || d.reviewed_at || d.created_at || null,
          reviewed_at: d.reviewed_at || null,
          documents: [
            {
              id: d.id,
              filename: d.document_name || '',
              file_type: d.document_type || '',
              uploaded_at: d.submitted_at || d.created_at || null,
              file_url: d.document_file || ''
            }
          ]
        }))

        items = [...tutors, ...inst]
      } else if (Array.isArray(payload?.results)) {
        items = payload.results
      } else {
        // unknown shape — try to coerce
        items = Array.isArray(payload) ? payload : (payload ? [payload] : [])
      }

      setSubmissions(items)
    } catch (err) {
      console.error('Failed to load submissions:', err)
      showToast('Failed to load verification submissions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    const s = debouncedSearch.toLowerCase()
    if (!s) return true
    const matchesSearch =
      sub.entity_name.toLowerCase().includes(s) ||
      sub.owner_name.toLowerCase().includes(s) ||
      sub.email.toLowerCase().includes(s)
    return matchesSearch
  })

  const handleApprove = async () => {
    if (!selectedSubmission) return

    setIsProcessing(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      await axios.post(
        `${API_BASE}/admin/verify-submission/${selectedSubmission.id}/approve/`,
        {
          entity_type: selectedSubmission.entity_type,
          reason: approvalReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showToast('Submission approved successfully', 'success')
      setSelectedSubmission(null)
      setApprovalReason('')
      setActiveAction(null)
      await loadSubmissions()
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to approve', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error')
      return
    }

    setIsProcessing(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      await axios.post(
        `${API_BASE}/admin/verify-submission/${selectedSubmission.id}/reject/`,
        {
          entity_type: selectedSubmission.entity_type,
          reason: rejectionReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showToast('Submission rejected and owner notified', 'success')
      setSelectedSubmission(null)
      setRejectionReason('')
      setActiveAction(null)
      await loadSubmissions()
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to reject', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Submissions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Submissions</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Stats */}
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Total Pending</p>
            <p className="text-2xl font-bold text-blue-600">
              {submissions.filter(s => s.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No submissions found</p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <div
              key={submission.id}
              onClick={() => setSelectedSubmission(submission)}
              className={`bg-white rounded-lg border cursor-pointer transition hover:shadow-lg ${
                selectedSubmission?.id === submission.id ? 'ring-2 ring-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{submission.entity_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 capitalize">
                        {submission.entity_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Owner: {submission.owner_name}</p>
                  </div>
                  {submission.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSubmission(submission)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Review
                    </button>
                  )}
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {submission.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {submission.phone || 'N/A'}
                  </div>
                </div>

                {/* Documents Count */}
                <div className="text-sm text-gray-500">
                  {submission.documents.length} document(s) submitted on{' '}
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Panel */}
      {selectedSubmission && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button
            onClick={() => {
              setSelectedSubmission(null)
              setActiveAction(null)
            }}
            className="text-gray-500 hover:text-gray-700 float-right text-2xl"
          >
            ×
          </button>

          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {selectedSubmission.entity_name} - Verification Details
          </h3>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-600 mb-1">Owner</p>
              <p className="font-semibold text-gray-900">{selectedSubmission.owner_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Type</p>
              <p className="font-semibold text-gray-900 capitalize">{selectedSubmission.entity_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="font-semibold text-gray-900">{selectedSubmission.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="font-semibold text-gray-900">{selectedSubmission.phone || 'N/A'}</p>
            </div>
          </div>

          {/* Documents */}
          <div className="mb-6 pb-6 border-b">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Submitted Documents ({selectedSubmission.documents.length})
            </h4>
            <div className="space-y-2">
              {selectedSubmission.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{doc.filename}</span>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          {selectedSubmission.comments && (
            <div className="mb-6 pb-6 border-b">
              <h4 className="font-semibold text-gray-900 mb-2">Submitter Comments</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded">{selectedSubmission.comments}</p>
            </div>
          )}

          {/* Action Buttons */}
          {selectedSubmission.status === 'pending' && !activeAction && (
            <div className="flex gap-4">
              <button
                onClick={() => setActiveAction('approve')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Approve
              </button>
              <button
                onClick={() => setActiveAction('reject')}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
            </div>
          )}

          {/* Approve Form */}
          {activeAction === 'approve' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900">Approve This Submission</h4>
              <textarea
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="Optional message to include in approval email..."
                className="w-full px-4 py-2 border border-green-300 rounded-lg"
                rows={3}
              />
              <div className="flex gap-4">
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Confirm Approval
                </button>
                <button
                  onClick={() => setActiveAction(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {activeAction === 'reject' && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900">Reject This Submission</h4>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (will be sent to the applicant)..."
                className="w-full px-4 py-2 border border-red-300 rounded-lg"
                rows={3}
              />
              <div className="flex gap-4">
                <button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setActiveAction(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reviewed Status */}
          {selectedSubmission.status !== 'pending' && selectedSubmission.reviewed_at && (
            <div className={`p-4 rounded-lg ${
              selectedSubmission.status === 'approved'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                selectedSubmission.status === 'approved' ? 'text-green-800' : 'text-red-800'
              }`}>
                {selectedSubmission.status === 'approved' ? '✓ Approved' : '✗ Rejected'} on{' '}
                {new Date(selectedSubmission.reviewed_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
