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
interface SubjectEntry { id: number; subject: Subject; exam: Exam }
interface Folder { id: number; name: string; slug: string; description: string; country?: number; country_tags?: number[]; country_tag_details?: Array<{ id: number; name: string }>; children: Folder[]; exams: Exam[]; subject_entries?: SubjectEntry[]; parent?: number | null }
interface Country { id: number; name: string; code: string; slug: string; folders: Folder[]; exam_count?: number }
interface ExamAttempt {
  id: number; exam_title: string; subject_name: string | null; test_name?: string; num_questions: number
  score: number | null; started_at: string; submitted_at: string | null; time_taken_seconds: number | null
  correct_answers?: number; total_questions?: number; is_submitted: boolean
}
interface TrialInfo { trial_attempts_used: number; trial_attempts_remaining: number; trial_available: boolean; trial_attempts_limit?: number; trial_questions_limit?: number }

function flattenFolders(folders: Folder[]): Folder[] { return folders.flatMap(folder => [folder, ...flattenFolders(folder.children || [])]) }
function flattenExams(countries: Country[]): Exam[] { return Array.from(new Map(countries.flatMap(country => flattenFolders(country.folders || []).flatMap(folder => folder.exams || [])).map(exam => [exam.id, exam])).values()) }
function routeId(value?: string): number | null { const id = Number(value?.split('-')[0]); return Number.isFinite(id) ? id : null }

