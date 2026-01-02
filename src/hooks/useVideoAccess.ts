import { useState, useCallback } from 'react'
import axios from 'axios'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api'

interface SignedVideoResponse {
  url: string
  auth_header: string
  header_name: string
  expires_in_hours: number
  video_id: string
  title: string
}

interface VideoAccessData {
  url: string
  customHeaders: Record<string, string>
  expiresIn: number
}

/**
 * Hook to fetch signed video URLs with custom authentication headers
 * 
 * Usage:
 *   const { getSignedVideoUrl, loading, error } = useVideoAccess()
 *   const { url, customHeaders } = await getSignedVideoUrl(videoId)
 */
export const useVideoAccess = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getSignedVideoUrl = useCallback(
    async (videoId: string): Promise<VideoAccessData> => {
      setLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem('access')
        const response = await axios.get<SignedVideoResponse>(
          `${API_BASE}/videos/${videoId}/signed_url/`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        )

        const { url, auth_header, header_name, expires_in_hours } = response.data

        // Build custom headers object
        const customHeaders: Record<string, string> = {}
        if (auth_header && header_name) {
          customHeaders[header_name] = auth_header
        }

        return {
          url,
          customHeaders,
          expiresIn: expires_in_hours * 3600 * 1000 // Convert to milliseconds
        }
      } catch (err) {
        const errorMessage =
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : 'Failed to fetch signed video URL'

        setError(errorMessage)
        console.error('[useVideoAccess] Error:', errorMessage, err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { getSignedVideoUrl, loading, error }
}
