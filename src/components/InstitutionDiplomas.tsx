// src/components/InstitutionDiplomas.tsx
import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Upload, 
  Image as ImageIcon, 
  GraduationCap 
} from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Diploma {
  id: number
  title: string
  description: string
  price: number
  duration: string
  start_date: string
  end_date: string
  meeting_place: string
  image: string
  published: boolean
  created_at: string
}

interface DiplomaFormData {
  title: string
  description: string
  price: string
  duration: string
  start_date: string
  end_date: string
  meeting_place: string
  image: string // Used for preview URL
}

export default function InstitutionDiplomas() {
  const [diplomas, setDiplomas] = useState<Diploma[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [institutionId, setInstitutionId] = useState<number | null>(null)
  const [creatorId, setCreatorId] = useState<number | null>(null)
  
  // Image handling
  const [imageTab, setImageTab] = useState<'url' | 'upload'>('upload') 
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState<DiplomaFormData>({
    title: '',
    description: '',
    price: '',
    duration: '',
    start_date: '',
    end_date: '',
    meeting_place: '',
    image: '',
  })

  const loadDiplomas = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('access')
      if (!token) {
        setError('Not authenticated. Please log in.')
        return
      }
      const res = await axios.get(`${API_BASE}/diplomas/my_diplomas/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDiplomas(res.data)
    } catch (err: any) {
      console.error('[InstitutionDiplomas] Failed to load diplomas:', err)
      const status = err.response?.status
      if (status === 401 || status === 403) {
        setError('Session expired. Please refresh or log in again.')
      } else {
        setError('Failed to load diplomas')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true;
    const loadIds = async () => {
      try {
        const token = localStorage.getItem('access')
        if (!token) return

        // Get current user ID
        const userRes = await axios.get(`${API_BASE}/users/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem('access')
            window.location.href = '/login'
          }
          throw err
        })
        
        if (!mounted) return
        setCreatorId(userRes.data.id)

        // Get institution for this user
        try {
          const instRes = await axios.get(`${API_BASE}/institutions/my_institution/`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (mounted) {
            setInstitutionId(instRes.data.id)
          }
        } catch (instError: any) {
          if (!mounted) return
          if (instError.response?.status === 404) {
             console.log('No institution found')
          }
        }
      } catch (err: any) {
         // Error handling
      }
    }
    loadIds()
    loadDiplomas()
    
    return () => {
      mounted = false
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create a blob URL for preview immediately
      setFormData({ ...formData, image: URL.createObjectURL(file) })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.title.trim() || !formData.meeting_place.trim()) {
      setError('Please fill in required fields')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('access')

      if (!institutionId || !creatorId) {
        setError('Institution information not loaded. Please refresh.')
        return
      }

      // --- USE FORM DATA FOR FILE UPLOAD ---
      const payload = new FormData()
      payload.append('institution', String(institutionId))
      payload.append('creator', String(creatorId))
      payload.append('title', formData.title)
      payload.append('description', formData.description)
      payload.append('price', formData.price)
      payload.append('duration', formData.duration)
      payload.append('meeting_place', formData.meeting_place)
      
      if (formData.start_date) payload.append('start_date', formData.start_date)
      if (formData.end_date) payload.append('end_date', formData.end_date)

      // Handle Image Logic
      if (selectedFile) {
          // If a file is selected, send it as 'image_upload' (matches serializer FileField)
          payload.append('image_upload', selectedFile) 
      } else if (imageTab === 'url' && formData.image && !formData.image.startsWith('blob:')) {
          // If using URL mode and it's NOT a blob preview, send as 'image' (matches serializer CharField)
          payload.append('image', formData.image)
      }
      // Note: If selectedFile is null and formData.image is a blob, we send nothing for image
      // This preserves the existing image on the backend during an update.

      const config = {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' 
        },
      }

      if (editingId) {
        // Use PATCH for updates (Fixes 400 Bad Request by allowing partial updates)
        await axios.patch(`${API_BASE}/diplomas/${editingId}/`, payload, config)
        setSuccess('Diploma updated successfully!')
      } else {
        await axios.post(`${API_BASE}/diplomas/`, payload, config)
        setSuccess('Diploma created successfully!')
      }

      // Reset Form
      setFormData({
        title: '',
        description: '',
        price: '',
        duration: '',
        start_date: '',
        end_date: '',
        meeting_place: '',
        image: '',
      })
      setSelectedFile(null)
      setShowForm(false)
      setEditingId(null)
      await loadDiplomas()
    } catch (err: any) {
      console.error(err)
      // Extract specific field errors if available
      const data = err.response?.data;
      let msg = 'Failed to save diploma';
      if (typeof data === 'object') {
          const errors = Object.values(data).flat().join(', ');
          if (errors) msg = errors;
      }
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (diploma: Diploma) => {
    setFormData({
      title: diploma.title,
      description: diploma.description,
      price: diploma.price.toString(),
      duration: diploma.duration,
      start_date: diploma.start_date || '',
      end_date: diploma.end_date || '',
      meeting_place: diploma.meeting_place,
      image: diploma.image || '',
    })
    setSelectedFile(null) 
    setEditingId(diploma.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this diploma?')) return

    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/diplomas/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSuccess('Diploma deleted successfully!')
      await loadDiplomas()
    } catch (err: any) {
      setError('Failed to delete diploma')
    }
  }

  const handlePublish = async (id: number, currentPublished: boolean) => {
    try {
      const token = localStorage.getItem('access')
      await axios.patch(`${API_BASE}/diplomas/${id}/`, 
        { published: !currentPublished },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSuccess(currentPublished ? 'Diploma unpublished!' : 'Diploma published!')
      await loadDiplomas()
    } catch (err: any) {
      setError(currentPublished ? 'Failed to unpublish diploma' : 'Failed to publish diploma')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Diploma Programs</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            if (!showForm) {
              setFormData({
                title: '',
                description: '',
                price: '',
                duration: '',
                start_date: '',
                end_date: '',
                meeting_place: '',
                image: '',
              })
              setSelectedFile(null)
            }
          }}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Diploma
        </motion.button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-600 text-sm">{success}</p>
        </div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? 'Edit Diploma' : 'Create New Diploma'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Advanced Welding Certificate"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={submitting}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="50000"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the diploma program..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 6 months"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Place *</label>
                <input
                  type="text"
                  name="meeting_place"
                  value={formData.meeting_place}
                  onChange={handleChange}
                  placeholder="Physical venue location"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Diploma Image</label>
              <div className="flex gap-2 mb-3 border-b">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-4 py-2 font-medium transition ${
                    imageTab === 'upload'
                      ? 'text-green-600 border-b-2 border-yellow-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-4 py-2 font-medium transition ${
                    imageTab === 'url'
                      ? 'text-green-600 border-b-2 border-yellow-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Image URL
                </button>
              </div>

              {imageTab === 'upload' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="image-upload"
                    disabled={submitting}
                  />
                  <div className="flex flex-col items-center justify-center">
                    {formData.image && formData.image.startsWith('blob:') ? (
                        <img 
                            src={formData.image} 
                            alt="Selected" 
                            className="h-32 object-cover rounded-md mb-2 shadow-sm"
                        />
                    ) : (
                        <div className="mb-2 p-3 bg-yellow-100 rounded-full">
                            <Upload className="w-6 h-6 text-green-600" />
                        </div>
                    )}
                    <p className="font-medium text-gray-700">
                        {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG, GIF up to 5MB</p>
                  </div>
                </div>
              )}

              {imageTab === 'url' && (
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  disabled={submitting}
                />
              )}

              {/* Existing Image Preview (if not in upload mode or if no new file selected) */}
              {imageTab === 'url' && formData.image && !formData.image.startsWith('blob:') && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <img
                    src={formData.image}
                    alt="Diploma preview"
                    className="w-full max-w-xs h-40 object-cover rounded-lg border"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Invalid+Image';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? 'Saving...' : editingId ? 'Update Diploma' : 'Create Diploma'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading && !showForm ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : diplomas.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-gray-500" />
            </div>
          <p className="text-gray-500 text-lg">No diplomas yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {diplomas.map(diploma => (
            <motion.div
              key={diploma.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-gray-900 flex-1 text-lg line-clamp-2">{diploma.title}</h3>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => handlePublish(diploma.id, diploma.published)}
                    className={`p-2 rounded-lg transition-colors ${
                      diploma.published
                        ? 'hover:bg-orange-50 text-orange-600'
                        : 'hover:bg-yellow-50 text-green-600'
                    }`}
                    title={diploma.published ? 'Unpublish' : 'Publish'}
                  >
                    {diploma.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(diploma)}
                    className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(diploma.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {diploma.image && (
                  <div className="w-full h-32 mb-4 overflow-hidden rounded-lg bg-gray-100">
                      <img 
                        src={diploma.image.startsWith('http') ? diploma.image : `${API_BASE.replace('/api', '')}${diploma.image}`} 
                        alt={diploma.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                  </div>
              )}

              <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">{diploma.description}</p>

              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-green-700">₦{diploma.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{diploma.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold truncate max-w-[150px]">{diploma.meeting_place}</span>
                </div>
                {diploma.start_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Starts:</span>
                    <span className="font-semibold">{new Date(diploma.start_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                 <span className="text-xs text-gray-400">ID: {diploma.id}</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  diploma.published
                    ? 'bg-yellow-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {diploma.published ? 'Published' : 'Draft'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}