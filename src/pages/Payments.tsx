import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [count, setCount] = useState(0)

  useEffect(() => { loadPayments() }, [page])

  async function loadPayments() {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/payments/`, { headers: { Authorization: `Bearer ${token}` }, params: { page, page_size: pageSize } })
      setPayments(res.data.results || [])
      setCount(res.data.count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadCart() {
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/cart/`, { headers: { Authorization: `Bearer ${token}` } })
      // cart items return nested course
      const cartItems = res.data.results || res.data || []
      if (cartItems.length === 0) {
        alert('Your cart is empty. Browse courses to add items.')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to load cart')
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Payments</h2>
        <Link to="/student/cart" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <ShoppingCart className="w-4 h-4" />
          Go to Cart
        </Link>
      </div>

      {loading ? <div>Loading payments...</div> : (
        <div>
          {payments.length === 0 && <div className="text-gray-600">No payments yet.</div>}
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="p-3 border rounded flex justify-between">
                <div>
                  <div className="font-semibold">{p.course ? p.course : 'Unlock/Other'}</div>
                  <div className="text-sm text-gray-600">{new Date(p.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">₦{p.amount} — {p.status}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-gray-200 rounded" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <button className="px-3 py-1 bg-gray-200 rounded" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
