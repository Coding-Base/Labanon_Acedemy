// src/pages/PaymentCheckout.tsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PaymentMethodSelector from './PaymentMethodSelector'
import CurrencySelector from './CurrencySelector'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

interface PaymentCheckoutProps {
  itemId: number
  itemType: 'course' | 'diploma' | 'activation' | 'mock_exam'
  amount: number
  currency?: string
  itemTitle: string
  isScheduled?: boolean // <--- New Prop
  onSuccess?: () => void
  meta?: Record<string, any>
  returnTo?: string
}

declare global {
  interface Window {
    PaystackPop?: any
  }
}

export default function PaymentCheckout({
  itemId,
  itemType,
  amount,
  currency = 'NGN',
  itemTitle,
  isScheduled = false, // Default to false
  onSuccess,
  meta,
  returnTo,
}: PaymentCheckoutProps) {
  // Helper: map ISO currency to symbol
  const currencySymbol = (code?: string) => {
    const c = (code || 'NGN').toUpperCase()
    const map: Record<string,string> = {
      'NGN': '₦', 'USD': '$', 'EUR': '€', 'GBP': '£', 'GHS': 'GH₵', 'KES': 'KSh',
      'ZAR': 'R', 'CAD': 'C$', 'AUD': 'A$', 'INR': '₹'
    }
    return map[c] || (c + ' ')
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [promoData, setPromoData] = useState<any | null>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [tutorShare, setTutorShare] = useState<number>(95)
  const [institutionShare, setInstitutionShare] = useState<number>(95)
  const [referralBalance, setReferralBalance] = useState<number>(0)
  const [redeemingPoints, setRedeemingPoints] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currency)
  const [convertedAmount, setConvertedAmount] = useState<number>(amount)
  const [exchangeRate, setExchangeRate] = useState<number>(1600)
  const navigate = useNavigate()

  // Load Paystack script on mount
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = localStorage.getItem('access')
        if (!token || itemType !== 'course') return
        const res = await axios.get(`${API_BASE}/referrals/me/`, { headers: { Authorization: `Bearer ${token}` } })
        if (mounted) setReferralBalance(Number(res.data.points_balance || 0))
      } catch (e) {
        if (mounted) setReferralBalance(0)
      }
    })()
    return () => { mounted = false }
  }, [itemType])

  // Load configured split from backend so UI reflects admin settings
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = localStorage.getItem('access')
        if (!token) return
        const res = await axios.get(`${API_BASE}/payments/admin/split-config/`, { headers: { Authorization: `Bearer ${token}` } })
        if (!mounted) return
        setTutorShare(typeof res.data.tutor_share === 'number' ? res.data.tutor_share : Number(res.data.tutor_share))
        setInstitutionShare(typeof res.data.institution_share === 'number' ? res.data.institution_share : Number(res.data.institution_share))
      } catch (e) {
        // keep defaults on error
        console.warn('Failed to load split config, using defaults')
      }
    })()
    return () => { mounted = false }
  }, [])

  const baseAmount = promoData && promoData.valid ? Number(promoData.new_total) : amount
  const displayAmount = selectedCurrency === 'USD'
    ? Math.round((baseAmount / exchangeRate) * 100) / 100
    : baseAmount
  const discountAmount = promoData && promoData.valid ? Number(promoData.discount) : 0

  const initiatePayment = async () => {
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('access')
      if (!token) {
        window.location.href = `/login?next=/${itemType}/${itemId}`
        return
      }

      // Call backend to initiate payment (include optional meta)
      // If a promo is applied, prefer the backend-calculated new_total
      const payload: any = {
        item_type: itemType,
        item_id: itemId,
        amount: displayAmount,
        currency: selectedCurrency,
      }
      const referralCode = localStorage.getItem('referral_code')
      if (referralCode) payload.referral_code = referralCode
      if (meta) {
        Object.assign(payload, meta)
      }
      if (promoData && promoData.valid) {
        payload.promo_code = promoData.promo?.code || (promoInput || '').trim()
      }
      const res = await axios.post(`${API_BASE}/payments/initiate/`, payload, { headers: { Authorization: `Bearer ${token}` } })

      const { authorization_url, link, reference } = res.data

      // Store reference and method for verification after redirect
      sessionStorage.setItem('paymentReference', reference)
      sessionStorage.setItem('paymentItemType', itemType)
      sessionStorage.setItem('paymentItemId', itemId.toString())
      sessionStorage.setItem('paymentMethod', 'paystack')
      
      // Store scheduled flag so verification page knows where to redirect
      sessionStorage.setItem('isScheduled', isScheduled ? 'true' : 'false')
      // Optional return path for activation flows
      if (returnTo) sessionStorage.setItem('paymentReturnTo', returnTo)

      // Redirect to payment gateway (Paystack)
      if (authorization_url) {
        window.location.href = authorization_url
        return
      }

      if (link) {
        window.location.href = link
        return
      }

      // Option 2: Use Paystack Popup (if available)
      if (window.PaystackPop) {
        const payAmount = promoData && promoData.valid ? Number(promoData.new_total) : amount
        const handler = window.PaystackPop.setup({
          key: (import.meta.env as any).VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_b5d0eaff52a5d2ed395c2ea99c881ec4ce62acc6',
          email: (await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } })).data.email,
          amount: payAmount * 100, // Convert to subunits (kobo/cents)
          ref: reference,
          onClose: () => {
            setLoading(false)
            alert('Payment window closed.')
          },
          onSuccess: async () => {
            // Verify payment on backend
            await verifyPayment(reference, token)
          },
        })
        handler.openIframe()
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to initiate payment'
      setError(errorMsg)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const redeemWithPoints = async () => {
    setError('')
    setRedeemingPoints(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) {
        window.location.href = `/login?next=/${itemType}/${itemId}`
        return
      }
      await axios.post(
        `${API_BASE}/referrals/redeem/`,
        { item_type: itemType, item_id: itemId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Referral points redeemed! You now have access.')
      if (onSuccess) onSuccess()
      else navigate('/student/courses')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to redeem referral points')
    } finally {
      setRedeemingPoints(false)
    }
  }

  const verifyPayment = async (reference: string, token: string) => {
    setProcessing(true)
    try {
      const res = await axios.get(
        `${API_BASE}/payments/verify/${reference}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (res.data.status === 'success') {
        alert('Payment successful! Your enrollment is now active.')
        
        if (onSuccess) {
          onSuccess()
        } else {
          // Check if scheduled to determine redirect
          if (isScheduled) {
             navigate('/student/schedule')
          } else {
             navigate('/student/courses')
          }
        }
      } else {
        setError('Payment verification failed. Please try again.')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Payment verification failed'
      setError(errorMsg)
    } finally {
      setProcessing(false)
    }
  }

  if (amount === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">Free Course/Diploma</h4>
            <p className="text-sm text-yellow-700 mt-1">This is a free offering. Click enroll to get immediate access.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-gradient-to-r from-yellow-50 to-yellow-50 dark:from-slate-800 dark:to-slate-800 rounded-lg p-6 border border-yellow-250 dark:border-slate-700">
        <CurrencySelector
          baseAmountNGN={promoData && promoData.valid ? Number(promoData.new_total) : amount}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={(cur, converted, rate) => {
            setSelectedCurrency(cur)
            setConvertedAmount(converted)
            setExchangeRate(rate)
          }}
        />

        <div className="flex justify-between items-start mb-4 border-t border-yellow-200 dark:border-slate-750 pt-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{itemType === 'activation' ? 'Activate access for:' : 'You\'re about to purchase:'}</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{itemTitle}</h3>
          </div>
        </div>

        <div className="border-t border-yellow-200 dark:border-slate-750 pt-4 mt-4 space-y-2">
          {discountAmount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-650 dark:text-gray-400 font-medium">Price:</span>
                <span className="font-semibold text-gray-950 dark:text-gray-100">
                  {currencySymbol(selectedCurrency)}
                  {(selectedCurrency === 'USD'
                    ? Math.round((amount / exchangeRate) * 100) / 100
                    : amount
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-green-700 dark:text-green-400 font-medium">
                <span>Discount:</span>
                <span>- {currencySymbol(selectedCurrency)}{(selectedCurrency === 'USD' ? Math.round((discountAmount / exchangeRate) * 100) / 100 : discountAmount).toLocaleString()}</span>
              </div>
            </>
          )}
          <div className="flex justify-between pt-1">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Total:</span>
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{currencySymbol(selectedCurrency)}{displayAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        selectedMethod="paystack"
        onMethodChange={() => {}}
        disabled={loading || processing}
      />

      {/* Promo code input */}
      <div className="mt-4">
        <div className="flex gap-2">
          <input value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Promo code" className="flex-1 px-3 py-2 border rounded" />
          {!promoData ? (
            <button disabled={applyingPromo} onClick={async () => {
              setApplyingPromo(true); setPromoError('')
              try {
                const token = localStorage.getItem('access')
                const payload: any = { code: (promoInput||'').trim(), total_amount: amount, payment_type: itemType }
                if (meta) Object.assign(payload, meta)
                const res = await axios.post(`${API_BASE}/promos/promocodes/apply/`, payload, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
                setPromoData(res.data)
              } catch (e: any) {
                setPromoError(e.response?.data?.detail || (e.response?.data && JSON.stringify(e.response.data)) || 'Failed to apply promo')
              } finally { setApplyingPromo(false) }
            }} className="px-4 py-2 bg-yellow-600 text-white rounded">Apply</button>
          ) : (
            <button onClick={() => { setPromoData(null); setPromoInput(''); setPromoError('') }} className="px-4 py-2 bg-gray-100 rounded">Remove</button>
          )}
        </div>
        {promoError && <div className="text-sm text-red-600 mt-2">{promoError}</div>}
        {promoData && promoData.valid && (
          <div className="mt-2 text-sm text-green-700">Applied: Discount {promoData.discount} — New total {promoData.new_total}</div>
        )}
      </div>

      <button
        onClick={initiatePayment}
        disabled={loading || processing}
        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all"
      >
        {loading || processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {processing ? 'Verifying payment...' : 'Processing...'}
          </>
        ) : (
          <>
            Proceed to Paystack ({selectedCurrency})
          </>
        )}
      </button>

      {itemType === 'course' && referralBalance >= Number(amount || 0) && (
        <button
          onClick={redeemWithPoints}
          disabled={redeemingPoints || loading || processing}
          className="w-full py-3 border border-green-500 text-green-700 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-50 disabled:opacity-60 transition-all"
        >
          {redeemingPoints ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          Pay with referral points ({referralBalance.toLocaleString()} pts)
        </button>
      )}

      <p className="text-xs text-gray-500 text-center">
        Your payment is secure and encrypted. You will be redirected to Paystack to complete payment.
      </p>
    </div>
  )
}