export default function CBTPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('hub')
  const [countries, setCountries] = useState<Country[]>([])
  const [fallbackExams, setFallbackExams] = useState<Exam[]>([])
  const [unlockedExamIds, setUnlockedExamIds] = useState<Set<number>>(new Set())
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([])
  const [inProgressAttempts, setInProgressAttempts] = useState<ExamAttempt[]>([])
  const [recentlyViewedExams, setRecentlyViewedExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([])
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [allowedSubjectIds, setAllowedSubjectIds] = useState<number[]>([])
  const [resumeData, setResumeData] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [examTypeFilter, setExamTypeFilter] = useState('')
  const [examFilter, setExamFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [examPage, setExamPage] = useState(1)
  const categoriesSectionRef = useRef<HTMLElement>(null)

  const allExams = useMemo(() => {
    const nested = flattenExams(countries)
    return Array.from(new Map([...fallbackExams, ...nested].map(exam => [exam.id, exam])).values())
  }, [countries, fallbackExams])
  const sortedAllExams = useMemo(() => [...allExams].sort((a, b) => {
    const unlockedDelta = Number(unlockedExamIds.has(b.id)) - Number(unlockedExamIds.has(a.id))
    return unlockedDelta || String(a.title || '').localeCompare(String(b.title || ''))
  }), [allExams, unlockedExamIds])
  const allFolders = useMemo(() => countries.flatMap(country => flattenFolders(country.folders || [])), [countries])

  const loadHubData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const headers = { Authorization: `Bearer ${token}` }
      const loadAllPublishedExams = async () => {
        const results: Exam[] = []
        let url = `${API_BASE}/cbt/exams/?page_size=100`
        for (let page = 0; page < 25 && url; page += 1) {
          const response = await axios.get(url, { headers })
          if (Array.isArray(response.data)) return response.data
          results.push(...(response.data?.results || []))
          url = response.data?.next || ''
        }
        return results
      }
      const [libraryRes, examsRes, recentRes, inProgressRes] = await Promise.all([
        axios.get(`${API_BASE}/cbt/library/`, { headers }).catch(() => ({ data: { results: [] } })),
        loadAllPublishedExams().then(data => ({ data })).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/cbt/attempt-list/?page=1`, { headers }).catch(() => ({ data: { results: [] } })),
        axios.get(`${API_BASE}/cbt/attempts/?status=in_progress`, { headers }).catch(() => ({ data: [] }))
      ])
      const libraryFolders = Array.isArray(libraryRes.data?.folders)
        ? libraryRes.data.folders
        : (Array.isArray(libraryRes.data?.results) ? libraryRes.data.results : [])
      const tags = Array.isArray(libraryRes.data?.countries) ? libraryRes.data.countries : []
      const library = tags.map((country: Omit<Country, 'folders'>) => ({
        ...country,
        folders: libraryFolders
          .filter((folder: Folder) => (folder.country_tags || []).includes(country.id))
          .map((folder: Folder) => ({ ...folder, country: country.id })),
      })) as Country[]
      const rawExams = Array.isArray(examsRes.data) ? examsRes.data : (examsRes.data?.results || [])
      setCountries(library)
      setFallbackExams(rawExams)
      if (token && rawExams.length) {
        const statuses = await Promise.all(rawExams.map((exam: Exam) =>
          axios.get(`${API_BASE}/payments/activation-status/?exam=${exam.id}`, { headers })
            .then(response => response.data?.unlocked ? exam.id : null)
            .catch(() => null)
        ))
        setUnlockedExamIds(new Set(statuses.filter((id): id is number => typeof id === 'number')))
      } else {
        setUnlockedExamIds(new Set())
      }
      const recent = Array.isArray(recentRes.data) ? recentRes.data : (recentRes.data?.results || [])
      setRecentAttempts(recent.slice(0, 5))
      setInProgressAttempts(Array.isArray(inProgressRes.data) ? inProgressRes.data : (inProgressRes.data?.results || []))
      const recentIds = JSON.parse(localStorage.getItem('cbt_recently_viewed') || '[]') as number[]
      const source = Array.from(new Map([...rawExams, ...flattenExams(library)].map((exam: Exam) => [exam.id, exam])).values())
      const map = new Map<number, Exam>(source.map((exam: Exam) => [exam.id, exam]))
      setRecentlyViewedExams(recentIds.map(id => map.get(id)).filter(Boolean) as Exam[])
    } catch (error) { console.error('Failed to load CBT library', error) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadHubData() }, [loadHubData])
  useEffect(() => { setExamPage(1) }, [searchQuery, yearFilter, examTypeFilter, examFilter, categoryFilter])

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
  const examMatches = (exam: Exam) => [exam.title, exam.description, exam.institution, exam.provider, exam.exam_type, exam.year, exam.difficulty, ...(exam.subjects || []).map(subject => subject.name)].some(value => String(value || '').toLowerCase().includes(search)) && (!yearFilter || exam.year === yearFilter) && (!examTypeFilter || exam.exam_type === examTypeFilter) && (!examFilter || String(exam.id) === examFilter)
  const folderMatchesCategory = (folder: Folder) => !categoryFilter || String(folder.id) === categoryFilter || String(folder.parent) === categoryFilter
  const matchingExams = sortedAllExams.filter(examMatches)
  const matchingFolders = allFolders.filter(folder => folderMatchesCategory(folder) && (`${folder.name} ${folder.description} ${(folder.country_tag_details || []).map(tag => tag.name).join(' ')}`.toLowerCase().includes(search) || folder.exams.some(examMatches) || (folder.subject_entries || []).some(entry => examMatches(entry.exam) || entry.subject.name.toLowerCase().includes(search))))
  const roots = Array.from(new Map((routeCountry ? routeCountry.folders : countries.flatMap(country => country.folders)).filter(folder => !folder.parent).map(folder => [folder.id, folder])).values())
  const childFolders = routeFolder?.children || roots
  const folderExams = routeFolder?.exams || []
  const folderSubjects = routeFolder?.subject_entries || []
  const folderPath = (folder: Folder) => `/student/cbt/folder/${folder.id}-${folder.slug}`

  // Options for dropdown filters
  const currentYear = new Date().getFullYear()
  const yearsFromData = Array.from(new Set(allExams.map(exam => exam.year).filter(Boolean))) as string[]
  const standardYears = Array.from({ length: 15 }, (_, i) => String(currentYear - i))
  const years = Array.from(new Set([...yearsFromData, ...standardYears])).sort((a, b) => Number(b) - Number(a))

  const examTypes = Array.from(new Set(allExams.map(exam => exam.exam_type).filter(Boolean))) as string[]
  const examOptions = Array.from(new Map(allExams.map(exam => [exam.id, exam])).values()).sort((a, b) => String(a.title).localeCompare(String(b.title)))
  const categoryOptions = Array.from(new Map(allFolders.map(f => [f.id, f])).values()).sort((a, b) => String(a.name).localeCompare(String(b.name)))

  const isFiltered = Boolean(search || yearFilter || examTypeFilter || examFilter || categoryFilter)
  const examPageSize = 12
  const paginatedAllExams = sortedAllExams.slice((examPage - 1) * examPageSize, examPage * examPageSize)
  const examTotalPages = Math.max(1, Math.ceil(sortedAllExams.length / examPageSize))
  const startLinkedSubject = (entry: SubjectEntry) => { rememberExam(entry.exam); startExam(entry.exam, [entry.subject], null, []) }
  const renderExamCard = (exam: Exam) => <button key={exam.id} onClick={() => openExam(exam)} className="text-left bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 hover:border-yellow-500 hover:shadow-md transition-all"><div className="flex items-start justify-between gap-3"><h4 className="font-bold text-gray-900 dark:text-slate-100">{exam.title}</h4><ChevronRight className="w-5 h-5 text-gray-400 shrink-0" /></div><p className="mt-2 text-sm text-gray-600 dark:text-slate-400 line-clamp-2">{exam.description || `Practice ${exam.title}`}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-slate-400"><span>{exam.time_limit_minutes} mins</span><span>{exam.question_count || 0} questions</span>{exam.year && <span>{exam.year}</span>}{exam.difficulty && <span>{exam.difficulty}</span>}{unlockedExamIds.has(exam.id) && <span className="font-semibold text-emerald-600 dark:text-emerald-400">Unlocked</span>}</div></button>

  return <div className="min-h-screen p-6 bg-gray-50 dark:bg-slate-900 transition-colors">
    <div className="mb-8 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-3"><FileText className="w-8 h-8 text-yellow-600" /> CBT & Exams</h2>
          <p className="text-gray-600 dark:text-slate-400 mt-2">Discover folders, subjects, and exams, then practise at your pace.</p>
        </div>
        <button onClick={() => categoriesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="self-start px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"><Play className="w-4 h-4 fill-current" /> Explore Library</button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search folders, countries, exams, subjects, institutions or years..." className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select value={yearFilter} onChange={event => setYearFilter(event.target.value)} aria-label="Filter by year" className="border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500">
            <option value="">All years</option>
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>

          <select value={examFilter} onChange={event => setExamFilter(event.target.value)} aria-label="Filter by exam" className="border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 truncate">
            <option value="">All exams</option>
            {examOptions.map(exam => <option key={exam.id} value={String(exam.id)}>{exam.title}</option>)}
          </select>

          <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} aria-label="Filter by category" className="border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 truncate">
            <option value="">All categories</option>
            {categoryOptions.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
          </select>

          <select value={examTypeFilter} onChange={event => setExamTypeFilter(event.target.value)} aria-label="Filter by exam type" className="border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 truncate">
            <option value="">All exam types</option>
            {examTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>
    </div>
    {loading ? <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600" /></div> : <div className="space-y-10">
      {inProgressAttempts.length > 0 && !isFiltered && <section><h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-600" /> Continue Practising</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{inProgressAttempts.slice(0, 3).map((attempt, index) => <ContinuePractisingCard key={attempt.id} attempt={attempt} colorIndex={index} onContinue={() => handleResumeAttempt(attempt.id)} />)}</div></section>}
      <section ref={categoriesSectionRef} className="scroll-mt-6">
        <div className="flex items-center gap-2 mb-5"><BookOpen className="w-5 h-5 text-blue-500" /><h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{routeFolder ? routeFolder.name : routeCountry ? `${routeCountry.name} Library` : isFiltered ? 'Library Results' : 'Exam Library'}</h3></div>
        {(routeFolder || routeCountry) && <button onClick={() => navigate(routeFolder?.parent ? `/student/cbt/folder/${routeFolder.parent}` : '/student/cbt')} className="mb-5 inline-flex items-center gap-1 text-sm text-yellow-600 hover:text-yellow-700"><ChevronLeft className="w-4 h-4" /> Back to library</button>}
        {isFiltered ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {matchingFolders.map(folder => <div key={`folder-${folder.id}`} onClick={() => navigate(folderPath(folder))}><ExamFolderCard title={folder.name} description={folder.description} count={(folder.exams?.length || 0) + (folder.subject_entries?.length || 0)} countLabel="Item" colorIndex={folder.id} /></div>)}
              {matchingExams.map(renderExamCard)}
            </div>
            {matchingFolders.length === 0 && matchingExams.length === 0 && <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-gray-200 dark:border-slate-700 text-gray-500">No library content matches these filters.</div>}
          </div>
        ) : (
          <>
            {childFolders.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{childFolders.map(folder => <div key={folder.id} onClick={() => navigate(folderPath(folder))}><ExamFolderCard title={folder.name} description={folder.description} count={folder.exams.length + (folder.subject_entries?.length || 0) + folder.children.length} countLabel={folder.children.length ? 'Item' : 'Exam'} colorIndex={folder.id} /></div>)}</div>}
            {folderExams.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{folderExams.map(renderExamCard)}</div>}
            {folderSubjects.length > 0 && <div className="mt-8"><h4 className="mb-3 font-semibold text-gray-900 dark:text-slate-100">Subjects in this folder</h4><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{folderSubjects.map(entry => <button key={entry.id} onClick={() => startLinkedSubject(entry)} className="text-left bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 hover:border-yellow-500 hover:shadow-md transition-all"><p className="text-xs text-gray-500">{entry.exam.title}</p><h4 className="mt-1 font-bold text-gray-900 dark:text-slate-100">{entry.subject.name}</h4><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{entry.subject.question_count || 0} questions</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-yellow-700"><Play className="w-4 h-4" /> Practise subject</span></button>)}</div></div>}
          </>
        )}
      </section>
      {!search && !routeFolder && !routeCountry && sortedAllExams.length > 0 && <section><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2"><FileText className="w-5 h-5 text-yellow-600" /> All Exams</h3><p className="text-sm text-gray-500 dark:text-slate-400">Unlocked exams appear first.</p></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{paginatedAllExams.map(renderExamCard)}</div>{examTotalPages > 1 && <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"><span className="text-gray-600 dark:text-slate-300">Page {examPage} of {examTotalPages}</span><div className="flex gap-2"><button onClick={() => setExamPage(page => Math.max(1, page - 1))} disabled={examPage === 1} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button><button onClick={() => setExamPage(page => Math.min(examTotalPages, page + 1))} disabled={examPage === examTotalPages} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button></div></div>}</section>}
      {recentlyViewedExams.length > 0 && !search && !routeFolder && !routeCountry && <section><h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" /> Recently Viewed</h3><div className="flex overflow-x-auto gap-4 pb-2">{recentlyViewedExams.map(exam => <button key={exam.id} onClick={() => openExam(exam)} className="min-w-[220px] text-left bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4"><h4 className="font-semibold text-gray-900 dark:text-slate-100 truncate">{exam.title}</h4><p className="text-sm text-gray-500 mt-1">{exam.subject_count || 0} subjects</p></button>)}</div></section>}
      {recentAttempts.length > 0 && !search && <section><h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" /> Recent Attempts</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{recentAttempts.map((attempt, index) => <ContinuePractisingCard key={attempt.id} attempt={attempt} colorIndex={index} onContinue={() => { window.location.href = `/performance/${attempt.id}` }} />)}</div></section>}
    </div>}
  </div>
}
