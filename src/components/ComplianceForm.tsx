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

export default function ComplianceForm({ entityType, entityId }: ComplianceFormProps) {
  const [userLoading, setUserLoading] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [filesMeta, setFilesMeta] = useState<{ document_name?: string; document_type?: string }[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedFile[]>([])
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [legalDocs, setLegalDocs] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [comments, setComments] = useState('')
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('bulk') // 'single' or 'bulk'
  const [hasSubmitted, setHasSubmitted] = useState(false) // Track if user has submitted
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    prefillUserInfo()
    loadUploadedDocuments()
    loadLegalDocs()
  }, [entityId, entityType])

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
      // Handle both paginated response (with results property) and direct array response
      const payload = res.data
      const items = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : [])
      setLegalDocs(items)
    } catch (err) {
      console.error('Failed to load legal documents:', err)
      setLegalDocs([])
    }
  }

  const loadUploadedDocuments = async () => {
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      const endpoint = entityType === 'institution'
        ? `/institutions/compliance/form/`
        : `/tutors/compliance/form/`

      const res = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Backend returns different shapes for institution vs tutor
      if (entityType === 'institution') {
        // institution endpoint returns a list of institution entries
        if (Array.isArray(res.data)) {
          // flatten documents from all institutions (usually one)
          const docs = res.data.flatMap((entry: any) => entry.documents || [])
          setUploadedDocuments(docs)
          // prefer institution-level status if present
          const first = res.data[0]
          setVerificationStatus(first?.verification_status || 'pending')
          setRejectionReason(first?.rejection_reason || '')
        } else {
          setUploadedDocuments(res.data.documents || [])
          setVerificationStatus(res.data.status || 'pending')
          setRejectionReason(res.data.rejection_reason || '')
        }
      } else {
        setUploadedDocuments(res.data.documents || [])
        setVerificationStatus(res.data.status || 'pending')
        setRejectionReason(res.data.rejection_reason || '')
      }
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter(f => f.size <= 10 * 1024 * 1024) // 10MB limit
    
    if (validFiles.length < selectedFiles.length) {
      showToast(`Some files exceeded 10MB limit and were skipped`, 'warn')
    }

    setFiles(prev => {
      const next = [...prev, ...validFiles]
      setFilesMeta(prevMeta => {
        const added = validFiles.map(() => ({ document_name: '', document_type: '' }))
        return [...prevMeta, ...added]
      })
      return next
    })
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setFilesMeta(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    if (!contactName.trim()) {
      showToast('Please provide your full name or business name', 'error')
      return false
    }
    if (!contactPhone.trim() || !/^[\d\s\-\+\(\)]+$/.test(contactPhone)) {
      showToast('Please provide a valid phone number', 'error')
      return false
    }
    if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      showToast('Please provide a valid email address', 'error')
      return false
    }
    if (files.length === 0) {
      showToast('Please select at least one file to upload', 'error')
      return false
    }

    for (let i = 0; i < files.length; i++) {
      const meta = filesMeta[i]
      if (!meta?.document_name?.trim()) {
        showToast(`Please provide a document name for file ${i + 1}`, 'error')
        return false
      }
      if (!meta?.document_type) {
        showToast(`Please select a document type for file ${i + 1}`, 'error')
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

      const endpoint = entityType === 'institution'
        ? `/institutions/compliance/form/`
        : `/tutors/compliance/form/`

      // Submit each file individually with required backend field names
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const meta = filesMeta[i]
        const perForm = new FormData()
        perForm.append('document_file', file)
        perForm.append('document_type', meta.document_type)
        perForm.append('document_name', meta.document_name)
        perForm.append('comments', comments)
        // include contact info to help admins
        perForm.append('contact_name', contactName)
        perForm.append('contact_phone', contactPhone)
        perForm.append('contact_email', contactEmail)

        if (entityType === 'institution') {
          // Try to include institution_id if provided as prop
          if (entityId) perForm.append('institution_id', String(entityId))
          else {
            // attempt to fetch my_institution id
            try {
              const instRes = await axios.get(`${API_BASE}/institutions/my_institution/`, { headers: { Authorization: `Bearer ${token}` } })
              if (instRes?.data?.id) perForm.append('institution_id', String(instRes.data.id))
            } catch (e) {
              // ignore; backend will validate presence
            }
          }
        }

        await axios.post(`${API_BASE}${endpoint}`, perForm, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      showToast('✅ Documents submitted successfully! Awaiting admin review...', 'success')
      setFiles([])
      setFilesMeta([])
      setComments('')
      setHasSubmitted(true) // Mark as submitted to show pending status
      await loadUploadedDocuments()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to submit documents'
      showToast(`❌ ${errorMsg}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-50 text-green-700 border-green-200', badge: 'Approved ✓' }
      case 'rejected':
        return { icon: <AlertCircle className="w-5 h-5" />, color: 'bg-red-50 text-red-700 border-red-200', badge: 'Rejected' }
      default:
        return { icon: <Clock className="w-5 h-5 animate-pulse" />, color: 'bg-yellow-50 text-yellow-700 border-yellow-200', badge: 'Pending Review' }
    }
  }

  if (userLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-yellow-600" /></div>
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-gray-50 to-yellow-50 rounded-2xl p-6 md:p-8">
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
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 md:px-8 py-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8" />
            <h2 className="text-2xl md:text-3xl font-bold">Verification Request</h2>
          </div>
          <p className="text-yellow-100 text-sm md:text-base">Complete your identity verification to unlock all platform features</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 md:px-8 py-8 space-y-8">
          {/* Step 1: Contact Information */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <h3 className="text-lg font-bold text-gray-900">Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-yellow-600" /> Full Name / Business Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:bg-white transition"
                  placeholder="Your name or company"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-yellow-600" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:bg-white transition"
                  placeholder="+234 800 000 0000"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-yellow-600" /> Email Address
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:bg-white transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Legal Documents Section */}
          {legalDocs.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-yellow-600" />
                📥 Legal Documents to Download & Sign
              </h4>
              <p className="text-sm text-gray-700 mb-4 bg-white rounded-lg p-3 border-l-4 border-yellow-500">
                ✍️ <strong>Important:</strong> Download the document below, print it, sign it physically or digitally, then re-upload the signed copy in Step 2. This is required for verification.
              </p>
              <div className="space-y-3">
                {legalDocs.map(doc => (
                  <div key={doc.id} className="bg-white rounded-lg p-4 border-2 border-yellow-100 flex items-center justify-between hover:border-yellow-300 transition">
                    <div>
                      <p className="font-semibold text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-600 mt-1">v{doc.version}</p>
                    </div>
                    <a href={doc.document_file} target="_blank" rel="noreferrer" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold flex items-center gap-2 transition">
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Document Upload */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <h3 className="text-lg font-bold text-gray-900">Upload Documents</h3>
            </div>

            {/* Upload Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setUploadMode('bulk')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                  uploadMode === 'bulk'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📁 Bulk Upload
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('single')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                  uploadMode === 'single'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📄 Single Upload
              </button>
            </div>

            {/* Upload Info Text */}
            <p className="text-xs text-gray-600 mb-4">
              {uploadMode === 'bulk'
                ? '💡 Drag multiple files or click to select them all at once'
                : '💡 Select one file at a time. Upload will be added to the list below.'}
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-3 border-dashed border-yellow-300 hover:border-yellow-500 rounded-xl p-8 md:p-12 text-center cursor-pointer transition bg-yellow-50 hover:bg-yellow-100"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={uploadMode === 'bulk'}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />
              <div className="flex justify-center mb-4">
                <Upload className="w-12 h-12 text-yellow-600" />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-2">Click to upload or drag files here</p>
              <p className="text-sm text-gray-600">PDF, PNG, JPG, DOCX (max 10MB each)</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-4">
                <p className="font-bold text-gray-900">Selected Files ({files.length})</p>
                {files.map((file, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
                    {/* File Header */}
                    <div className="p-4 flex items-center justify-between bg-gray-50 border-b-2 border-gray-200">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-600">{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-2 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition"
                        title="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Metadata Fields - Always Visible */}
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          📝 Document Name *
                        </label>
                        <input
                          type="text"
                          value={filesMeta[idx]?.document_name || ''}
                          onChange={(e) => setFilesMeta(prev => { const next = [...prev]; next[idx] = { ...(next[idx] || {}), document_name: e.target.value }; return next })}
                          className="w-full px-4 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:bg-white transition"
                          placeholder="e.g., Signed Terms of Service"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          📂 Document Type *
                        </label>
                        <select
                          value={filesMeta[idx]?.document_type || ''}
                          onChange={(e) => setFilesMeta(prev => { const next = [...prev]; next[idx] = { ...(next[idx] || {}), document_type: e.target.value }; return next })}
                          className="w-full px-4 py-2 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 focus:border-yellow-500 focus:outline-none focus:bg-white transition"
                          required
                        >
                          <option value="">-- Select Document Type --</option>
                          {DOCUMENT_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 3: Additional Comments */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <h3 className="text-lg font-bold text-gray-900">Additional Information (Optional)</h3>
            </div>

            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any additional details the admin should know about your application..."
              className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:bg-white transition resize-none"
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || files.length === 0}
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
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <File className="w-6 h-6 text-yellow-600" />
            Submission History
          </h3>
          <div className="space-y-3">
            {uploadedDocuments.map((doc) => {
              const badge = getStatusBadge(doc.status)
              return (
                <div key={doc.id} className={`border-2 rounded-xl p-5 ${badge.color}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">{badge.icon}</div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{doc.filename}</p>
                        <p className="text-xs opacity-75 mt-1">📅 {(() => {
                          const dateStr = doc.submitted_at || doc.uploaded_at || (doc as any).submittedAt || doc.created_at || doc.reviewed_at
                          const d = dateStr ? new Date(dateStr) : null
                          return d && !isNaN(d.getTime())
                            ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'
                        })()}</p>
                        {doc.rejection_reason && (
                          <div className="mt-2 p-2 bg-white bg-opacity-60 rounded text-sm">
                            <p className="font-semibold">Feedback:</p>
                            <p>{doc.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-white bg-opacity-60 text-gray-900 rounded-lg text-xs font-bold whitespace-nowrap ml-3">
                      {badge.badge}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Requirements Card */}
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 md:p-8">
        <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          What We Require
        </h4>
        <ul className="space-y-3">
          {[
            '✅ Government-issued ID (Passport, Driver License, or National ID)',
            '✅ Business registration certificate or proof of incorporation',
            '✅ Signed copy of our legal document (download above)',
            '✅ Proof of business address (utility bill, lease, or official letter)',
            '✅ Tax ID or company business license number',
            entityType === 'tutor' && '✅ Professional certifications or academic qualifications'
          ].filter(Boolean).map((req, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-green-600 font-bold text-lg flex-shrink-0">•</span>
              <span className="text-gray-700">{req}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
