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
  ArrowRight,
  UserCircle2
} from 'lucide-react'
import api from '../utils/axiosInterceptor'
import showToast from '../utils/toast'
import { setSeoTags, injectStructuredData, createLessonSchema, generateExcerpt, generateCanonicalUrl } from '../utils/seoHelpers'
import 'katex/dist/katex.min.css'

// @ts-ignore - Bypasses the "Cannot find module or its corresponding type declarations" error
import renderMathInElement from 'katex/dist/contrib/auto-render'

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

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api'

interface StudentLessonsPageProps {
  darkMode?: boolean
}

export default function StudentLessonsPage({ darkMode = false }: StudentLessonsPageProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [selectedLessonForView, setSelectedLessonForView] = useState<Lesson | null>(null)
  
  const [globalSearch, setGlobalSearch] = useState('')
  const [lessonSearch, setLessonSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Secondary' | 'University'>('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortOrder, setSortOrder] = useState('Date')
  
  const [loading, setLoading] = useState(true)
  const [topicsData, setTopicsData] = useState<{ [key: string]: Topic[] }>({})
  const [lessonsData, setLessonsData] = useState<{ [key: string]: Lesson[] }>({})
  
  const contentRef = useRef<HTMLDivElement>(null)

  // Render KaTeX when lesson content changes + Set SEO tags
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

  // Load only subjects on mount (Lazy Loading Fix)
  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    try {
      setLoading(true)
      const response = await api.get(`${API_BASE}/lessons/subjects/`)
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || [])
      setSubjects(data)
    } catch (error: any) {
      console.error('Error loading subjects:', error)
      showToast('error', 'Error loading subjects')
    } finally {
      setLoading(false)
    }
  }

  const loadTopics = async (subjectId: string) => {
    try {
      if (topicsData[subjectId]) return // Already loaded
      const response = await api.get(`${API_BASE}/lessons/topics/?subject=${subjectId}`)
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || [])
      setTopicsData(prev => ({ ...prev, [subjectId]: data }))
    } catch (error: any) {
      console.error('Error loading topics:', error)
      showToast('error', 'Error loading topics')
    }
  }

  const loadLessons = async (topicId: string) => {
    try {
      if (lessonsData[topicId]) return // Already loaded
      const response = await api.get(`${API_BASE}/lessons/lessons/?topic=${topicId}`)
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || [])
      setLessonsData(prev => ({ ...prev, [topicId]: data }))
    } catch (error: any) {
      console.error('Error loading lessons:', error)
      showToast('error', 'Error loading lessons')
    }
  }

  const toggleSubject = async (subject: Subject) => {
    const newSet = new Set(expandedSubjects)
    if (newSet.has(subject.id)) {
      newSet.delete(subject.id)
    } else {
      newSet.add(subject.id)
      await loadTopics(subject.id) // Lazy load topics
    }
    setExpandedSubjects(newSet)
  }

  const handleTopicClick = async (subject: Subject, topic: Topic) => {
    setSelectedSubject(subject)
    setSelectedTopic(topic)
    await loadLessons(topic.id) // Lazy load lessons
  }

  // UI Helpers mapped from Image
  const getSubjectIcon = (name: string, className: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('english')) return <BookOpen className={className} />
    if (lower.includes('geography')) return <Globe className={className} />
    if (lower.includes('engineering') || lower.includes('math')) return <Settings className={className} />
    if (lower.includes('science') || lower.includes('physics') || lower.includes('chemistry')) return <Atom className={className} />
    if (lower.includes('computer')) return <Code className={className} />
    return <Folder className={className} />
  }

  const getSubjectCategory = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('university') || lower.includes('engineering') || lower.includes('computer')) return 'University'
    return 'Secondary'
  }

  // Filtering Sidebar Subjects
  const filteredSubjects = subjects.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(globalSearch.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || getSubjectCategory(sub.name) === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Filtering Current Lessons
  const currentLessons = (selectedTopic ? lessonsData[selectedTopic.id] || [] : [])
    .filter(lesson => lesson.title.toLowerCase().includes(lessonSearch.toLowerCase()))
    .sort((a, b) => sortOrder === 'Alphabetical' ? a.title.localeCompare(b.title) : new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${darkMode ? 'bg-slate-900' : 'bg-transparent'}`}>
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    )
  }

  // LESSON DETAIL OVERLAY
  if (selectedLessonForView) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          } rounded-2xl border p-8 shadow-xl`}
        >
          <div className="flex justify-between items-start mb-6 border-b pb-6 border-gray-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-bold rounded-full">
                  Lesson
                </span>
                <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {selectedSubject?.name} &gt; {selectedTopic?.name}
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
            </div>
            <button
              onClick={() => setSelectedLessonForView(null)}
              className={`px-5 py-2.5 rounded-xl font-bold transition ${
                darkMode
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              Back to Course
            </button>
          </div>

          <div
            ref={contentRef}
            className={`prose prose-lg max-w-none mb-8 ${
              darkMode ? 'text-slate-200 prose-invert' : 'text-gray-800'
            }`}
            dangerouslySetInnerHTML={{ __html: selectedLessonForView.content }}
          />

          <div className={`pt-6 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'} flex gap-4`}>
            <a
              href="/student/cbt"
              className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-bold flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Take Practice Test
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  // MAIN 2-COLUMN VIEW
  return (
    <div className={`flex flex-col gap-6 ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
      
      {/* Top Banner (Matches Image exactly) */}
      <div className="bg-gradient-to-r from-[#e8701a] to-[#f48c2a] rounded-2xl p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold mb-2">Learn by Topics</h2>
          <p className="opacity-90 font-medium text-orange-50">Step-by-step lessons with explanations and examples</p>
        </div>
        <BookMarked className="absolute right-12 top-1/2 -translate-y-1/2 w-40 h-40 text-white opacity-20" />
      </div>

      {/* Global Search Bar under banner */}
      <div className={`relative rounded-xl overflow-hidden shadow-sm border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search subjects, topics, or lessons..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className={`w-full pl-12 pr-4 py-4 focus:outline-none ${
            darkMode ? 'bg-slate-800 text-white placeholder-slate-400' : 'bg-white text-gray-900 placeholder-gray-400'
          }`}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT SIDEBAR (Categories / Subjects) */}
        <aside className={`w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6`}>
          <div>
            <h3 className="text-xl font-bold mb-4">Categories / Subjects</h3>
            
            {/* Filters */}
            <div className="mb-3">
              <span className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Filters</span>
              <div className="flex flex-wrap gap-2">
                {['All', 'Secondary', 'University'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat as any)}
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

            {/* Folders List */}
            <div className="mt-6">
              <span className={`text-sm font-semibold mb-3 block ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Folders</span>
              <div className="space-y-1">
                {filteredSubjects.map(subject => {
                  const isExpanded = expandedSubjects.has(subject.id);
                  const isUniv = getSubjectCategory(subject.name) === 'University';
                  
                  return (
                    <div key={subject.id} className="flex flex-col">
                      {/* Subject Button */}
                      <button
                        onClick={() => toggleSubject(subject)}
                        className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                          darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="w-6 flex justify-center">
                           {getSubjectIcon(subject.name, "w-5 h-5 text-yellow-600")}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[15px] uppercase leading-tight">{subject.name}</p>
                          <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            ({isUniv ? 'University Faculty' : 'Secondary'})
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>

                      {/* Topics Dropdown (The "-> Dept" style from image) */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className={`ml-6 pl-4 border-l-2 my-1 space-y-1 ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                              {(topicsData[subject.id] || []).length === 0 ? (
                                <p className={`text-xs py-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>No topics found</p>
                              ) : (
                                (topicsData[subject.id] || []).map(topic => (
                                  <button
                                    key={topic.id}
                                    onClick={() => handleTopicClick(subject, topic)}
                                    className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                      selectedTopic?.id === topic.id
                                        ? (darkMode ? 'bg-orange-900/30 text-orange-400 font-bold' : 'bg-orange-50 text-orange-700 font-bold')
                                        : (darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100')
                                    }`}
                                  >
                                    <span className="text-gray-400">↳</span>
                                    <span className="truncate">{topic.name}</span>
                                  </button>
                                ))
                              )}
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

        {/* MAIN CONTENT AREA (Details / Lessons) */}
        <main className="flex-1 min-w-0">
          <h3 className="text-xl font-bold mb-1">Details / Lessons</h3>
          
          {/* Breadcrumbs */}
          <div className={`text-sm mb-6 font-medium ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            {selectedSubject ? (
              <span>{selectedSubject.name} &gt; {selectedTopic ? <span className={darkMode ? 'text-slate-200' : 'text-gray-900'}>{selectedTopic.name}</span> : 'Select a Topic'}</span>
            ) : (
              <span>Select a subject from the sidebar</span>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className={`relative flex-1 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-transparent focus:outline-none text-sm`}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={`px-4 py-2.5 rounded-xl border text-sm focus:outline-none font-medium appearance-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <option>Sort by Date</option>
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

          {/* Lesson Cards Area */}
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
                const isNew = new Date().getTime() - new Date(lesson.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
                
                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center'} rounded-2xl border p-5 transition-shadow hover:shadow-lg ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'
                    }`}
                  >
                    {/* Top Row: Icon + Badge */}
                    <div className="flex justify-between items-start mb-4 w-full">
                       <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-orange-600" />
                       </div>
                       <div className="flex gap-2">
                         {isNew && <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded-md">New</span>}
                         <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-700'}`}>
                           {getSubjectCategory(selectedSubject!.name) === 'University' ? 'Uni' : 'Secondary'}
                         </span>
                       </div>
                    </div>

                    {/* Title */}
                    <h4 className={`text-lg font-extrabold mb-1 line-clamp-2 ${viewMode === 'list' && 'flex-1'} ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      {lesson.title}
                    </h4>

                    {/* Author */}
                    <div className="flex items-center gap-2 mb-6 mt-1">
                      <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                         <UserCircle2 className="w-4 h-4 text-gray-500" />
                      </div>
                      <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>By {lesson.publisher_name}</p>
                    </div>

                    {/* CTA Button */}
                    <div className={viewMode === 'list' ? 'ml-auto' : 'mt-auto'}>
                      <button
                        onClick={() => setSelectedLessonForView(lesson)}
                        className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all ${
                          darkMode 
                           ? 'bg-orange-600 hover:bg-orange-500 text-white' 
                           : 'bg-[#e8701a] hover:bg-[#d66314] text-white shadow-md hover:shadow-lg'
                        }`}
                      >
                        Start Lesson
                      </button>
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