import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Loader2, ArrowLeft } from 'lucide-react'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

export default function AdminCourseDetail({ idParam, onClose }:{ idParam?: string | undefined, onClose?: ()=>void }){
  const params = useParams()
  const { id } = params as { id?: string } 
  const courseId = idParam ?? id
  const navigate = useNavigate()
  const [course, setCourse] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)

  useEffect(() => {
    if (!courseId) return
    async function load(){
      setLoading(true)
      try{
        const token = localStorage.getItem('access')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await axios.get(`${API_BASE}/courses/${courseId}/admin_detail/`, { headers })
        setCourse(res.data)
      }catch(e:any){
        console.error(e)
        setError(e?.response?.data?.detail || 'Failed to load course')
      }finally{setLoading(false)}
    }
    load()
  }, [courseId])

  async function handleUnpublish(){
    if(!courseId) return
    setSaving(true)
    try{
      const token = localStorage.getItem('access')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.post(`${API_BASE}/courses/${courseId}/unpublish/`, {}, { headers })
      // refresh
      const res = await axios.get(`${API_BASE}/courses/${courseId}/admin_detail/`, { headers })
      setCourse(res.data)
      setConfirmUnpublish(false)
      alert('Course unpublished')
    }catch(e:any){
      alert(e?.response?.data?.detail || 'Failed to unpublish')
    }finally{setSaving(false)}
  }

  if(loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-yellow-600"/></div>

  if(!course) return <div className="min-h-screen flex items-center justify-center">{error || 'Course not found'}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b py-4">
        <div className="max-w-6xl mx-auto px-4">
          <button onClick={() => { if (onClose) return onClose(); navigate(-1) }} className="flex items-center gap-2 text-gray-700"><ArrowLeft className="w-4 h-4"/> Back</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold mb-2 break-words">{course.title}</h1>
              <p className="text-sm text-gray-600 mb-4">By <strong>{course.creator_username || course.creator}</strong> • Created at: {new Date(course.created_at).toLocaleString()}</p>
              <p className="text-gray-700 mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>Students: <strong>{course.students_count ?? course.stats?.students ?? 0}</strong></div>
                <div>Sold: <strong>{course.sold_count ?? 0}</strong></div>
                <div>Revenue: <strong>{course.payments_total ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(course.payments_total) : '₦0'}</strong></div>
                <div>Published: <strong>{course.published ? 'Yes' : 'No'}</strong></div>
              </div>
            </div>

            <div className="w-full md:w-56 flex-shrink-0">
              <img src={course.image || ''} alt={course.title} className="w-full h-40 object-cover rounded"/>
              <div className="mt-4">
                {!confirmUnpublish ? (
                  <button onClick={() => setConfirmUnpublish(true)} disabled={saving || !course.published} className="w-full px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">{saving ? 'Saving...' : 'Unpublish'}</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleUnpublish} disabled={saving} className="flex-1 px-4 py-2 bg-red-700 text-white rounded">{saving ? 'Saving...' : 'Confirm'}</button>
                    <button onClick={() => setConfirmUnpublish(false)} disabled={saving} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="my-6" />

          <h2 className="text-lg font-semibold mb-3">Modules & Lessons</h2>
          {course.modules && course.modules.length > 0 ? (
            <div className="space-y-4">
              {course.modules.map((m:any, mi:number) => (
                <div key={m.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-sm text-gray-500">{m.lessons?.length || 0} lessons</div>
                  </div>
                  <div className="space-y-2">
                    {m.lessons?.map((l:any, li:number) => (
                      <div key={l.id} className="flex items-center justify-between">
                        <div>{li+1}. {l.title}</div>
                        <div className="text-sm text-gray-500">{l.duration_minutes ? `${l.duration_minutes}m` : '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No modules added.</div>
          )}

          <hr className="my-6" />

          <h2 className="text-lg font-semibold mb-3">Videos Attached</h2>
          {course.modules ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.modules.flatMap((m:any)=> (m.lessons||[])).filter(Boolean).map((l:any, idx:number) => (
                <div key={idx} className="p-3 border rounded flex items-center gap-4">
                  <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">▶</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{l.title}</div>
                    <div className="text-xs text-gray-500">{l.youtube_url ? 'YouTube' : (l.video ? 'Uploaded' : 'No video')}</div>
                  </div>
                  <div className="text-sm text-gray-500">{l.duration_minutes ? `${l.duration_minutes}m` : ''}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No videos available.</div>
          )}
        </div>
      </div>
    </div>
  )
}
