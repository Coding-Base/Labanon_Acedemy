// frontend/src/components/Materials/DownloadsCard.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DownloadCloud, TrendingUp, Loader } from 'lucide-react'
import api from '../../utils/axiosInterceptor'

interface DownloadStats {
  total_downloads: number
  total_materials: number
}

interface DownloadsCardProps {
  darkMode?: boolean
}

export default function DownloadsCard({ darkMode = false }: DownloadsCardProps) {
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
      <div className={`rounded-lg shadow p-6 animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <div className={`h-12 rounded mb-4 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
        <div className={`h-8 rounded w-1/3 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
      </div>
    )
  }

  return (
    <div
      onClick={handleNavigateToResources}
      className={`rounded-lg shadow-sm border-2 p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 ${
        darkMode
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500'
          : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg shadow-md ${darkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
            <DownloadCloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Materials Downloaded</p>
            <h3 className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
              {stats?.total_downloads || 0}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <TrendingUp className={`w-5 h-5 mb-2 ml-auto ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
          <p className={`text-xs font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Discover More</p>
        </div>
      </div>

      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-blue-200'}`}>
        <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
          You have access to <strong>{stats?.total_materials || 0}</strong> materials. Click to browse and download more from our resource library.
        </p>
      </div>
    </div>
  )
}
