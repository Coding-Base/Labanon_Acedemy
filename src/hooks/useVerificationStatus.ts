import { useState, useEffect } from 'react'
import api from '../utils/axiosInterceptor'

export interface VerificationStatus {
  role: string
  is_verified: boolean
  verification_status: 'pending' | 'approved' | 'rejected' | 'not_applicable'
  reason?: string
  verified_at?: string
}

/**
 * Hook to fetch and manage user verification status
 * Used to determine if a tutor/institution can publish courses
 */
export function useVerificationStatus() {
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true)
        const response = await api.get('/users/me/verification-status/')
        setStatus(response.data)
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch verification status:', err)
        setError(err.response?.data?.detail || err.message || 'Failed to load verification status')
        setStatus(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  return { status, loading, error }
}
