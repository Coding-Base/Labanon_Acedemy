import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Trash2, ShoppingCart, ArrowLeft, CreditCard, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import PaymentMethodSelector from '../components/PaymentMethodSelector'
import Footer from '../components/Footer'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface CartItemType {
  id: number
  course?: {
    id: number
    title: string
    price: number | string
    image?: string
  }
  diploma?: {
    id: number
    title: string
    price: number | string
    image?: string
  }
  // Fallback for flat structure
  kind?: 'course' | 'diploma'
  item_id?: number
  title?: string
  price?: number | string
  image?: string
  created_at: string
}

export default function Cart() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'flutterwave'>('paystack')

  useEffect(() => {
    loadCart()
  }, [])

  async function loadCart() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access')
      if (!token) {
        navigate('/login')
        return
      }

      const res = await axios.get(`${API_BASE}/cart/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const items = Array.isArray(res.data) ? res.data : (res.data.results || [])
      // Debug log removed for production
      setCartItems(items)
    } catch (err: any) {
      console.error('Failed to load cart:', err)
      if (err.response?.status === 401) {
        localStorage.removeItem('access')
        navigate('/login')
      } else {
        setError(err.response?.data?.detail || 'Failed to load cart')
      }
    } finally {
      setLoading(false)
    }
  }

  async function removeItem(id: number) {
    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/cart/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCartItems(cartItems.filter(item => item.id !== id))
    } catch (err) {
      console.error('Failed to remove item:', err)
      setError('Failed to remove item')
    }
  }

  async function checkout() {
    if (cartItems.length === 0) return

    setProcessing(true)
    setError('')
    try {
      const token = localStorage.getItem('access')

      // For single item, initiate payment directly
      if (cartItems.length === 1) {
        const item = cartItems[0]
        // Determine type and ID
        const itemType = item.course ? 'course' : item.diploma ? 'diploma' : 'course'
        const itemId = item.course?.id || item.diploma?.id || item.item_id
        
        // Calculate Amount (Item Price + 5% Fee)
        const rawPrice = parseFloat(String(item.course?.price || item.diploma?.price || item.price || 0))
        const platformFee = rawPrice * 0.05
        const finalAmount = rawPrice + platformFee
        
        if (!itemId) {
          setError('Invalid cart item: missing item ID')
          setProcessing(false)
          return
        }

        // Determine endpoint based on selected payment method
        const endpoint = paymentMethod === 'flutterwave' 
          ? `${API_BASE}/payments/flutterwave/initiate/`
          : `${API_BASE}/payments/initiate/`

        const res = await axios.post(
          endpoint,
          {
            item_type: itemType,
            item_id: itemId,
            amount: finalAmount
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        // Store info for verification
        sessionStorage.setItem('paymentReference', res.data.reference)
        sessionStorage.setItem('paymentItemType', itemType)
        sessionStorage.setItem('paymentItemId', itemId.toString())
        sessionStorage.setItem('paymentMethod', paymentMethod)

        // Redirect to payment page (works for both Paystack and Flutterwave)
        if (res.data.authorization_url) {
          window.location.href = res.data.authorization_url
        } else if (res.data.link) {
          // Flutterwave returns 'link' instead of 'authorization_url'
          window.location.href = res.data.link
        } else {
          navigate(`/payment?reference=${res.data.reference}&method=${paymentMethod}`)
        }
      } else {
        // For multiple items, show error (implement bulk checkout later)
        setError('Bulk checkout not yet supported. Please purchase items individually.')
      }
    } catch (err: any) {
      console.error('Checkout failed:', err)
      setError(err.response?.data?.detail || 'Checkout failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  // Calculate totals for display
  const total = cartItems.reduce((sum, item) => {
    const price = parseFloat(String(item.course?.price || item.diploma?.price || item.price || 0))
    return sum + (isNaN(price) ? 0 : price)
  }, 0)
  const platformFee = +(total * 0.05).toFixed(2)
  const finalTotal = +(total + platformFee).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          <button
            onClick={() => navigate('/student')}
            className="flex items-center gap-2 text-green-600 hover:text-yellow-700 mb-4 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.length === 0 ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-sm p-12 text-center"
              >
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">Add courses or diplomas to get started</p>
                <button
                  onClick={() => navigate('/student/courses')}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  Browse Courses
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {cartItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between hover:shadow-md transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                          {item.course ? 'Course' : item.diploma ? 'Diploma' : 'Item'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{item.course?.title || item.diploma?.title || item.title || 'Unknown'}</h3>
                      <p className="text-sm text-gray-600">Added on {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">₦{parseFloat(String(item.course?.price || item.diploma?.price || item.price || 0)).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>

                <div className="space-y-4 border-b border-gray-200 pb-6 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                    <span className="font-medium text-gray-900">₦{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee (5%)</span>
                    <span className="font-medium text-gray-900">₦{platformFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between mb-6">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-green-600">₦{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>

                {/* Payment Method Selector */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onMethodChange={setPaymentMethod}
                    disabled={processing}
                  />
                </div>

                <button
                  onClick={checkout}
                  disabled={processing}
                  className="w-full py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" /> Proceed to Payment
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  You will be redirected to {paymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'} to complete payment securely.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}