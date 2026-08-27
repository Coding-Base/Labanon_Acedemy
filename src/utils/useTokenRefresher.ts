import { useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

/**
 * Proactively refreshes the JWT access token on a regular interval.
 * 
 * This hook should be used in any page/component where the user may spend
 * a long time (e.g., dashboards, CBT exam interfaces) to prevent token
 * expiry from causing unexpected logouts.
 * 
 * On failure, it logs a warning but does NOT redirect to /login — the
 * axios interceptor handles that on actual API call failures instead.
 * This prevents disrupting the user during an active exam session.
 * 
 * @param intervalMinutes - How often (in minutes) to refresh. Default: 50.
 */
export default function useTokenRefresher(intervalMinutes = 50) {
  useEffect(() => {
    let mounted = true

    const refresh = async () => {
      try {
        const refreshToken = localStorage.getItem('refresh')
        if (!refreshToken) {
          // No refresh token — don't force redirect here.
          // The interceptor will handle it on the next API call.
          console.warn('[TokenRefresher] No refresh token found, skipping refresh.')
          return
        }

        const res = await axios.post(
          `${API_BASE}/auth/jwt/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        )

        if (!mounted) return

        if (res?.data?.access) {
          localStorage.setItem('access', res.data.access)
        }
        // Store rotated refresh token if the backend returns one
        if (res?.data?.refresh) {
          localStorage.setItem('refresh', res.data.refresh)
        }
      } catch (e) {
        // Refresh failed — log warning but do NOT redirect.
        // The user might be mid-exam. Let the axios interceptor
        // handle auth failures on actual API requests.
        console.warn('[TokenRefresher] Proactive refresh failed, will retry next interval.', e)
      }
    }

    // Immediately attempt a refresh to extend session on mount
    refresh()

    const id = setInterval(refresh, intervalMinutes * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [intervalMinutes])
}
