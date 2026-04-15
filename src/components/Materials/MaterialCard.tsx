// frontend/src/components/Materials/MaterialCard.tsx

import React from 'react'
import { FileText, Download, ShoppingCart, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/axiosInterceptor'


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

interface MaterialCardProps {
  material: Material
  onDownload?: () => void
  onPurchase?: () => void
  isAdmin?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export default function MaterialCard({
  material,
  onDownload,
  onPurchase,
  isAdmin = false,
  onEdit,
  onDelete
}: MaterialCardProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const response = await api.post(`/materials/materials/${material.id}/download/`)
      // Download link sent to email, show toast
      alert('Download link sent to your email!')
      onDownload?.()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Download failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    // Add to cart logic here
    onPurchase?.()
  }

  const areaColors: Record<string, string> = {
    academy: 'bg-blue-100 text-blue-700',
    research: 'bg-purple-100 text-purple-700',
    interview: 'bg-orange-100 text-orange-700',
    science: 'bg-green-100 text-green-700',
    art: 'bg-pink-100 text-pink-700',
    discovery: 'bg-indigo-100 text-indigo-700',
    invention: 'bg-cyan-100 text-cyan-700',
    project: 'bg-yellow-100 text-yellow-700',
    other: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full border border-gray-200">
      
      {/* Header / Thumbnail */}
      <div className="relative">
        {material.image_url ? (
          <div className="h-40 w-full overflow-hidden">
            <img src={material.image_url} alt={material.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 w-full" />
        )}

        <div className="absolute left-3 top-3">
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${areaColors[material.area] || areaColors.other}`}>
            {material.area.charAt(0).toUpperCase() + material.area.slice(1)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {material.name}
        </h3>

        {/* Creator */}
        <p className="text-sm text-gray-600 mb-3">
          <span className="font-semibold">By:</span> {material.creator_name}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
          {material.description || 'Educational material'}
        </p>

        {/* Topic category */}
        <p className="text-xs text-gray-500 mb-4">
          <span className="font-semibold">Topic:</span> {material.topic_category}
        </p>

        {/* Downloads counter */}
        <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
          <Download className="w-4 h-4" />
          <span>{material.total_downloads} downloads</span>
        </div>

      </div>

      {/* Footer with price and action */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        
        {/* Price */}
        <div className="mb-4">
          {material.is_free ? (
            <span className="text-lg font-bold text-green-600">FREE</span>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {material.currency} {Number(material.price).toLocaleString()}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {isAdmin ? (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        ) : (
          <>
            {material.user_has_access ? (
              <button
                onClick={handleDownload}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Preparing...' : 'Download Now'}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            )}
          </>
        )}

      </div>
    </div>
  )
}
