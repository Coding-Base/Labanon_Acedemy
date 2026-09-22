import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import axios from 'axios'
import { FileText, Search, ChevronRight, TrendingUp, Clock, BookOpen, Play } from 'lucide-react'
import CBTExamFlow from '../components/cbt/CBTExamFlow'
import ExamCategoryPage from '../components/cbt/ExamCategoryPage'
import ExamFolderCard from '../components/cbt/ExamFolderCard'
import ContinuePractisingCard from '../components/cbt/ContinuePractisingCard'
import ExamInterface from '../components/cbt/ExamInterface-MultiSubject'
import showToast from '../utils/toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

type View = 'hub' | 'category' | 'exam-flow' | 'exam-interface'

interface Subject {
  id: number
  name: string
  description: string
  question_count: number
}

interface Exam {
  id: number
  title: string
  slug: string
  description: string
  time_limit_minutes: number
  subject_count?: number
  subjects?: Subject[]
  attempt_count?: number
}

interface ExamAttempt {
  id: number
  exam_title: string
  subject_name: string | null
  test_name?: string
  num_questions: number
  score: number | null
  started_at: string
  submitted_at: string | null
  time_taken_seconds: number | null
  correct_answers?: number
  total_questions?: number
  is_submitted: boolean
}

interface TrialInfo {
  trial_attempts_used: number
  trial_attempts_remaining: number
  trial_available: boolean
  trial_attempts_limit?: number
  trial_questions_limit?: number
}

