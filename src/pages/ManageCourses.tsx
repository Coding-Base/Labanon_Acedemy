import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function ManageCourses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('access')
        const me = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } })
        const uid = me.data.id
        const res = await axios.get(`${API_BASE}/courses/?creator=${uid}`, { headers: { Authorization: `Bearer ${token}` } })
        setCourses(res.data.results || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleCreate() {
    if (!title || title.trim() === '') {
      alert('Title is required')
      return
    }
    if (isNaN(Number(price))) {
      alert('Price must be numeric')
      return
    }

    try {
      const token = localStorage.getItem('access')
      let imageUrl = ''
      if (imageFile) {
        const fd = new FormData()
        fd.append('file', imageFile)
        setUploadProgress(0)
        const up = await axios.post(`${API_BASE}/uploads/courses/image/`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / (e.total || 1)))
        })
        imageUrl = up.data.url
        setUploadProgress(null)
      }

      const res = await axios.post(`${API_BASE}/courses/`, { title, description, price, image: imageUrl }, { headers: { Authorization: `Bearer ${token}` } })
      setCourses((c) => [res.data, ...c])
      setTitle('')
      setDescription('')
      setPrice('0')
      setImageFile(null)
      setPreviewUrl(null)
    } catch (err) {
      console.error(err)
      alert('Failed to create course')
    }
  }

  if (loading) return <div>Loading your courses...</div>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Courses</h2>

      <div className="bg-white p-4 rounded mb-4">
        <h3 className="font-semibold">Create Course</h3>
        <input className="border p-2 w-full my-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="border p-2 w-full my-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="border p-2 my-2" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
        <div className="my-2">
          <label className="block text-sm text-gray-700">Course image (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files ? e.target.files[0] : null
            setImageFile(f)
            if (f) setPreviewUrl(URL.createObjectURL(f))
            else setPreviewUrl(null)
          }} />
          {uploadProgress !== null && <div className="text-sm text-gray-600">Uploading image: {uploadProgress}%</div>}
          {previewUrl && (
            <div className="mt-2">
              <div className="text-sm text-gray-600">Preview</div>
              <img src={previewUrl} alt="preview" className="w-48 h-32 object-cover rounded mt-1" />
            </div>
          )}
        </div>
        <div>
          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleCreate}>Create</button>
        </div>
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
              <Link to={`/dashboard/manage/${c.id}`} className="px-3 py-1 bg-blue-600 text-white rounded">Manage</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
