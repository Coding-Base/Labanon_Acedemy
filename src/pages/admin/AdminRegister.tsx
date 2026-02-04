import React, { useState } from 'react'
import { register } from '../../api/auth'
import labanonLogo from '../labanonlogo.png'

export default function AdminRegister() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      // Build payload ensuring admin flags are set so backend can grant full admin permissions
      const payload: any = {
        username,
        email,
        password,
        role: 'admin',
        admin_secret: inviteCode,
        // Attempt to request staff/superuser flags — backend must allow or enforce this server-side
        is_staff: true,
        is_superuser: true,
        is_active: true
      }

      await register(payload)
      // after successful registration, navigate to the admin login page
      window.location.href = '/admin/login'
    } catch (err: any) {
      setError(err?.response?.data || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-yellow-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <img src={labanonLogo} alt="LightHub Academy logo" width={48} height={48} className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Register</h1>
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
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-200" 
              placeholder="Choose a username"
            />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Email</div>
            <input 
              type="email"
              autoComplete="email"
              required
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-200" 
              placeholder="Enter email"
            />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Password</div>
            <input 
              type="password" 
              autoComplete="new-password"
              required
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-200" 
              placeholder="Create a password"
            />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Admin Invite Code</div>
            <input 
              required
              value={inviteCode} 
              onChange={e => setInviteCode(e.target.value)} 
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-200" 
              placeholder="Enter secret invite code"
            />
          </label>
          <button 
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg font-semibold transition"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  )
}
