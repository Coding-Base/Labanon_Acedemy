// frontend/src/components/Materials/MaterialsActivitySection.tsx

import React, { useEffect, useState } from 'react'
import { Download, ShoppingCart, Clock, Loader, AlertCircle } from 'lucide-react'
import api from '../../utils/axiosInterceptor'

interface Activity {
  type: 'download' | 'purchase'
  user_email: string
  material_name: string
  amount?: number
  time_ago: string
  created_at: string
}

export default function MaterialsActivitySection() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get('/materials/materials/activities/')
        setActivities(response.data)
      } catch (err) {
        console.error('Error fetching activities:', err)
        setError('Failed to load activities')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'download':
        return <Download className="w-5 h-5 text-blue-600" />
      case 'purchase':
        return <ShoppingCart className="w-5 h-5 text-green-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    if (type === 'download') return 'bg-blue-50 border-blue-200'
    if (type === 'purchase') return 'bg-green-50 border-green-200'
    return 'bg-gray-50 border-gray-200'
  }

  const getActivityMessage = (activity: Activity) => {
    if (activity.type === 'download') {
      return (
        <>
          <strong>{activity.user_email}</strong> downloaded{' '}
          <strong>"{activity.material_name}"</strong>
        </>
      )
    } else {
      return (
        <>
          <strong>₦{(activity.amount || 0).toLocaleString()}</strong> payment from{' '}
          <strong>{activity.user_email}</strong> for{' '}
          <strong>"{activity.material_name}"</strong>
        </>
      )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="flex justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-center text-gray-500 py-8">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>

      <div className="space-y-3">
        {activities.map((activity, idx) => (
          <div
            key={idx}
            className={`border-2 rounded-lg p-4 ${getActivityColor(activity.type)} hover:shadow-sm transition-shadow`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  {getActivityMessage(activity)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {activity.time_ago}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        Last updated: {new Date().toLocaleTimeString()}
      </p>
    </div>
  )
}
