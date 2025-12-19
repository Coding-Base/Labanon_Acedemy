// src/pages/CreateCourse.tsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

const levels = ['Beginner', 'Intermediate', 'Professional'] as const

type Level = (typeof levels)[number]

type Lesson = {
  id?: number | string
  title: string
  content?: string
  video?: string
}

type ModuleItem = {
  id?: number | string
  title: string
  order?: number
  lessons?: Lesson[]
}

export default function CreateCourse() {
  const navigate = useNavigate()
  const [courseType, setCourseType] = useState<'normal' | 'scheduled'>('normal')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('0')
  const [description, setDescription] = useState('')
  const [requiredTools, setRequiredTools] = useState('')
  const [numLessons, setNumLessons] = useState(0)
  const [level, setLevel] = useState<Level>(levels[0])
  const [outcome, setOutcome] = useState('')
  const [linkedCourse, setLinkedCourse] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // modules + lessons local state
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null)
  const [moduleTitleInput, setModuleTitleInput] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('') // HTML from Quill or plain text + code blocks
  const [videoLink, setVideoLink] = useState('')
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null) // when editing an existing lesson
  const location = useLocation()

  // scheduled course fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [meetingPlace, setMeetingPlace] = useState('')
  const [meetingLink, setMeetingLink] = useState('')

  // image for course
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null)
  const [courseImagePreview, setCourseImagePreview] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<any | null>(null)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function search() {
      if (!searchQuery) {
        setSearchResults([])
        return
      }
      try {
        const token = localStorage.getItem('access')
        const res = await axios.get(`${API_BASE}/courses/?search=${encodeURIComponent(searchQuery)}&page_size=5`, { headers: { Authorization: `Bearer ${token}` } })
        if (!mounted) return
        setSearchResults(res.data.results || res.data || [])
      } catch (err) {
        console.error(err)
      }
    }
    const t = setTimeout(search, 300)
    return () => { mounted = false; clearTimeout(t) }
  }, [searchQuery])

  // if courseId provided in query params, load course for editing
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
        // build modules structure from API response (modules include lessons)
        const mods = (data.modules || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          order: m.order || 0,
          lessons: (m.lessons || []).map((ls: any) => ({ id: ls.id, title: ls.title, content: ls.content, video: ls.video }))
        }))
        setModules(mods)
        if (mods.length > 0) setCurrentModuleIndex(0)

        // image preview if provided by backend
        if (data.image) setCourseImagePreview(data.image)
      } catch (err) {
        console.error('Failed to load course for editing', err)
      }
    }
    if (courseId) loadCourse(courseId)
    return () => { mounted = false }
  }, [location.search])

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
    setVideoLink(ls.video || '')
    setCurrentModuleIndex(moduleIdx)
  }

  function cancelEditLesson() {
    setEditingLessonIndex(null)
    setLessonTitle('')
    setLessonContent('')
    setVideoLink('')
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
      const copy = { ...e }
      delete copy.lesson_title
      delete copy.lesson_module
      return copy
    })

    setModules((m) => {
      const copy = [...m]
      const mod = { ...(copy[currentModuleIndex] || { title: 'Module', lessons: [] }) }
      const lessonObj: Lesson = { title: lessonTitle.trim(), content: lessonContent, video: videoLink }
      if (editingLessonIndex !== null) {
        mod.lessons = [...(mod.lessons || [])]
        mod.lessons[editingLessonIndex] = { ...(mod.lessons[editingLessonIndex] || {}), ...lessonObj }
      } else {
        mod.lessons = [...(mod.lessons || []), lessonObj]
      }
      copy[currentModuleIndex] = mod
      return copy
    })

    // reset inputs
    setLessonTitle('')
    setLessonContent('')
    setVideoLink('')
    setEditingLessonIndex(null)
  }

  function removeLesson(moduleIdx: number, lessonIdx: number) {
    // attempt backend delete if lesson has id and course is saved
    ;(async () => {
      try {
        const mod = modules[moduleIdx]
        const ls = mod?.lessons?.[lessonIdx]
        const params = new URLSearchParams(location.search)
        const courseId = params.get('courseId')
        if (ls?.id && courseId) {
          const token = localStorage.getItem('access')
          await axios.delete(`${API_BASE}/lessons/${ls.id}/`, { headers: { Authorization: `Bearer ${token}` } })
        }
      } catch (err) {
        console.error('Failed to delete lesson', err)
      }
    })()

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
    const { type, moduleIdx, lessonIdx } = pendingDelete
    try {
      if (type === 'lesson') {
        removeLesson(moduleIdx, lessonIdx)
      } else if (type === 'module') {
        await deleteModule(moduleIdx)
      }
    } catch (err) {
      console.error('Delete action failed', err)
    } finally {
      setPendingDelete(null)
    }
  }

  function cancelDelete() {
    setPendingDelete(null)
  }

  async function deleteModule(moduleIdx: number) {
    const mod = modules[moduleIdx]
    const params = new URLSearchParams(location.search)
    const courseId = params.get('courseId')
    try {
      if (mod?.id && courseId) {
        const token = localStorage.getItem('access')
        await axios.delete(`${API_BASE}/modules/${mod.id}/`, { headers: { Authorization: `Bearer ${token}` } })
      }
    } catch (err) {
      console.error('Failed to delete module', err)
    }
    setModules((m) => {
      const copy = [...m]
      copy.splice(moduleIdx, 1)
      return copy
    })
    setCurrentModuleIndex((cur) => {
      if (cur === null) return null
      if (cur > moduleIdx) return cur - 1
      if (cur === moduleIdx) return null
      return cur
    })
  }

  async function uploadCourseImageIfNeeded(courseId: any, token: string | null) {
    if (!courseImageFile || !courseId) return
    try {
      const form = new FormData()
      form.append('image', courseImageFile)
      await axios.patch(`${API_BASE}/courses/${courseId}/`, form, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
    } catch (err) {
      console.error('Failed to upload course image', err)
    }
  }

  async function publishCourse() {
    setErrors({})
    setGeneralError(null)
    if (!title.trim()) {
      setErrors({ title: ['Title required'] })
      return
    }
    setPublishing(true)
    try {
      const token = localStorage.getItem('access')
      // determine if editing existing course
      const params = new URLSearchParams(location.search)
      const courseId = params.get('courseId')
      const payload: any = {
        title: title.trim(),
        description,
        price: Number(price) || 0,
        published: true,
        // scheduled-specific (backend must accept these to persist)
        start_date: courseType === 'scheduled' ? startDate || null : null,
        end_date: courseType === 'scheduled' ? endDate || null : null,
        meeting_time: courseType === 'scheduled' ? meetingTime || null : null,
        meeting_place: courseType === 'scheduled' ? meetingPlace || null : null,
        meeting_link: courseType === 'scheduled' ? meetingLink || null : null,
      }

      let createdCourseId = courseId
      if (courseId) {
        // update existing
        await axios.patch(`${API_BASE}/courses/${courseId}/`, payload, { headers: { Authorization: `Bearer ${token}` } })
      } else {
        const res = await axios.post(`${API_BASE}/courses/`, payload, { headers: { Authorization: `Bearer ${token}` } })
        createdCourseId = res.data.id
      }

      // upload image if selected
      if (createdCourseId) await uploadCourseImageIfNeeded(createdCourseId, token)

      // create/update modules and lessons
      if (createdCourseId && modules.length > 0) {
        for (let mi = 0; mi < modules.length; mi++) {
          const mod = modules[mi]
          let moduleId = mod.id
          try {
            if (moduleId) {
              // update
              await axios.patch(`${API_BASE}/modules/${moduleId}/`, { title: mod.title, order: mi }, { headers: { Authorization: `Bearer ${token}` } })
            } else {
              const mres = await axios.post(`${API_BASE}/modules/`, { course: createdCourseId, title: mod.title, order: mi }, { headers: { Authorization: `Bearer ${token}` } })
              moduleId = mres.data.id
              // update local modules array with returned id
              setModules((prev) => {
                const copy = [...prev]
                copy[mi] = { ...copy[mi], id: moduleId }
                return copy
              })
            }
          } catch (err) {
            console.error('Failed to create/update module', err)
            continue
          }

          // handle lessons
          for (let li = 0; li < (mod.lessons || []).length; li++) {
            const ls = mod.lessons![li]
            try {
              // when sending lesson content we expect HTML or plain text; code snippets will be in <pre><code> blocks
              if (ls.id) {
                await axios.patch(`${API_BASE}/lessons/${ls.id}/`, { module: moduleId, title: ls.title, content: ls.content, video: ls.video }, { headers: { Authorization: `Bearer ${token}` } })
              } else {
                await axios.post(`${API_BASE}/lessons/`, { module: moduleId, title: ls.title, content: ls.content, video: ls.video }, { headers: { Authorization: `Bearer ${token}` } })
              }
            } catch (err) {
              console.error('Failed to create/update lesson', err)
            }
          }
        }
      }
      navigate('/tutor/manage')
    } catch (err: any) {
      console.error(err)
      if (err?.response?.data) {
        // set field errors from server
        setErrors(err.response.data)
      } else {
        setGeneralError('Failed to publish course')
      }
    } finally {
      setPublishing(false)
    }
  }

  async function saveDraft() {
    setErrors({})
    setGeneralError(null)
    setSaving(true)
    try {
      const token = localStorage.getItem('access')
      const params = new URLSearchParams(location.search)
      const courseId = params.get('courseId')
      const payload: any = {
        title: title.trim() || 'Untitled draft',
        description,
        price: Number(price) || 0,
        published: false,
        start_date: courseType === 'scheduled' ? startDate || null : null,
        end_date: courseType === 'scheduled' ? endDate || null : null,
        meeting_time: courseType === 'scheduled' ? meetingTime || null : null,
        meeting_place: courseType === 'scheduled' ? meetingPlace || null : null,
        meeting_link: courseType === 'scheduled' ? meetingLink || null : null,
      }

      let createdCourseId = courseId
      if (courseId) {
        await axios.patch(`${API_BASE}/courses/${courseId}/`, payload, { headers: { Authorization: `Bearer ${token}` } })
      } else {
        const res = await axios.post(`${API_BASE}/courses/`, payload, { headers: { Authorization: `Bearer ${token}` } })
        createdCourseId = res.data.id
      }

      // upload image if selected
      if (createdCourseId) await uploadCourseImageIfNeeded(createdCourseId, token)

      // create/update modules+lessons similar to publish flow
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
              // update local id
              setModules((prev) => {
                const copy = [...prev]
                copy[mi] = { ...copy[mi], id: moduleId }
                return copy
              })
            }
          } catch (err) {
            console.error('Failed to create/update module', err)
            continue
          }
          for (let li = 0; li < (mod.lessons || []).length; li++) {
            const ls = mod.lessons![li]
            try {
              if (ls.id) {
                await axios.patch(`${API_BASE}/lessons/${ls.id}/`, { module: moduleId, title: ls.title, content: ls.content, video: ls.video }, { headers: { Authorization: `Bearer ${token}` } })
              } else {
                await axios.post(`${API_BASE}/lessons/`, { module: moduleId, title: ls.title, content: ls.content, video: ls.video }, { headers: { Authorization: `Bearer ${token}` } })
              }
            } catch (err) {
              console.error('Failed to create/update lesson', err)
            }
          }
        }
      }
      // navigate to manage and maybe highlight drafts
      navigate('/tutor/manage')
    } catch (err: any) {
      console.error(err)
      if (err?.response?.data) setErrors(err.response.data)
      else setGeneralError('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  function handleCourseImageChange(file?: File) {
    if (!file) return
    setCourseImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setCourseImagePreview(String(reader.result))
    reader.readAsDataURL(file)
  }

  function onCourseImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    if (f) handleCourseImageChange(f)
  }

  // helper to convert plain code into a HTML code block safe for insertion
  function insertCodeSnippet(code: string, language = 'text') {
    // escape HTML entities
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const block = `<pre><code class="language-${language}">${escaped}</code></pre><p></p>`
    setLessonContent((c) => (c || '') + block)
  }

  // Quill modules and formats
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Create Course</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setPreviewOpen(true)} className="px-4 py-2 bg-gray-100 rounded">Preview</button>
          <button onClick={saveDraft} disabled={saving} className="px-4 py-2 bg-yellow-500 text-white rounded">{saving ? 'Saving...' : 'Save Draft'}</button>
          <button onClick={publishCourse} disabled={publishing} className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold">{publishing ? 'Publishing...' : 'Publish Course'}</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type of course</label>
            <select value={courseType} onChange={(e) => setCourseType(e.target.value as any)} className="mt-2 w-full border rounded p-2">
              <option value="normal">Normal Content & Tutorial Course</option>
              <option value="scheduled">Scheduled Lessons Course</option>
            </select>

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

            {courseType === 'scheduled' && (
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Course Title</label>
                <input className="mt-2 w-full border rounded p-2" value={title} onChange={(e) => setTitle(e.target.value)} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 w-full border rounded p-2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meeting Time (recurring)</label>
                    <input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className="mt-2 w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meeting Place</label>
                    <select value={meetingPlace} onChange={(e) => setMeetingPlace(e.target.value)} className="mt-2 w-full border rounded p-2">
                      <option value="">Select</option>
                      <option value="zoom">Zoom</option>
                      <option value="google_meet">Google Meet</option>
                      <option value="team">Microsoft Teams</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700">Meeting Link</label>
                <input className="mt-2 w-full border rounded p-2" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://" />

                <label className="block text-sm font-medium text-gray-700">Course Modules (short explanation)</label>
                <textarea className="mt-2 w-full border rounded p-2 h-32" value={description} onChange={(e) => setDescription(e.target.value)} />

                <label className="block text-sm font-medium text-gray-700">Linked Course (optional)</label>
                <input className="mt-2 w-full border rounded p-2" placeholder="Search your previous courses" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input className="mt-2 w-full border rounded p-2" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course Duration (display)</label>
                    <div className="mt-2 text-sm text-gray-600">{startDate || 'Start'} — {endDate || 'End'}</div>
                  </div>
                </div>

              </div>
            )}

          </div>

          <div>
            <h3 className="font-semibold">Lessons</h3>
            <p className="text-sm text-gray-600">Add lessons for this course. Use the rich editor to format text and insert code snippets.</p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Modules</label>
              <div className="mt-2 flex items-center gap-2">
                <input placeholder="Module title" value={moduleTitleInput} onChange={(e) => setModuleTitleInput(e.target.value)} className="w-full border rounded p-2" />
                <button onClick={addModule} className="px-4 py-2 bg-green-600 text-white rounded">Add Module</button>
              </div>

              <div className="mt-3 space-y-2">
                {modules.map((m, idx) => (
                  <div key={idx} className={`p-2 border rounded flex items-center justify-between ${currentModuleIndex === idx ? 'bg-green-50' : ''}`}>
                    <div className="cursor-pointer" onClick={() => setCurrentModuleIndex(idx)}>
                      <div className="font-medium">{m.title}</div>
                      <div className="text-xs text-gray-500">{(m.lessons || []).length} lessons</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentModuleIndex(idx)} className="text-sm text-blue-600">Edit</button>
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

                <label className="block text-sm font-medium text-gray-700 mt-3">Video (YouTube link)</label>
                <input className="mt-2 w-full border rounded p-2" placeholder="https://youtube.com/..." value={videoLink} onChange={(e) => setVideoLink(e.target.value)} />
                <div className="text-sm text-gray-500 mt-2">Video upload option disabled for now.</div>

                <div className="mt-4 flex gap-2">
                  <button onClick={addOrUpdateLesson} className="px-4 py-2 bg-green-600 text-white rounded">{editingLessonIndex !== null ? 'Save Lesson' : 'Add Lesson'}</button>
                  <button onClick={() => { cancelEditLesson(); setLessonTitle(''); setLessonContent(''); setVideoLink('') }} className="px-4 py-2 bg-gray-100 rounded">Reset</button>
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
                        {l.video && (
                          <div className="mt-2">
                            <iframe className="w-full h-40" src={l.video.includes('youtube') ? l.video.replace('watch?v=', 'embed/') : l.video} title={l.title} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => startEditLesson(currentModuleIndex, li)} className="text-sm text-blue-600">Edit</button>
                        <button onClick={() => setPendingDelete({ type: 'lesson', moduleIdx: currentModuleIndex, lessonIdx: li })} className="text-sm text-red-600">Remove</button>
                      </div>
                    </div>
                  ))}
                  {currentModuleIndex !== null && (modules[currentModuleIndex]?.lessons || []).length === 0 && <div className="text-sm text-gray-500">No lessons yet in this module</div>}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-[90%] md:w-3/4 max-h-[90%] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Course Preview</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewOpen(false)} className="px-3 py-1 bg-gray-100 rounded">Close</button>
                <button onClick={publishCourse} className="px-3 py-1 bg-green-600 text-white rounded">Publish</button>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{title || 'Untitled Course'}</h2>
              {courseImagePreview && <img src={courseImagePreview} alt="course" className="w-48 mt-2 mb-4 object-cover rounded" />}
              <p className="text-sm text-gray-600">{description}</p>
              <div className="mt-4">
                <strong>Price:</strong> ₦{price}
              </div>
              <div className="mt-2">
                <strong>Level:</strong> {level}
              </div>
              <div className="mt-4">
                <h4 className="font-semibold">Outcome</h4>
                <p className="text-sm text-gray-700">{outcome}</p>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold">Lessons ({modules.flatMap(m => m.lessons || []).length})</h4>
                <div className="mt-2 space-y-3">
                  {modules.flatMap(m => m.lessons || []).map((l: Lesson, i: number) => (
                    <div key={i} className="p-3 border rounded">
                      <div className="font-semibold">{l.title}</div>
                      <div className="text-sm text-gray-700 mt-2" dangerouslySetInnerHTML={{ __html: l.content || '' }} />
                      {l.video && (
                        <div className="mt-2">
                          <iframe className="w-full h-40" src={l.video.includes('youtube') ? l.video.replace('watch?v=', 'embed/') : l.video} title={l.title} />
                        </div>
                      )}
                    </div>
                  ))}
                  {modules.flatMap(m => m.lessons || []).length === 0 && <div className="text-sm text-gray-500">No lessons added yet.</div>}
                </div>
              </div>
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
    </div>
  )
}

// --- Helper subcomponent: CodeSnippetInserter ---
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
            <button onClick={handleInsert} className="px-3 py-1 bg-green-600 text-white rounded">Insert</button>
          </div>
        </div>
      )}
    </div>
  )
}
