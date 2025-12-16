import React, { useState } from 'react'
import { login } from '../../api/auth'
import labanonLogo from '../labanonlogo.png'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = await login({ username, password })
      localStorage.setItem('access', data.access)
      localStorage.setItem('refresh', data.refresh)
      // redirect directly to the master admin dashboard route
      window.location.href = '/admin'
    } catch (err: any) {
      setError(err?.response?.data || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <img src={labanonLogo} alt="Lebanon Academy" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-sm text-gray-500">Master Admin Portal</p>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{String(error)}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Username</div>
            <input 
              autoComplete="username"
              required
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200" 
              placeholder="Enter admin username"
            />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Password</div>
            <input 
              type="password" 
              autoComplete="current-password"
              required
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200" 
              placeholder="Enter password"
            />
          </label>
          <button 
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:shadow-lg font-semibold transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
