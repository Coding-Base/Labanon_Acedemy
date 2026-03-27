import React, { useState, useRef } from 'react'
import axios from 'axios'
import { Upload, AlertCircle, CheckCircle, Loader2, FileText, X } from 'lucide-react'
import showToast from '../utils/toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface UploadedFile {
  id: number
  filename: string
  file_type: string
  uploaded_at: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
}

interface ComplianceFormProps {
  entityType: 'institution' | 'tutor'
  entityId?: number
}

export default function ComplianceForm({ entityType, entityId }: ComplianceFormProps) {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [filesMeta, setFilesMeta] = useState<{ document_name: string; document_type: string }[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedFile[]>([])
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [comments, setComments] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load uploaded documents on mount
  React.useEffect(() => {
    loadUploadedDocuments()
  }, [entityId, entityType])

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
    setFiles(prev => {
      const next = [...prev, ...selectedFiles]
      // extend meta for each newly added file
      setFilesMeta(prevMeta => {
        const added = selectedFiles.map(() => ({ document_name: '', document_type: '' }))
        return [...prevMeta, ...added]
      })
      return next
    })
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setFilesMeta(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      showToast('Please select at least one file', 'error')
      return
    }

    // basic contact validation
    if (!contactName || !contactPhone || !contactEmail) {
      showToast('Please provide your name, phone and email', 'error')
      return
    }

    // ensure each file has meta
    for (let i = 0; i < files.length; i++) {
      const meta = filesMeta[i]
      if (!meta || !meta.document_name || !meta.document_type) {
        showToast('Please provide a document name and type for each file', 'error')
        return
      }
    }

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

      showToast('Documents submitted successfully for review', 'success')
      setFiles([])
      setFilesMeta([])
      setComments('')
      setContactName('')
      setContactPhone('')
      setContactEmail('')
      await loadUploadedDocuments()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to submit documents'
      showToast(errorMsg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50'
      case 'rejected': return 'text-red-600 bg-red-50'
      default: return 'text-yellow-600 bg-yellow-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5" />
      case 'rejected': return <AlertCircle className="w-5 h-5" />
      default: return <Loader2 className="w-5 h-5 animate-spin" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Verification Status Banner */}
      {verificationStatus && (
        <div className={`p-4 rounded-lg border ${getStatusColor(verificationStatus)}`}>
          <div className="flex items-start gap-3">
            {getStatusIcon(verificationStatus)}
            <div className="flex-1">
              <p className="font-semibold capitalize">
                {verificationStatus === 'pending' ? 'Verification Pending' : verificationStatus === 'approved' ? 'Verified & Approved' : 'Verification Rejected'}
              </p>
              {rejectionReason && (
                <p className="text-sm mt-2">Reason: {rejectionReason}</p>
              )}
              {verificationStatus === 'approved' && (
                <p className="text-sm mt-2">Your account has been verified. You can now publish courses and receive from payments.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Verification Documents</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Full name / Business name</label>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          {/* File Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Click to upload or drag files</p>
            <p className="text-xs text-gray-500 mt-1">Supported: PDF, images, Word documents (max 10MB each)</p>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2 bg-gray-50 p-4 rounded">
              <p className="text-sm font-semibold text-gray-900">Selected Files ({files.length})</p>
              {files.map((file, idx) => (
                <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-400 mt-1" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                        <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Document Name</label>
                          <input
                            value={filesMeta[idx]?.document_name || ''}
                            onChange={(e) => setFilesMeta(prev => { const next = [...prev]; next[idx] = { ...(next[idx] || {}), document_name: e.target.value }; return next })}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="e.g. Certificate of Incorporation"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Document Type</label>
                          <select
                            value={filesMeta[idx]?.document_type || ''}
                            onChange={(e) => setFilesMeta(prev => { const next = [...prev]; next[idx] = { ...(next[idx] || {}), document_type: e.target.value }; return next })}
                            className="w-full px-3 py-2 border rounded"
                          >
                            <option value="">Select type</option>
                            <option value="registration">Registration / Incorporation</option>
                            <option value="tax">Tax ID / Business Tax</option>
                            <option value="proof_of_address">Proof of Address</option>
                            <option value="id">ID / Passport</option>
                            <option value="qualification">Qualification / Certificate</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any additional information you'd like to provide..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || files.length === 0}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit for Review
              </>
            )}
          </button>
        </form>
      </div>

      {/* Uploaded Documents History */}
      {uploadedDocuments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted Documents</h3>
          <div className="space-y-3">
            {uploadedDocuments.map((doc) => (
              <div key={doc.id} className={`p-4 rounded-lg border ${getStatusColor(doc.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(doc.status)}
                    <div className="flex-1">
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-xs mt-1 opacity-75">
                        Submitted: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                      {doc.rejection_reason && (
                        <p className="text-sm mt-2">Reason: {doc.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white rounded text-xs font-semibold capitalize">
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          What Documents Do We Need?
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Certificate of registration or incorporation</li>
          <li>• Tax identification number or business license</li>
          <li>• Proof of address (utility bill or official letter)</li>
          <li>• Identification of owner/director</li>
          <li>• Professional qualifications (for tutors)</li>
          <li>• Any relevant certifications</li>
        </ul>
      </div>
    </div>
  )
}
