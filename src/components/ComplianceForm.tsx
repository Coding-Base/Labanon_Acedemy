import React, { useState, useRef } from 'react'
import axios from 'axios'
import { Upload, AlertCircle, CheckCircle, Loader2, FileText, X, Download, Shield, Clock, CheckSquare, File, Phone, Mail, User } from 'lucide-react'
import showToast from '../utils/toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface UploadedFile {
  id: number
  filename: string
  file_type: string
  uploaded_at: string
  submitted_at?: string
  created_at?: string
  reviewed_at?: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
}

interface ComplianceFormProps {
  entityType: 'institution' | 'tutor'
  entityId?: number
  darkMode?: boolean
}

interface DocumentLink {
  document_name: string
  document_type: string
  document_link: string
}

const DOCUMENT_TYPES = [
  { value: 'registration', label: 'Registration / Incorporation Certificate', icon: '📋' },
  { value: 'tax', label: 'Tax ID / Business License', icon: '💼' },
  { value: 'proof_of_address', label: 'Proof of Address', icon: '🏠' },
  { value: 'id', label: 'Government ID / Passport', icon: '🪪' },
  { value: 'qualification', label: 'Professional Qualification / Certificate', icon: '🎓' },
  { value: 'signed_legal_doc', label: 'Signed Legal Document', icon: '✍️' },
  { value: 'other', label: 'Other Supporting Document', icon: '📄' }
]

