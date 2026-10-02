import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, Clock, FileText, Globe2, Play, Search, TrendingUp } from 'lucide-react'
import CBTExamFlow from '../components/cbt/CBTExamFlow'
import ExamCategoryPage from '../components/cbt/ExamCategoryPage'
import ExamFolderCard from '../components/cbt/ExamFolderCard'
import ContinuePractisingCard from '../components/cbt/ContinuePractisingCard'
import ExamInterface from '../components/cbt/ExamInterface-MultiSubject'
import showToast from '../utils/toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
type View = 'hub' | 'exam-flow' | 'exam-interface'

interface Subject { id: number; name: string; description: string; question_count: number }
interface Exam {
  id: number; title: string; slug: string; description: string; time_limit_minutes: number
  subject_count?: number; question_count?: number; subjects?: Subject[]; attempt_count?: number
  year?: string; difficulty?: string; exam_type?: string; institution?: string; provider?: string
}
interface Folder { id: number; name: string; slug: string; description: string; country?: number; children: Folder[]; exams: Exam[]; parent?: number | null }
interface Country { id: number; name: string; code: string; slug: string; folders: Folder[]; exam_count?: number }
interface ExamAttempt {
  id: number; exam_title: string; subject_name: string | null; test_name?: string; num_questions: number
  score: number | null; started_at: string; submitted_at: string | null; time_taken_seconds: number | null
  correct_answers?: number; total_questions?: number; is_submitted: boolean
}
interface TrialInfo { trial_attempts_used: number; trial_attempts_remaining: number; trial_available: boolean; trial_attempts_limit?: number; trial_questions_limit?: number }

function flattenFolders(folders: Folder[]): Folder[] { return folders.flatMap(folder => [folder, ...flattenFolders(folder.children || [])]) }
function flattenExams(countries: Country[]): Exam[] { return countries.flatMap(country => flattenFolders(country.folders || []).flatMap(folder => folder.exams || [])) }
function routeId(value?: string): number | null { const id = Number(value?.split('-')[0]); return Number.isFinite(id) ? id : null }

