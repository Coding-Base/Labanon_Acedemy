// src/shared/CoursesList.tsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

type Course = {
  id: number
  title: string
  description: string
  price: string
  slug?: string
  image?: string
}

export default function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [count, setCount] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [addingIds, setAddingIds] = useState<number[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  async function load() {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/courses/`, {
        params: { page, page_size: pageSize, search },
      })
      setCourses(res.data.results || [])
      setCount(res.data.count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  function normalizeSrc(src?: string) {
    if (!src) return null
    // collapse duplicate /media/ occurrences and trim
    try {
      let s = src.trim()
      // If we got a full URL, just return it
      if (s.startsWith('http://') || s.startsWith('https://')) return s

      // Replace repeated '/media/' sequences with a single '/media/'
      s = s.replace(/(\/media\/)+/g, '/media/')

      // remove accidental leading 'media/' without slash -> '/media/...'
      if (s.startsWith('media/')) s = `/${s}`

      // ensure single leading slash
      if (!s.startsWith('/')) s = `/${s}`

      return s
    } catch (e) {
      return src
    }
  }

  function resolveImage(src?: string) {
    if (!src) return null
    // if it's an absolute URL already
    if (src.startsWith('http://') || src.startsWith('https://')) return src

    const normalized = normalizeSrc(src)
    if (!normalized) return null
    const siteBase = API_BASE.replace(/\/api\/?$/, '')
    // normalized starts with '/', so just join
    return `${siteBase}${normalized}`
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <input className="border p-2 rounded flex-1" placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {courses.length === 0 && <div className="text-gray-600">No courses found.</div>}
          {courses.map((c) => (
            <Link key={c.id} to={`/marketplace/${c.id}`} className="block p-4 border rounded hover:shadow-sm">
              <div className="flex justify-between items-start gap-4">
                {c.image ? (
                  <img src={resolveImage(c.image) || undefined} alt={c.title} className="w-28 h-20 object-cover rounded mr-4" />
                ) : (
                  <div className="w-28 h-20 bg-gray-100 rounded mr-4 flex items-center justify-center text-sm text-gray-500">No image</div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{c.description}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                    <div className="text-sm text-gray-500">Price</div>
                    <div className="text-xl font-bold">₦{c.price}</div>
                  </div>
                  <div>
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-60"
                        onClick={async (e) => {
                          e.preventDefault()
                          const token = localStorage.getItem('access')
                          if (!token) { window.location.href = `/register?next=/marketplace/${c.id}`; return }
                          if (addingIds.includes(c.id)) return
                          setAddingIds((cur) => [...cur, c.id])
                          try {
                            const res = await fetch(`${API_BASE}/cart/`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ course_id: c.id }),
                            })
                            if (!res.ok) throw new Error('Failed')
                            // show temporary success
                            alert('Added to cart')
                          } catch (err) {
                            console.error(err)
                            alert('Failed to add to cart')
                          } finally {
                            setAddingIds((cur) => cur.filter((id) => id !== c.id))
                          }
                        }}
                        disabled={addingIds.includes(c.id)}
                      >
                        {addingIds.includes(c.id) ? 'Adding...' : 'Add to cart'}
                      </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          <div className="flex items-center justify-between">
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
