// frontend/src/components/Materials/ResourcesList.tsx

import React, { useEffect, useState, useCallback } from 'react'
import { Search, Loader, AlertCircle } from 'lucide-react'
import api from '../../utils/axiosInterceptor'
import MaterialCard from './MaterialCard'

interface Material {
  id: string
  name: string
  description: string
  area: string
  creator_name: string
  topic_category: string
  image_url?: string
  price: number
  currency: string
  is_free: boolean
  user_has_access: boolean
  total_downloads: number
  created_at: string
}

const AREAS = [
  { value: '', label: 'All Areas' },
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

export default function ResourcesList() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  
  // Debounce timeout
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Fetch materials with filters and search
  const fetchMaterials = useCallback(async (search: string, area: string) => {
    setSearching(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (area) params.area = area
      params.ordering = '-created_at'

      const response = await api.get('/materials/materials/', { params })
      setMaterials(response.data.results || response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load resources')
    } finally {
      setSearching(false)
    }
  }, [])

  // Load initial materials
  useEffect(() => {
    fetchMaterials('', '')
    setLoading(false)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer) clearTimeout(debounceTimer)

    // Set new timer
    const timer = setTimeout(() => {
      fetchMaterials(searchTerm, areaFilter)
    }, 500)

    setDebounceTimer(timer)

    // Cleanup
    return () => clearTimeout(timer)
  }, [searchTerm, areaFilter, fetchMaterials])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 sticky top-0 z-10">
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials (e.g., Maths, Physics)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searching && (
              <Loader className="absolute right-3 top-3 w-5 h-5 text-blue-600 animate-spin" />
            )}
          </div>

          {/* Area Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Area:
            </label>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {AREAS.map(area => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Error loading resources</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {searching && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          Searching...
        </div>
      )}

      {/* Results */}
      {materials.length === 0 && !searching ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {searchTerm || areaFilter ? 'No resources found matching your search' : 'No resources available'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-6">
            Found <strong>{materials.length}</strong> resource{materials.length !== 1 ? 's' : ''}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map(material => (
              <MaterialCard
                key={material.id}
                material={material}
                onPurchase={() => {
                  // Add to cart logic
                  console.log('Add', material.id, 'to cart')
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