export default function CBTPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('hub')
  const [countries, setCountries] = useState<Country[]>([])
  const [fallbackExams, setFallbackExams] = useState<Exam[]>([])
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([])
  const [inProgressAttempts, setInProgressAttempts] = useState<ExamAttempt[]>([])
  const [recentlyViewedExams, setRecentlyViewedExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([])
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [allowedSubjectIds, setAllowedSubjectIds] = useState<number[]>([])
  const [resumeData, setResumeData] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const categoriesSectionRef = useRef<HTMLElement>(null)

  const allExams = useMemo(() => {
    const nested = flattenExams(countries)
    return nested.length ? nested : fallbackExams
  }, [countries, fallbackExams])
  const allFolders = useMemo(() => countries.flatMap(country => flattenFolders(country.folders || [])), [countries])

  const loadHubData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const headers = { Authorization: `Bearer ${token}` }
      const [libraryRes, examsRes, recentRes, inProgressRes] = await Promise.all([
        axios.get(`${API_BASE}/cbt/library/`, { headers }).catch(() => ({ data: { results: [] } })),
        axios.get(`${API_BASE}/cbt/exams/`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/cbt/attempt-list/?page=1`, { headers }).catch(() => ({ data: { results: [] } })),
        axios.get(`${API_BASE}/cbt/attempts/?status=in_progress`, { headers }).catch(() => ({ data: [] }))
      ])
      const library = Array.isArray(libraryRes.data?.results) ? libraryRes.data.results : []
      const rawExams = Array.isArray(examsRes.data) ? examsRes.data : (examsRes.data?.results || [])
      setCountries(library)
      setFallbackExams(library.length ? [] : rawExams)
      const recent = Array.isArray(recentRes.data) ? recentRes.data : (recentRes.data?.results || [])
      setRecentAttempts(recent.slice(0, 5))
      setInProgressAttempts(Array.isArray(inProgressRes.data) ? inProgressRes.data : (inProgressRes.data?.results || []))
      const recentIds = JSON.parse(localStorage.getItem('cbt_recently_viewed') || '[]') as number[]
      const source = library.length ? flattenExams(library) : rawExams
      const map = new Map<number, Exam>(source.map((exam: Exam) => [exam.id, exam]))
      setRecentlyViewedExams(recentIds.map(id => map.get(id)).filter(Boolean) as Exam[])
    } catch (error) { console.error('Failed to load CBT library', error) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadHubData() }, [loadHubData])

  const examRouteValue = location.pathname.match(/\/student\/cbt\/exam\/([^/]+)/)?.[1]
  const folderRouteValue = location.pathname.match(/\/student\/cbt\/folder\/([^/]+)/)?.[1]
  const countryRouteValue = location.pathname.match(/\/student\/cbt\/country\/([^/]+)/)?.[1]
  const routeExam = allExams.find(exam => exam.id === routeId(examRouteValue)) || null
  const routeFolder = allFolders.find(folder => folder.id === routeId(folderRouteValue)) || null
  const routeCountry = countries.find(country => country.id === routeId(countryRouteValue)) || null

  useEffect(() => {
    if (examRouteValue && !routeExam) {
      const id = routeId(examRouteValue)
      if (id) axios.get(`${API_BASE}/cbt/exams/${id}/`).then(res => setSelectedExam(res.data)).catch(() => navigate('/student/cbt'))
    } else if (routeExam) setSelectedExam(routeExam)
  }, [examRouteValue, routeExam, navigate])

  const handleResumeAttempt = useCallback(async (attemptId: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/cbt/attempts/${attemptId}/resume/`, { headers: { Authorization: `Bearer ${token}` } })
      setResumeData(res.data); setView('exam-interface')
    } catch (err: any) { showToast(err.response?.data?.error || 'This exam cannot be resumed.', 'error'); loadHubData() }
    finally { setLoading(false) }
  }, [loadHubData])

  const rememberExam = (exam: Exam) => {
    const ids = JSON.parse(localStorage.getItem('cbt_recently_viewed') || '[]') as number[]
    localStorage.setItem('cbt_recently_viewed', JSON.stringify([exam.id, ...ids.filter(id => id !== exam.id)].slice(0, 5)))
    setRecentlyViewedExams(prev => [exam, ...prev.filter(item => item.id !== exam.id)].slice(0, 5))
  }
  const openExam = (exam: Exam) => { rememberExam(exam); setSelectedExam(exam); setView('hub'); navigate(`/student/cbt/exam/${exam.id}-${exam.slug}`) }
  const startExam = (exam: Exam, subjects: Subject[], trial: TrialInfo | null, allowedIds: number[]) => { setSelectedExam(exam); setSelectedSubjects(subjects); setTrialInfo(trial); setAllowedSubjectIds(allowedIds); setView('exam-flow') }

  if (view === 'exam-interface' && resumeData) return <ExamInterface examAttemptId={resumeData.exam_attempt_id} testName={resumeData.test_name} subjectConfigs={resumeData.subject_configs || []} timeLimitMinutes={resumeData.time_limit_minutes} initialTimeRemainingSeconds={resumeData.time_remaining_seconds} onSubmitComplete={() => { window.location.href = `/performance/${resumeData.exam_attempt_id}` }} isTrialAttempt={resumeData.is_trial_attempt} />
  if (view === 'exam-flow' && selectedExam) return <CBTExamFlow onClose={() => setView('hub')} onComplete={() => { setView('hub'); navigate('/student/cbt'); loadHubData() }} initialExam={selectedExam} initialSelectedSubjects={selectedSubjects} initialTrialInfo={trialInfo} initialAllowedSubjectIds={allowedSubjectIds} />
  if (examRouteValue && selectedExam) return <div className="min-h-screen p-6 bg-gray-50 dark:bg-slate-900"><ExamCategoryPage exam={selectedExam} onBack={() => navigate('/student/cbt')} onStartExam={startExam} /></div>

  const search = searchQuery.trim().toLowerCase()
  const matchingExams = allExams.filter(exam => [exam.title, exam.description, exam.institution, exam.provider, exam.exam_type, exam.year, exam.difficulty, ...(exam.subjects || []).map(subject => subject.name)].some(value => String(value || '').toLowerCase().includes(search)))
  const matchingFolders = allFolders.filter(folder => `${folder.name} ${folder.description}`.toLowerCase().includes(search))
  const roots = routeCountry ? routeCountry.folders.filter(folder => !folder.parent) : countries.flatMap(country => country.folders.filter(folder => !folder.parent))
  const childFolders = routeFolder?.children || roots
  const folderExams = routeFolder?.exams || []
  const folderPath = (folder: Folder) => `/student/cbt/folder/${folder.id}-${folder.slug}`
  const countryPath = (country: Country) => `/student/cbt/country/${country.id}-${country.slug}`
  const renderExamCard = (exam: Exam) => <button key={exam.id} onClick={() => openExam(exam)} className="text-left bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 hover:border-yellow-500 hover:shadow-md transition-all"><div className="flex items-start justify-between gap-3"><h4 className="font-bold text-gray-900 dark:text-slate-100">{exam.title}</h4><ChevronRight className="w-5 h-5 text-gray-400 shrink-0" /></div><p className="mt-2 text-sm text-gray-600 dark:text-slate-400 line-clamp-2">{exam.description || `Practice ${exam.title}`}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-slate-400"><span>{exam.time_limit_minutes} mins</span><span>{exam.question_count || 0} questions</span>{exam.year && <span>{exam.year}</span>}{exam.difficulty && <span>{exam.difficulty}</span>}</div></button>

  return <div className="min-h-screen p-6 bg-gray-50 dark:bg-slate-900 transition-colors">
    <div className="mb-8 flex flex-col gap-5"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3"><FileText className="w-8 h-8 text-yellow-600" /> CBT & Exams</h2><p className="text-gray-600 dark:text-slate-400 mt-2">Practice, test yourself and track your progress</p></div><button onClick={() => categoriesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="self-start px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"><Play className="w-4 h-4 fill-current" /> Take CBT Test</button></div><div className="relative max-w-2xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search exams, subjects, institutions or exam names..." className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" /></div></div>
    {loading ? <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600" /></div> : <div className="space-y-10">
      {inProgressAttempts.length > 0 && !search && <section><h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-600" /> Continue Practising</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{inProgressAttempts.slice(0, 3).map((attempt, index) => <ContinuePractisingCard key={attempt.id} attempt={attempt} colorIndex={index} onContinue={() => handleResumeAttempt(attempt.id)} />)}</div></section>}
      <section ref={categoriesSectionRef} className="scroll-mt-6"><div className="flex items-center gap-2 mb-5"><BookOpen className="w-5 h-5 text-blue-500" /><h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{routeFolder ? routeFolder.name : routeCountry ? `${routeCountry.name} Exam Library` : search ? 'Search Results' : 'Exam Library'}</h3></div>{(routeFolder || routeCountry) && <button onClick={() => navigate(routeFolder?.parent ? `/student/cbt/folder/${routeFolder.parent}` : '/student/cbt')} className="mb-5 inline-flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700"><ChevronLeft className="w-4 h-4" /> Back to library</button>}
        {search ? <div className="space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{matchingFolders.map(folder => <div key={`folder-${folder.id}`} onClick={() => navigate(folderPath(folder))}><ExamFolderCard title={folder.name} description={folder.description} count={folder.exams?.length || 0} countLabel="Exam" colorIndex={folder.id} /></div>)}{matchingExams.map(renderExamCard)}</div>{matchingFolders.length === 0 && matchingExams.length === 0 && <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-gray-200 dark:border-slate-700 text-gray-500">No exams found matching “{searchQuery}”.</div>}</div> : <><>{!routeFolder && !routeCountry && countries.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">{countries.map(country => <button key={country.id} onClick={() => navigate(countryPath(country))} className="text-left bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:border-yellow-500 hover:shadow-md transition-all"><div className="flex items-center gap-3"><Globe2 className="w-7 h-7 text-yellow-600" /><div><h4 className="font-bold text-gray-900 dark:text-slate-100">{country.name}</h4><p className="text-xs text-gray-500 dark:text-slate-400">{country.exam_count || flattenFolders(country.folders || []).reduce((sum, folder) => sum + folder.exams.length, 0)} exams</p></div></div></button>)}</div>}</><>{childFolders.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{childFolders.map(folder => <div key={folder.id} onClick={() => navigate(folderPath(folder))}><ExamFolderCard title={folder.name} description={folder.description} count={folder.exams.length + folder.children.length} countLabel={folder.children.length ? 'Item' : 'Exam'} colorIndex={folder.id} /></div>)}</div>}{folderExams.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{folderExams.map(renderExamCard)}</div>}{!countries.length && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{fallbackExams.map((exam, index) => <div key={exam.id} onClick={() => openExam(exam)}><ExamFolderCard exam={exam} colorIndex={index} /></div>)}</div>}</></>}</section>
      {recentlyViewedExams.length > 0 && !search && !routeFolder && !routeCountry && <section><h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" /> Recently Viewed</h3><div className="flex overflow-x-auto gap-4 pb-2">{recentlyViewedExams.map(exam => <button key={exam.id} onClick={() => openExam(exam)} className="min-w-[220px] text-left bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4"><h4 className="font-semibold text-gray-900 dark:text-slate-100 truncate">{exam.title}</h4><p className="text-sm text-gray-500 mt-1">{exam.subject_count || 0} subjects</p></button>)}</div></section>}
      {recentAttempts.length > 0 && !search && <section><h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" /> Recent Attempts</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{recentAttempts.map((attempt, index) => <ContinuePractisingCard key={attempt.id} attempt={attempt} colorIndex={index} onContinue={() => { window.location.href = `/performance/${attempt.id}` }} />)}</div></section>}
    </div>}
  </div>
}
