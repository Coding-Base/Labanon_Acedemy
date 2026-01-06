import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function PaymentVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('reference')
        const method = searchParams.get('method') || sessionStorage.getItem('paymentMethod') || 'paystack'
        const token = localStorage.getItem('access')

        if (!reference) {
          setStatus('error')
          setMessage('No payment reference found')
          setTimeout(() => navigate('/student'), 3000)
          return
        }

        if (!token) {
          setStatus('error')
          setMessage('Session expired. Please log in again.')
          setTimeout(() => navigate('/login'), 3000)
          return
        }

        // Determine endpoint based on payment method
        const endpoint = method === 'flutterwave'
          ? `${API_BASE}/payments/flutterwave/verify/${reference}/`
          : `${API_BASE}/payments/verify/${reference}/`

        // Verify payment with backend
        const res = await axios.get(
          endpoint,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (res.data.status === 'success') {
          setStatus('success')
          setMessage('Payment verified! You now have access to the course/diploma.')
          
          // Get item type and id from sessionStorage
          const itemType = sessionStorage.getItem('paymentItemType')
          const itemId = sessionStorage.getItem('paymentItemId')
          
          // Clean up
          sessionStorage.removeItem('paymentReference')
          sessionStorage.removeItem('paymentItemType')
          sessionStorage.removeItem('paymentItemId')
          sessionStorage.removeItem('paymentMethod')
          
          // Redirect after 2 seconds
          setTimeout(() => {
            if (itemType && itemId) {
              navigate(`/${itemType}/${itemId}`)
            } else {
              navigate('/student')
            }
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Payment verification failed. Please contact support.')
          setTimeout(() => navigate('/student'), 3000)
        }
      } catch (err: any) {
        console.error(err)
        const errorMsg = err.response?.data?.detail || 'Payment verification failed'
        setStatus('error')
        setMessage(errorMsg)
        setTimeout(() => navigate('/student'), 3000)
      }
    }

    verifyPayment()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-lg text-gray-800">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-700">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting in 2 seconds...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-700">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting in 3 seconds...</p>
          </>
        )}
      </div>
    </div>
  )
}
