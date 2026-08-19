// src/components/StudentLessonsPage.tsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  BookMarked,
  ExternalLink,
  Globe,
  Settings,
  Atom,
  Code,
  Folder,
  LayoutGrid,
  List as ListIcon,
  UserCircle2,
  Tags,
  Bookmark,
  Clock,
  CheckCircle,
  PlayCircle,
} from 'lucide-react'
import api from '../utils/axiosInterceptor'
import showToast from '../utils/toast'
import { setSeoTags, injectStructuredData, createLessonSchema, generateExcerpt, generateCanonicalUrl } from '../utils/seoHelpers'
import 'katex/dist/katex.min.css'

// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render'

interface Category {
  id: string
  name: string
  description?: string
  color: string
  order: number
}

interface Subject {
  id: string
  name: string
  category?: string
  category_name?: string
  category_color?: string
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

interface Progress {
  id: string
  lesson: string
  is_viewed: boolean
  is_completed: boolean
  time_spent_seconds: number
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api'
const toArray = (data: any) => Array.isArray(data) ? data : (data?.results || [])

interface StudentLessonsPageProps {
  darkMode?: boolean
}

export default function StudentLessonsPage({ darkMode = false }: StudentLessonsPageProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subfolders, setSubfolders] = useState<LessonSubfolder[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [expandedSubfolders, setExpandedSubfolders] = useState<Set<string>>(new Set())
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedSubfolder, setSelectedSubfolder] = useState<LessonSubfolder | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedLessonForView, setSelectedLessonForView] = useState<Lesson | null>(null)
  const [linkedLessons, setLinkedLessons] = useState<Lesson[]>([])

