// frontend/src/components/Materials/MaterialCard.tsx

import React from 'react'
import { FileText, Download, ShoppingCart, Lock, Loader2 } from 'lucide-react'
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
      
      if (response.data.email_sent) {
        alert('✓ Download link sent to your email!')
      } else if (response.data.email_error) {
        alert(`⚠ Download link generated but email failed to send.\nError: ${response.data.email_error}\nDirect URL: ${response.data.download_url}`)
      }
      onDownload?.()
    } catch (error: any) {
      // Check if error is 401 Unauthorized (user not authenticated)
      if (error.response?.status === 401) {
        const currentPath = window.location.pathname + window.location.search
        // Preserve current URL and material id so we can trigger download after sign-in
        navigate(`/login?next=${encodeURIComponent(currentPath)}&pendingDownload=${material.id}`, {
          state: { message: 'Please sign in to download materials' }
        })
        return
      }
      
      const errorMessage = error.response?.data?.error || error.message || 'Download failed'
      alert(`❌ ${errorMessage}`)
      console.error('Download error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    // Redirect unauthenticated users to sign-in before checkout
    const currentPath = window.location.pathname + window.location.search
    const token = localStorage.getItem('access')
    if (!token) {
      navigate(`/login?next=${encodeURIComponent(currentPath)}&pendingPurchase=${material.id}`, {
        state: { message: 'Please sign in to purchase materials' }
      })
      return
    }

    // Initiate single-item payment for this material
    ;(async () => {
      setLoading(true)
      try {
        // Compute amount with platform fee (5%) to match cart logic
        const rawPrice = Number(material.price) || 0
        const platformFee = rawPrice * 0.05
        const finalAmount = +(rawPrice + platformFee).toFixed(2)

        const res = await api.post('/payments/initiate/', {
          item_type: 'material',
          item_id: material.id,
          amount: finalAmount,
          currency: 'NGN'
        })

        // Store payment metadata for verification flow
        sessionStorage.setItem('paymentReference', res.data.reference || '')
        sessionStorage.setItem('paymentItemType', 'material')
        sessionStorage.setItem('paymentItemId', material.id)
        sessionStorage.setItem('paymentMethod', 'paystack')

        // Redirect to payment provider if provided
        if (res.data.authorization_url) {
          window.location.href = res.data.authorization_url
        } else if (res.data.link) {
          window.location.href = res.data.link
        } else if (res.data.reference) {
          navigate(`/payment?reference=${res.data.reference}&method=paystack`)
        } else {
          alert('Failed to initiate payment. Please try again.')
        }
      } catch (err: any) {
        console.error('Payment initiation failed:', err)
        if (err.response?.status === 401) {
          // Token invalid — force login
          localStorage.removeItem('access')
          navigate(`/login?next=${encodeURIComponent(currentPath)}&pendingPurchase=${material.id}`)
        } else {
          alert(err.response?.data?.detail || 'Failed to start checkout')
        }
      } finally {
        setLoading(false)
      }
    })()
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
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {loading ? 'Preparing...' : 'Download Now'}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                {loading ? 'Processing...' : 'Buy Now'}
              </button>
            )}
          </>
        )}

      </div>
    </div>
  )
}
