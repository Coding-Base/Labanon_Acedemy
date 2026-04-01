import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertCircle, CheckCircle, XCircle, Loader2, Download, Filter, Search, User, Mail, Phone, FileText, Folder, ChevronDown } from 'lucide-react'
import showToast from '../utils/toast'
import useDebounce from '../utils/useDebounce'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface ComplianceDocument {
  id: number
  filename: string
  file_type: string
  uploaded_at: string
  file_url: string
}

interface ComplianceSubmission {
  id: number
  submission_id: string
  entity_type: 'tutor' | 'institution'
  tutor?: number
  tutor_username?: string
  tutor_email?: string
  institution?: number
  institution_name?: string
  institution_owner_email?: string
  contact_name: string
  contact_email: string
  contact_phone: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  reviewed_by_username?: string
  review_notes?: string
  comments?: string
  documents: ComplianceDocument[]
}

export default function VerificationDashboard() {
  const [submissions, setSubmissions] = useState<ComplianceSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<ComplianceSubmission | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadSubmissions()
  }, [filterStatus])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      const params = filterStatus !== 'all' ? { status: filterStatus } : {}
      const res = await axios.get(`${API_BASE}/admin/compliance/folders/`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })

      const payload = res.data
      let items: any[] = []

      if (Array.isArray(payload?.submissions)) {
        items = payload.submissions
      } else if (Array.isArray(payload)) {
        items = payload
      } else if (payload?.submissions) {
        items = payload.submissions
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
    
    const entityName = (sub.entity_type === 'tutor' ? sub.tutor_username : sub.institution_name) || ''
    const matchesSearch =
      entityName.toLowerCase().includes(s) ||
      sub.contact_name.toLowerCase().includes(s) ||
      sub.contact_email.toLowerCase().includes(s) ||
      sub.submission_id.toLowerCase().includes(s)
    return matchesSearch
  })

  const handleApprove = async () => {
    if (!selectedSubmission) return

    setIsProcessing(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      await axios.post(
        `${API_BASE}/admin/compliance/folders/${selectedSubmission.id}/approve/`,
        {
          reason: ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showToast('Submission folder approved successfully', 'success')
      setSelectedSubmission(null)
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
        `${API_BASE}/admin/compliance/folders/${selectedSubmission.id}/reject/`,
        {
          reason: rejectionReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      showToast('Submission folder rejected and owner notified', 'success')
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

  const getEntityName = (sub: ComplianceSubmission) => {
    return sub.entity_type === 'tutor' ? sub.tutor_username : sub.institution_name
  }

  const toggleFolder = (id: number) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedFolders(newExpanded)
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Submissions (Folder View)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or submission ID..."
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
              className={`bg-white rounded-lg border cursor-pointer transition hover:shadow-lg ${
                selectedSubmission?.id === submission.id ? 'ring-2 ring-blue-500' : 'border-gray-200'
              }`}
            >
              {/* Folder Header */}
              <div 
                onClick={() => {
                  toggleFolder(submission.id)
                  setSelectedSubmission(submission)
                }}
                className="p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 flex items-center gap-3">
                    <Folder className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{getEntityName(submission)}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 capitalize">
                          {submission.entity_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Submission ID: {submission.submission_id}</p>
                      <p className="text-sm text-gray-600">Contact: {submission.contact_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                      {submission.documents.length} file(s)
                    </span>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 transition ${expandedFolders.has(submission.id) ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {submission.contact_email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {submission.contact_phone || 'N/A'}
                  </div>
                </div>

                {/* Submission Date */}
                <div className="text-sm text-gray-500">
                  Submitted on {new Date(submission.submitted_at).toLocaleDateString()} at {new Date(submission.submitted_at).toLocaleTimeString()}
                </div>
              </div>

              {/* Expanded Folder Contents */}
              {expandedFolders.has(submission.id) && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents in this folder ({submission.documents.length})
                  </h4>
                  
                  <div className="space-y-2">
                    {submission.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                            <p className="text-xs text-gray-500">{doc.file_type} • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                          </div>
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

                  {/* Comments */}
                  {submission.comments && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-2">Submission Comments</h5>
                      <p className="text-sm text-gray-700">{submission.comments}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {submission.status === 'pending' && !activeAction && (
                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveAction('approve')}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve This Folder
                      </button>
                      <button
                        onClick={() => setActiveAction('reject')}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject This Folder
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Rejection Notes */}
              {submission.status === 'rejected' && submission.review_notes && (
                <div className="border-t border-gray-200 p-6 bg-red-50">
                  <h4 className="font-semibold text-red-900 mb-2">Rejection Notes</h4>
                  <p className="text-sm text-red-800">{submission.review_notes}</p>
                </div>
              )}

              {/* Approval Notes */}
              {submission.status === 'approved' && submission.review_notes && (
                <div className="border-t border-gray-200 p-6 bg-green-50">
                  <h4 className="font-semibold text-green-900 mb-2">Approval Notes</h4>
                  <p className="text-sm text-green-800">{submission.review_notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Modals */}
      {selectedSubmission && activeAction === 'approve' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Approve This Folder?</h3>
            <p className="text-gray-600 mb-4">
              You are about to approve all {selectedSubmission.documents.length} documents in this compliance folder for <strong>{getEntityName(selectedSubmission)}</strong>.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveAction(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSubmission && activeAction === 'reject' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Reject This Folder?</h3>
            <p className="text-gray-600 mb-4">
              Provide a reason for rejecting this compliance folder. The owner will be notified and can resubmit with corrections.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Documents are unclear, signatures missing, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 h-24 focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setActiveAction(null)
                  setRejectionReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
