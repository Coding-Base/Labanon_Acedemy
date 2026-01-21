import { useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function useTokenRefresher(intervalMinutes = 50) {
  useEffect(() => {
    let mounted = true
    const refresh = async () => {
      try {
        const refreshToken = localStorage.getItem('refresh')
        if (!refreshToken) {
          // no refresh token -> force login
          localStorage.removeItem('access')
          window.location.href = '/login'
          return
        }

        const res = await axios.post(`${API_BASE}/auth/jwt/refresh/`, { refresh: refreshToken }, { headers: { 'Content-Type': 'application/json' } })
        if (!mounted) return
        if (res?.data?.access) {
          localStorage.setItem('access', res.data.access)
        }
      } catch (e) {
        // Refresh failed -> clear tokens and redirect to login
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        if (mounted) window.location.href = '/login'
      }
    }

    // Immediately attempt a refresh to extend session
    refresh()

    const id = setInterval(refresh, intervalMinutes * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [intervalMinutes])
}
