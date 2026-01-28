// src/pages/CreateCourse.tsx
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { VideoUploadWidget } from '../components/VideoUploadWidget'
import { Calendar, Clock, MapPin, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

const levels = ['Beginner', 'Intermediate', 'Professional'] as const
type Level = (typeof levels)[number]

type Lesson = {
  id?: number | string
  title: string
  content?: string
  video_s3?: string
  video_s3_url?: string
  video_s3_status?: string
  youtube_url?: string
  video?: string
  [key: string]: any
}

type ModuleItem = {
  id?: number | string
  title: string
  order?: number
  lessons?: Lesson[]
}

export default function CreateCourse() {
  const navigate = useNavigate()
  const location = useLocation()
  const [courseType, setCourseType] = useState<'normal' | 'scheduled'>('normal')
  
  // Common Fields
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('0')
  const [description, setDescription] = useState('')
  const [requiredTools, setRequiredTools] = useState('')
  const [numLessons, setNumLessons] = useState(0) 
  const [level, setLevel] = useState<Level>(levels[0])
  const [outcome, setOutcome] = useState('')
  
  // Linking
  const [linkedCourse, setLinkedCourse] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // modules + lessons local state (Normal Course Only)
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null)
  const [moduleTitleInput, setModuleTitleInput] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('') 
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null)

  // scheduled course fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [meetingPlace, setMeetingPlace] = useState('zoom')
  const [meetingLink, setMeetingLink] = useState('')

  // image for course
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null)
  const [courseImagePreview, setCourseImagePreview] = useState<string | null>(null)

  // UI / status
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<any | null>(null)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Encoding feedback state
  const [isEncodingVideo, setIsEncodingVideo] = useState(false)
  const [encodingVideoId, setEncodingVideoId] = useState<string | null>(null)

  // Polling refs for background video status checks
  const videoPollingRefs = useRef<Record<string, number>>({})

  // ... (Video helper functions: waitForVideoReady, ensureAllVideosReady, startPollingForVideo - Same as before)
  async function waitForVideoReady(videoId: string, token: string | null, timeoutMs = 30000, intervalMs = 3000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await axios.get(`${API_BASE}/videos/${videoId}/`, { headers: { Authorization: `Bearer ${token}` } })
        const data = res.data
        if (data && data.status === 'ready') return data
      } catch (err) {}
      await new Promise((r) => setTimeout(r, intervalMs))
    }
    return null
  }

  async function ensureAllVideosReady(token: string | null, timeoutMs = 30000) {
    const pending: string[] = []
    modules.forEach((mod) => {
      (mod.lessons || []).forEach((ls: any) => {
        if (ls.video_s3 && !ls.video_s3_url) pending.push(ls.video_s3)
      })
    })
    const unique = Array.from(new Set(pending))
    if (unique.length === 0) return
    const promises = unique.map((id) => waitForVideoReady(id, token, timeoutMs))
    const results = await Promise.all(promises)
    setModules((prev) => {
      const copy = prev.map((m) => ({ ...m, lessons: (m.lessons || []).map((ls: any) => ({ ...ls })) }))
      results.forEach((res) => {
        if (res && res.id) {
          for (let mi = 0; mi < copy.length; mi++) {
            const mod = copy[mi]
            for (let li = 0; li < (mod.lessons || []).length; li++) {
              const ls = mod.lessons![li]
              if (ls.video_s3 === res.id) {
                copy[mi].lessons![li] = { ...ls, video_s3_url: res.cloudfront_url, video_s3_status: res.status }
              }
            }
          }
        }
      })
      return copy
    })
  }

  function startPollingForVideo(videoId: string, moduleIdx: number, lessonIdx: number) {
    const token = localStorage.getItem('access')
    if (!videoId || !token) return
    if (videoPollingRefs.current[videoId]) return
    
    // Start encoding feedback
    setIsEncodingVideo(true)
    setEncodingVideoId(videoId)
    
    const interval = window.setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/videos/${videoId}/`, { headers: { Authorization: `Bearer ${token}` } })
        const data = res.data
        if (data && data.status === 'ready') {
          setModules((prev) => {
            const copy = [...prev]
            if (copy[moduleIdx] && copy[moduleIdx].lessons) {
              const lesson = copy[moduleIdx].lessons![lessonIdx]
              copy[moduleIdx].lessons![lessonIdx] = { ...lesson, video_s3_url: data.cloudfront_url, video_s3_status: data.status }
            }
            return copy
          })
          window.clearInterval(videoPollingRefs.current[videoId])
          delete videoPollingRefs.current[videoId]
          
          // Stop encoding feedback
          setIsEncodingVideo(false)
          setEncodingVideoId(null)
          
          try { alert('Video encoding complete — URL attached to lesson.') } catch { }
        }
      } catch (err) {}
    }, 3000)
    videoPollingRefs.current[videoId] = interval as unknown as number
  }
  // ... (End video helpers)

  useEffect(() => {
    let mounted = true
    async function search() {
      if (!searchQuery) { setSearchResults([]); return }
      try {
        const token = localStorage.getItem('access')
        const res = await axios.get(`${API_BASE}/courses/?search=${encodeURIComponent(searchQuery)}&page_size=5`, { headers: { Authorization: `Bearer ${token}` } })
        if (mounted) setSearchResults(res.data.results || res.data || [])
      } catch (err) { console.error(err) }
    }
    const t = setTimeout(search, 300)
    return () => { mounted = false; clearTimeout(t) }
  }, [searchQuery])

  // Lock body scroll while guide modal is open
  useEffect(() => {
    if (guideOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
    return
  }, [guideOpen])

  // Load course for editing
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const courseId = params.get('courseId')
    let mounted = true
    async function loadCourse(id: string) {
      try {
        const token = localStorage.getItem('access')
        const res = await axios.get(`${API_BASE}/courses/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
        if (!mounted) return
        const data = res.data
        
        setTitle(data.title || '')
        setDescription(data.description || '')
        setPrice(String(data.price ?? 0))
        setCourseImagePreview(data.image || null)
        setLevel(data.level || levels[0])
        setOutcome(data.outcome || '')
        setRequiredTools(data.required_tools || '')
        
        // Scheduled check
        if (data.meeting_link || (data.start_date && data.meeting_place)) {
            setCourseType('scheduled')
            setStartDate(data.start_date || '')
            setEndDate(data.end_date || '')
            setMeetingTime(data.meeting_time || '')
            setMeetingPlace(data.meeting_place || 'zoom')
            setMeetingLink(data.meeting_link || '')
        } else {
            setCourseType('normal')
        }

        const mods = (data.modules || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          order: m.order || 0,
          lessons: (m.lessons || []).map((ls: any) => ({ 
              id: ls.id, 
              title: ls.title, 
              content: ls.content, 
              video: ls.video,
              video_s3: ls.video_s3,
              video_s3_url: ls.video_s3_url,
              youtube_url: ls.youtube_url
          }))
        }))
        setModules(mods)
        if (mods.length > 0) setCurrentModuleIndex(0)

      } catch (err) { console.error('Failed to load course for editing', err) }
    }
    if (courseId) loadCourse(courseId)
    return () => { mounted = false }
  }, [location.search])

  async function uploadCourseImageIfNeeded(courseId: any, token: string | null) {
    if (!courseImageFile || !courseId) return
    try {
      const form = new FormData()
      form.append('image_upload', courseImageFile) // Use image_upload key
      await axios.patch(`${API_BASE}/courses/${courseId}/`, form, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
    } catch (err) {
      console.error('Failed to upload course image', err)
    }
  }

  // --- SUBMIT HANDLER FOR BOTH PUBLISH AND SAVE ---
  async function handleCourseSubmit(publish: boolean) {
    setErrors({})
    setGeneralError(null)
    
    // Basic Validation
    if (!title.trim()) { setErrors(prev => ({ ...prev, title: ['Title required'] })); return }
    
    // Scheduled Validation
    if (courseType === 'scheduled') {
        let hasError = false;
        if (!startDate || !endDate) { 
            setErrors(prev => ({...prev, dates: 'Start and End dates are required'})); 
            hasError = true; 
        }
        if (!meetingTime) { 
            setErrors(prev => ({...prev, time: 'Meeting time is required'})); 
            hasError = true; 
        }
        if (!meetingLink) { 
            setErrors(prev => ({...prev, link: 'Meeting link is required'})); 
            hasError = true; 
        }
        if (hasError) return;
    }

    publish ? setPublishing(true) : setSaving(true)

    try {
      const token = localStorage.getItem('access')
      const params = new URLSearchParams(location.search)
      const courseId = params.get('courseId')
      
      // Use FormData for everything to handle file upload correctly
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description)
      formData.append('price', String(Number(price) || 0))
      formData.append('published', publish ? 'true' : 'false')
      formData.append('level', level)
      formData.append('outcome', outcome)
      formData.append('required_tools', requiredTools) 

      // Handle Scheduled Fields
      if (courseType === 'scheduled') {
          formData.append('start_date', startDate)
          formData.append('end_date', endDate)
          formData.append('meeting_time', meetingTime)
          formData.append('meeting_place', meetingPlace)
          formData.append('meeting_link', meetingLink)
      } else {
          // Explicitly clear or send empty strings for scheduled fields
          // This allows the backend to receive them as empty (valid per allow_blank=True)
          formData.append('start_date', '') 
          formData.append('end_date', '')
          formData.append('meeting_time', '')
          formData.append('meeting_place', '')
          formData.append('meeting_link', '')
      }

      // Handle Image
      if (courseImageFile) {
          formData.append('image_upload', courseImageFile) // Use image_upload key
      }

      let createdCourseId = courseId
      
      if (courseId) {
        // UPDATE
        await axios.patch(`${API_BASE}/courses/${courseId}/`, formData, { 
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } 
        })
      } else {
        // CREATE
        const res = await axios.post(`${API_BASE}/courses/`, formData, { 
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } 
        })
        createdCourseId = res.data.id
      }

      // Handle Modules (Only for Normal Courses)
      if (courseType === 'normal') {
          await ensureAllVideosReady(token)
          if (createdCourseId && modules.length > 0) {
             for (let mi = 0; mi < modules.length; mi++) {
                const mod = modules[mi]
                let moduleId = mod.id
                try {
                  if (moduleId) {
                    await axios.patch(`${API_BASE}/modules/${moduleId}/`, { title: mod.title, order: mi }, { headers: { Authorization: `Bearer ${token}` } })
                  } else {
                    const mres = await axios.post(`${API_BASE}/modules/`, { course: createdCourseId, title: mod.title, order: mi }, { headers: { Authorization: `Bearer ${token}` } })
                    moduleId = mres.data.id
                  }
                } catch (err) { continue }

                for (let li = 0; li < (mod.lessons || []).length; li++) {
                  const ls = mod.lessons![li]
                  try {
                    const lessonPayload: any = { 
                      module: moduleId, 
                      title: ls.title, 
                      content: ls.content
                    }
                    if (ls.video_s3) lessonPayload.video_s3 = ls.video_s3
                    if (ls.video_s3_url) lessonPayload.video_s3_url = ls.video_s3_url
                    if (ls.youtube_url) lessonPayload.youtube_url = ls.youtube_url
                    
                    if (ls.id) {
                      await axios.patch(`${API_BASE}/lessons/${ls.id}/`, lessonPayload, { headers: { Authorization: `Bearer ${token}` } })
                    } else {
                      await axios.post(`${API_BASE}/lessons/`, lessonPayload, { headers: { Authorization: `Bearer ${token}` } })
                    }
                  } catch (err) { console.error(err) }
                }
             }
          }
      }
      
      alert(publish ? 'Course Published!' : 'Draft Saved!')
      navigate('/tutor/manage')

    } catch (err: any) {
      console.error(err)
      if (err?.response?.data) setErrors(err.response.data)
      else setGeneralError('Failed to save/publish course')
    } finally {
      publish ? setPublishing(false) : setSaving(false)
    }
  }

  // Wrappers for buttons
  const publishCourse = () => handleCourseSubmit(true)
  const saveDraft = () => handleCourseSubmit(false)

  // ... (Rest of helper functions: addModule, onCourseImageInput, etc. remain unchanged) ...
  function addModule() {
    if (!moduleTitleInput.trim()) return
    const newModule: ModuleItem = { title: moduleTitleInput.trim(), order: modules.length, lessons: [] }
    setModules((m) => [...m, newModule])
    setModuleTitleInput('')
    setCurrentModuleIndex(modules.length)
  }

  function startEditLesson(moduleIdx: number, lessonIdx: number) {
    const ls = modules[moduleIdx].lessons?.[lessonIdx]
    if (!ls) return
    setEditingLessonIndex(lessonIdx)
    setLessonTitle(ls.title || '')
    setLessonContent(ls.content || '')
    setCurrentModuleIndex(moduleIdx)
  }

  function cancelEditLesson() {
    setEditingLessonIndex(null)
    setLessonTitle('')
    setLessonContent('')
  }

  function addOrUpdateLesson() {
    if (currentModuleIndex === null) {
      setErrors((e) => ({ ...e, lesson_module: ['Select or create a module first'] }))
      return
    }
    if (!lessonTitle.trim()) {
      setErrors((e) => ({ ...e, lesson_title: ['Lesson title required'] }))
      return
    }
    setErrors((e) => {
      const copy = { ...e }; delete copy.lesson_title; delete copy.lesson_module; return copy
    })

    setModules((m) => {
      const copy = [...m]
      const mod = { ...(copy[currentModuleIndex] || { title: 'Module', lessons: [] }) }
      const lessonObj: Lesson = { title: lessonTitle.trim(), content: lessonContent }
      if (editingLessonIndex !== null) {
        mod.lessons = [...(mod.lessons || [])]
        mod.lessons[editingLessonIndex] = { ...(mod.lessons[editingLessonIndex] || {}), ...lessonObj }
      } else {
        mod.lessons = [...(mod.lessons || []), lessonObj]
      }
      copy[currentModuleIndex] = mod
      return copy
    })
    setLessonTitle(''); setLessonContent(''); setEditingLessonIndex(null)
  }

  async function removeLesson(moduleIdx: number, lessonIdx: number) {
    const mod = modules[moduleIdx]
    const ls = mod?.lessons?.[lessonIdx]
    if (ls?.id) {
        const token = localStorage.getItem('access')
        await axios.delete(`${API_BASE}/lessons/${ls.id}/`, { headers: { Authorization: `Bearer ${token}` } }).catch(console.error)
    }
    setModules((m) => {
      const copy = [...m]
      const mod = { ...copy[moduleIdx] }
      mod.lessons = (mod.lessons || []).filter((_: any, i: number) => i !== lessonIdx)
      copy[moduleIdx] = mod
      return copy
    })
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    if (pendingDelete.type === 'lesson') removeLesson(pendingDelete.moduleIdx, pendingDelete.lessonIdx)
    else if (pendingDelete.type === 'module') deleteModule(pendingDelete.moduleIdx)
    setPendingDelete(null)
  }

  function cancelDelete() { setPendingDelete(null) }

  async function deleteModule(moduleIdx: number) {
    const mod = modules[moduleIdx]
    if (mod?.id) {
        const token = localStorage.getItem('access')
        await axios.delete(`${API_BASE}/modules/${mod.id}/`, { headers: { Authorization: `Bearer ${token}` } }).catch(console.error)
    }
    setModules((m) => {
      const copy = [...m]; copy.splice(moduleIdx, 1); return copy
    })
    setCurrentModuleIndex(null)
  }

  function onCourseImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    if (f) {
        setCourseImageFile(f)
        const reader = new FileReader()
        reader.onload = () => setCourseImagePreview(String(reader.result))
        reader.readAsDataURL(f)
    }
  }

  function insertCodeSnippet(code: string, language = 'text') {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const block = `<pre><code class="language-${language}">${escaped}</code></pre><p></p>`
    setLessonContent((c) => (c || '') + block)
  }

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block', 'link'],
      ['clean']
    ]
  }
  const quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'blockquote', 'code-block', 'link']

  // --- RENDER ---

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Create Course</h2>
          <button onClick={() => setGuideOpen(true)} className="px-3 py-1 bg-brand-600 text-white rounded text-sm">How to use this panel — Watch Guide</button>
        </div>
        <div className="flex items-center gap-3">
          {courseType === 'normal' && <button onClick={() => setPreviewOpen(true)} className="px-4 py-2 bg-gray-100 rounded">Preview</button>}
          <button onClick={saveDraft} disabled={saving} className="px-4 py-2 bg-brand-500 text-white rounded">{saving ? 'Saving...' : 'Save Draft'}</button>
          <button onClick={publishCourse} disabled={publishing} className="px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold">{publishing ? 'Publishing...' : 'Publish Course'}</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg">
        {/* Dynamic Grid Layout: 2 Cols for Normal, 1 Centered Col for Scheduled */}
        <div className={`grid gap-6 ${courseType === 'normal' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
          
          {/* Left Column (or Main Column for Scheduled) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Course Type</label>
            <select value={courseType} onChange={(e) => setCourseType(e.target.value as any)} className="mt-2 w-full border rounded p-2 mb-6 bg-gray-50 border-gray-300">
              <option value="normal">Normal Content & Tutorial Course</option>
              <option value="scheduled">Scheduled Live Lessons Course</option>
            </select>

            {/* NORMAL COURSE FIELDS */}
            {courseType === 'normal' && (
              <>
                <label className="block text-sm font-medium text-gray-700 mt-4">Title</label>
                <input className="mt-2 w-full border rounded p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
                {errors.title && <div className="text-sm text-red-600 mt-1">{Array.isArray(errors.title) ? errors.title[0] : errors.title}</div>}

                <label className="block text-sm font-medium text-gray-700 mt-4">Price</label>
                <input className="mt-2 w-full border rounded p-2" value={price} onChange={(e) => setPrice(e.target.value)} />
                {errors.price && <div className="text-sm text-red-600 mt-1">{Array.isArray(errors.price) ? errors.price[0] : errors.price}</div>}

                <label className="block text-sm font-medium text-gray-700 mt-4">Course Description</label>
                <textarea className="mt-2 w-full border rounded p-2 h-28" value={description} onChange={(e) => setDescription(e.target.value)} />

                <label className="block text-sm font-medium text-gray-700 mt-4">Required Tools (optional)</label>
                <input className="mt-2 w-full border rounded p-2" value={requiredTools} onChange={(e) => setRequiredTools(e.target.value)} />

                <label className="block text-sm font-medium text-gray-700 mt-4">Number of Lessons</label>
                <input type="number" className="mt-2 w-32 border rounded p-2" value={numLessons} onChange={(e) => setNumLessons(Number(e.target.value))} />

                <label className="block text-sm font-medium text-gray-700 mt-4">Level</label>
                <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="mt-2 w-full border rounded p-2">
                  {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>

                <label className="block text-sm font-medium text-gray-700 mt-4">Course Outcome</label>
                <textarea className="mt-2 w-full border rounded p-2 h-20" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
                {errors.outcome && <div className="text-sm text-red-600 mt-1">{Array.isArray(errors.outcome) ? errors.outcome[0] : errors.outcome}</div>}

                <label className="block text-sm font-medium text-gray-700 mt-4">Course Image (thumbnail)</label>
                <div className="mt-2 flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={onCourseImageInput} />
                  {courseImagePreview && <img src={courseImagePreview} alt="preview" className="w-24 h-16 object-cover rounded" />}
                </div>

                <label className="block text-sm font-medium text-gray-700 mt-4">Linked Course (optional)</label>
                <input className="mt-2 w-full border rounded p-2" placeholder="Search your previous courses" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded max-h-40 overflow-auto bg-white">
                    {searchResults.map((s) => (
                      <div key={s.id} onClick={() => { setLinkedCourse(s); setSearchResults([]); setSearchQuery('') }} className="p-2 hover:bg-gray-50 cursor-pointer">
                        <div className="font-medium">{s.title}</div>
                        <div className="text-xs text-gray-500">{s.description?.slice(0,60)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {linkedCourse && (
                  <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">Linked: {linkedCourse.title}</div>
                      <div className="text-xs text-gray-500">{linkedCourse.description?.slice(0,80)}</div>
                    </div>
                    <button onClick={() => setLinkedCourse(null)} className="text-sm text-red-600">Remove</button>
                  </div>
                )}
              </>
            )}

            {/* SCHEDULED COURSE FIELDS */}
            {courseType === 'scheduled' && (
              <div className="mt-4 space-y-6">
                {/* Info Box */}
                <div className="bg-brand-50 p-4 rounded-lg border border-brand-200">
                  <h3 className="font-semibold text-brand-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5"/> Scheduled Live Course
                    </h3>
                    <p className="text-sm text-brand-700 mt-1">
                        Students who enroll will be directed to a schedule page with a countdown. 
                        The "Join Class" button will only activate at the meeting time.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Course Title</label>
                    <input className="mt-2 w-full border rounded p-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Live React Bootcamp" />
                    {errors.title && <div className="text-sm text-red-600 mt-1">{errors.title}</div>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 w-full border rounded p-2" />
                  </div>
                </div>
                {errors.dates && <div className="text-sm text-red-600">{errors.dates}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meeting Time (Daily/Weekly)</label>
                    <div className="relative mt-2">
                        <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className="w-full border rounded p-2 pl-10" />
                    </div>
                    {errors.time && <div className="text-sm text-red-600 mt-1">{errors.time}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meeting Platform</label>
                    <div className="relative mt-2">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <select value={meetingPlace} onChange={(e) => setMeetingPlace(e.target.value)} className="w-full border rounded p-2 pl-10">
                        <option value="zoom">Zoom</option>
                        <option value="google_meet">Google Meet</option>
                        <option value="team">Microsoft Teams</option>
                        <option value="other">Other</option>
                        </select>
                    </div>
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Meeting Link (Hidden until class time)</label>
                    <div className="relative mt-2">
                        <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input className="w-full border rounded p-2 pl-10" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://zoom.us/j/..." />
                    </div>
                    {errors.link && <div className="text-sm text-red-600 mt-1">{errors.link}</div>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price (₦)</label>
                    <input className="mt-2 w-full border rounded p-2" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Level</label>
                    <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="mt-2 w-full border rounded p-2">
                      {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Short Description</label>
                    <textarea className="mt-2 w-full border rounded p-2 h-24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will be covered in these live sessions?" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Learning Outcome</label>
                    <textarea className="mt-2 w-full border rounded p-2 h-20" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="What will students achieve?" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Required Tools</label>
                    <input className="mt-2 w-full border rounded p-2" value={requiredTools} onChange={(e) => setRequiredTools(e.target.value)} placeholder="e.g. Laptop, Zoom installed" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                    <div className="flex items-center gap-4 p-4 border rounded bg-gray-50">
                        <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                            {courseImagePreview ? (
                                <img src={courseImagePreview} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                            )}
                        </div>
                        <input type="file" accept="image/*" onChange={onCourseImageInput} className="text-sm" />
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Lessons (Only for Normal) */}
          {courseType === 'normal' && (
            <div>
              <h3 className="font-semibold">Lessons</h3>
              <p className="text-sm text-gray-600">Add lessons for this course.</p>
              {/* ... Lesson Management UI remains exactly as provided previously ... */}
               <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Modules</label>
                <div className="mt-2 flex items-center gap-2">
                  <input placeholder="Module title" value={moduleTitleInput} onChange={(e) => setModuleTitleInput(e.target.value)} className="w-full border rounded p-2" />
                  <button onClick={addModule} className="px-4 py-2 bg-brand-600 text-white rounded">Add Module</button>
                </div>

                <div className="mt-3 space-y-2">
                  {modules.map((m, idx) => (
                    <div key={idx} className={`p-2 border rounded flex items-center justify-between ${currentModuleIndex === idx ? 'bg-brand-50' : ''}`}>
                      <div className="cursor-pointer" onClick={() => setCurrentModuleIndex(idx)}>
                        <div className="font-medium">{m.title}</div>
                        <div className="text-xs text-gray-500">{(m.lessons || []).length} lessons</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentModuleIndex(idx)} className="text-sm text-brand-600">Edit</button>
                        <button onClick={() => setPendingDelete({ type: 'module', moduleIdx: idx })} className="text-sm text-red-600">Delete</button>
                      </div>
                    </div>
                  ))}
                  {modules.length === 0 && <div className="text-sm text-gray-500">No modules yet. Add one to start adding lessons.</div>}
                </div>

                <div className="mt-4 bg-gray-50 p-4 rounded">
                  <label className="block text-sm font-medium text-gray-700">Lesson Title</label>
                  <input className="mt-2 w-full border rounded p-2" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
                  {errors.lesson_title && <div className="text-sm text-red-600 mt-1">{Array.isArray(errors.lesson_title) ? errors.lesson_title[0] : errors.lesson_title}</div>}

                  <label className="block text-sm font-medium text-gray-700 mt-3">Lesson Content (rich editor)</label>
                  <div className="mt-2">
                    <ReactQuill value={lessonContent} onChange={setLessonContent} modules={quillModules} formats={quillFormats} />
                  </div>

                  <div className="mt-3 flex gap-2 items-center">
                    <label className="block text-sm font-medium text-gray-700">Insert code snippet</label>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <CodeSnippetInserter onInsert={(code, lang) => insertCodeSnippet(code, lang)} />
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mt-3">Video (YouTube link OR upload below)</label>
                  {/* ... Video Upload Widget ... */}
                  {currentModuleIndex !== null && editingLessonIndex !== null && (
                    <div className="mt-4 border rounded p-3 bg-white">
                      <VideoUploadWidget 
                        onUploadComplete={(videoData) => {
                          setModules(prev => {
                            const cp = [...prev]
                            const moduleIdx = currentModuleIndex
                            const lessonIdx = editingLessonIndex
                            if (cp[moduleIdx] && cp[moduleIdx].lessons) {
                              cp[moduleIdx].lessons![lessonIdx] = {
                                ...cp[moduleIdx].lessons![lessonIdx],
                                video_s3: videoData.video_id,
                                video_s3_url: videoData.cloudfront_url || undefined,
                                video_s3_status: videoData.status || 'processing'
                              }
                            }
                            return cp
                          })
                          if (currentModuleIndex !== null && editingLessonIndex !== null && videoData.video_id) {
                            startPollingForVideo(videoData.video_id, currentModuleIndex, editingLessonIndex)
                          }
                          alert('Video uploaded successfully! Encoding queued.')
                        }}
                      />
                    </div>
                  )}
                  
                  {currentModuleIndex === null && (
                    <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded text-sm text-brand-800">
                      Select a module first to upload a video
                    </div>
                  )}
                  
                  {editingLessonIndex === null && currentModuleIndex !== null && (
                    <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded text-sm text-brand-800">
                      Select or create a lesson to upload a video
                    </div>
                  )}

                      <div className="mt-4 flex gap-2">
                    <button onClick={addOrUpdateLesson} className="px-4 py-2 bg-brand-600 text-white rounded">{editingLessonIndex !== null ? 'Save Lesson' : 'Add Lesson'}</button>
                    <button onClick={() => { cancelEditLesson(); setLessonTitle(''); setLessonContent('') }} className="px-4 py-2 bg-gray-100 rounded">Reset</button>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium">Added Lessons</h4>
                  <div className="space-y-2 mt-2">
                    {currentModuleIndex === null && <div className="text-sm text-gray-500">Select a module to see its lessons.</div>}
                    {currentModuleIndex !== null && (modules[currentModuleIndex]?.lessons || []).map((l: Lesson, li: number) => (
                      <div key={li} className="p-3 border rounded flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{l.title}</div>
                          <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: String(l.content || '').slice(0, 200) }} />
                          {(l.video || l.video_s3 || l.youtube_url) && (
                            <div className="mt-2 text-xs text-brand-600 font-medium">
                                {l.youtube_url ? 'YouTube Video Attached' : l.video_s3 ? 'S3 Video Attached' : 'Video Attached'}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => startEditLesson(currentModuleIndex, li)} className="text-sm text-brand-600">Edit</button>
                          <button onClick={() => setPendingDelete({ type: 'lesson', moduleIdx: currentModuleIndex, lessonIdx: li })} className="text-sm text-red-600">Remove</button>
                        </div>
                      </div>
                    ))}
                    {currentModuleIndex !== null && (modules[currentModuleIndex]?.lessons || []).length === 0 && <div className="text-sm text-gray-500">No lessons yet in this module</div>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal (Only relevant for Normal Courses usually, but can adapt) */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-[90%] md:w-3/4 max-h-[90%] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Course Preview</h3>
              <button onClick={() => setPreviewOpen(false)} className="px-3 py-1 bg-gray-100 rounded">Close</button>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{title || 'Untitled Course'}</h2>
              {courseImagePreview && <img src={courseImagePreview} alt="course" className="w-48 mt-2 mb-4 object-cover rounded" />}
              <p className="text-sm text-gray-600">{description}</p>
              <div className="mt-4"><strong>Price:</strong> ₦{price}</div>
              
              {courseType === 'normal' && (
                  <div className="mt-4">
                    <h4 className="font-semibold">Lessons ({modules.flatMap(m => m.lessons || []).length})</h4>
                    <div className="mt-2 space-y-3">
                        {modules.flatMap(m => m.lessons || []).map((l: Lesson, i: number) => (
                        <div key={i} className="p-3 border rounded">
                            <div className="font-semibold">{l.title}</div>
                        </div>
                        ))}
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal - embedded YouTube video */}
      {guideOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGuideOpen(false)} />

          <div className="relative z-10 bg-white rounded-lg w-[95%] md:w-3/4 lg:w-2/3 max-h-[90%] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="text-lg font-semibold">How to use this panel — Guide</h3>
              <button onClick={() => setGuideOpen(false)} className="px-3 py-1 bg-gray-100 rounded">Close</button>
            </div>
            <div className="p-4">
              <div className="w-full" style={{ position: 'relative', paddingTop: '56.25%' }}>
                <iframe
                  src="https://www.youtube.com/embed/9RAz35sJM7Q"
                  title="Create Course Panel Guide"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-sm text-gray-600 mt-3">This short walkthrough shows how tutors and institutions can use the Create Course panel.</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-[90%] md:w-1/3 p-6">
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            <p className="mt-3 text-sm text-gray-700">Are you sure you want to delete this {pendingDelete.type === 'module' ? 'module' : 'lesson'}? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={cancelDelete} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Video Encoding Feedback Overlay */}
      {isEncodingVideo && encodingVideoId && (
        <div className="fixed inset-0 z-70 flex items-center justify-center">
          {/* Blur background */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          
          {/* Content */}
          <div className="relative z-71 flex flex-col items-center justify-center gap-6 bg-white rounded-lg p-8 w-[90%] md:w-1/3 shadow-2xl">
            {/* Loader Animation */}
            <div className="flex items-center justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-brand-600 rounded-full animate-spin border-r-transparent border-t-transparent" />
              </div>
            </div>

            {/* Text */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Encoding Video</h3>
              <p className="text-sm text-gray-600">Your video is being processed and optimized for playback. This may take a few minutes.</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setIsEncodingVideo(false)
                  setEncodingVideoId(null)
                  if (encodingVideoId && videoPollingRefs.current[encodingVideoId]) {
                    window.clearInterval(videoPollingRefs.current[encodingVideoId])
                    delete videoPollingRefs.current[encodingVideoId]
                  }
                }}
                className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition"
              >
                Quiet
              </button>
              <button
                onClick={() => {
                  setIsEncodingVideo(false)
                  setEncodingVideoId(null)
                  if (encodingVideoId && videoPollingRefs.current[encodingVideoId]) {
                    window.clearInterval(videoPollingRefs.current[encodingVideoId])
                    delete videoPollingRefs.current[encodingVideoId]
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CodeSnippetInserter({ onInsert }: { onInsert: (code: string, lang: string) => void }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [lang, setLang] = useState('javascript')

  function handleInsert() {
    if (!code.trim()) return
    onInsert(code, lang)
    setCode('')
    setOpen(false)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen((o) => !o)} className="px-3 py-1 bg-gray-100 rounded">{open ? 'Close' : 'Add code'}</button>
      </div>

      {open && (
        <div className="mt-2 border rounded p-3 bg-white">
          <label className="block text-xs text-gray-600">Language</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="mt-1 mb-2 w-full border rounded p-1">
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
            <option value="text">Plain Text</option>
          </select>

          <label className="block text-xs text-gray-600">Code</label>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} className="w-full h-36 border rounded p-2 font-mono text-sm" />

          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setCode(''); setOpen(false) }} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
            <button onClick={handleInsert} className="px-3 py-1 bg-brand-600 text-white rounded">Insert</button>
          </div>
        </div>
      )}
    </div>
  )
}