import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import labanonLogo from './labanonlogo.png' // Make sure this path is correct

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      await axios.post(`${API_BASE}/users/password-reset/`, { email })
      setStatus('success')
    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setErrorMessage(err.response?.data?.error || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={labanonLogo} alt="LightHub Academy" className="w-10 h-10 object-contain" />
          <h1 className="text-xl font-bold text-gray-900">Reset Password</h1>
        </div>

        {status === 'success' ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We have sent a password reset link to <strong>{email}</strong>.
            </p>
            <Link to="/login" className="text-green-600 font-medium hover:underline">
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>

            {status === 'error' && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center"
              >
                {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-gray-500 hover:text-gray-900 text-sm flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}