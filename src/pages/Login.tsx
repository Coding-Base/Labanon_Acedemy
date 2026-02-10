// src/pages/Login.tsx
import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { login } from '../api/auth'
import axios from 'axios'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import labanonLogo from './labanonlogo.png'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const nextParam = params.get('next')

  function mapRoleToRoute(role: string | undefined, isSubAdmin: boolean = false) {
    if (isSubAdmin) return '/admin'
    if (!role) return '/student'
    const roleMap: Record<string, string> = {
      student: '/student/overview',
      institution: '/institution/overview',
      tutor: '/tutor/overview',
      admin: '/admin',
      superadmin: '/admin',
    }
    return roleMap[role] || '/student'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await login({ username, password })

      localStorage.setItem('access', data.access)
      localStorage.setItem('refresh', data.refresh)

      if (nextParam) {
        navigate(nextParam, { replace: true })
        return
      }

      let role: string | undefined = (data.role as string) || (data.user && (data.user.role as string))
      let summary: any = undefined
      let isSubAdmin = false
      
      try {
        const token = data.access
        const res = await axios.get(`${API_BASE}/dashboard/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        summary = res.data
        role = role || res.data?.role
        
        try {
          const subAdminRes = await axios.get(`${API_BASE}/subadmin/me/`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (subAdminRes.data) {
            isSubAdmin = true
            summary = { ...summary, subadmin_profile: subAdminRes.data }
          }
        } catch (err) { }
      } catch (fetchErr) {
        console.warn('Could not fetch summary after login', fetchErr)
      }

      const target = mapRoleToRoute(role, isSubAdmin)
      navigate(target, { state: summary ? { summary } : undefined, replace: true })
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.detail || err?.response?.data || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-yellow-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={labanonLogo} alt="LightHub Academy logo" width={48} height={48} className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in to continue to your dashboard</p>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{String(error)}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Username</div>
            <input autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-200" placeholder="Enter your username or email" />
          </label>

          <label className="block relative">
            <div className="text-sm text-gray-600 mb-1">Password</div>
            <input autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-200 pr-10" placeholder="Enter your password" />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-9 p-1 rounded-md text-gray-500 hover:text-gray-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </label>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-yellow-600 hover:underline flex items-center gap-1">
               <KeyRound className="w-3 h-3" /> Forgot?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 rounded-md text-white font-semibold bg-gradient-to-r from-yellow-600 to-yellow-600 shadow-md hover:opacity-95 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to={`/register${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ''}`} className="text-yellow-600 font-medium hover:underline">Create account</Link>
        </div>
      </div>
      
    </div>
  )
}