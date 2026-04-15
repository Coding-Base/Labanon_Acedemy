// frontend/src/components/Materials/CreateMaterialForm.tsx

import React, { useState } from 'react'
import { Upload, Link as LinkIcon, AlertCircle } from 'lucide-react'
import api from '../../utils/axiosInterceptor'

const AREAS = [
  { value: 'academy', label: 'Academy' },
  { value: 'research', label: 'Research' },
  { value: 'interview', label: 'Interview Prep' },
  { value: 'science', label: 'Science' },
  { value: 'art', label: 'Art' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'invention', label: 'Invention' },
  { value: 'project', label: 'Project' },
  { value: 'other', label: 'Other' },
]

interface CreateMaterialFormProps {
  onSuccess?: () => void
}

export default function CreateMaterialForm({ onSuccess }: CreateMaterialFormProps) {
  const [fileSource, setFileSource] = useState<'upload' | 'gdrive'>('upload')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    area: 'academy',
    creator_name: '',
    licenses: '',
    topic_category: '',
    price: '0',
    currency: 'NGN',
    file_url: '',
    image_url: '',
    image_name: '',
    gdrive_link: '',
  })

  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null)
  const [imageInfo, setImageInfo] = useState<{ name: string; url: string } | null>(null)

  // Handle image upload (thumbnail)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image exceeds 5MB limit')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await api.post('/materials/materials/upload_file/', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setFormData(prev => ({
        ...prev,
        image_url: response.data.file_url,
        image_name: response.data.file_name,
      }))

      setImageInfo({ name: response.data.file_name, url: response.data.file_url })
      setSuccess('Image uploaded successfully')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await api.post('/materials/materials/upload_file/', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setFormData(prev => ({
        ...prev,
        file_url: response.data.file_url,
        file_size: response.data.file_size,
      }))

      setFileInfo({
        name: response.data.file_name,
        size: (response.data.file_size / 1024 / 1024).toFixed(2) + ' MB',
      })

      setSuccess('File uploaded successfully')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Handle Google Drive link validation
  const handleGDriveValidation = async () => {
    if (!formData.gdrive_link) {
      setError('Please paste a Google Drive link')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const response = await api.post('/materials/materials/validate_gdrive/', {
        gdrive_link: formData.gdrive_link,
      })

      // For Google Drive, use 0 as placeholder since we can't determine actual size
      setFormData(prev => ({
        ...prev,
        file_size: response.data.file_size === 'Unknown (from Google Drive)' ? 0 : response.data.file_size,
      }))

      setFileInfo({
        name: response.data.file_name,
        size: response.data.file_size,
      })

      setSuccess('Google Drive link validated')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Validation failed')
    } finally {
      setUploading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.name || !formData.creator_name || !formData.licenses || !formData.topic_category) {
      setError('Please fill all required fields')
      return
    }

    // Validate file
    if (fileSource === 'upload' && !formData.file_url) {
      setError('Please upload a file')
      return
    }

    if (fileSource === 'gdrive' && !formData.gdrive_link) {
      setError('Please provide a Google Drive link')
      return
    }

    setLoading(true)

    try {
      // Prepare payload and normalize file_url
      const prepared = { ...formData }
      // Trim strings
      if (prepared.file_url && typeof prepared.file_url === 'string') prepared.file_url = prepared.file_url.trim()
      if (prepared.gdrive_link && typeof prepared.gdrive_link === 'string') prepared.gdrive_link = prepared.gdrive_link.trim()

      // If file_url is relative (starts with '/'), make it absolute using current origin
      if (prepared.file_url && typeof prepared.file_url === 'string' && prepared.file_url.startsWith('/')) {
        prepared.file_url = `${window.location.origin}${prepared.file_url}`
      }

      // If using Google Drive, ensure file_url is null to avoid URL validation errors
      if (fileSource === 'gdrive') {
        prepared.file_url = null
      }

      const payload = {
        ...prepared,
        file_source: fileSource,
        price: Number(formData.price) || 0,
        is_published: true,
      }

      const response = await api.post('/materials/materials/', payload)

      setSuccess('Material created successfully!')
      setFormData({
        name: '',
        description: '',
        area: 'academy',
        creator_name: '',
        licenses: '',
        topic_category: '',
        price: '0',
        currency: 'NGN',
        file_url: '',
        image_url: '',
        image_name: '',
        gdrive_link: '',
      })
      setFileInfo(null)

      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.[0] || 'Failed to create material')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Material</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Material Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Physics Workbook 2024"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the material..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Area and Topic Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Area *
            </label>
            <select
              value={formData.area}
              onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            >
              {AREAS.map(area => (
                <option key={area.value} value={area.value}>{area.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Topic Category *
            </label>
            <input
              type="text"
              value={formData.topic_category}
              onChange={(e) => setFormData(prev => ({ ...prev, topic_category: e.target.value }))}
              placeholder="e.g., Maths, Physics, Biology"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Creator Name and Licenses */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Creator Name *
            </label>
            <input
              type="text"
              value={formData.creator_name}
              onChange={(e) => setFormData(prev => ({ ...prev, creator_name: e.target.value }))}
              placeholder="Author name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              License *
            </label>
            <input
              type="text"
              value={formData.licenses}
              onChange={(e) => setFormData(prev => ({ ...prev, licenses: e.target.value }))}
              placeholder="e.g., CC-BY-4.0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* File Source Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            File Source *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="fileSource"
                value="upload"
                checked={fileSource === 'upload'}
                onChange={(e) => setFileSource(e.target.value as 'upload' | 'gdrive')}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Direct Upload</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="fileSource"
                value="gdrive"
                checked={fileSource === 'gdrive'}
                onChange={(e) => setFileSource(e.target.value as 'upload' | 'gdrive')}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Google Drive Link</span>
            </label>
          </div>
        </div>

        {/* File Upload / Google Drive Link */}
        {fileSource === 'upload' ? (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Upload File (Max 10MB) *
            </label>
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-brand-500 transition-colors block">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-700">Click to upload or drag file here</span>
              </div>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
              />
            </label>
            {fileInfo && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {fileInfo.name} ({fileInfo.size})
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Google Drive Link *
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.gdrive_link}
                onChange={(e) => setFormData(prev => ({ ...prev, gdrive_link: e.target.value }))}
                placeholder="https://drive.google.com/file/d/..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleGDriveValidation}
                disabled={uploading}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Validate
              </button>
            </div>
            {fileInfo && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {fileInfo.name}
              </p>
            )}
          </div>
        )}

        {/* Thumbnail / Cover Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Thumbnail Image (optional, max 5MB)
          </label>
          <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-brand-500 transition-colors block">
            <div className="flex items-center gap-3">
              <input
                type="file"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                accept="image/*"
              />
              <div className="flex flex-col">
                <span className="text-sm text-gray-700">Click to upload thumbnail</span>
                {imageInfo && (
                  <img src={imageInfo.url} alt={imageInfo.name} className="mt-2 w-40 h-24 object-cover rounded" />
                )}
              </div>
            </div>
          </label>
          {imageInfo && (
            <p className="mt-2 text-sm text-green-600">✓ {imageInfo.name}</p>
          )}
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Price (0 = FREE) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0"
              min="0"
              step="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Material...' : 'Create Material'}
        </button>

      </form>
    </div>
  )
}
