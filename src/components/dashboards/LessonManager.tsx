import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Trash2,
  FolderOpen,
  ChevronDown,
  Loader2,
  Edit,
  Save,
  Tags,
} from 'lucide-react'
import api from '../../utils/axiosInterceptor'
import showToast from '../../utils/toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import 'katex/dist/katex.min.css'

// Register SVG table icon for Quill toolbar
const Icons = ReactQuill.Quill.import('ui/icons')
Icons['table'] = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  <line x1="9" y1="3" x2="9" y2="21"></line>
  <line x1="15" y1="3" x2="15" y2="21"></line>
  <line x1="3" y1="9" x2="21" y2="9"></line>
  <line x1="3" y1="15" x2="21" y2="15"></line>
</svg>`

// Define and register custom Table embed blot for Quill v1 table support
const BlockEmbed = ReactQuill.Quill.import('blots/block/embed')
class TableEmbed extends BlockEmbed {
  static create(value: string) {
    const node = super.create()
    node.innerHTML = value
    node.setAttribute('contenteditable', 'true')
    return node
  }
  static value(node: HTMLElement) {
    return node.innerHTML
  }
}
TableEmbed.blotName = 'qtable'
TableEmbed.tagName = 'div'
TableEmbed.className = 'quill-table-embed'
ReactQuill.Quill.register(TableEmbed)

interface Subject {
  id: string
  name: string
  created_at: string
}

interface LessonSubfolder {
  id: string
  subject: string
  subject_name?: string
  name: string
  created_at: string
}

interface Topic {
  id: string
  subject: string
  subject_name?: string
  subfolder: string
  subfolder_name?: string
  name: string
  created_at: string
}

interface Lesson {
  id: string
  subject?: string
  subject_name?: string
  subfolder?: string
  subfolder_name?: string
  topic: string
  topic_name?: string
  title: string
  content: string
  publisher_name: string
  publisher_title?: string
  linked_topics?: string[]
  slug?: string
  meta_description?: string
  meta_keywords?: string
  og_image?: string
  tags?: string
  created_at: string
  updated_at: string
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

const quillModules = {
  toolbar: {
    container: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      ['image', 'link', 'formula'],
      ['table'],
      ['clean'],
    ],
    handlers: {
      table: function (this: any) {
        const range = this.quill.getSelection()
        if (range) {
          this.quill.insertEmbed(
            range.index,
            'qtable',
            '<table><tr><td>Header 1</td><td>Header 2</td></tr><tr><td>Cell 1</td><td>Cell 2</td></tr></table>'
          )
          this.quill.setSelection(range.index + 1)
        }
      },
    },
  },
  clipboard: {
    matchers: [
      ['table', function (node: any, delta: any) {
        const tableHtml = node.outerHTML
        const Delta = ReactQuill.Quill.import('delta')
        return new Delta().insert({ qtable: tableHtml })
      }]
    ]
  }
}

const quillFormats = ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block', 'header', 'list', 'script', 'image', 'link', 'formula', 'table', 'qtable']

const toArray = (data: any) => Array.isArray(data) ? data : (data?.results || [])

const isLessonContentEmpty = (content: string): boolean => {
  if (!content) return true
  return !content.replace(/<[^>]*>/g, '').trim()
}

export default function LessonManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subfolders, setSubfolders] = useState<LessonSubfolder[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedSubfolder, setSelectedSubfolder] = useState<LessonSubfolder | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  const [subjectSearch, setSubjectSearch] = useState('')
  const [subfolderSearch, setSubfolderSearch] = useState('')
  const [topicSearch, setTopicSearch] = useState('')

  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubfolderName, setNewSubfolderName] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [showSubjectInput, setShowSubjectInput] = useState(false)
  const [showSubfolderInput, setShowSubfolderInput] = useState(false)
  const [showTopicInput, setShowTopicInput] = useState(false)

  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [publisherName, setPublisherName] = useState('')
  const [publisherTitle, setPublisherTitle] = useState('')
  const [linkedTopic, setLinkedTopic] = useState<string | null>(null)
  const [lessonTags, setLessonTags] = useState('')
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  const [metaDescription, setMetaDescription] = useState('')
  const [metaKeywords, setMetaKeywords] = useState('')
  const [ogImage, setOgImage] = useState('')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [expandedSubfolders, setExpandedSubfolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSubjects()
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      loadSubfolders(selectedSubject.id)
    } else {
      setSubfolders([])
    }
    setSelectedSubfolder(null)
    setSelectedTopic(null)
    setTopics([])
    setLessons([])
  }, [selectedSubject])

  useEffect(() => {
    if (selectedSubfolder) {
      loadTopics(selectedSubfolder.id)
    } else {
      setTopics([])
    }
    setSelectedTopic(null)
    setLessons([])
  }, [selectedSubfolder])

  useEffect(() => {
    if (selectedTopic) loadLessons(selectedTopic.id)
    else setLessons([])
  }, [selectedTopic])

  const loadSubjects = async () => {
    try {
      setLoading(true)
      const response = await api.get(`${API_BASE}/lessons/subjects/`)
      setSubjects(toArray(response.data))
    } catch (error: any) {
      console.error('Error loading folders:', error, error?.response?.data)
      showToast('Error loading folders', 'error')
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  const loadSubfolders = async (subjectId: string) => {
    try {
      const response = await api.get(`${API_BASE}/lessons/subfolders/?subject=${subjectId}`)
      setSubfolders(toArray(response.data))
    } catch (error: any) {
      console.error('Error loading subfolders:', error, error?.response?.data)
      showToast('Error loading subfolders', 'error')
      setSubfolders([])
    }
  }

  const loadTopics = async (subfolderId: string) => {
    try {
      const response = await api.get(`${API_BASE}/lessons/topics/?subfolder=${subfolderId}`)
      setTopics(toArray(response.data))
    } catch (error: any) {
      console.error('Error loading topics:', error, error?.response?.data)
      showToast('Error loading topics', 'error')
      setTopics([])
    }
  }

  const loadLessons = async (topicId: string) => {
    try {
      const response = await api.get(`${API_BASE}/lessons/lessons/?topic=${topicId}`)
      setLessons(toArray(response.data))
    } catch (error: any) {
      console.error('Error loading lessons:', error, error?.response?.data)
      showToast('Error loading lessons', 'error')
      setLessons([])
    }
  }

  const addSubject = async () => {
    if (!newSubjectName.trim()) {
      showToast('Folder name is required', 'error')
      return
    }
    try {
      setSaving(true)
      const response = await api.post(`${API_BASE}/lessons/subjects/`, { name: newSubjectName.trim() })
      setSelectedSubject(response.data)
      setExpandedSubjects(prev => new Set(prev).add(response.data.id))
      setNewSubjectName('')
      setShowSubjectInput(false)
      showToast('Folder created successfully', 'success')
      await loadSubjects()
    } catch (error: any) {
      console.error('Error creating folder:', error, error?.response?.data)
      showToast(getErrorMessage(error, 'Error creating folder'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const addSubfolder = async () => {
    if (!selectedSubject) {
      showToast('Please select a folder first', 'error')
      return
    }
    if (!newSubfolderName.trim()) {
      showToast('Subfolder name is required', 'error')
      return
    }
    try {
      setSaving(true)
      const response = await api.post(`${API_BASE}/lessons/subfolders/`, {
        subject: selectedSubject.id,
        name: newSubfolderName.trim(),
      })
      setSubfolders(prev => [...prev, response.data])
      setSelectedSubfolder(response.data)
      setExpandedSubfolders(prev => new Set(prev).add(response.data.id))
      setNewSubfolderName('')
      setShowSubfolderInput(false)
      showToast('Subfolder created successfully', 'success')
    } catch (error: any) {
      console.error('Error creating subfolder:', error, error?.response?.data)
      showToast(getErrorMessage(error, 'Error creating subfolder'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const addTopic = async () => {
    if (!selectedSubfolder || !selectedSubject) {
      showToast('Please select a subfolder first', 'error')
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
        subfolder: selectedSubfolder.id,
        name: newTopicName.trim(),
      })
      setTopics(prev => [...prev, response.data])
      setSelectedTopic(response.data)
      setNewTopicName('')
      setShowTopicInput(false)
      showToast('Topic created successfully', 'success')
    } catch (error: any) {
      console.error('Error creating topic:', error, error?.response?.data)
      showToast(getErrorMessage(error, 'Error creating topic'), 'error')
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
        topic: selectedTopic.id,
        title: lessonTitle.trim(),
        content: lessonContent.trim(),
        publisher_name: publisherName.trim() || 'Admin',
        publisher_title: publisherTitle.trim() || '',
        linked_topics: linkedTopic ? [linkedTopic] : [],
        meta_description: metaDescription.trim(),
        meta_keywords: metaKeywords.trim(),
        tags: lessonTags.trim(),
      }

      const ogImageValue = ogImage.trim()
      if (ogImageValue) {
        let finalOg = ogImageValue
        try {
          new URL(finalOg)
        } catch (_) {
          const value = finalOg.startsWith('/') ? finalOg : `/${finalOg}`
          finalOg = `${window.location.origin}${value}`
        }
        payload.og_image = finalOg
      }

      if (editingLesson) {
        const response = await api.put(`${API_BASE}/lessons/lessons/${editingLesson.id}/`, payload)
        setLessons(prev => prev.map(l => l.id === editingLesson.id ? response.data : l))
        showToast('Lesson updated successfully', 'success')
      } else {
        const response = await api.post(`${API_BASE}/lessons/lessons/`, payload)
        setLessons(prev => [...prev, response.data])
        showToast('Lesson created successfully', 'success')
      }

      resetLessonForm()
    } catch (error: any) {
      console.error('Error saving lesson:', error, error?.response?.data)
      showToast(getErrorMessage(error, 'Error saving lesson'), 'error')
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
    setLessonTags('')
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
    setLessonTags(lesson.tags || '')
    setMetaDescription(lesson.meta_description || '')
    setMetaKeywords(lesson.meta_keywords || '')
    setOgImage(lesson.og_image || '')
  }

  const deleteSubject = async (subjectId: string) => {
    if (!window.confirm('Are you sure? This will delete all subfolders, topics, and lessons under this folder.')) return
    try {
      setSaving(true)
      await api.delete(`${API_BASE}/lessons/subjects/${subjectId}/`)
      setSubjects(prev => prev.filter(s => s.id !== subjectId))
      if (selectedSubject?.id === subjectId) setSelectedSubject(null)
      showToast('Folder deleted successfully', 'success')
    } catch (error: any) {
      console.error('Error deleting folder:', error, error?.response?.data)
      showToast('Error deleting folder', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteSubfolder = async (subfolderId: string) => {
    if (!window.confirm('Are you sure? This will delete all topics and lessons under this subfolder.')) return
    try {
      setSaving(true)
      await api.delete(`${API_BASE}/lessons/subfolders/${subfolderId}/`)
      setSubfolders(prev => prev.filter(s => s.id !== subfolderId))
      if (selectedSubfolder?.id === subfolderId) setSelectedSubfolder(null)
      showToast('Subfolder deleted successfully', 'success')
    } catch (error: any) {
      console.error('Error deleting subfolder:', error, error?.response?.data)
      showToast('Error deleting subfolder', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteTopic = async (topicId: string) => {
    if (!window.confirm('Are you sure? This will delete all lessons under this topic.')) return
    try {
      setSaving(true)
      await api.delete(`${API_BASE}/lessons/topics/${topicId}/`)
      setTopics(prev => prev.filter(t => t.id !== topicId))
      if (selectedTopic?.id === topicId) setSelectedTopic(null)
      showToast('Topic deleted successfully', 'success')
    } catch (error: any) {
      console.error('Error deleting topic:', error, error?.response?.data)
      showToast('Error deleting topic', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return
    try {
      setSaving(true)
      await api.delete(`${API_BASE}/lessons/lessons/${lessonId}/`)
      setLessons(prev => prev.filter(l => l.id !== lessonId))
      showToast('Lesson deleted successfully', 'success')
    } catch (error: any) {
      console.error('Error deleting lesson:', error, error?.response?.data)
      showToast('Error deleting lesson', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleSubjectExpanded = (subject: Subject) => {
    setSelectedSubject(subject)
    setExpandedSubjects(prev => {
      const next = new Set(prev)
      next.has(subject.id) ? next.delete(subject.id) : next.add(subject.id)
      return next
    })
  }

  const toggleSubfolderExpanded = (subfolder: LessonSubfolder) => {
    setSelectedSubfolder(subfolder)
    setExpandedSubfolders(prev => {
      const next = new Set(prev)
      next.has(subfolder.id) ? next.delete(subfolder.id) : next.add(subfolder.id)
      return next
    })
  }

  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase()))
  const filteredSubfolders = subfolders.filter(s => s.name.toLowerCase().includes(subfolderSearch.toLowerCase()))
  const filteredTopics = topics.filter(t => t.name.toLowerCase().includes(topicSearch.toLowerCase()))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Lesson Organization
            </h3>

            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
              </div>
            ) : (
              <div className="space-y-6">
                <ManagementSection
                  label="Folder / Field"
                  placeholder="Search folders..."
                  search={subjectSearch}
                  onSearch={setSubjectSearch}
                  showInput={showSubjectInput}
                  onShowInput={() => setShowSubjectInput(true)}
                  inputPlaceholder="New folder name"
                  inputValue={newSubjectName}
                  onInputChange={setNewSubjectName}
                  onSave={addSubject}
                  addLabel="Add Folder"
                  saving={saving}
                >
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-56 overflow-y-auto">
                    {filteredSubjects.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-gray-500">No folders found</p>
                    ) : filteredSubjects.map(subject => (
                      <div key={subject.id} className="border-b last:border-b-0">
                        <button
                          onClick={() => toggleSubjectExpanded(subject)}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-yellow-50 transition ${selectedSubject?.id === subject.id ? 'bg-yellow-100' : ''}`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <ChevronDown className={`w-4 h-4 transition-transform ${expandedSubjects.has(subject.id) ? '' : '-rotate-90'}`} />
                            <FolderOpen className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium text-gray-800 truncate">{subject.name}</span>
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </ManagementSection>

                {selectedSubject && (
                  <SelectedCard
                    eyebrow="Selected Folder"
                    title={selectedSubject.name}
                    onDelete={() => deleteSubject(selectedSubject.id)}
                  />
                )}

                {selectedSubject && (
                  <ManagementSection
                    label="Subfolder / Department"
                    placeholder="Search subfolders..."
                    search={subfolderSearch}
                    onSearch={setSubfolderSearch}
                    showInput={showSubfolderInput}
                    onShowInput={() => setShowSubfolderInput(true)}
                    inputPlaceholder="New subfolder name"
                    inputValue={newSubfolderName}
                    onInputChange={setNewSubfolderName}
                    onSave={addSubfolder}
                    addLabel="Add Subfolder"
                    saving={saving}
                  >
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-56 overflow-y-auto">
                      {filteredSubfolders.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-gray-500">No subfolders found</p>
                      ) : filteredSubfolders.map(subfolder => (
                        <button
                          key={subfolder.id}
                          onClick={() => toggleSubfolderExpanded(subfolder)}
                          className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-yellow-50 border-b last:border-b-0 transition ${selectedSubfolder?.id === subfolder.id ? 'bg-yellow-100' : ''}`}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedSubfolders.has(subfolder.id) ? '' : '-rotate-90'}`} />
                          <FolderOpen className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-gray-800 truncate">{subfolder.name}</span>
                        </button>
                      ))}
                    </div>
                  </ManagementSection>
                )}

                {selectedSubfolder && (
                  <SelectedCard
                    eyebrow="Selected Subfolder"
                    title={selectedSubfolder.name}
                    onDelete={() => deleteSubfolder(selectedSubfolder.id)}
                  />
                )}

                {selectedSubfolder && (
                  <ManagementSection
                    label="Topic"
                    placeholder="Search topics..."
                    search={topicSearch}
                    onSearch={setTopicSearch}
                    showInput={showTopicInput}
                    onShowInput={() => setShowTopicInput(true)}
                    inputPlaceholder="New topic name"
                    inputValue={newTopicName}
                    onInputChange={setNewTopicName}
                    onSave={addTopic}
                    addLabel="Add Topic"
                    saving={saving}
                  >
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-56 overflow-y-auto">
                      {filteredTopics.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-gray-500">No topics found</p>
                      ) : filteredTopics.map(topic => (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopic(topic)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-yellow-50 border-b last:border-b-0 transition ${selectedTopic?.id === topic.id ? 'bg-yellow-100 font-semibold text-gray-900' : 'text-gray-700'}`}
                        >
                          {topic.name}
                        </button>
                      ))}
                    </div>
                  </ManagementSection>
                )}

                {selectedTopic && (
                  <SelectedCard
                    eyebrow="Selected Topic"
                    title={selectedTopic.name}
                    onDelete={() => deleteTopic(selectedTopic.id)}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTopic ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800">
                  {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSubject?.name} &gt; {selectedSubfolder?.name} &gt; {selectedTopic.name}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Title</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="e.g., Thermodynamics"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Content (Rich Text with Math Support)</label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden [&_.ql-editor]:min-h-[560px] [&_.ql-container]:min-h-[560px]">
                    <ReactQuill
                      value={lessonContent}
                      onChange={setLessonContent}
                      modules={quillModules}
                      formats={quillFormats}
                      theme="snow"
                      placeholder="Enter lesson content..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Publisher Name</label>
                    <input
                      type="text"
                      value={publisherName}
                      onChange={(e) => setPublisherName(e.target.value)}
                      placeholder="e.g., Admin"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Publisher Title</label>
                    <input
                      type="text"
                      value={publisherTitle}
                      onChange={(e) => setPublisherTitle(e.target.value)}
                      placeholder="e.g., Physics Teacher"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Tags className="w-4 h-4 text-yellow-600" />
                    Lesson Tags
                  </label>
                  <input
                    type="text"
                    value={lessonTags}
                    onChange={(e) => setLessonTags(e.target.value)}
                    placeholder="dynamics, force, momentum"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated terms students can search for.</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-4">SEO & Social Media</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description (60-160 characters for Google)</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords (comma-separated)</label>
                      <input
                        type="text"
                        value={metaKeywords}
                        onChange={(e) => setMetaKeywords(e.target.value)}
                        placeholder="e.g., mathematics, algebra, equations"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Open Graph Image URL (for social sharing)</label>
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

                {topics.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link to Another Topic (Optional)</label>
                    <select
                      value={linkedTopic || ''}
                      onChange={(e) => setLinkedTopic(e.target.value || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">-- None --</option>
                      {topics
                        .filter(t => t.id !== selectedTopic?.id)
                        .map(topic => (
                          <option key={topic.id} value={topic.id}>{topic.name}</option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <div className="flex-1 relative">
                    <button
                      onClick={saveLesson}
                      disabled={saving || !lessonTitle.trim() || isLessonContentEmpty(lessonContent)}
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
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-800">{lesson.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">
                              By {lesson.publisher_name}
                              {lesson.publisher_title && <span className="text-gray-500"> ({lesson.publisher_title})</span>}
                            </p>
                            {lesson.tags && (
                              <p className="text-xs text-yellow-700 mt-2 truncate">
                                Tags: {lesson.tags}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{new Date(lesson.created_at).toLocaleDateString()}</p>
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
              <p className="text-gray-600">Select a folder, subfolder, and topic to create or manage lessons</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ManagementSection(props: {
  label: string
  placeholder: string
  search: string
  onSearch: (value: string) => void
  showInput: boolean
  onShowInput: () => void
  inputPlaceholder: string
  inputValue: string
  onInputChange: (value: string) => void
  onSave: () => void
  addLabel: string
  saving: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{props.label}</label>
      <div className="relative">
        <input
          type="text"
          placeholder={props.placeholder}
          value={props.search}
          onChange={(e) => props.onSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
      </div>

      {props.children}

      {props.showInput ? (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder={props.inputPlaceholder}
            value={props.inputValue}
            onChange={(e) => props.onInputChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={props.onSave}
            disabled={props.saving}
            className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition"
          >
            {props.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <button
          onClick={props.onShowInput}
          className="mt-2 w-full px-3 py-2 border border-dashed border-yellow-300 text-yellow-600 rounded-lg hover:bg-yellow-50 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          {props.addLabel}
        </button>
      )}
    </div>
  )
}

function SelectedCard(props: { eyebrow: string; title: string; onDelete: () => void }) {
  return (
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{props.eyebrow}</p>
          <p className="font-semibold text-gray-800 truncate">{props.title}</p>
        </div>
        <button onClick={props.onDelete} className="text-red-500 hover:text-red-700 transition">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function getErrorMessage(error: any, fallback: string) {
  const errData = error?.response?.data
  if (!errData) return error?.message || fallback
  if (typeof errData === 'string') return errData
  if (Array.isArray(errData)) return errData.join(' ')
  if (errData.detail) return String(errData.detail)
  const parts: string[] = []
  Object.entries(errData).forEach(([key, value]) => {
    if (Array.isArray(value)) parts.push(`${key}: ${value.join(' ')}`)
    else parts.push(`${key}: ${String(value)}`)
  })
  return parts.length ? parts.join(' | ') : fallback
}
