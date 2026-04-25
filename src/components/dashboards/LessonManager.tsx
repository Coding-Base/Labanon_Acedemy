import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  Trash2,
  FolderOpen,
  ChevronDown,
  Loader2,
  X,
  Edit,
  Save,
  Eye,
} from 'lucide-react'
import api from '../../utils/axiosInterceptor'
import showToast from '../../utils/toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import 'katex/dist/katex.min.css'

interface Subject {
  id: string // UUID
  name: string
  created_at: string
}

interface Topic {
  id: string // UUID
  subject: string
  name: string
  created_at: string
}

interface Lesson {
  id: string // UUID
  subject: string
  topic: string
  title: string
  content: string
  publisher_name: string
  publisher_title?: string
  linked_topics?: string[]
  slug?: string
  meta_description?: string
  meta_keywords?: string
  og_image?: string
  created_at: string
  updated_at: string
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

// Quill modules for rich text editor with math (KaTeX) support
const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    ['image', 'link', 'formula'],
    ['clean']
  ]
}

const quillFormats = ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block', 'header', 'list', 'script', 'image', 'link', 'formula']

// Helper to check if Quill content is actually empty (removes HTML tags)
const isLessonContentEmpty = (content: string): boolean => {
  if (!content) return true
  // Remove HTML tags and check if anything remains
  const plainText = content.replace(/<[^>]*>/g, '').trim()
  return !plainText
}