export default function CBTPage() {
  const [currentView, setCurrentView] = useState<View>('hub')
  
  const [exams, setExams] = useState<Exam[]>([])
  const [popularExams, setPopularExams] = useState<Exam[]>([])
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([])
  const [inProgressAttempts, setInProgressAttempts] = useState<ExamAttempt[]>([])
  const [recentlyViewedExams, setRecentlyViewedExams] = useState<Exam[]>([])
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([])
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [allowedSubjectIds, setAllowedSubjectIds] = useState<number[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [resumeData, setResumeData] = useState<any>(null)

  const categoriesSectionRef = useRef<HTMLElement>(null)

  const handleScrollToCategories = () => {
    if (categoriesSectionRef.current) {
      categoriesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleHeroTakeTest = () => {
    if (exams.length > 0) {
      const primaryExam = exams.find(e => e.title.toLowerCase().includes('jamb')) || exams[0]
      setSelectedExam(primaryExam)
      setSelectedSubjects([])
      setTrialInfo(null)
      setAllowedSubjectIds([])
      setCurrentView('exam-flow')
    } else {
      handleScrollToCategories()
    }
  }

  const fetchHubData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const headers = { Authorization: `Bearer ${token}` }

      const [examsRes, popularRes, recentRes, inProgressRes] = await Promise.all([
        axios.get(`${API_BASE}/cbt/exams/`, { headers }),
        axios.get(`${API_BASE}/cbt/exams/popular/`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/cbt/attempt-list/?page=1`, { headers }).catch(() => ({ data: { results: [] } })),
        axios.get(`${API_BASE}/cbt/attempts/?status=in_progress`, { headers }).catch(() => ({ data: [] }))
      ])

      const extractList = (data: any): any[] => {
        if (Array.isArray(data)) return data
        if (data && Array.isArray(data.results)) return data.results
        return []
      }

      const fetchedExams = extractList(examsRes.data)
      const fetchedPopular = extractList(popularRes.data)
      const fetchedRecent = extractList(recentRes.data)
      const fetchedInProgress = extractList(inProgressRes.data)

      setExams(fetchedExams)
      setPopularExams(fetchedPopular)
      setRecentAttempts(fetchedRecent.slice(0, 5))
      setInProgressAttempts(fetchedInProgress)

      // Load recently viewed from localStorage
      const recentIds = JSON.parse(localStorage.getItem('cbt_recently_viewed') || '[]') as number[]
      const recentExamsMap = new Map<number, Exam>(fetchedExams.map((e: Exam) => [e.id, e]))
      const validRecentExams = recentIds
        .map(id => recentExamsMap.get(id))
        .filter((e): e is Exam => e !== undefined)
      setRecentlyViewedExams(validRecentExams)

    } catch (err) {
      console.error('Failed to load CBT hub data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleResumeAttempt = useCallback(async (attemptId: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/cbt/attempts/${attemptId}/resume/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setResumeData(res.data)
      setCurrentView('exam-interface')
    } catch (err: any) {
      console.error('Failed to resume exam:', err)
      const errorMsg = err.response?.data?.error || 'This exam has already been completed or cannot be resumed.'
      showToast(errorMsg, 'error')
      // Clean up URL if it had ?resume=...
      window.history.replaceState({}, document.title, '/student/cbt')
      fetchHubData()
    } finally {
      setLoading(false)
    }
  }, [fetchHubData])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    if (currentView === 'hub') {
      fetchHubData()
    }
  }, [currentView, fetchHubData])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const resumeId = params.get('resume')
    if (resumeId) {
      const id = parseInt(resumeId)
      if (!isNaN(id)) {
        handleResumeAttempt(id)
      }
    }
  }, [handleResumeAttempt])

  const filteredExams = useMemo(() => {
    if (!Array.isArray(exams)) return []
    if (!debouncedSearch) return exams
    return exams.filter(e => 
      e.title.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  }, [exams, debouncedSearch])

  const handleSelectExam = useCallback((exam: Exam) => {
    setSelectedExam(exam)
    setCurrentView('category')
    
    const recentIds = JSON.parse(localStorage.getItem('cbt_recently_viewed') || '[]') as number[]
    const newIds = [exam.id, ...recentIds.filter(id => id !== exam.id)].slice(0, 5)
    localStorage.setItem('cbt_recently_viewed', JSON.stringify(newIds))
    
    setRecentlyViewedExams(prev => {
      const updated = [exam, ...prev.filter(e => e.id !== exam.id)].slice(0, 5)
      return updated
    })
  }, [])

  const handleStartExamFromCategory = useCallback((
    exam: Exam, 
    subjects: Subject[], 
    trial: TrialInfo | null, 
    allowedIds: number[]
  ) => {
    setSelectedExam(exam)
    setSelectedSubjects(subjects)
    setTrialInfo(trial)
    setAllowedSubjectIds(allowedIds)
    setCurrentView('exam-flow')
  }, [])

  if (currentView === 'exam-interface' && resumeData) {
    return (
      <ExamInterface
        examAttemptId={resumeData.exam_attempt_id}
        testName={resumeData.test_name}
        subjectConfigs={resumeData.subject_configs || []}
        timeLimitMinutes={resumeData.time_limit_minutes}
        initialTimeRemainingSeconds={resumeData.time_remaining_seconds}
        onSubmitComplete={() => {
          window.location.href = `/performance/${resumeData.exam_attempt_id}`
        }}
        isTrialAttempt={resumeData.is_trial_attempt}
      />
    )
  }

  if (currentView === 'exam-flow' && selectedExam) {
    return (
      <CBTExamFlow 
        onClose={() => setCurrentView('category')}
        onComplete={() => {
          fetchHubData()
          setCurrentView('hub')
        }}
        initialExam={selectedExam}
        initialSelectedSubjects={selectedSubjects}
        initialTrialInfo={trialInfo}
        initialAllowedSubjectIds={allowedSubjectIds}
      />
    )
  }

  if (currentView === 'category' && selectedExam) {
    return (
      <ExamCategoryPage 
        exam={selectedExam} 
        onBack={() => setCurrentView('hub')} 
        onStartExam={handleStartExamFromCategory} 
      />
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* 1. Hero Header */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3">
              <FileText className="w-8 h-8 text-yellow-600" />
              CBT & Exams
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mt-2">
              Practice, test yourself and track your progress
            </p>
          </div>

          <button
            onClick={handleHeroTakeTest}
            className="self-start sm:self-auto px-6 py-2.5 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            Take CBT Test
          </button>
        </div>
        
        <div className="mt-6 relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors shadow-sm"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* 2. Continue Practising */}
          {inProgressAttempts.length > 0 && !debouncedSearch && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Continue Practising
                </h3>
                <a href="/student/progress" className="text-sm font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 flex items-center transition-colors">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {inProgressAttempts.slice(0, 3).map((attempt, index) => (
                  <ContinuePractisingCard 
                    key={attempt.id} 
                    attempt={attempt} 
                    colorIndex={index}
                    onContinue={() => handleResumeAttempt(attempt.id)} 
                  />
                ))}
              </div>
            </section>
          )}

          {/* 3. Exam Categories */}
          <section ref={categoriesSectionRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Exam Categories
            </h3>
            {filteredExams.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-gray-200 dark:border-slate-700">
                <p className="text-gray-500 dark:text-slate-400">No exams found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredExams.map((exam, index) => (
                  <div 
                    key={exam.id} 
                    onClick={() => handleSelectExam(exam)} 
                    className="cursor-pointer h-full"
                  >
                    <ExamFolderCard exam={exam} colorIndex={index} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Recently Viewed */}
          {recentlyViewedExams.length > 0 && !debouncedSearch && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Recently Viewed Categories
              </h3>
              <div className="flex overflow-x-auto pb-4 gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
                {recentlyViewedExams.map(exam => (
                  <div 
                    key={exam.id} 
                    onClick={() => handleSelectExam(exam)}
                    className="min-w-[220px] max-w-[280px] flex-shrink-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:border-yellow-500 hover:shadow-md transition-all snap-start"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 truncate" title={exam.title}>
                      {exam.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                      {exam.subject_count || 0} {exam.subject_count === 1 ? 'Subject' : 'Subjects'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Recently Attempted */}
          {recentAttempts.length > 0 && !debouncedSearch && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Recent Attempts
                </h3>
                <a href="/student/progress" className="text-sm font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 flex items-center transition-colors">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentAttempts.map((attempt, index) => (
                  <ContinuePractisingCard 
                    key={attempt.id} 
                    attempt={attempt} 
                    colorIndex={index}
                    onContinue={() => window.location.href = `/performance/${attempt.id}`} 
                  />
                ))}
              </div>
            </section>
          )}

          {/* 6. Popular Exams */}
          {popularExams.length > 0 && !debouncedSearch && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  Popular Exams
                </h3>
              </div>
              <div className="flex overflow-x-auto pb-4 gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
                {popularExams.map(exam => (
                  <div 
                    key={exam.id} 
                    className="min-w-[300px] w-[300px] flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col snap-start transition-shadow hover:shadow-lg"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-red-500 to-yellow-500 w-full" />
                    <div className="p-5 flex flex-col flex-grow">
                      <h4 className="font-bold text-gray-900 dark:text-slate-100 text-lg mb-2 truncate" title={exam.title}>
                        {exam.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2 mb-6 flex-grow">
                        {exam.description || `Practice exam questions for ${exam.title}`}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-slate-700">
                        <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {exam.attempt_count || 0} attempts
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {exam.subject_count || 0} subjects
                          </div>
                        </div>
                        <button 
                          onClick={() => handleSelectExam(exam)}
                          className="px-4 py-2 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-slate-100 text-sm font-semibold rounded-lg transition-colors border border-gray-200 dark:border-slate-600"
                        >
                          Explore
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
        </div>
      )}
    </div>
  )
}
