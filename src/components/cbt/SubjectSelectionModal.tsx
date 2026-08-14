import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Check, Lock } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Subject {
  id: number
  name: string
  description: string
  question_count: number
}

interface Exam {
  id: number
  title: string
}

interface SubjectSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  exam: Exam | null
  onSelectSubjects: (subjects: Subject[]) => void
  allowedSubjectIds?: number[]
  trialInfo?: {
    trial_attempts_used: number
    trial_attempts_remaining: number
    trial_available: boolean
    trial_attempts_limit?: number
  }
}

export default function SubjectSelectionModal({
  isOpen,
  onClose,
  exam,
  onSelectSubjects,
  allowedSubjectIds,
  trialInfo
}: SubjectSelectionModalProps): JSX.Element | null {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingActivation, setCheckingActivation] = useState(false)

  const isPreLocked = allowedSubjectIds && allowedSubjectIds.length > 0

  useEffect(() => {
    if (isOpen && exam) {
      fetchSubjects()
    }
    // fetch current user role for activation modal bypass logic
    ;(async () => {
      try {
        const token = localStorage.getItem('access')
        if (!token) return
        const res = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } })
        setCurrentUserRole(res.data?.role || null)
      } catch (e) {
        // ignore
      }
    })()
  }, [isOpen, exam])

  useEffect(() => {
    if (isPreLocked && subjects.length > 0) {
      const allowedSubs = subjects.filter(s => allowedSubjectIds?.includes(s.id))
      setSelectedSubjects(allowedSubs)
    }
  }, [subjects, isPreLocked, allowedSubjectIds])

  const fetchSubjects = async (): Promise<void> => {
    if (!exam) return
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get<Subject[]>(`${API_BASE}/cbt/exams/${exam.id}/subjects/`)
      setSubjects(response.data)
      if (!isPreLocked) {
        setSelectedSubjects([])
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load subjects')
      console.error('Error fetching subjects:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSubject = (subject: Subject): void => {
    setSelectedSubjects(prev =>
      prev.some(s => s.id === subject.id)
        ? prev.filter(s => s.id !== subject.id)
        : [...prev, subject]
    )
  }

  const handleProceed = async (): Promise<void> => {
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject')
      return
    }

    if (isPreLocked) {
      onSelectSubjects(selectedSubjects)
      return
    }

    setCheckingActivation(true)
    setError(null)

    try {
      const token = localStorage.getItem('access')
      if (!token) {
        window.location.href = '/login'
        return
      }

      for (const subject of selectedSubjects) {
        const res = await fetch(
          `${API_BASE}/payments/activation-status/?exam=${exam?.id}&subject=${subject.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const data = await res.json()

        // Allow access if: 1) user has unlock, OR 2) user has trial attempts available
        const envDisable = import.meta.env.VITE_DISABLE_ACTIVATION_MODAL === 'true'
        const roleBypass = currentUserRole === 'tutor' || currentUserRole === 'institution'

        const hasAccess = data.unlocked || data.trial_available || envDisable || roleBypass
        
        if (!res.ok || !hasAccess) {
          const qs = new URLSearchParams({
            type: 'interview',
            exam_id: String(exam?.id || ''),
            subject_id: String(subject.id),
            subject_name: subject.name
          })
          window.location.href = `/activate?${qs.toString()}`
          return
        }
      }

      onSelectSubjects(selectedSubjects)
    } catch (err: any) {
      setError(err.message || 'Failed to verify subject access')
      console.error('Error checking activation:', err)
    } finally {
      setCheckingActivation(false)
    }
  }

  const handlePayNow = (): void => {
    if (!exam) return

    try {
      // Analytics event (if analytics present)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (window && (window as any).dataLayer) {
        // @ts-ignore
        (window as any).dataLayer.push({ event: 'cbt_pay_cta_clicked', exam_id: exam.id })
      }
    } catch (e) {
      // ignore analytics errors
    }

    const qs = new URLSearchParams({
      type: 'exam',
      exam_id: String(exam.id),
      exam_title: String(exam.title || '')
    })

    // Return to CBT page after payment — ActivateCheckout decodes this param
    const returnTo = `/student/cbt?exam_id=${encodeURIComponent(String(exam.id))}`
    qs.set('return_to', encodeURIComponent(returnTo))
    // Ask CBT flow to auto-start after activation
    qs.set('start_after_activation', '1')

    window.location.href = `/activate?${qs.toString()}`
  }

  if (!isOpen || !exam) return null

  const displayedSubjects = isPreLocked
    ? subjects.filter(s => allowedSubjectIds?.includes(s.id))
    : subjects

  const totalQuestions = selectedSubjects.reduce((sum, s) => sum + s.question_count, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border dark:border-slate-800">
        
        {/* HEADER (Fixed) */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{exam.title}</h2>
          {isPreLocked ? (
            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Lock size={16} className="text-yellow-600" />
              Select from your unlocked subjects for this exam
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">Select subjects to create your custom exam</p>
          )}
        </div>

        {/* BODY (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-300">
              {error}
            </div>
          )}

          {trialInfo && trialInfo.trial_available && !isPreLocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 dark:bg-amber-950/20 dark:border-amber-900/50">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎁</span>
                <div className="flex-1">
                  <p className="font-bold text-amber-900 dark:text-amber-200">Free Trial</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                    {trialInfo.trial_attempts_remaining === (trialInfo.trial_attempts_limit || 5) 
                      ? `You have ${trialInfo.trial_attempts_limit || 5} free attempts to explore this exam. No payment required!` 
                      : `${trialInfo.trial_attempts_remaining} attempt${trialInfo.trial_attempts_remaining !== 1 ? 's' : ''} remaining of your free trial`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={handlePayNow}
                    aria-label="Skip trial and pay to unlock exam"
                    disabled={loading || checkingActivation}
                    className="ml-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition font-medium"
                  >
                    Skip Trial — Pay Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading subjects...</p>
            </div>
          ) : displayedSubjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No subjects available for this exam</div>
          ) : (
            <div className="space-y-3">
              {displayedSubjects.map((subject) => {
                const isSelected = selectedSubjects.some(s => s.id === subject.id)
                return (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject)}
                    disabled={checkingActivation}
                    className={`w-full p-4 border-2 rounded-lg text-left transition flex items-start gap-4 ${
                      isSelected
                        ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-500'
                        : 'border-gray-200 hover:border-yellow-300 bg-white dark:bg-slate-800 dark:border-slate-700 dark:hover:border-yellow-500'
                    } ${checkingActivation ? 'opacity-50' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-yellow-600 border-yellow-600'
                            : 'border-gray-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected ? (
                          <Check size={18} className="text-white" />
                        ) : null}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{subject.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{subject.description}</p>
                      {/* Question count hidden from students */}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* FOOTER (Fixed) */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex-shrink-0 bg-gray-50 dark:bg-slate-900/50 rounded-b-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedSubjects.length > 0 && (
                <>
                  <strong className="text-gray-900 dark:text-gray-100">{selectedSubjects.length}</strong> subject{selectedSubjects.length !== 1 ? 's' : ''} selected
                </>
              )}
              {isPreLocked && selectedSubjects.length > 0 && (
                <span className="text-yellow-600 ml-2 text-xs inline-flex items-center gap-1 font-medium">
                  <Lock size={12} />
                  Unlocked subjects
                </span>
              )}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={checkingActivation || loading}
              className="flex-1 px-6 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={selectedSubjects.length === 0 || checkingActivation || loading}
              className="flex-1 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition font-medium"
            >
              {checkingActivation ? 'Verifying Access...' : isPreLocked ? 'Start Exam' : 'Continue'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
