// frontend/src/components/Materials/MaterialsList.tsx

import React, { useEffect, useState } from 'react'
import { Edit2, Trash2, Loader } from 'lucide-react'
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
  total_downloads: number
  created_at: string
}

interface MaterialsListProps {
  onRefresh?: () => void
}

export default function MaterialsList({ onRefresh }: MaterialsListProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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
              material={material}
              isAdmin={true}
              onEdit={() => {
                // Edit functionality to be implemented
                alert('Edit functionality coming soon')
              }}
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
    </div>
  )
}
