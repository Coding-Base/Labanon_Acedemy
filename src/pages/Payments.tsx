import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [count, setCount] = useState(0)
  const [showCart, setShowCart] = useState(false)
  const [cartEnrollments, setCartEnrollments] = useState<any[]>([])

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
      setCartEnrollments(res.data.results || [])
      setShowCart(true)
    } catch (err) {
      console.error(err)
      alert('Failed to load cart')
    }
  }

  async function payEnrollment(enrollmentId: number) {
    try {
      const token = localStorage.getItem('access')
      const res = await axios.post(`${API_BASE}/cart/${enrollmentId}/checkout/`, {}, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.payment_url) {
        window.open(res.data.payment_url, '_blank')
      } else if (res.data.payments) {
        // batch payments response
        (res.data.payments || []).forEach((p: any) => window.open(p.payment_url, '_blank'))
      } else {
        alert(res.data.detail || 'Payment processed')
        loadPayments()
        setShowCart(false)
      }
    } catch (err: any) {
      console.error(err)
      alert('Failed to initiate payment')
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Payments</h2>
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={loadCart}>Make Payment</button>
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

      {showCart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <h3 className="text-lg font-semibold mb-3">Cart — unpaid enrollments</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {cartEnrollments.length === 0 && <div className="text-gray-600">No items in cart.</div>}
              {cartEnrollments.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-semibold">{e.course?.title}</div>
                    <div className="text-sm text-gray-600">₦{e.course?.price}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => payEnrollment(e.id)}>Pay</button>
                    <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={async () => {
                      try {
                        const token = localStorage.getItem('access')
                        await axios.delete(`${API_BASE}/cart/${e.id}/`, { headers: { Authorization: `Bearer ${token}` } })
                        setCartEnrollments((cur) => cur.filter((ci) => ci.id !== e.id))
                      } catch (err) {
                        console.error(err)
                        alert('Failed to remove item')
                      }
                    }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setShowCart(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
