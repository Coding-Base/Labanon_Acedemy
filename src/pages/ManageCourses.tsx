// src/ManageCourses.tsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface ManageCoursesProps {
  uploadCourseImageHandler?: (courseId: number) => Promise<void>
  uploadLessonMediaHandler?: (lessonId: number) => Promise<void>
  isInstitution?: boolean  // Flag to determine routing context
}

export default function ManageCourses({ uploadCourseImageHandler, uploadLessonMediaHandler, isInstitution = false }: ManageCoursesProps) {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('access')
        const me = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } })
        const uid = me.data.id
        const res = await axios.get(`${API_BASE}/courses/?creator=${uid}&page=${page}&page_size=${pageSize}`, { headers: { Authorization: `Bearer ${token}` } })
        // support both simple list and paginated responses
        const items = res.data.results || res.data || []
        setCourses(items)
        if (res.data.count) {
          setPageCount(Math.ceil(res.data.count / pageSize))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page])

  // Course creation moved to dedicated CreateCourse page — ManageCourses now lists and paginates

  if (loading) return <div>Loading your courses...</div>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Courses</h2>

      <div className="flex items-center justify-between bg-white p-4 rounded mb-4">
        <h3 className="font-semibold">Your Courses</h3>
        <Link to="/tutor/manage/create" className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold">Create Course</Link>
      </div>

      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="p-3 border rounded flex justify-between items-center">
            <div className="flex items-center gap-4">
              {c.image && <img src={c.image} alt={c.title} className="w-28 h-20 object-cover rounded" />}
              <div>
                <div className="font-semibold">{c.title}</div>
                <div className="text-sm text-gray-600">{c.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Price</div>
                <div className="font-bold">₦{c.price}</div>
              </div>
              {/* Route based on context: institution vs tutor */}
              {isInstitution ? (
                <Link to={`/institution/courses/manage?courseId=${c.id}`} className="px-3 py-1 bg-green-600 text-white rounded">Manage</Link>
              ) : (
                <Link to={`/tutor/manage/create?courseId=${c.id}`} className="px-3 py-1 bg-green-600 text-white rounded">Manage</Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50">Previous</button>
        <div className="text-sm text-gray-600">Page {page} / {pageCount}</div>
        <button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}
