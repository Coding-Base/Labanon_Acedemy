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
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedFile[]>([])
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
        ? `/institutions/verification-documents/`
        : `/tutors/verification-documents/`

      const res = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUploadedDocuments(res.data.documents || [])
      setVerificationStatus(res.data.status || 'pending')
      setRejectionReason(res.data.rejection_reason || '')
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      showToast('Please select at least one file', 'error')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) {
        showToast('Please log in', 'error')
        return
      }

      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      formData.append('comments', comments)

      const endpoint = entityType === 'institution'
        ? `/institutions/submit-verification/`
        : `/tutors/submit-verification/`

      const res = await axios.post(`${API_BASE}${endpoint}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      showToast('Documents submitted successfully for review', 'success')
      setFiles([])
      setComments('')
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
                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
