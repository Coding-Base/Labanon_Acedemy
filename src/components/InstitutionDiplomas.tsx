// src/components/InstitutionDiplomas.tsx
import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
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
  GraduationCap,
  BookOpen,
  ClipboardList,
  Users,
  Briefcase,
  DollarSign,
  Info
} from 'lucide-react'
import { motion } from 'framer-motion'
import { SUPPORTED_CURRENCIES } from '../constants/currencies'

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
  currency?: string
  overview?: string
  admissions?: string
  academics?: string
  tuition_financing?: string
  careers?: string
  student_experience?: string
}

export default function InstitutionDiplomas({ darkMode }: { darkMode?: boolean }) {
  const [diplomas, setDiplomas] = useState<Diploma[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [institutionId, setInstitutionId] = useState<number | null>(null)
  const [institutionName, setInstitutionName] = useState<string | null>(null)
  const [institutionEmail, setInstitutionEmail] = useState<string | null>(null)
  const [creatorId, setCreatorId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'overview' | 'admissions' | 'academics' | 'tuition' | 'careers' | 'experience'>('basic')
  
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
    currency: 'NGN',
    overview: '',
    admissions: '',
    academics: '',
    tuition_financing: '',
    careers: '',
    student_experience: ''
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
            setInstitutionName(instRes.data.name)
            setInstitutionEmail(instRes.data.email)
          }
        } catch (instError: any) {
          if (!mounted) return
           if (instError.response?.status === 404) {
             // No institution found for this user
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
      payload.append('currency', formData.currency || 'NGN')
      payload.append('duration', formData.duration)
      payload.append('meeting_place', formData.meeting_place)
      payload.append('overview', formData.overview || '')
      payload.append('admissions', formData.admissions || '')
      payload.append('academics', formData.academics || '')
      payload.append('tuition_financing', formData.tuition_financing || '')
      payload.append('careers', formData.careers || '')
      payload.append('student_experience', formData.student_experience || '')
      
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
        overview: '',
        admissions: '',
        academics: '',
        tuition_financing: '',
        careers: '',
        student_experience: ''
      })
      setSelectedFile(null)
      setShowForm(false)
      setEditingId(null)
      setActiveTab('basic')
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
      currency: (diploma as any).currency || 'NGN',
      overview: (diploma as any).overview || '',
      admissions: (diploma as any).admissions || '',
      academics: (diploma as any).academics || '',
      tuition_financing: (diploma as any).tuition_financing || '',
      careers: (diploma as any).careers || '',
      student_experience: (diploma as any).student_experience || ''
    })
    setSelectedFile(null) 
    setEditingId(diploma.id)
    setShowForm(true)
    setActiveTab('basic')
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
                overview: '',
                admissions: '',
                academics: '',
                tuition_financing: '',
                careers: '',
                student_experience: ''
              })
              setSelectedFile(null)
              setActiveTab('basic')
            }
          }}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-yellow-600 text-white rounded-lg font-semibold flex items-center gap-2"
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
          
          {institutionName && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Institution</p>
              <p className="font-bold text-gray-900">{institutionName}</p>
              {institutionEmail && <p className="text-xs text-gray-500 mt-2">{institutionEmail}</p>}
            </div>
          )}
          
          {/* Tab Navigation */}
          <div className="mb-6 border-b overflow-x-auto flex gap-1">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'basic'
                  ? 'border-yellow-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Info className="w-4 h-4" /> Basic Info
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-yellow-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => setActiveTab('admissions')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'admissions'
                  ? 'border-yellow-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Admissions
            </button>
            <button
              onClick={() => setActiveTab('academics')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'academics'
                  ? 'border-yellow-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Academics
            </button>
            <button
              onClick={() => setActiveTab('tuition')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'tuition'
                  ? 'border-yellow-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Tuition
            </button>
            <button
              onClick={() => setActiveTab('careers')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'careers'
                  ? 'border-yellow-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Careers
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'experience'
                  ? 'border-yellow-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" /> Experience
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the diploma program..."
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                    disabled={submitting}
                  />
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
                            alt="Selected diploma image" 
                            className="h-32 object-cover rounded-md mb-2 shadow-sm"
                            width={192}
                            height={128}
                            loading="lazy"
                            decoding="async"
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

                  {imageTab === 'url' && formData.image && !formData.image.startsWith('blob:') && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <img
                        src={formData.image}
                        alt="Diploma preview"
                        className="w-full max-w-xs h-40 object-cover rounded-lg border"
                        width={320}
                        height={200}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Invalid+Image';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Program Overview</label>
                <ReactQuill
                  value={formData.overview || ''}
                  onChange={(value) => setFormData({ ...formData, overview: value })}
                  theme="snow"
                  placeholder="Enter program overview..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['blockquote', 'code-block'],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            )}

            {/* Admissions Tab */}
            {activeTab === 'admissions' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admissions Information</label>
                <ReactQuill
                  value={formData.admissions || ''}
                  onChange={(value) => setFormData({ ...formData, admissions: value })}
                  theme="snow"
                  placeholder="Enter admissions requirements and information..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['blockquote', 'code-block'],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            )}

            {/* Academics Tab */}
            {activeTab === 'academics' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Details & Curriculum</label>
                <ReactQuill
                  value={formData.academics || ''}
                  onChange={(value) => setFormData({ ...formData, academics: value })}
                  theme="snow"
                  placeholder="Enter academic details and curriculum information..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['blockquote', 'code-block'],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            )}

            {/* Tuition Tab */}
            {activeTab === 'tuition' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tuition & Financing</label>
                <ReactQuill
                  value={formData.tuition_financing || ''}
                  onChange={(value) => setFormData({ ...formData, tuition_financing: value })}
                  theme="snow"
                  placeholder="Enter tuition fees and financing options..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['blockquote', 'code-block'],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            )}

            {/* Careers Tab */}
            {activeTab === 'careers' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Career Prospects</label>
                <ReactQuill
                  value={formData.careers || ''}
                  onChange={(value) => setFormData({ ...formData, careers: value })}
                  theme="snow"
                  placeholder="Enter career prospects and alumni success stories..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['blockquote', 'code-block'],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student Experience</label>
                <ReactQuill
                  value={formData.student_experience || ''}
                  onChange={(value) => setFormData({ ...formData, student_experience: value })}
                  theme="snow"
                  placeholder="Enter student experience and testimonials..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['blockquote', 'code-block'],
                      ['link'],
                      ['clean']
                    ]
                  }}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-yellow-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
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
                    aria-label={diploma.published ? 'Unpublish diploma' : 'Publish diploma'}
                  >
                    {diploma.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(diploma)}
                    className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors"
                    title="Edit"
                    aria-label="Edit diploma"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(diploma.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                    title="Delete"
                    aria-label="Delete diploma"
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