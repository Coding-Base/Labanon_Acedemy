import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Loader2, PlusCircle, AlertCircle } from 'lucide-react'
import showToast from '../utils/toast'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

interface ManageCoursesProps {
  uploadCourseImageHandler?: (courseId: number) => Promise<void>
  uploadLessonMediaHandler?: (lessonId: number) => Promise<void>
  isInstitution?: boolean  // Flag to determine routing context
  darkMode?: boolean
}
export default function ManageCourses({ uploadCourseImageHandler, uploadLessonMediaHandler, isInstitution = false, darkMode }: ManageCoursesProps) {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [pageSize] = useState(10)
  const [confirmingDelete, setConfirmingDelete] = useState<null | { id: number; title?: string }>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('access')
        const me = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } })
        const uid = me.data.id
        const res = await axios.get(`${API_BASE}/courses/?creator=${uid}&page=${page}&page_size=${pageSize}`, { headers: { Authorization: `Bearer ${token}` } })
        
        if (mounted) {
            // support both simple list and paginated responses
            const items = res.data.results || res.data || []
            setCourses(items)
            if (res.data.count) {
            setPageCount(Math.ceil(res.data.count / pageSize))
            }
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [page])

  // Delete handler
  const performDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/courses/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
      setCourses((prev) => prev.filter((c) => c.id !== id))
      showToast('success', 'Course deleted successfully')
    } catch (err) {
      console.error('Error deleting course', err)
      showToast('error', 'Failed to delete course')
    } finally {
      setConfirmingDelete(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  )

  return (
    <div>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Courses</h2>
        
        {/* Only show this button if NOT an institution (i.e. Tutors see it) */}
        {!isInstitution && (
            <Link 
                to="/tutor/manage/create" 
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition shadow-sm"
            >
                <PlusCircle className="w-5 h-5" />
                Create Course
            </Link>
        )}
      </div>

      <div className="space-y-4">
        {courses.length === 0 && (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
                <p className="text-gray-500">Get started by creating your first course.</p>
            </div>
        )}

        {courses.map((c) => (
          <div key={c.id} className="p-4 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-center bg-white hover:shadow-md transition-shadow gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {c.image ? (
                  <img src={c.image} alt={c.title} className="w-24 h-16 object-cover rounded-lg bg-gray-100" width={192} height={128} loading="lazy" decoding="async" />
              ) : (
                  <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs font-medium">No Image</div>
              )}
              <div>
                <div className="font-bold text-gray-900 line-clamp-1">{c.title}</div>
                <div className="text-sm text-gray-500 line-clamp-1">{c.description || 'No description provided'}</div>
                <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.published ? 'bg-yellow-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.published ? 'Published' : 'Draft'}
                    </span>
                    {c.meeting_link && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Scheduled</span>
                    )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Price</div>
                <div className="font-bold text-gray-900">₦{parseFloat(c.price).toLocaleString()}</div>
              </div>
              
              {/* Route based on context: institution vs tutor */}
              <div className="flex items-center gap-2">
                {isInstitution ? (
                  <Link to={`/institution/courses/manage?courseId=${c.id}`} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                      Manage
                  </Link>
                ) : (
                  <Link to={`/tutor/manage/create?courseId=${c.id}`} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                      Manage
                  </Link>
                )}

                <button
                  onClick={() => setConfirmingDelete({ id: c.id, title: c.title })}
                  className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
            <button 
                disabled={page <= 1} 
                onClick={() => setPage((p) => Math.max(1, p - 1))} 
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-medium"
            >
                Previous
            </button>
            <span className="text-sm font-medium text-gray-600">Page {page} of {pageCount}</span>
            <button 
                disabled={page >= pageCount} 
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))} 
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 font-medium"
            >
                Next
            </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmingDelete(null)} />
          <div className="relative z-50 bg-white dark:bg-slate-800 rounded-lg p-6 w-[90%] max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Delete Course</h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">Are you sure you want to permanently delete <span className="font-semibold">{confirmingDelete.title}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmingDelete(null)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={() => performDelete(confirmingDelete.id)} className="px-4 py-2 rounded-lg bg-red-600 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Confirm delete modal rendered outside default export so it doesn't re-declare hooks
export function ManageCoursesDeleteModal({ confirmingDelete, onCancel, onConfirm }: { confirmingDelete: { id: number; title?: string } | null, onCancel: () => void, onConfirm: (id: number) => void }) {
  if (!confirmingDelete) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-50 bg-white dark:bg-slate-800 rounded-lg p-6 w-[90%] max-w-md shadow-2xl">
        <h3 className="text-lg font-bold mb-2">Delete Course</h3>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">Are you sure you want to permanently delete <span className="font-semibold">{confirmingDelete.title}</span>? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onConfirm(confirmingDelete.id)} className="px-4 py-2 rounded-lg bg-red-600 text-white">Delete</button>
        </div>
      </div>
    </div>
  )
}