// frontend/src/components/Materials/DownloadsCard.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DownloadCloud, TrendingUp, Loader } from 'lucide-react'
import api from '../../utils/axiosInterceptor'

interface DownloadStats {
  total_downloads: number
  total_materials: number
}

export default function DownloadsCard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DownloadStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDownloadStats = async () => {
      try {
        const response = await api.get('/materials/materials/my_downloads/')
        setStats(response.data)
      } catch (error) {
        console.error('Error fetching download stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDownloadStats()
  }, [])

  const handleNavigateToResources = () => {
    navigate('/marketplace', { state: { activeTab: 'resources' } })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      </div>
    )
  }

  return (
    <div
      onClick={handleNavigateToResources}
      className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-sm border-2 border-blue-200 p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-300 hover:scale-105"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500 rounded-lg shadow-md">
            <DownloadCloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Materials Downloaded</p>
            <h3 className="text-3xl font-bold text-gray-900">
              {stats?.total_downloads || 0}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <TrendingUp className="w-5 h-5 text-blue-500 ml-auto mb-2" />
          <p className="text-xs text-blue-600 font-semibold">Discover More</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-gray-600 leading-relaxed">
          You have access to <strong>{stats?.total_materials || 0}</strong> materials. Click to browse and download more from our resource library.
        </p>
      </div>
    </div>
  )
}
