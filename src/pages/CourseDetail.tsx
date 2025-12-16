import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function CourseDetail() {
  const { id } = useParams()
  const [course, setCourse] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const res = await axios.get(`${API_BASE}/courses/${id}/`)
        setCourse(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleEnroll() {
    try {
      const token = localStorage.getItem('access')
      if (!token) {
        window.location.href = '/login'
        return
      }
      // create enrollment (backend expects `course_id` write-only field)
      const create = await axios.post(`${API_BASE}/enrollments/`, { course_id: course.id }, { headers: { Authorization: `Bearer ${token}` } })
      const enrollment = create.data

      // If the enrollment is already purchased (free course auto-enrolled), show confirmation
      if (enrollment.purchased) {
        alert('Enrollment completed — you have access to this course')
        return
      }

      // otherwise initiate purchase
      const pay = await axios.post(`${API_BASE}/enrollments/${enrollment.id}/purchase/`, {}, { headers: { Authorization: `Bearer ${token}` } })
      const payment_url = pay.data.payment_url
      if (payment_url) {
        window.open(payment_url, '_blank')
        alert('Payment/checkout opened - complete payment to finalize enrollment (or follow instructions).')
      } else {
        // if backend returned immediate confirmation (free course fallback), show it
        const detail = pay.data.detail || 'Enrollment completed'
        alert(detail)
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.response?.data?.detail || 'Enrollment failed')
    }
  }

  if (loading) return <div>Loading course...</div>
  if (!course) return <div>Course not found.</div>

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <header className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <div className="text-sm text-gray-600">By {course.creator}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Price</div>
            <div className="text-xl font-bold">₦{course.price}</div>
            <div className="flex flex-col items-end gap-2">
              <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded" onClick={handleEnroll}>Enroll / Buy</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={async () => {
                const token = localStorage.getItem('access')
                if (!token) { window.location.href = '/login'; return }
                if (adding) return
                setAdding(true)
                try {
                  const res = await fetch(`${API_BASE}/cart/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ course_id: course.id }),
                  })
                  if (!res.ok) throw new Error('Failed')
                  alert('Added to cart')
                } catch (err) {
                  console.error(err)
                  alert('Failed to add to cart')
                } finally {
                  setAdding(false)
                }
              }}>Add to cart</button>
            </div>
          </div>
        </header>

        <section className="mb-4">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-700">{course.description}</p>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Modules</h3>
          {course.modules?.length === 0 && <div className="text-gray-600">No modules yet.</div>}
          <div className="space-y-3">
            {course.modules?.map((m: any) => (
              <div key={m.id} className="border p-3 rounded">
                <div className="font-semibold">{m.title}</div>
                <div className="text-sm text-gray-600">Lessons: {m.lessons?.length ?? 0}</div>
                <div className="mt-2 space-y-2">
                  {m.lessons?.map((l: any) => (
                    <div key={l.id} className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">{l.title}</div>
                      <div className="text-sm text-gray-600">{l.content?.substring(0, 120)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
