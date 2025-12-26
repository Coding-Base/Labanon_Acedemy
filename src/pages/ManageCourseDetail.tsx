import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface ManageCourseDetailProps {
  uploadCourseImageHandler?: (courseId: number) => Promise<void>
  uploadLessonMediaHandler?: (lessonId: number) => Promise<void>
}

export default function ManageCourseDetail({ uploadCourseImageHandler, uploadLessonMediaHandler }: ManageCourseDetailProps) {
  const { id } = useParams()
  const [course, setCourse] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [modules, setModules] = useState<any[]>([])
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonContent, setNewLessonContent] = useState('')
  const [newLessonFile, setNewLessonFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('access')
        const res = await axios.get(`${API_BASE}/courses/${id}/`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
        setCourse(res.data)
        setTitle(res.data.title)
        setDescription(res.data.description)
        setPrice(res.data.price)
        setModules(res.data.modules || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSaveCourse() {
    if (!title || title.trim() === '') {
      setMessage('Title is required')
      return
    }
    if (isNaN(Number(price))) {
      setMessage('Price must be numeric')
      return
    }

    try {
      const token = localStorage.getItem('access')
      await axios.put(`${API_BASE}/courses/${id}/`, { title, description, price }, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Course updated')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error(err)
      setMessage('Failed to update course')
      setTimeout(() => setMessage(null), 3000)
    }
  }

  async function handleCreateModule() {
    try {
      const token = localStorage.getItem('access')
      const res = await axios.post(`${API_BASE}/modules/`, { course: id, title: newModuleTitle, order: modules.length }, { headers: { Authorization: `Bearer ${token}` } })
      setModules((m) => [...m, res.data])
      setNewModuleTitle('')
    } catch (err) {
      console.error(err)
      alert('Failed to create module')
    }
  }

  async function handleCreateLesson(moduleId: number) {
    if (!newLessonTitle || newLessonTitle.trim() === '') {
      setMessage('Lesson title is required')
      return
    }

    try {
      const token = localStorage.getItem('access')
      let videoRef = ''
      if (newLessonFile) {
        const fd = new FormData()
        fd.append('file', newLessonFile)
        setUploadProgress(0)
        const up = await axios.post(`${API_BASE}/uploads/lessons/media/`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
            setUploadProgress(pct)
          }
        })
        videoRef = up.data.url
        setPreviewUrl(videoRef)
        setUploadProgress(null)
      }

      const res = await axios.post(`${API_BASE}/lessons/`, { module: moduleId, title: newLessonTitle, content: newLessonContent, video: videoRef }, { headers: { Authorization: `Bearer ${token}` } })
      // Refresh modules list
      const c = await axios.get(`${API_BASE}/courses/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
      setModules(c.data.modules || [])
      setNewLessonTitle('')
      setNewLessonContent('')
      setNewLessonFile(null)
      setMessage('Lesson created')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error(err)
      setMessage('Failed to create lesson')
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!course) return <div>Course not found</div>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Course: {course.title}</h2>
      <div className="bg-white p-4 rounded mb-4">
        <label className="block">Title</label>
        <input className="border p-2 w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="block mt-2">Description</label>
        <textarea className="border p-2 w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
        <label className="block mt-2">Price</label>
        <input className="border p-2" value={price} onChange={(e) => setPrice(e.target.value)} />
        <div className="mt-3">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleSaveCourse}>Save</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded mb-4">
        <h3 className="font-semibold">Modules</h3>
        <div className="flex gap-2 my-2">
          <input className="border p-2 flex-1" placeholder="New module title" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} />
          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleCreateModule}>Add Module</button>
        </div>

        <div className="space-y-3">
          {modules.map((m) => (
            <div key={m.id} className="p-3 border rounded">
              <div className="font-semibold">{m.title}</div>
              <div className="text-sm text-gray-600">Lessons: {m.lessons?.length ?? 0}</div>
              <div className="mt-2">
                <input className="border p-2 w-full mb-2" placeholder="Lesson title" value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} />
                <textarea className="border p-2 w-full mb-2" placeholder="Lesson content" value={newLessonContent} onChange={(e) => setNewLessonContent(e.target.value)} />
                <input type="file" onChange={(e) => setNewLessonFile(e.target.files ? e.target.files[0] : null)} />
                        <div className="mt-2">
                          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => handleCreateLesson(m.id)}>Add Lesson</button>
                        </div>
                        {uploadProgress !== null && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600">Uploading: {uploadProgress}%</div>
                            <div className="w-full bg-gray-200 h-2 rounded mt-1"><div className="bg-blue-600 h-2 rounded" style={{ width: `${uploadProgress}%` }} /></div>
                          </div>
                        )}
                        {previewUrl && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600">Preview</div>
                            <video src={previewUrl} controls className="w-full mt-1" />
                          </div>
                        )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