  const [globalSearch, setGlobalSearch] = useState('')
  const [lessonSearch, setLessonSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortOrder, setSortOrder] = useState('Date')

  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Lesson[]>([])
  const [lessonsData, setLessonsData] = useState<{ [key: string]: Lesson[] }>({})
  const [progress, setProgress] = useState<{ [lessonId: string]: Progress }>({})
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())

  const contentRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)

  // Simple debounced value hook
  const useDebouncedValue = <T,>(value: T, delay = 300) => {
    const [debounced, setDebounced] = useState<T>(value)
    useEffect(() => {
      const id = window.setTimeout(() => setDebounced(value), delay)
      return () => window.clearTimeout(id)
    }, [value, delay])
    return debounced
  }

  const debouncedGlobalSearch = useDebouncedValue(globalSearch, 400)
  const debouncedLessonSearch = useDebouncedValue(lessonSearch, 250)

  // Initialize bookmarks
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lesson_bookmarks')
      if (stored) {
        setBookmarks(new Set(JSON.parse(stored)))
      }
    } catch (e) {
      console.error('Error reading bookmarks', e)
    }
  }, [])

  const toggleBookmark = (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation()
    const next = new Set(bookmarks)
    if (next.has(lessonId)) {
      next.delete(lessonId)
      showToast('success', 'Bookmark removed')
    } else {
      next.add(lessonId)
      showToast('success', 'Lesson bookmarked!')
    }
    setBookmarks(next)
    localStorage.setItem('lesson_bookmarks', JSON.stringify(Array.from(next)))
  }

  // Load SEO and Math
  useEffect(() => {
    if (selectedLessonForView && contentRef.current) {
      const metaDescription = selectedLessonForView.meta_description || generateExcerpt(selectedLessonForView.content, 160)
      setSeoTags({
        title: `${selectedLessonForView.title} - Lebanon Academy`,
        description: metaDescription,
        keywords: selectedLessonForView.meta_keywords,
        ogImage: selectedLessonForView.og_image,
        lessonAuthor: selectedLessonForView.publisher_name
      })

      const schema = createLessonSchema({
        title: selectedLessonForView.title,
        description: metaDescription,
        content: selectedLessonForView.content,
        author: selectedLessonForView.publisher_name,
        datePublished: selectedLessonForView.created_at || new Date().toISOString(),
        dateModified: selectedLessonForView.updated_at || new Date().toISOString(),
        url: selectedLessonForView.slug ? generateCanonicalUrl(selectedLessonForView.slug) : undefined,
        image: selectedLessonForView.og_image
      })
      injectStructuredData(schema)

      if (selectedLessonForView.linked_topics && selectedLessonForView.linked_topics.length > 0) {
        const fetchLinkedLessons = async () => {
          try {
            const promises = selectedLessonForView.linked_topics!.map(topicId => 
              api.get(`${API_BASE}/lessons/lessons/`, { params: { topic: topicId, page_size: 10 } })
            )
            const responses = await Promise.all(promises)
            const lessons = responses.flatMap(r => toArray(r.data))
            setLinkedLessons(lessons.filter(l => l.id !== selectedLessonForView.id))
          } catch (err) {
            console.error('Failed to load linked lessons', err)
          }
        }
        fetchLinkedLessons()
      } else {
        setLinkedLessons([])
      }

      // Mark as viewed on open
      markAsViewed(selectedLessonForView.id)

      setTimeout(() => {
        renderMathInElement(contentRef.current!, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ]
        })
      }, 100)
    }
  }, [selectedLessonForView])

  useEffect(() => {
    loadHierarchy()
    loadProgress()
  }, [])

  // Debounced search effect
  useEffect(() => {
    const query = debouncedGlobalSearch.trim()
    if (!query) {
      setSearchResults([])
      setSearching(false)
      return
    }

    let cancelled = false
    const requestId = ++requestIdRef.current

    const run = async () => {
      try {
        setSearching(true)
        const response = await api.get(`${API_BASE}/lessons/lessons/search/`, { params: { q: query, page_size: 100 } })
        if (cancelled) return
        if (requestId === requestIdRef.current) setSearchResults(toArray(response.data))
      } catch (error: any) {
        if (cancelled) return
        console.error('Error searching lessons:', error)
        if (requestId === requestIdRef.current) setSearchResults([])
      } finally {
        if (cancelled) return
        if (requestId === requestIdRef.current) setSearching(false)
      }
    }

    run()

    return () => { cancelled = true }
  }, [debouncedGlobalSearch])

  const loadHierarchy = async () => {
    try {
      setLoading(true)
      const [subjectsRes, subfoldersRes, topicsRes, categoriesRes] = await Promise.all([
        api.get(`${API_BASE}/lessons/subjects/`, { params: { page_size: 100 } }),
        api.get(`${API_BASE}/lessons/subfolders/`, { params: { page_size: 100 } }),
        api.get(`${API_BASE}/lessons/topics/`, { params: { page_size: 100 } }),
        api.get(`${API_BASE}/lessons/categories/`).catch(() => ({ data: [] }))
      ])
      setSubjects(toArray(subjectsRes.data))
      setSubfolders(toArray(subfoldersRes.data))
      setTopics(toArray(topicsRes.data))
      setCategories(toArray(categoriesRes.data))
    } catch (error: any) {
      console.error('Error loading lesson hierarchy:', error)
      showToast('error', 'Error loading lessons')
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      const response = await api.get(`${API_BASE}/lessons/progress/?page_size=1000`)
      const progressMap: { [lessonId: string]: Progress } = {}
      toArray(response.data).forEach((item: Progress) => {
        progressMap[item.lesson] = item
      })
      setProgress(progressMap)
    } catch (err) {
      console.error('Error loading progress:', err)
    }
  }

  const loadLessons = async (topicId: string) => {
    try {
      if (lessonsData[topicId]) return
      const response = await api.get(`${API_BASE}/lessons/lessons/`, { params: { topic: topicId, page_size: 100 } })
      setLessonsData(prev => ({ ...prev, [topicId]: toArray(response.data) }))
    } catch (error: any) {
      console.error('Error loading lessons:', error)
      showToast('error', 'Error loading lessons')
    }
  }

  const markAsViewed = async (lessonId: string) => {
    try {
      if (progress[lessonId]?.is_viewed) return
      const response = await api.post(`${API_BASE}/lessons/lessons/${lessonId}/mark_as_viewed/`)
      setProgress(prev => ({ ...prev, [lessonId]: response.data }))
    } catch (err) {
      console.error('Error marking viewed', err)
    }
  }

  const handleMarkAsCompleted = async (lessonId: string) => {
    try {
      const response = await api.post(`${API_BASE}/lessons/lessons/${lessonId}/mark_as_completed/`, {
        time_spent_seconds: 300
      })
      setProgress(prev => ({ ...prev, [lessonId]: response.data }))
      showToast('success', 'Lesson marked as completed!')
    } catch (err) {
      console.error('Error marking completion', err)
      showToast('error', 'Error updating progress')
    }
  }

  const toggleSubject = (subject: Subject) => {
    const newSet = new Set(expandedSubjects)
    if (newSet.has(subject.id)) newSet.delete(subject.id)
    else newSet.add(subject.id)
    setExpandedSubjects(newSet)
  }

  const toggleSubfolder = (subfolder: LessonSubfolder) => {
    const newSet = new Set(expandedSubfolders)
    if (newSet.has(subfolder.id)) newSet.delete(subfolder.id)
    else newSet.add(subfolder.id)
    setExpandedSubfolders(newSet)
  }

  const handleTopicClick = async (subject: Subject, subfolder: LessonSubfolder, topic: Topic) => {
    setSelectedSubject(subject)
    setSelectedSubfolder(subfolder)
    setSelectedTopic(topic)
    await loadLessons(topic.id)
  }

  const handleSearchLessonClick = async (lesson: Lesson) => {
    const topic = topics.find(t => t.id === lesson.topic) || null
    const subfolder = topic ? subfolders.find(s => s.id === topic.subfolder) || null : null
    const subject = topic ? subjects.find(s => s.id === topic.subject) || null : null

    setSelectedSubject(subject)
    setSelectedSubfolder(subfolder)
    setSelectedTopic(topic)
    setSelectedLessonForView(lesson)
    if (topic) {
      await loadLessons(topic.id)
    }
  }

  const getSubjectIcon = (name: string, className: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('english')) return <BookOpen className={className} />
    if (lower.includes('geography')) return <Globe className={className} />
    if (lower.includes('engineering') || lower.includes('math')) return <Settings className={className} />
    if (lower.includes('science') || lower.includes('physics') || lower.includes('chemistry')) return <Atom className={className} />
    if (lower.includes('computer')) return <Code className={className} />
    return <Folder className={className} />
  }

  // Reading time helper
  const getReadingTime = (content: string) => {
    if (!content) return '1 min read'
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
    const minutes = Math.max(1, Math.ceil(words / 200))
    return `${minutes} min read`
  }

  const query = globalSearch.trim().toLowerCase()
  const searchLessonTopicIds = new Set(searchResults.map(lesson => lesson.topic))
  const searchSubfolderIds = new Set(
    topics.filter(topic => searchLessonTopicIds.has(topic.id)).map(topic => topic.subfolder)
  )
  const searchSubjectIds = new Set(
    topics.filter(topic => searchLessonTopicIds.has(topic.id)).map(topic => topic.subject)
  )

  const filteredSubjects = subjects.filter(subject => {
    const subjectSubfolders = subfolders.filter(subfolder => subfolder.subject === subject.id)
    const subjectTopics = topics.filter(topic => topic.subject === subject.id)
    const matchesSearch = !query ||
      subject.name.toLowerCase().includes(query) ||
      subjectSubfolders.some(subfolder => subfolder.name.toLowerCase().includes(query)) ||
      subjectTopics.some(topic => topic.name.toLowerCase().includes(query)) ||
      searchSubjectIds.has(subject.id)
    
    const matchesCategory = categoryFilter === 'All' || 
      (subject.category_name === categoryFilter)
    
    return matchesSearch && matchesCategory
  })

  const getFilteredSubfolders = (subjectId: string) => {
    return subfolders.filter(subfolder => {
      const subfolderTopics = topics.filter(topic => topic.subfolder === subfolder.id)
      return subfolder.subject === subjectId && (!query ||
        subfolder.name.toLowerCase().includes(query) ||
        subfolderTopics.some(topic => topic.name.toLowerCase().includes(query)) ||
        searchSubfolderIds.has(subfolder.id)
      )
    })
  }

  const getFilteredTopics = (subfolderId: string) => {
    return topics.filter(topic => {
      return topic.subfolder === subfolderId && (!query ||
        topic.name.toLowerCase().includes(query) ||
        searchLessonTopicIds.has(topic.id)
      )
    })
  }

  const currentLessons = (selectedTopic ? lessonsData[selectedTopic.id] || [] : [])
    .filter(lesson => {
      const text = `${lesson.title} ${lesson.tags || ''}`.toLowerCase()
      return text.includes(debouncedLessonSearch.toLowerCase())
    })
    .sort((a, b) => sortOrder === 'Alphabetical' ? a.title.localeCompare(b.title) : new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Continue learning lessons: viewed but not completed
  const continueLearningLessons = Object.values(progress)
    .filter(p => p.is_viewed && !p.is_completed)
    .map(p => {
      // Find full lesson info in loaded data
      for (const topicId of Object.keys(lessonsData)) {
        const found = lessonsData[topicId].find(l => l.id === p.lesson)
        if (found) return found
      }
      // Or in search results
      const foundInSearch = searchResults.find(l => l.id === p.lesson)
      if (foundInSearch) return foundInSearch
      return null
    })
    .filter(Boolean) as Lesson[]

  const selectedBreadcrumb = selectedLessonForView
    ? `${selectedLessonForView.subject_name || selectedSubject?.name || 'Folder'} > ${selectedLessonForView.subfolder_name || selectedSubfolder?.name || 'Subfolder'} > ${selectedLessonForView.topic_name || selectedTopic?.name || 'Topic'}`
    : ''

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${darkMode ? 'bg-slate-900' : 'bg-transparent'}`}>
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    )
  }

  if (selectedLessonForView) {
    const isCompleted = progress[selectedLessonForView.id]?.is_completed

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl border p-8 shadow-xl`}
        >
          <div className="flex justify-between items-start mb-6 border-b pb-6 border-gray-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold rounded-full">
                  Lesson
                </span>
                <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {selectedBreadcrumb}
                </span>
              </div>
              <h3 className={`text-3xl font-extrabold mb-3 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                {selectedLessonForView.title}
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
                  <UserCircle2 size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                    By {selectedLessonForView.publisher_name}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                    Published: {new Date(selectedLessonForView.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedLessonForView.tags && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {selectedLessonForView.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-orange-55 text-[#e8701a] dark:bg-orange-950/20 dark:text-orange-400 text-xs font-bold rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={(e) => toggleBookmark(e, selectedLessonForView.id)}
                className={`p-2.5 rounded-xl border transition ${
                  bookmarks.has(selectedLessonForView.id)
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-950/20 dark:border-yellow-900'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                }`}
              >
                <Bookmark className="w-5 h-5" fill={bookmarks.has(selectedLessonForView.id) ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={() => setSelectedLessonForView(null)}
                className={`px-5 py-2.5 rounded-xl font-bold transition ${
                  darkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                Back to Lessons
              </button>
            </div>
          </div>

          <div
            ref={contentRef}
            className={`prose prose-lg max-w-none mb-8 rich-text-content ${darkMode ? 'text-slate-200 prose-invert dark-content' : 'text-gray-800'} overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_td]:border [&_td]:border-gray-300 [&_th]:p-3 [&_td]:p-3 dark:[&_th]:border-slate-700 dark:[&_td]:border-slate-700`}
            dangerouslySetInnerHTML={{ __html: selectedLessonForView.content }}
          />

          <div className={`pt-6 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'} flex flex-wrap gap-4 items-center justify-between`}>
            <a
              href="/student/cbt"
              className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-bold flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Take Practice Test
            </a>

            {!isCompleted ? (
              <button
                onClick={() => handleMarkAsCompleted(selectedLessonForView.id)}
                className="px-6 py-3.5 border border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-xl transition font-bold flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Completed
              </button>
            ) : (
              <div className="flex items-center gap-2 text-green-600 font-bold px-4 py-2 bg-green-50 dark:bg-green-950/20 rounded-xl">
                <CheckCircle className="w-5 h-5" />
                Completed
              </div>
            )}
          </div>

          {linkedLessons.length > 0 && (
            <div className={`mt-8 pt-8 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <h4 className={`text-xl font-bold mb-4 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                Also see similar lessons
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkedLessons.map(lesson => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLessonForView(null)
                      setTimeout(() => handleSearchLessonClick(lesson), 50)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`text-left rounded-xl border p-4 transition hover:shadow-md ${darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-orange-50/50 border-orange-100 hover:bg-orange-50'}`}
                  >
                    <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                      {lesson.topic_name || 'Related Topic'}
                    </p>
                    <h5 className={`font-bold line-clamp-2 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      {lesson.title}
                    </h5>
                    {lesson.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lesson.tags.split(',').map(t => t.trim()).slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-orange-100 text-[#e8701a] text-[10px] rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-6 ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
      <div className="bg-gradient-to-r from-[#e8701a] to-[#f48c2a] rounded-2xl p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold mb-2">Learn by Topics</h2>
          <p className="opacity-90 font-medium text-orange-50">Step-by-step lessons with explanations and examples</p>
        </div>
        <BookMarked className="absolute right-12 top-1/2 -translate-y-1/2 w-40 h-40 text-white opacity-20" />
      </div>

      <div className={`relative rounded-xl overflow-hidden shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search folders, subfolders, topics, lessons, or tags..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className={`w-full pl-12 pr-4 py-4 focus:outline-none ${darkMode ? 'bg-slate-800 text-white placeholder-slate-400' : 'bg-white text-gray-950 placeholder-gray-400'}`}
        />
      </div>

      {query && (
        <section className={`rounded-2xl border p-5 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Matching Lessons</h3>
            {searching && <Loader2 className="w-5 h-5 animate-spin text-orange-500" />}
          </div>
          {searchResults.length === 0 && !searching ? (
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>No lessons matched your search.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map(lesson => (
                <button
                  key={lesson.id}
                  onClick={() => handleSearchLessonClick(lesson)}
                  className={`text-left rounded-xl border p-4 transition hover:shadow-md ${darkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-900/80' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                >
                  <p className={`text-xs font-semibold mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                    {lesson.subject_name} &gt; {lesson.subfolder_name} &gt; {lesson.topic_name}
                  </p>
                  <h4 className={`font-extrabold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{lesson.title}</h4>
                  {lesson.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lesson.tags.split(',').map(t => t.trim()).slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-orange-50 text-[#e8701a] text-[10px] rounded border border-orange-100">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Continue Learning Section */}
      {continueLearningLessons.length > 0 && !query && !selectedLessonForView && (
        <section className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-orange-500 animate-pulse" />
            Continue Learning
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {continueLearningLessons.map(lesson => (
              <button
                key={lesson.id}
                onClick={() => handleSearchLessonClick(lesson)}
                className={`min-w-[280px] max-w-[320px] text-left p-4 rounded-xl border transition hover:shadow-md ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-orange-100 text-orange-850 rounded-full">In Progress</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getReadingTime(lesson.content)}
                  </span>
                </div>
                <h4 className={`font-bold line-clamp-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{lesson.title}</h4>
                <p className="text-xs text-gray-500 mt-1 truncate">{lesson.subject_name} &gt; {lesson.topic_name}</p>
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-orange-500 h-full w-[45%]" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold mb-4">Categories / Folders</h3>
            
            {/* Dynamic filter tabs from Category model */}
            <div className="mb-3">
              <span className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Filters</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('All')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border ${
                    categoryFilter === 'All'
                      ? (darkMode ? 'bg-slate-200 text-slate-900 border-slate-200' : 'bg-gray-800 text-white border-gray-800')
                      : (darkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.name)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border flex items-center gap-1.5 ${
                      categoryFilter === cat.name
                        ? (darkMode ? 'bg-slate-200 text-slate-900 border-slate-200' : 'bg-gray-800 text-white border-gray-800')
                        : (darkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                ))}
                {/* Fallbacks if API is empty */}
                {categories.length === 0 && ['Secondary', 'University'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border ${
                      categoryFilter === cat
                        ? (darkMode ? 'bg-slate-200 text-slate-900 border-slate-200' : 'bg-gray-800 text-white border-gray-800')
                        : (darkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50')
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <span className={`text-sm font-semibold mb-3 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Folders</span>
              <div className="space-y-1">
                {filteredSubjects.map(subject => {
                  const isExpanded = expandedSubjects.has(subject.id) || !!query
                  const visibleSubfolders = getFilteredSubfolders(subject.id)
                  
                  return (
                    <div key={subject.id} className="flex flex-col">
                      <button
                        onClick={() => toggleSubject(subject)}
                        className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
                      >
                        <div className="w-6 flex justify-center">
                          {subject.category_color ? (
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.category_color }} />
                          ) : (
                            getSubjectIcon(subject.name, 'w-5 h-5 text-yellow-600')
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[15px] uppercase leading-tight truncate">{subject.name}</p>
                          {subject.category_name ? (
                            <p className="text-[10px] font-semibold" style={{ color: subject.category_color || '#e8701a' }}>
                              {subject.category_name}
                            </p>
                          ) : (
                            <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                              General
                            </p>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className={`ml-6 pl-4 border-l-2 my-1 space-y-1 ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                              {visibleSubfolders.length === 0 ? (
                                <p className={`text-xs py-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No subfolders found</p>
                              ) : visibleSubfolders.map(subfolder => {
                                const isSubfolderExpanded = expandedSubfolders.has(subfolder.id) || !!query
                                const visibleTopics = getFilteredTopics(subfolder.id)

                                return (
                                  <div key={subfolder.id}>
                                    <button
                                      onClick={() => toggleSubfolder(subfolder)}
                                      className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                        selectedSubfolder?.id === subfolder.id
                                          ? (darkMode ? 'bg-orange-900/30 text-orange-400 font-bold' : 'bg-orange-50 text-orange-700 font-bold')
                                          : (darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100')
                                      }`}
                                    >
                                      <Folder className="w-4 h-4 text-yellow-600" />
                                      <span className="truncate">{subfolder.name}</span>
                                      {isSubfolderExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                                    </button>

                                    {isSubfolderExpanded && (
                                      <div className={`ml-5 pl-3 border-l my-1 space-y-1 ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                                        {visibleTopics.length === 0 ? (
                                          <p className={`text-xs py-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No topics found</p>
                                        ) : visibleTopics.map(topic => (
                                          <button
                                            key={topic.id}
                                            onClick={() => handleTopicClick(subject, subfolder, topic)}
                                            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                              selectedTopic?.id === topic.id
                                                ? (darkMode ? 'bg-orange-900/30 text-orange-400 font-bold' : 'bg-orange-50 text-orange-700 font-bold')
                                                : (darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100')
                                            }`}
                                          >
                                            <span className="text-gray-400">-&gt;</span>
                                            <span className="truncate">{topic.name}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <h3 className="text-xl font-bold mb-1">Details / Lessons</h3>
          <div className={`text-sm mb-6 font-medium ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            {selectedSubject ? (
              <span>
                {selectedSubject.name}
                {selectedSubfolder && <> &gt; <span className={darkMode ? 'text-slate-200' : 'text-gray-900'}>{selectedSubfolder.name}</span></>}
                {selectedTopic && <> &gt; <span className={darkMode ? 'text-slate-200' : 'text-gray-900'}>{selectedTopic.name}</span></>}
              </span>
            ) : (
              <span>Select a folder from the sidebar</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className={`relative flex-1 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search lessons or tags..."
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-transparent focus:outline-none text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={`px-4 py-2.5 rounded-xl border text-sm focus:outline-none font-medium appearance-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-700'}`}
              >
                <option>Date</option>
                <option>Alphabetical</option>
              </select>
              <div className={`flex rounded-xl border p-1 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? (darkMode ? 'bg-slate-700' : 'bg-gray-100') : ''}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? (darkMode ? 'bg-slate-700' : 'bg-gray-100') : ''}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {!selectedTopic ? (
            <div className={`flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-300 bg-gray-50'}`}>
              <BookOpen className={`w-12 h-12 mb-4 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Select a topic to view its lessons</p>
            </div>
          ) : currentLessons.length === 0 ? (
            <div className={`text-center p-12 rounded-2xl border ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
              <p className={`font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>No lessons found for this topic.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-5' : 'flex flex-col gap-4'}>
              {currentLessons.map(lesson => {
                const isNew = new Date().getTime() - new Date(lesson.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
                const isViewed = progress[lesson.id]?.is_viewed
                const isCompleted = progress[lesson.id]?.is_completed

                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSelectedLessonForView(lesson)}
                    className={`cursor-pointer flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center'} rounded-2xl border p-5 transition-all hover:shadow-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-4 w-full">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex gap-2 items-center">
                        {isNew && <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded-md">New</span>}
                        
                        <span 
                          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md"
                          style={{
                            backgroundColor: (selectedSubject?.category_color || '#FFEADB') + '40',
                            color: selectedSubject?.category_color || '#e8701a'
                          }}
                        >
                          {selectedSubject?.category_name || 'General'}
                        </span>
                        
                        <button
                          onClick={(e) => toggleBookmark(e, lesson.id)}
                          className={`p-1.5 rounded-lg border transition ${
                            bookmarks.has(lesson.id)
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-600'
                              : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" fill={bookmarks.has(lesson.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <h4 className={`text-lg font-extrabold mb-1 line-clamp-2 ${viewMode === 'list' && 'flex-1'} ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      {lesson.title}
                    </h4>

                    <div className="flex items-center justify-between w-full mt-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                          <UserCircle2 className="w-4 h-4 text-gray-500" />
                        </div>
                        <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>By {lesson.publisher_name}</p>
                      </div>

                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {getReadingTime(lesson.content)}
                      </span>
                    </div>

                    {lesson.tags && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {lesson.tags.split(',').map(t => t.trim()).slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-50 dark:bg-slate-700/50 text-[#e8701a] text-[10px] rounded border border-orange-100/50 dark:border-slate-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Progress indicators */}
                    <div className="w-full mt-auto pt-3 border-t border-gray-150 dark:border-slate-700">
                      {isCompleted ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </div>
                      ) : isViewed ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-orange-500">
                            <span>In Progress</span>
                            <span>45%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full w-[45%]" />
                          </div>
                        </div>
                      ) : (
                        <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Not started</span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
