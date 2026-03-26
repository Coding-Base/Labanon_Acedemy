import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Download,
  Upload,
  Trash2,
  Edit2,
  Plus,
  FileText,
  AlertCircle,
  Check,
  X,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface LegalDocument {
  id: number
  document_type: string
  title: string
  description: string
  document_file: string
  version: string
  is_active: boolean
  created_at: string
  updated_at: string
  updated_by?: number
}

interface DocumentTypeOption {
  value: string
  label: string
}

const DOCUMENT_TYPES: DocumentTypeOption[] = [
  { value: 'terms_of_service', label: 'Terms of Service' },
  { value: 'creator_agreement', label: 'Creator Agreement' },
  { value: 'data_privacy', label: 'Data Privacy Policy' },
  { value: 'intellectual_property', label: 'Intellectual Property Agreement' },
  { value: 'payment_terms', label: 'Payment Terms & Conditions' },
  { value: 'code_of_conduct', label: 'Code of Conduct' },
  { value: 'other', label: 'Other' },
]

export default function LegalDocumentsManagement() {
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    document_type: '',
    title: '',
    description: '',
    version: '1.0',
    is_active: true,
    document_file: '',
  })

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/legal-documents/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const payload = res.data
      const items = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : [])
      setDocuments(items)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load documents')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function saveDocument() {
    if (!formData.document_type || !formData.title) {
      setError('Please fill in all required fields')
      return
    }

    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('access')

      if (editingDocument) {
        // Update existing document
        const res = await axios.patch(
          `${API_BASE}/legal-documents/${editingDocument.id}/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setDocuments(
          documents.map(doc =>
            doc.id === editingDocument.id ? res.data : doc
          )
        )
        alert('Document updated successfully!')
      } else {
        // Create new document
        const res = await axios.post(
          `${API_BASE}/legal-documents/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setDocuments([...documents, res.data])
        alert('Document created successfully!')
      }

      resetForm()
      setShowForm(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save document')
    } finally {
      setSaving(false)
    }
  }

  async function deleteDocument(id: number) {
    if (!window.confirm('Are you sure you want to delete this document?')) return

    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/legal-documents/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDocuments(documents.filter(doc => doc.id !== id))
      alert('Document deleted successfully!')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete document')
    }
  }

  function resetForm() {
    setFormData({
      document_type: '',
      title: '',
      description: '',
      version: '1.0',
      is_active: true,
      document_file: '',
    })
    setEditingDocument(null)
  }

  function openEditForm(doc: LegalDocument) {
    setEditingDocument(doc)
    setFormData({
      document_type: doc.document_type,
      title: doc.title,
      description: doc.description,
      version: doc.version,
      is_active: doc.is_active,
      document_file: doc.document_file,
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading documents...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Legal Documents Management</h1>
            <p className="text-gray-600 mt-1">Manage agreement and legal documents for download</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Document
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

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {documents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents yet</p>
            </div>
          ) : (
            documents.map(doc => (
              <div
                key={doc.id}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{doc.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      v{doc.version} • {DOCUMENT_TYPES.find(dt => dt.value === doc.document_type)?.label}
                    </p>
                  </div>
                  {doc.is_active ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <Check className="w-3 h-3" />
                      Active
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      <X className="w-3 h-3" />
                      Inactive
                    </div>
                  )}
                </div>

                {/* Description */}
                {doc.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                )}

                {/* Meta */}
                <div className="text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  Updated {new Date(doc.updated_at).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={doc.document_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button
                    onClick={() => openEditForm(doc)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingDocument ? 'Edit Document' : 'Add New Document'}
              </h2>

              <div className="space-y-4">
                {/* Document Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Document Type *
                  </label>
                  <select
                    value={formData.document_type}
                    onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select document type</option>
                    {DOCUMENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Version */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Document File URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Document File URL
                  </label>
                  <input
                    type="text"
                    value={formData.document_file}
                    onChange={(e) => setFormData({ ...formData, document_file: e.target.value })}
                    placeholder="https://example.com/document.pdf"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-900">
                    Active (visible for download)
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    resetForm()
                    setShowForm(false)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDocument}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