export default function LessonManager() {
  // Subject Management
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectSearch, setSubjectSearch] = useState('')
  const [subjectSuggestions, setSubjectSuggestions] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showSubjectInput, setShowSubjectInput] = useState(false)
  const subjectSearchRef = useRef<ReturnType<typeof setTimeout> | undefined>()

  // Topic Management
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicSearch, setTopicSearch] = useState('')
  const [topicSuggestions, setTopicSuggestions] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [newTopicName, setNewTopicName] = useState('')
  const [showTopicInput, setShowTopicInput] = useState(false)
  const topicSearchRef = useRef<ReturnType<typeof setTimeout> | undefined>()

  // Lesson Management
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [publisherName, setPublisherName] = useState('')
  const [publisherTitle, setPublisherTitle] = useState('')
  const [linkedTopic, setLinkedTopic] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  // SEO Fields
  const [metaDescription, setMetaDescription] = useState('')
  const [metaKeywords, setMetaKeywords] = useState('')
  const [ogImage, setOgImage] = useState('')

  // UI States
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())

  // Load all subjects on mount
  useEffect(() => {
    loadSubjects()
  }, [])

  // Debug: Log form state
  useEffect(() => {
    console.log('Lesson form state:', {
      lessonTitle,
      lessonContentPlainText: lessonContent.replace(/<[^>]*>/g, '').trim(),
      isContentEmpty: isLessonContentEmpty(lessonContent),
      shouldBeEnabled: !(!lessonTitle.trim() || isLessonContentEmpty(lessonContent))
    })
  }, [lessonTitle, lessonContent])

  // Debounced subject search
  useEffect(() => {
    if (subjectSearchRef.current) clearTimeout(subjectSearchRef.current)
    
    if (subjectSearch.trim() && Array.isArray(subjects)) {
      subjectSearchRef.current = setTimeout(() => {
        const filtered = subjects.filter(s =>
          s.name.toLowerCase().includes(subjectSearch.toLowerCase())
        )
        setSubjectSuggestions(filtered)
      }, 300)
    } else {
      setSubjectSuggestions([])
    }
  }, [subjectSearch, subjects])

  // Debounced topic search
  useEffect(() => {
    if (topicSearchRef.current) clearTimeout(topicSearchRef.current)
    
    if (topicSearch.trim() && selectedSubject && Array.isArray(topics)) {
      topicSearchRef.current = setTimeout(() => {
        const filtered = topics.filter(t =>
          t.subject === selectedSubject.id &&
          t.name.toLowerCase().includes(topicSearch.toLowerCase())
        )
        setTopicSuggestions(filtered)
      }, 300)
    } else {
      setTopicSuggestions([])
    }
  }, [topicSearch, topics, selectedSubject])

  // Load lessons when topic is selected
  useEffect(() => {
    if (selectedTopic) {
      loadLessons(selectedTopic.id)
    }
  }, [selectedTopic])

  const loadSubjects = async () => {
    try {
      setLoading(true)
      const response = await api.get(`${API_BASE}/lessons/subjects/`)
      console.log('Raw subjects response:', response.data)
      // Handle both array and paginated responses { results: [...] }
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || [])
      setSubjects(data)
    } catch (error: any) {
      console.error('Error loading subjects:', error, error?.response?.data)
      showToast('Error loading subjects', 'error')
      setSubjects([]) // Ensure subjects is always an array
    } finally {
      setLoading(false)
    }
  }

  const loadTopics = async (subjectId: string) => {
    try {
      const response = await api.get(`${API_BASE}/lessons/topics/?subject=${subjectId}`)
      console.log('Raw topics response:', response.data)
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || [])
      setTopics(data)
    } catch (error: any) {
      console.error('Error loading topics:', error, error?.response?.data)
      showToast('Error loading topics', 'error')
      setTopics([])
    }
  }

  const loadLessons = async (topicId: string) => {
    try {
      const response = await api.get(`${API_BASE}/lessons/lessons/?topic=${topicId}`)
      console.log('Raw lessons response:', response.data)
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || [])
      setLessons(data)
    } catch (error: any) {
      console.error('Error loading lessons:', error, error?.response?.data)
      showToast('Error loading lessons', 'error')
      setLessons([])
    }
  }

  const addSubject = async () => {
    if (!newSubjectName.trim()) {
      showToast('Subject name is required', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await api.post(`${API_BASE}/lessons/subjects/`, {
        name: newSubjectName.trim()
      })
      // Select the created subject and refresh the list to ensure consistency
      setSelectedSubject(response.data)
      setNewSubjectName('')
      setShowSubjectInput(false)
      showToast('Subject created successfully', 'success')
      await loadSubjects()
    } catch (error: any) {
      console.error('Error creating subject:', error, error?.response?.data)
      const errData = error?.response?.data
      let message = 'Error creating subject'
      if (errData) {
        if (Array.isArray(errData)) {
          message = errData.join(' ')
        } else if (errData.name) {
          message = Array.isArray(errData.name) ? errData.name.join(' ') : String(errData.name)
        } else if (typeof errData === 'object') {
          const parts: string[] = []
          Object.values(errData).forEach(v => {
            if (Array.isArray(v)) parts.push(...v.map(String))
            else if (typeof v === 'string') parts.push(v)
          })
          message = parts.length ? parts.join(' ') : JSON.stringify(errData)
        } else {
          message = String(errData)
        }
      } else if (error?.message) {
        message = error.message
      }
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const addTopic = async () => {
    if (!selectedSubject) {
      showToast('Please select a subject first', 'error')
      return
    }

    if (!newTopicName.trim()) {
      showToast('Topic name is required', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await api.post(`${API_BASE}/lessons/topics/`, {
        subject: selectedSubject.id,
        name: newTopicName.trim()
      })
      const updatedTopics = [...topics, response.data]
      setTopics(updatedTopics)
      setNewTopicName('')
      setShowTopicInput(false)
      setSelectedTopic(response.data)
      showToast('Topic created successfully', 'success')
    } catch (error: any) {
      console.error('Error creating topic:', error, error?.response?.data)
      showToast('Error creating topic', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveLesson = async () => {
    if (!selectedTopic) {
      showToast('Please select a topic first', 'error')
      return
    }

    if (!lessonTitle.trim() || isLessonContentEmpty(lessonContent)) {
      showToast('Lesson title and content are required', 'error')
      return
    }

    try {
      setSaving(true)
      const payload: any = {
        subject: selectedSubject?.id,
        topic: selectedTopic.id,
        title: lessonTitle.trim(),
        content: lessonContent.trim(),
        publisher_name: publisherName.trim() || 'Admin',
        publisher_title: publisherTitle.trim() || '',
        linked_topics: linkedTopic ? [linkedTopic] : [],
        meta_description: metaDescription.trim(),
        meta_keywords: metaKeywords.trim(),
      }

      // Only include og_image when the user provided a non-empty value
      const ogImageValue = ogImage.trim();
      if (ogImageValue) {
        let finalOg = ogImageValue;
        try {
          new URL(finalOg);
        } catch (_) {
          const value = finalOg.startsWith('/') ? finalOg : `/${finalOg}`;
          finalOg = `${window.location.origin}${value}`;
        }
        payload.og_image = finalOg;
      }

      if (editingLesson) {
        // Update existing lesson
        const response = await api.put(
          `${API_BASE}/lessons/lessons/${editingLesson.id}/`,
          payload
        )
        setLessons(lessons.map(l => l.id === editingLesson.id ? response.data : l))
        showToast('Lesson updated successfully', 'success')
      } else {
        // Create new lesson
        const response = await api.post(`${API_BASE}/lessons/lessons/`, payload)
        setLessons([...lessons, response.data])
        showToast('Lesson created successfully', 'success')
      }

      resetLessonForm()
    } catch (error: any) {
      console.error('Error saving lesson:', error, error?.response?.data)
      // Try to extract backend validation errors and show them clearly
      const errData = error?.response?.data
      let message = 'Error saving lesson'
      if (errData) {
        if (typeof errData === 'string') message = errData
        else if (Array.isArray(errData)) message = errData.join(' ')
        else if (errData.detail) message = String(errData.detail)
        else {
          const parts: string[] = []
          Object.entries(errData).forEach(([k, v]) => {
            if (Array.isArray(v)) parts.push(`${k}: ${v.join(' ')}`)
            else parts.push(`${k}: ${String(v)}`)
          })
          if (parts.length) message = parts.join(' | ')
        }
      } else if (error?.message) {
        message = error.message
      }
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const resetLessonForm = () => {
    setLessonTitle('')
    setLessonContent('')
    setPublisherName('')
    setPublisherTitle('')
    setLinkedTopic(null)
    setMetaDescription('')
    setMetaKeywords('')
    setOgImage('')
    setEditingLesson(null)
  }

  const editLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonTitle(lesson.title)
    setLessonContent(lesson.content)
    setPublisherName(lesson.publisher_name)
    setPublisherTitle(lesson.publisher_title || '')
    setLinkedTopic(lesson.linked_topics?.[0] || null)
    setMetaDescription(lesson.meta_description || '')
    setMetaKeywords(lesson.meta_keywords || '')
    setOgImage(lesson.og_image || '')
  }

  const deleteLesson = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return

    try {
      setSaving(true)
      await api.delete(`${API_BASE}/lessons/lessons/${lessonId}/`)
      setLessons(lessons.filter(l => l.id !== lessonId))
      showToast('Lesson deleted successfully', 'success')
    } catch (error: any) {
      console.error('Error deleting lesson:', error, error?.response?.data)
      showToast('Error deleting lesson', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteSubject = async (subjectId: string) => {
    if (!window.confirm('Are you sure? This will delete all topics and lessons under this subject.')) return

    try {
      setSaving(true)
      await api.delete(`${API_BASE}/lessons/subjects/${subjectId}/`)
      setSubjects(subjects.filter(s => s.id !== subjectId))
      if (selectedSubject?.id === subjectId) setSelectedSubject(null)
      showToast('Subject deleted successfully', 'success')
    } catch (error: any) {
      console.error('Error deleting subject:', error, error?.response?.data)
      showToast('Error deleting subject', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteTopic = async (topicId: string) => {
    if (!window.confirm('Are you sure? This will delete all lessons under this topic.')) return

    try {
      setSaving(true)
      await api.delete(`${API_BASE}/lessons/topics/${topicId}/`)
      setTopics(topics.filter(t => t.id !== topicId))
      if (selectedTopic?.id === topicId) setSelectedTopic(null)
      showToast('Topic deleted successfully', 'success')
    } catch (error: any) {
      console.error('Error deleting topic:', error, error?.response?.data)
      showToast('Error deleting topic', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleSubjectExpanded = (subjectId: string) => {
    const newSet = new Set(expandedSubjects)
    if (newSet.has(subjectId)) {
      newSet.delete(subjectId)
    } else {
      newSet.add(subjectId)
      loadTopics(subjectId)
    }
    setExpandedSubjects(newSet)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Subject & Topic Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Lesson Organization
            </h3>

            {/* Subject Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>

              {/* Subject Suggestions or All Subjects Folder View */}
              {subjectSuggestions.length > 0 ? (
                // Show search results
                <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {subjectSuggestions.map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubject(subject)
                        setSubjectSearch('')
                        setSubjectSuggestions([])
                        loadTopics(subject.id)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-yellow-50 border-b last:border-b-0 transition"
                    >
                      {subject.name}
                    </button>
                  ))}
                </div>
              ) : (
                // Show all subjects as folder tree when not searching
                subjects.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {subjects.map(subject => (
                      <div key={subject.id} className="border-b last:border-b-0">
                        {/* Subject Folder Item */}
                        <button
                          onClick={() => {
                            toggleSubjectExpanded(subject.id)
                            setSelectedSubject(subject)
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-yellow-50 transition ${selectedSubject?.id === subject.id ? 'bg-yellow-100' : ''}`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <ChevronDown 
                              className={`w-4 h-4 transition-transform ${expandedSubjects.has(subject.id) ? '' : '-rotate-90'}`}
                            />
                            <FolderOpen className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium text-gray-800">{subject.name}</span>
                          </div>
                        </button>

                        {/* Topics under expanded subject */}
                        {expandedSubjects.has(subject.id) && topics.length > 0 && (
                          <div className="bg-gray-50 pl-6">
                            {topics
                              .filter(t => t.subject === subject.id)
                              .map(topic => (
                                <button
                                  key={topic.id}
                                  onClick={() => setSelectedTopic(topic)}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-yellow-50 border-t transition ${selectedTopic?.id === topic.id ? 'bg-yellow-100' : ''}`}
                                >
                                  {topic.name}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Add Custom Subject */}
              {showSubjectInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="New subject name"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <button
                    onClick={addSubject}
                    disabled={saving}
                    className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {!showSubjectInput && (
                <button
                  onClick={() => setShowSubjectInput(true)}
                  className="mt-2 w-full px-3 py-2 border border-dashed border-yellow-300 text-yellow-600 rounded-lg hover:bg-yellow-50 flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Subject
                </button>
              )}
            </div>

            {/* Selected Subject Display */}
            {selectedSubject && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500">Selected Subject</p>
                    <p className="font-semibold text-gray-800">{selectedSubject.name}</p>
                  </div>
                  <button
                    onClick={() => deleteSubject(selectedSubject.id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Topic Search */}
            {selectedSubject && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area / Topic
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search topics..."
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>

                {/* Topic Suggestions */}
                {topicSuggestions.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {topicSuggestions.map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => {
                          setSelectedTopic(topic)
                          setTopicSearch('')
                          setTopicSuggestions([])
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-yellow-50 border-b last:border-b-0 transition"
                      >
                        {topic.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Add Custom Topic */}
                {showTopicInput && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="New topic name"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <button
                      onClick={addTopic}
                      disabled={saving}
                      className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {!showTopicInput && (
                  <button
                    onClick={() => setShowTopicInput(true)}
                    className="mt-2 w-full px-3 py-2 border border-dashed border-yellow-300 text-yellow-600 rounded-lg hover:bg-yellow-50 flex items-center justify-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Topic
                  </button>
                )}
              </div>
            )}

            {/* Selected Topic Display */}
            {selectedTopic && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500">Selected Topic</p>
                    <p className="font-semibold text-gray-800">{selectedTopic.name}</p>
                  </div>
                  <button
                    onClick={() => deleteTopic(selectedTopic.id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Lesson Creation/Editing */}
        <div className="lg:col-span-2">
          {selectedTopic ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">
                {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
              </h3>

              <div className="space-y-6">
                {/* Lesson Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="e.g., Quadratic Equations"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                {/* Lesson Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Content (Rich Text with Math Support)
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <ReactQuill
                      value={lessonContent}
                      onChange={setLessonContent}
                      modules={quillModules}
                      formats={quillFormats}
                      theme="snow"
                      placeholder="Enter lesson content..."
                      style={{ minHeight: '300px' }}
                    />
                  </div>
                </div>

                {/* Publisher Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publisher Name
                    </label>
                    <input
                      type="text"
                      value={publisherName}
                      onChange={(e) => setPublisherName(e.target.value)}
                      placeholder="e.g., Admin"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publisher Title
                    </label>
                    <input
                      type="text"
                      value={publisherTitle}
                      onChange={(e) => setPublisherTitle(e.target.value)}
                      placeholder="e.g., Physics Teacher"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                {/* SEO Fields */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-4">SEO & Social Media</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description (60-160 characters for Google)
                      </label>
                      <textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
                        placeholder="Brief description for search engines..."
                        maxLength={160}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">{metaDescription.length}/160 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Keywords (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={metaKeywords}
                        onChange={(e) => setMetaKeywords(e.target.value)}
                        placeholder="e.g., mathematics, algebra, equations"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Open Graph Image URL (for social sharing)
                      </label>
                      <input
                        type="url"
                        value={ogImage}
                        onChange={(e) => setOgImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Linked Topic */}
                {topics.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link to Another Topic (Optional)
                    </label>
                    <select
                      value={linkedTopic || ''}
                      onChange={(e) => setLinkedTopic(e.target.value || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">-- None --</option>
                      {topics
                        .filter(t => t.id !== selectedTopic?.id)
                        .map(topic => (
                          <option key={topic.id} value={topic.id}>
                            {topic.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <div className="flex-1 relative">
                    <button
                      onClick={saveLesson}
                      disabled={saving || !lessonTitle.trim() || isLessonContentEmpty(lessonContent)}
                      title={`Title: "${lessonTitle}" | Content: ${isLessonContentEmpty(lessonContent) ? 'empty' : 'filled'}`}
                      className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 transition font-semibold flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingLesson ? 'Update Lesson' : 'Save Lesson'}
                    </button>
                    {(saving || !lessonTitle.trim() || isLessonContentEmpty(lessonContent)) && (
                      <div className="mt-1 text-xs text-red-600">
                        {saving && 'Saving...'}
                        {!saving && !lessonTitle.trim() && 'Add a lesson title'}
                        {!saving && lessonTitle.trim() && isLessonContentEmpty(lessonContent) && 'Add lesson content'}
                      </div>
                    )}
                  </div>

                  {editingLesson && (
                    <button
                      onClick={resetLessonForm}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Lessons List */}
              {lessons.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <h4 className="font-bold text-gray-800 mb-4">Lessons in {selectedTopic.name}</h4>
                  <div className="space-y-3">
                    {lessons.map(lesson => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-800">{lesson.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">
                              By {lesson.publisher_name}
                              {lesson.publisher_title && <span className="text-gray-500"> ({lesson.publisher_title})</span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(lesson.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editLesson(lesson)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteLesson(lesson.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">Select a subject and topic to create or manage lessons</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
