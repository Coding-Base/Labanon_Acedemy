// frontend/src/components/Materials/MaterialsList.tsx

import React, { useEffect, useState } from 'react'
import { Edit2, Trash2, Loader, X, Upload } from 'lucide-react'
import api from '../../utils/axiosInterceptor'
import MaterialCard from './MaterialCard'

interface Material {
  id: string
  name: string
  description: string
  area: string
  creator_name: string
  topic_category: string
  price: number
  currency: string
  is_free: boolean
  user_has_access: boolean
  total_downloads: number
  created_at: string
}

interface MaterialsListProps {
  onRefresh?: () => void
}

function EditMaterialModal({ material, onClose, onSave }: { material: Material, onClose: () => void, onSave: (m: Material) => void }) {
  const [formData, setFormData] = useState({
    name: material.name,
    description: material.description,
    area: material.area,
    topic_category: material.topic_category,
    price: material.price,
    is_free: material.is_free,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('description', formData.description)
      data.append('area', formData.area)
      data.append('topic_category', formData.topic_category)
      data.append('price', String(formData.price))
      data.append('is_free', String(formData.is_free))
      if (imageFile) {
        data.append('image', imageFile)
      }

      const response = await api.patch(`/materials/materials/${material.id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onSave(response.data)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update material')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Edit Material</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <select required value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 bg-white">
                <option value="academy">Academy</option>
                <option value="research">Research</option>
                <option value="interview">Interview</option>
                <option value="science">Science</option>
                <option value="art">Art</option>
                <option value="discovery">Discovery</option>
                <option value="invention">Invention</option>
                <option value="project">Project</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic Category</label>
              <input required type="text" value={formData.topic_category} onChange={e => setFormData({...formData, topic_category: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input type="number" step="0.01" min="0" disabled={formData.is_free} value={formData.is_free ? 0 : formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 disabled:opacity-50" />
            </div>
            <div className="flex items-center h-[42px] px-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_free} onChange={e => setFormData({...formData, is_free: e.target.checked})} className="w-4 h-4 text-brand-600 rounded focus:ring-brand-600" />
                <span className="text-sm font-medium text-gray-700">Is Free?</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Update Image (Optional)</label>
            <div className="flex items-center gap-4">
              {(material as any).image_url && !imageFile && (
                <img src={(material as any).image_url} alt="Current" className="w-16 h-16 rounded object-cover border border-gray-200" />
              )}
              {imageFile && (
                <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center border border-gray-200">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 text-sm" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MaterialsList({ onRefresh }: MaterialsListProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)

  const fetchMaterials = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/materials/materials/')
      setMaterials(response.data.results || response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/materials/materials/${id}/`)
      setMaterials(prev => prev.filter(m => m.id !== id))
      setDeleteConfirm(null)
      alert('Material deleted successfully')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Delete failed')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No materials created yet</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">All Materials</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((material) => (
          <div key={material.id} className="relative">
            <MaterialCard
              material={material as any}
              isAdmin={true}
              onEdit={() => setEditingMaterial(material)}
              onDelete={() => setDeleteConfirm(material.id)}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirm === material.id && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Material?</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete "<strong>{material.name}</strong>"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editingMaterial && (
        <EditMaterialModal
          material={editingMaterial}
          onClose={() => setEditingMaterial(null)}
          onSave={(updatedMaterial) => {
            setMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m))
            setEditingMaterial(null)
          }}
        />
      )}
    </div>
  )
}
