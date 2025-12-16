// src/pages/dashboards/InstitutionDashboard.tsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Props {
  summary?: any
}

export default function InstitutionDashboard({ summary: propSummary }: Props) {
  const location = useLocation()
  const navSummary = (location.state as any)?.summary
  const [summary, setSummary] = useState<any | null>(propSummary ?? navSummary ?? null)
  const [loading, setLoading] = useState(!summary)

  useEffect(() => {
    let mounted = true
    async function loadSummary() {
      if (summary) {
        setLoading(false)
        return
      }

      const token = localStorage.getItem('access')
      if (!token) {
        // not authenticated — fallback
        window.location.href = '/login'
        return
      }

      setLoading(true)
      try {
        const res = await axios.get(`${API_BASE}/dashboard/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!mounted) return
        setSummary(res.data)
      } catch (err) {
        console.error('Failed to fetch institution summary:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadSummary()
    return () => {
      mounted = false
    }
  }, [propSummary, navSummary, summary])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>
  if (!summary) return <div className="min-h-screen flex items-center justify-center">Unable to load dashboard.</div>

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{summary.username} — Institution</h1>
        <div className="bg-white p-6 rounded shadow">Institution admin views will go here.</div>
      </div>
    </div>
  )
}
