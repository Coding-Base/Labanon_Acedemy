import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadReviews() }, [])

  async function loadReviews() {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/users/reviews/`)
      setReviews(res.data.results || res.data || [])
    } catch (e) {
      setReviews([])
    } finally { setLoading(false) }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('access')
      const payload: any = { rating, message }
      if (token) {
        await axios.post(`${API_BASE}/users/reviews/`, payload, { headers: { Authorization: `Bearer ${token}` } })
      } else {
        await axios.post(`${API_BASE}/users/reviews/`, payload)
      }
      setMessage('')
      setRating(5)
      loadReviews()
      alert('Thank you — your review was submitted and will appear after moderation.')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit review')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Public Reviews</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          {loading ? <div>Loading reviews...</div> : (
            reviews.length === 0 ? <div className="text-gray-500">No reviews yet.</div> : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-white rounded-xl p-4 shadow border">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{r.name || r.author?.username || 'Anonymous'}</div>
                        <div className="text-xs text-gray-500">{r.role} • {new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="text-yellow-600 font-bold">{r.rating}/5</div>
                    </div>
                    <p className="mt-3 text-gray-700">{r.message}</p>
                    {r.category === 'cbt' && (
                      <div className="mt-3 text-xs text-gray-500">Exam: {r.cbt_exam} • Subject: {r.cbt_subject} • Score: {r.cbt_score}</div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <aside className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Leave a review</h3>
          <form onSubmit={submitReview}>
            <label className="text-sm text-gray-600">Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full mb-3 p-2 border rounded">
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} star{n>1?'s':''}</option>)}
            </select>
            <label className="text-sm text-gray-600">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-2 border rounded mb-3" rows={4} required />
            <button type="submit" disabled={submitting} className="w-full bg-yellow-600 text-white py-2 rounded">{submitting ? 'Submitting…' : 'Submit Review'}</button>
          </form>
          <div className="mt-4 text-xs text-gray-500">Reviews are moderated by admins before appearing publicly.</div>
        </aside>
      </div>
      <div className="text-center mt-8"><Link to="/">Back to Home</Link></div>
    </div>
  )
}
