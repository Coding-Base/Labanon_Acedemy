import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [page])

  async function load() {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/enrollments/`, { headers: { Authorization: `Bearer ${token}` }, params: { page, page_size: pageSize } })
      setEnrollments(res.data.results || [])
      setCount(res.data.count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  if (loading) return <div>Loading your courses...</div>

  function resolveImage(src?: string) {
    if (!src) return null
    if (src.startsWith('http://') || src.startsWith('https://')) return src
    const siteBase = API_BASE.replace(/\/api\/?$/, '')
    if (src.startsWith('/')) return `${siteBase}${src}`
    return `${siteBase}/${src}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Courses</h2>
        <div>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => navigate('/dashboard/explore')}>Explore Market</button>
        </div>
      </div>

      {enrollments.length === 0 && <div className="text-gray-600">You have not purchased any courses yet.</div>}

      <div className="space-y-3">
        {enrollments.map((e) => (
          <div key={e.id} className="p-3 border rounded flex items-center gap-4">
            {e.course?.image ? (
              <img src={resolveImage(e.course.image) || undefined} alt={e.course.title} className="w-24 h-16 object-cover rounded" />
            ) : (
              <div className="w-24 h-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">No image</div>
            )}
            <div className="flex-1">
              <div className="font-semibold">{e.course?.title}</div>
              <div className="text-sm text-gray-600">{e.course?.description}</div>
            </div>
            <div className="text-right">₦{e.course?.price}</div>
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
  )
}