export default function ComplianceForm({ entityType, entityId, darkMode = false }: ComplianceFormProps) {
  const [userLoading, setUserLoading] = useState(true)
  const [documentLinks, setDocumentLinks] = useState<DocumentLink[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedFile[]>([])
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [legalDocs, setLegalDocs] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [comments, setComments] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)

  React.useEffect(() => {
    prefillUserInfo()
    loadUploadedDocuments()
    loadLegalDocs()
  }, [entityId, entityType])

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUploadedDocuments()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    const refreshInterval = setInterval(loadUploadedDocuments, 30000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(refreshInterval)
    }
  }, [])

  const prefillUserInfo = async () => {
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      const res = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } })
      const user = res.data
      setContactName(user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username || '')
      setContactEmail(user.email || '')
      setContactPhone(user.phone || '')
    } catch (err) {
      console.error('Failed to prefill user info:', err)
    } finally {
      setUserLoading(false)
    }
  }

  const loadLegalDocs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/legal-documents/`)
      const payload = res.data
      const items = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : [])
      setLegalDocs(items)
    } catch (err) {
      console.error('Failed to load legal documents:', err)
    }
  }

  const loadUploadedDocuments = async () => {
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      const endpoint = entityType === 'institution' 
        ? `${API_BASE}/compliance/my-institution-submissions/`
        : `${API_BASE}/compliance/my-submissions/`

      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      const docs = res.data.results || res.data || []
      setUploadedDocuments(docs)

      if (docs.length > 0) {
        const latest = docs[docs.length - 1]
        setVerificationStatus(latest.status || 'pending')
        setRejectionReason(latest.rejection_reason || '')
      }
    } catch (err) {
      console.error('Failed to load uploaded documents:', err)
    }
  }

  const isValidGoogleDriveLink = (url: string): boolean => {
    if (!url) return false
    const patterns = [
      /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/,
      /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/[a-zA-Z0-9_-]+/,
    ]
    return patterns.some(p => p.test(url))
  }

  const addDocumentLink = () => {
    setDocumentLinks([...documentLinks, { document_name: '', document_type: '', document_link: '' }])
  }

  const removeDocumentLink = (idx: number) => {
    setDocumentLinks(documentLinks.filter((_, i) => i !== idx))
  }

  const updateDocumentLink = (idx: number, field: keyof DocumentLink, value: string) => {
    const updated = [...documentLinks]
    updated[idx][field] = value
    setDocumentLinks(updated)
  }

  const validateForm = (): boolean => {
    if (!contactName.trim()) {
      showToast('Please provide your name', 'error')
      return false
    }
    if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      showToast('Please provide a valid email', 'error')
      return false
    }
    if (!contactPhone.trim()) {
      showToast('Please provide your phone number', 'error')
      return false
    }
    if (documentLinks.length === 0) {
      showToast('Please add at least one document link', 'error')
      return false
    }

    for (let i = 0; i < documentLinks.length; i++) {
      const doc = documentLinks[i]
      if (!doc.document_name.trim()) {
        showToast(`Please provide a document name for item ${i + 1}`, 'error')
        return false
      }
      if (!doc.document_type) {
        showToast(`Please select a document type for item ${i + 1}`, 'error')
        return false
      }
      if (!isValidGoogleDriveLink(doc.document_link)) {
        showToast(`Please provide a valid Google Drive link for "${doc.document_name}"`, 'error')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) {
        showToast('Please log in', 'error')
        return
      }

      const documents = documentLinks.map(doc => ({
        document_type: doc.document_type,
        document_name: doc.document_name,
        document_link: doc.document_link
      }))

      let entity_id = null
      if (entityType === 'institution') {
        if (entityId) {
          entity_id = entityId
        } else {
          try {
            const instRes = await axios.get(`${API_BASE}/institutions/my_institution/`, { headers: { Authorization: `Bearer ${token}` } })
            entity_id = instRes?.data?.id
          } catch (e) {
            showToast('Could not find your institution. Please try again.', 'error')
            return
          }
        }
      }

      const payload = {
        entity_type: entityType,
        entity_id: entity_id,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        comments: comments,
        documents: documents
      }

      await axios.post(`${API_BASE}/compliance/batch-submit/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      showToast('✅ Compliance folder submitted successfully! Your submission is now under review...', 'success')
      setDocumentLinks([])
      setComments('')
      setHasSubmitted(true)
      await loadUploadedDocuments()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to submit compliance folder'
      showToast(`❌ ${errorMsg}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { icon: <CheckCircle className="w-5 h-5" />, color: darkMode ? 'bg-green-900/30 text-green-300 border-green-800' : 'bg-green-50 text-green-700 border-green-200', badge: 'Approved ✓' }
      case 'rejected':
        return { icon: <AlertCircle className="w-5 h-5" />, color: darkMode ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-red-50 text-red-700 border-red-200', badge: 'Rejected' }
      default:
        return { icon: <Clock className="w-5 h-5 animate-pulse" />, color: darkMode ? 'bg-yellow-900/30 text-yellow-300 border-yellow-800' : 'bg-yellow-50 text-yellow-700 border-yellow-200', badge: 'Pending Review' }
    }
  }

  if (userLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-yellow-600" /></div>
  }

  return (
    <div className={`${darkMode ? 'space-y-6 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100' : 'space-y-6 bg-gradient-to-br from-gray-50 to-yellow-50'} rounded-2xl p-6 md:p-8`}>
      {/* Status Banner */}
      {verificationStatus && (
        <div className={`rounded-xl border-2 p-5 ${getStatusBadge(verificationStatus).color} backdrop-blur-sm`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">{getStatusBadge(verificationStatus).icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">{getStatusBadge(verificationStatus).badge}</h3>
              </div>
              {verificationStatus === 'approved' && (
                <p className="text-sm opacity-90">🎉 Your account is verified! You can now publish courses and receive payments.</p>
              )}
              {verificationStatus === 'rejected' && rejectionReason && (
                <div>
                  <p className="text-sm font-semibold mb-1">Reason for rejection:</p>
                  <p className="text-sm opacity-90">{rejectionReason}</p>
                  <p className="text-xs mt-2">Please resubmit with the required corrections.</p>
                </div>
              )}
              {verificationStatus === 'pending' && hasSubmitted && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reviewing your submission...</span>
                </div>
              )}
              {verificationStatus === 'pending' && !hasSubmitted && (
                <p className="text-sm opacity-90">Submit your verification documents to get started.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className={`${darkMode ? 'bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-700' : 'bg-white rounded-2xl shadow-lg overflow-hidden'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 md:px-8 py-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8" />
            <h2 className="text-2xl md:text-3xl font-bold">Verification Request</h2>
          </div>
          <p className="text-yellow-100 text-sm md:text-base">Complete your identity verification to unlock all platform features</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={`px-6 md:px-8 py-8 space-y-8 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
          {/* Step 1: Contact Information */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="relative">
                <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-700'} mb-2 flex items-center gap-2`}>
                  <User className="w-4 h-4 text-yellow-600" /> Full Name / Business Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400 focus:bg-slate-700' : 'bg-gray-100 border-2 border-gray-300 text-gray-900 focus:bg-white'}`}
                  placeholder="Your name or company"
                  required
                />
              </div>

              <div className="relative">
                <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-700'} mb-2 flex items-center gap-2`}>
                  <Phone className="w-4 h-4 text-yellow-600" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400 focus:bg-slate-700' : 'bg-gray-100 border-2 border-gray-300 text-gray-900 focus:bg-white'}`}
                  placeholder="+234 800 000 0000"
                  required
                />
              </div>

              <div className="relative">
                <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-700'} mb-2 flex items-center gap-2`}>
                  <Mail className="w-4 h-4 text-yellow-600" /> Email Address
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400 focus:bg-slate-700' : 'bg-gray-100 border-2 border-gray-300 text-gray-900 focus:bg-white'}`}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Legal Documents Section */}
          {legalDocs.length > 0 && (
            <div className={`${darkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} border-2 rounded-xl p-6`}>
              <h4 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-yellow-300' : 'text-gray-900'}`}>
                <Download className="w-5 h-5 text-yellow-600" />
                📥 Legal Documents to Download & Sign
              </h4>
              <p className={`text-sm mb-4 rounded-lg p-3 border-l-4 ${darkMode ? 'bg-slate-800 border-yellow-600 text-slate-200' : 'bg-white text-gray-700 border-yellow-500'}`}>
                ✍️ <strong>Important:</strong> Download the document below, print it, sign it physically or digitally, then re-upload the signed copy in Step 2. This is required for verification.
              </p>
              <div className="space-y-3">
                {legalDocs.map(doc => (
                  <div key={doc.id} className={`${darkMode ? 'bg-slate-700 border-yellow-800 hover:border-yellow-700' : 'bg-white border-yellow-100 hover:border-yellow-300'} rounded-lg p-4 border-2 flex items-center justify-between transition`}>
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{doc.title}</p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>v{doc.version}</p>
                    </div>
                    <a href={doc.document_file} target="_blank" rel="noreferrer" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold flex items-center gap-2 transition">
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Document Links */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Submit Document Links</h3>
            </div>

            {/* Info Banner */}
            <div className={`${darkMode ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'} border-2 rounded-xl p-4 mb-6`}>
              <p className="text-sm">
                📎 <strong>Share via Google Drive:</strong> Instead of uploading files, please share Google Drive links to your documents. This allows you to easily update documents if needed and admins can view them directly.
              </p>
            </div>

            {/* Document Links List */}
            {documentLinks.length > 0 && (
              <div className="space-y-4 mb-6">
                {documentLinks.map((doc, idx) => (
                  <div key={idx} className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'} rounded-xl overflow-hidden shadow-sm border-2`}>
                    {/* Header */}
                    <div className={`p-4 flex items-center justify-between ${darkMode ? 'bg-slate-900/30 border-b border-slate-700' : 'bg-gray-50 border-b-2 border-gray-200'}`}>
                      <div className="flex items-center gap-3 flex-1">
                        <span className="px-3 py-1 bg-yellow-600 text-white rounded-lg font-bold text-sm">#{idx + 1}</span>
                        <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{doc.document_name || 'Untitled'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocumentLink(idx)}
                        className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-red-800/20 text-red-300' : 'hover:bg-red-100 text-red-600'}`}
                        title="Remove this document"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Input Fields */}
                    <div className="p-4 space-y-4">
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                          📝 Document Name *
                        </label>
                        <input
                          type="text"
                          value={doc.document_name}
                          onChange={(e) => updateDocumentLink(idx, 'document_name', e.target.value)}
                          className={`w-full px-4 py-2 rounded-lg placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400' : 'bg-gray-100 border-2 border-gray-300 text-gray-900'}`}
                          placeholder="e.g., Tax Certificate, Business License"
                          required
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                          📂 Document Type *
                        </label>
                        <select
                          value={doc.document_type}
                          onChange={(e) => updateDocumentLink(idx, 'document_type', e.target.value)}
                          className={`w-full px-4 py-2 rounded-lg focus:border-yellow-500 focus:outline-none transition ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-gray-100 border-2 border-gray-300 text-gray-900'}`}
                          required
                        >
                          <option value="">-- Select Document Type --</option>
                          {DOCUMENT_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                          🔗 Google Drive Link *
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={doc.document_link}
                            onChange={(e) => updateDocumentLink(idx, 'document_link', e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition ${
                              doc.document_link && !isValidGoogleDriveLink(doc.document_link)
                                ? 'border-red-400'
                                : darkMode ? 'border-slate-600 bg-slate-700 text-slate-200 placeholder-slate-400' : 'border-gray-300 bg-gray-100 text-gray-900'
                            }`}
                            placeholder="https://drive.google.com/file/d/..."
                            required
                          />
                          {doc.document_link && isValidGoogleDriveLink(doc.document_link) && (
                            <CheckCircle className="absolute right-3 top-2.5 w-5 h-5 text-green-600" />
                          )}
                          {doc.document_link && !isValidGoogleDriveLink(doc.document_link) && (
                            <AlertCircle className="absolute right-3 top-2.5 w-5 h-5 text-red-600" />
                          )}
                        </div>
                        {doc.document_link && !isValidGoogleDriveLink(doc.document_link) && (
                          <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>⚠️ Please provide a valid Google Drive or Docs link</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Document Button */}
            <button
              type="button"
              onClick={addDocumentLink}
              className={`w-full px-4 py-3 border-2 border-dashed rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                darkMode
                  ? 'border-yellow-700 text-yellow-300 hover:border-yellow-600 hover:bg-yellow-900/10'
                  : 'border-yellow-400 text-yellow-700 hover:border-yellow-600 hover:bg-yellow-50'
              }`}
            >
              <Upload className="w-5 h-5" />
              + Add Document Link
            </button>
          </div>

          {/* Step 3: Additional Comments */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Additional Information (Optional)</h3>
            </div>

            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any additional details the admin should know about your application..."
              className={`w-full px-4 py-3 rounded-lg placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition resize-none ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400' : 'bg-gray-100 border-2 border-gray-300 text-gray-900'}`}
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || documentLinks.length === 0}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition transform hover:scale-105 active:scale-95"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckSquare className="w-5 h-5" />
                  Submit for Verification
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* History Section */}
      {uploadedDocuments.length > 0 && (
        <div className={`${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'} rounded-2xl shadow-lg p-6 md:p-8`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold flex items-center gap-3 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
              <File className={`w-6 h-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              Submission History
            </h3>
            <button
              onClick={loadUploadedDocuments}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${darkMode ? 'bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/40' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
              title="Refresh to check for admin updates"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {uploadedDocuments.map((doc) => {
              const badge = getStatusBadge(doc.status)
              return (
                <div key={doc.id} className={`border-2 rounded-xl p-5 ${badge.color}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">{badge.icon}</div>
                      <div className="flex-1">
                        <p className={`font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{doc.filename}</p>
                        <p className={`text-xs opacity-75 mt-1 ${darkMode ? 'text-slate-300' : ''}`}>
                          📅 {(() => {
                            const dateStr = doc.submitted_at || doc.uploaded_at || (doc as any).submittedAt || doc.created_at || doc.reviewed_at
                            const d = dateStr ? new Date(dateStr) : null
                            return d && !isNaN(d.getTime())
                              ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '—'
                          })()}
                        </p>
                        {doc.rejection_reason && (
                          <p className={`text-xs mt-2 ${darkMode ? 'text-red-300' : 'text-red-600'}`}>❌ {doc.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
