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
} from 'lucide-react'
import api from '../utils/axiosInterceptor'
import showToast from '../utils/toast'
import { setSeoTags, injectStructuredData, createLessonSchema, generateExcerpt, generateCanonicalUrl } from '../utils/seoHelpers'
import 'katex/dist/katex.min.css'
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

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface StudentLessonsPageProps {
  darkMode?: boolean
}

export default function StudentLessonsPage({ darkMode = false }: StudentLessonsPageProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [topicsData, setTopicsData] = useState<{ [key: string]: Topic[] }>({})
  const [lessonsData, setLessonsData] = useState<{ [key: string]: Lesson[] }>({})
  const searchInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Render KaTeX when lesson content changes + Set SEO tags
  useEffect(() => {
    if (selectedLesson && contentRef.current) {
      // Set SEO meta tags
      const metaDescription = selectedLesson.meta_description || generateExcerpt(selectedLesson.content, 160)
      setSeoTags({
        title: `${selectedLesson.title} - Lebanon Academy`,
        description: metaDescription,
        keywords: selectedLesson.meta_keywords,
        ogImage: selectedLesson.og_image,
        lessonAuthor: selectedLesson.publisher_name
      })

      // Inject structured data (schema.org)
      const schema = createLessonSchema({
        title: selectedLesson.title,
        description: metaDescription,
        content: selectedLesson.content,
        author: selectedLesson.publisher_name,
        datePublished: selectedLesson.created_at || new Date().toISOString(),
        dateModified: selectedLesson.updated_at || new Date().toISOString(),
        url: selectedLesson.slug ? generateCanonicalUrl(selectedLesson.slug) : undefined,
        image: selectedLesson.og_image
      })
      injectStructuredData(schema)

      // Render KaTeX math
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
  }, [selectedLesson])

  // Load subjects on mount
  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    try {
      setLoading(true)
      const response = await api.get(`${API_BASE}/lessons/subjects/`)
      // Handle both array and paginated responses { results: [...] }
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || [])
      setSubjects(data)
      
      // Batch-load all topics for all subjects on mount
      if (data.length > 0) {
        await loadAllTopics(data)
      }
    } catch (error: any) {
      console.error('Error loading subjects:', error)
      showToast('Error loading subjects', 'error')
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  const loadAllTopics = async (subjectList: Subject[]) => {
    try {
      const topicsMap: { [key: string]: Topic[] } = {}
      const lessonsMap: { [key: string]: Lesson[] } = {}

      // Load topics for all subjects in parallel
      await Promise.all(
        subjectList.map(async (subject) => {
          try {
            const response = await api.get(`${API_BASE}/lessons/topics/?subject=${subject.id}`)
            const topics = Array.isArray(response.data) ? response.data : (response.data?.results || [])
            topicsMap[subject.id] = topics

            // Also batch-load lessons for all topics in this subject
            await Promise.all(
              topics.map(async (topic) => {
                try {
                  const lessonResponse = await api.get(`${API_BASE}/lessons/lessons/?topic=${topic.id}`)
                  const lessons = Array.isArray(lessonResponse.data) ? lessonResponse.data : (lessonResponse.data?.results || [])
                  lessonsMap[topic.id] = lessons
                } catch (err) {
                  console.error('Error loading lessons for topic:', err)
                  lessonsMap[topic.id] = []
                }
              })
            )
          } catch (err) {
            console.error('Error loading topics for subject:', err)
            topicsMap[subject.id] = []
          }
        })
      )

      setTopicsData(topicsMap)
      setLessonsData(lessonsMap)
    } catch (error: any) {
      console.error('Error in loadAllTopics:', error)
    }
  }

  const loadTopics = async (subjectId: string) => {
    try {
      if (topicsData[subjectId]) {
        return // Already loaded
      }
      const response = await api.get(`${API_BASE}/lessons/topics/?subject=${subjectId}`)
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || [])
      setTopicsData(prev => ({ ...prev, [subjectId]: data }))
    } catch (error: any) {
      console.error('Error loading topics:', error)
      showToast('Error loading topics', 'error')
    }
  }

  const loadLessons = async (topicId: string) => {
    try {
      if (lessonsData[topicId]) {
        return // Already loaded
      }
      const response = await api.get(`${API_BASE}/lessons/lessons/?topic=${topicId}`)
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || [])
      setLessonsData(prev => ({ ...prev, [topicId]: data }))
    } catch (error: any) {
      console.error('Error loading lessons:', error)
      showToast('Error loading lessons', 'error')
    }
  }

  const toggleSubject = async (subjectId: string) => {
    const newSet = new Set(expandedSubjects)
    if (newSet.has(subjectId)) {
      newSet.delete(subjectId)
    } else {
      newSet.add(subjectId)
      // Topics are already loaded on mount, so just expand
    }
    setExpandedSubjects(newSet)
  }

  // Filter subjects and topics based on search
  const filterLessons = () => {
    const query = searchQuery.toLowerCase()
    const results: Array<{ subject: Subject; topics: Array<{ topic: Topic; lessons: Lesson[] }> }> = []

    subjects.forEach(subject => {
      if (subject.name.toLowerCase().includes(query)) {
        // If subject matches, include all its topics
        const topics = topicsData[subject.id] || []
        const topicsWithLessons = topics.map(topic => ({
          topic,
          lessons: lessonsData[topic.id] || []
        }))
        results.push({ subject, topics: topicsWithLessons })
      } else {
        // Check if any topic or lesson matches
        const topics = topicsData[subject.id] || []
        const matchingTopics = topics
          .filter(topic => topic.name.toLowerCase().includes(query))
          .map(topic => ({
            topic,
            lessons: lessonsData[topic.id] || []
          }))

        if (matchingTopics.length > 0) {
          results.push({ subject, topics: matchingTopics })
        } else {
          // Check if any lesson matches
          let hasMatchingLesson = false
          topics.forEach(topic => {
            const topicLessons = lessonsData[topic.id] || []
            if (topicLessons.some(l => l.title.toLowerCase().includes(query))) {
              hasMatchingLesson = true
            }
          })

          if (hasMatchingLesson) {
            const topicsWithLessons = topics.map(topic => {
              const filteredLessons = (lessonsData[topic.id] || []).filter(l =>
                l.title.toLowerCase().includes(query)
              )
              return { topic, lessons: filteredLessons }
            })
            results.push({ subject, topics: topicsWithLessons })
          }
        }
      }
    })

    return results
  }

  const displayedContent = searchQuery ? filterLessons() : subjects.map(subject => ({
    subject,
    topics: (topicsData[subject.id] || []).map(topic => ({
      topic,
      lessons: lessonsData[topic.id] || []
    }))
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-8 text-white relative overflow-hidden`}>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Learn by Topics</h2>
          <p className="opacity-90">Step-by-step lessons with explanations and examples</p>
        </div>
        <BookMarked className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white opacity-20" />
      </div>

      {/* Search Bar */}
      <div className={`${darkMode ? 'bg-slate-700' : 'bg-white'} rounded-lg p-4 shadow-md`}>
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search subjects, topics, or lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
              darkMode
                ? 'bg-slate-700 text-white placeholder-slate-400'
                : 'bg-gray-50 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
      </div>

      {/* Subjects List */}
      <div className="space-y-4">
        {displayedContent.length === 0 ? (
          <div
            className={`${
              darkMode
                ? 'bg-slate-700 border-slate-600'
                : 'bg-yellow-50 border-yellow-200'
            } rounded-lg border p-8 text-center`}
          >
            <p className={`${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              {searchQuery
                ? 'No lessons found matching your search.'
                : 'No lessons available yet.'}
            </p>
          </div>
        ) : (
          displayedContent.map(({ subject, topics }) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${
                darkMode
                  ? 'bg-slate-700 border-slate-600'
                  : 'bg-white border-gray-200'
              } rounded-lg border overflow-hidden shadow-md hover:shadow-lg transition-shadow`}
            >
              {/* Subject Header */}
              <button
                onClick={() => toggleSubject(subject.id)}
                className={`w-full px-6 py-4 flex items-center justify-between hover:${
                  darkMode ? 'bg-slate-600' : 'bg-gray-50'
                } transition`}
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <BookOpen className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                  <div>
                    <h3
                      className={`font-bold text-lg ${
                        darkMode ? 'text-slate-100' : 'text-gray-900'
                      }`}
                    >
                      {subject.name}
                    </h3>
                    <p
                      className={`text-sm ${
                        darkMode ? 'text-slate-400' : 'text-gray-500'
                      }`}
                    >
                      {topics.length} topic{topics.length !== 1 ? 's' : ''} •{' '}
                      {topics.reduce((sum, { lessons }) => sum + lessons.length, 0)} lesson
                      {topics.reduce((sum, { lessons }) => sum + lessons.length, 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className={`${
                  expandedSubjects.has(subject.id) ? 'text-yellow-600' : 'text-gray-400'
                } transition`}>
                  {expandedSubjects.has(subject.id) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {/* Topics List */}
              {expandedSubjects.has(subject.id) && (
                <AnimatePresence>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className={`border-t ${
                      darkMode ? 'border-slate-600' : 'border-gray-200'
                    } overflow-hidden`}
                  >
                    <div className="space-y-2 p-4">
                      {topics.length === 0 ? (
                        <p
                          className={`text-sm px-4 py-2 ${
                            darkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}
                        >
                          No topics available
                        </p>
                      ) : (
                        topics.map(({ topic, lessons }) => (
                          <motion.div
                            key={topic.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`rounded-lg overflow-hidden border ${
                              darkMode
                                ? 'bg-slate-600 border-slate-500'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {/* Topic Header */}
                            <button
                              onClick={() => loadLessons(topic.id)}
                              className={`w-full px-4 py-3 flex items-center justify-between hover:${
                                darkMode ? 'bg-slate-500' : 'bg-gray-100'
                              } transition text-left`}
                            >
                              <h4
                                className={`font-semibold ${
                                  darkMode ? 'text-slate-100' : 'text-gray-800'
                                }`}
                              >
                                {topic.name}
                              </h4>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  darkMode
                                    ? 'bg-slate-500 text-slate-100'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {lessons.length}
                              </span>
                            </button>

                            {/* Lessons List */}
                            {lessons.length > 0 && (
                              <div className={`border-t ${
                                darkMode ? 'border-slate-500' : 'border-gray-200'
                              } space-y-2 p-3`}>
                                {lessons.map(lesson => (
                                  <motion.button
                                    key={lesson.id}
                                    onClick={() => setSelectedLesson(lesson)}
                                    whileHover={{ x: 4 }}
                                    className={`w-full text-left px-3 py-2 rounded transition ${
                                      selectedLesson?.id === lesson.id
                                        ? darkMode
                                          ? 'bg-yellow-600 text-white'
                                          : 'bg-yellow-100 text-yellow-900'
                                        : darkMode
                                          ? 'hover:bg-slate-500 text-slate-100'
                                          : 'hover:bg-white text-gray-900'
                                    }`}
                                  >
                                    <p className="font-medium text-sm truncate">
                                      {lesson.title}
                                    </p>
                                    <p
                                      className={`text-xs ${
                                        selectedLesson?.id === lesson.id
                                          ? darkMode
                                            ? 'text-yellow-100'
                                            : 'text-yellow-700'
                                          : darkMode
                                            ? 'text-slate-400'
                                            : 'text-gray-500'
                                      }`}
                                    >
                                      By {lesson.publisher_name}
                                    </p>
                                  </motion.button>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Lesson Detail View */}
      {selectedLesson && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
            darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
          } rounded-lg border p-6 shadow-lg`}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3
                className={`text-2xl font-bold mb-2 ${
                  darkMode ? 'text-slate-100' : 'text-gray-900'
                }`}
              >
                {selectedLesson.title}
              </h3>
              <p
                className={`text-sm ${
                  darkMode ? 'text-slate-400' : 'text-gray-600'
                }`}
              >
                By{' '}
                <span className="font-semibold">{selectedLesson.publisher_name}</span>
                {selectedLesson.publisher_title && (
                  <span className={`ml-2 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                    ({selectedLesson.publisher_title})
                  </span>
                )}
              </p>
              <p
                className={`text-xs ${
                  darkMode ? 'text-slate-500' : 'text-gray-500'
                } mt-1`}
              >
                Published: {new Date(selectedLesson.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setSelectedLesson(null)}
              className={`px-4 py-2 rounded-lg transition ${
                darkMode
                  ? 'bg-slate-600 hover:bg-slate-500 text-slate-100'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              Close
            </button>
          </div>

          {/* Lesson Content */}
          <div
            ref={contentRef}
            className={`prose prose-sm max-w-none mb-6 p-4 rounded-lg ${
              darkMode
                ? 'bg-slate-600 text-slate-100 prose-invert'
                : 'bg-gray-50 text-gray-900'
            }`}
            dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
          />

          {/* CTA: Go to CBT Exam */}
          <div
            className={`pt-6 border-t ${
              darkMode ? 'border-slate-600' : 'border-gray-200'
            } flex gap-4`}
          >
            <a
              href="/student/cbt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Take Practice Test
            </a>
          </div>
        </motion.div>
      )}
    </div>
  )
}
