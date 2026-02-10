import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { generateReceipt, downloadReceipt } from '../utils/receiptGenerator'
import Footer from '../components/Footer'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

export default function PaymentVerify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your payment...')
  const [paymentData, setPaymentData] = useState<any | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

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

              // Decide whether to show receipt modal: only for diploma purchases
              const isDiploma = res.data.kind === 'diploma' || !!res.data.diploma
              setPaymentData(res.data)

              // If diploma: show receipt modal and DO NOT auto-redirect. User must click Continue.
              if (isDiploma) {
                setShowReceipt(true)
                // Do NOT clear sessionStorage here — keep redirect info until user continues.
              } else {
                // Non-diploma: follow original quick redirect flow
                setShowReceipt(false)

                // --- 3. Determine Redirect Target ---
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
                      navigate('/student/schedule')
                  } else if (itemType === 'activation') {
                    if (returnTo) navigate(returnTo)
                    else navigate('/student/cbt')
                  } else if (itemType && itemId) {
                    navigate('/student/courses')
                  } else {
                    navigate('/student')
                  }
                }, 2000)
              }
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-yellow-600 mx-auto mb-4" />
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
        {showReceipt && paymentData && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-2">Download Your Receipt</h3>
              <p className="text-sm text-gray-600 mb-4">A receipt for your transaction is available. Download it for your records.</p>

              <div className="space-y-2 text-sm text-gray-800 mb-4">
                <div><strong>Reference:</strong> {paymentData.reference || paymentData.reference}</div>
                <div><strong>Amount:</strong> ₦{Number(paymentData.amount || 0).toLocaleString()}</div>
                <div><strong>Item:</strong> {paymentData.course_title || paymentData.diploma_title || 'Payment'}</div>
                <div><strong>Date:</strong> {paymentData.created_at ? new Date(paymentData.created_at).toLocaleString() : '—'}</div>
              </div>

              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowReceipt(false)} className="px-3 py-2 rounded border border-gray-200">Close</button>

                <button
                  onClick={async () => {
                    try {
                      const blob = await generateReceipt({
                        id: paymentData.id,
                        amount: paymentData.amount,
                        reference: paymentData.reference,
                        gateway: paymentData.gateway,
                        course_title: paymentData.course_title,
                        diploma_title: paymentData.diploma_title,
                        created_at: paymentData.created_at,
                        institution_signature_url: paymentData.institution_signature_url || null,
                        institution_name: paymentData.institution_name || null,
                        platform_logo_url: '/labanonlogo.png',
                      })
                      downloadReceipt(blob, paymentData.id)
                    } catch (e) {
                      console.error('Receipt generation failed', e)
                      alert('Failed to generate receipt')
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded"
                >
                  Download Receipt
                </button>

                <button
                  onClick={() => {
                    // When user clicks Continue, perform the same redirect logic used previously
                    const isScheduled = sessionStorage.getItem('isScheduled') === 'true'
                    const itemType = sessionStorage.getItem('paymentItemType')
                    const itemId = sessionStorage.getItem('paymentItemId')
                    const returnTo = sessionStorage.getItem('paymentReturnTo')

                    // Clean up session now that user chose to continue
                    sessionStorage.removeItem('paymentReference')
                    sessionStorage.removeItem('paymentItemType')
                    sessionStorage.removeItem('paymentItemId')
                    sessionStorage.removeItem('paymentMethod')
                    sessionStorage.removeItem('isScheduled')
                    sessionStorage.removeItem('paymentReturnTo')

                    setShowReceipt(false)

                    if (isScheduled) {
                      navigate('/student/schedule')
                    } else if (itemType === 'activation') {
                      if (returnTo) navigate(returnTo)
                      else navigate('/student/cbt')
                    } else if (itemType && itemId) {
                      navigate('/student/courses')
                    } else {
                      navigate('/student')
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}