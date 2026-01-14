import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

export default function PaymentVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    let mounted = true

    const verifyPayment = async () => {
      try {
        // --- 1. Robust reference retrieval ---
        // Paystack sends 'reference' or 'trxref'
        // Flutterwave sends 'tx_ref'
        const reference = searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('tx_ref')
        const fwStatus = searchParams.get('status') // Flutterwave sends 'status=completed' or 'cancelled'

        // --- 2. Determine Method ---
        const isFlutterwavePath = location.pathname.includes('flutterwave')
        const hasFwParams = searchParams.has('tx_ref')
        const storedMethod = sessionStorage.getItem('paymentMethod')
        
        let method = 'paystack'
        if (isFlutterwavePath || hasFwParams || storedMethod === 'flutterwave') {
            method = 'flutterwave'
        }

        const token = localStorage.getItem('access')

        if (!token) {
          if(mounted) {
            setStatus('error')
            setMessage('Session expired. Please log in again.')
            setTimeout(() => navigate('/login'), 3000)
          }
          return
        }

        // Handle Flutterwave "cancelled" state specifically
        if (method === 'flutterwave' && fwStatus === 'cancelled') {
            if(mounted) {
                setStatus('error')
                setMessage('Payment was cancelled.')
                setTimeout(() => navigate('/student'), 3000)
            }
            return
        }

        if (!reference) {
          if(mounted) {
            setStatus('error')
            setMessage('No payment reference found')
            setTimeout(() => navigate('/student'), 3000)
          }
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

        if (mounted) {
            // Paystack returns {status: 'success', ...} inside data
            // Flutterwave endpoint returns {status: 'success', ...} inside data
            if (res.data.status === 'success') {
                setStatus('success')
                setMessage('Payment verified! You now have access to your content.')
                
                // --- 3. Determine Redirect Target ---
                // Retrieve the flag we saved in PaymentCheckout.tsx
                const isScheduled = sessionStorage.getItem('isScheduled') === 'true'
                const itemType = sessionStorage.getItem('paymentItemType')
                const itemId = sessionStorage.getItem('paymentItemId')
                const returnTo = sessionStorage.getItem('paymentReturnTo')

                // Clean up session
                sessionStorage.removeItem('paymentReference')
                sessionStorage.removeItem('paymentItemType')
                sessionStorage.removeItem('paymentItemId')
                sessionStorage.removeItem('paymentMethod')
                sessionStorage.removeItem('isScheduled')
                sessionStorage.removeItem('paymentReturnTo')
                
                setTimeout(() => {
                    if (isScheduled) {
                        // Redirect Scheduled Live Courses to Schedule Page
                        navigate('/student/schedule')
                  } else if (itemType === 'activation') {
                    // Activation payments should return to CBT/exam flow
                    if (returnTo) navigate(returnTo)
                    else navigate('/student/cbt')
                  } else if (itemType && itemId) {
                    // Redirect Standard Courses to My Courses (or detail page if preferred)
                    navigate('/student/courses')
                    } else {
                        // Fallback
                        navigate('/student')
                    }
                }, 2000)
            } else {
                setStatus('error')
                setMessage('Payment verification failed. Please contact support.')
                setTimeout(() => navigate('/student'), 3000)
            }
        }
      } catch (err: any) {
        console.error(err)
        if(mounted) {
            const errorMsg = err.response?.data?.detail || 'Payment verification failed'
            setStatus('error')
            setMessage(errorMsg)
            setTimeout(() => navigate('/student'), 3000)
        }
      }
    }

    verifyPayment()
    return () => { mounted = false }
  }, [searchParams, navigate, location])

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
            <p className="text-sm text-gray-500 mt-4">Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-700">{message}</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting to dashboard...</p>
          </>
        )}
      </div>
    </div>
  )
}