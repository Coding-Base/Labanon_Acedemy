import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MathDisplay from './MathDisplay'
import { Menu, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Question {
  id: number
  text: string
  image?: string
  choices: { id: number; text: string }[]
  user_answer_id: number | null
  is_answered: boolean
  year?: string
}

interface SubjectProgress {
  subject_id: number
  subject_name: string
  answered_count: number
  total_questions: number
}

interface ExamInterfaceProps {
  examAttemptId: number
  testName: string
  subjectConfigs: Array<{
    subject_id: number
    subject_name: string
    num_questions: number
  }>
  timeLimitMinutes: number
  onSubmitComplete: () => void
}

export default function ExamInterface({
  examAttemptId,
  testName,
  subjectConfigs,
  timeLimitMinutes,
  onSubmitComplete
}: ExamInterfaceProps) {
  const navigate = useNavigate()
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number | null }>({})
  const [loading, setLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([])
  const [showQuestionMenu, setShowQuestionMenu] = useState(false)
  const timerInterval = useRef<any>(null)

  const currentSubjectConfig = subjectConfigs[currentSubjectIndex]
  const totalQuestionsAcross = subjectConfigs.reduce((sum, cfg) => sum + cfg.num_questions, 0)
  const totalAnsweredAcross = subjectProgress.reduce((sum, sp) => sum + sp.answered_count, 0)

  useEffect(() => {
    fetchQuestionsForSubject()
    fetchProgress()
    startTimer()

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [examAttemptId])

  useEffect(() => {
    fetchQuestionsForSubject()
  }, [currentSubjectIndex])

  const fetchQuestionsForSubject = async () => {
    if (!currentSubjectConfig) return
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(
        `${API_BASE}/cbt/attempts/${examAttemptId}/questions/?subject=${currentSubjectConfig.subject_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setQuestions(
        (response.data.questions || []).map((q: any) => ({ ...q, year: q.year ?? null }))
      )
    } catch (err) {
      console.error('Failed to load questions for subject:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(
        `${API_BASE}/cbt/attempts/${examAttemptId}/progress/`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Process progress to organize by subject
      if (response.data.subject_progress) {
        setSubjectProgress(response.data.subject_progress)
      }
    } catch (err) {
      console.error('Failed to load progress:', err)
    }
  }

  const startTimer = () => {
    timerInterval.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval.current)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleAutoSubmit = async () => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('access')
      await axios.post(`${API_BASE}/cbt/attempts/${examAttemptId}/submit/`, {}, { headers: { Authorization: `Bearer ${token}` } })
      onSubmitComplete()
    } catch (err) {
      console.error('Auto-submit failed:', err)
    }
  }

  const handleAnswerSelect = async (questionId: number, choiceId: number) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: choiceId })

    try {
      const token = localStorage.getItem('access')
      await axios.post(
        `${API_BASE}/cbt/attempts/${examAttemptId}/submit-answer/`,
        { question_id: questionId, choice_id: choiceId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchProgress()
    } catch (err) {
      console.error('Failed to save answer:', err)
    }
  }

  const handleNextSubject = () => {
    if (currentSubjectIndex < subjectConfigs.length - 1) {
      setCurrentSubjectIndex(prev => prev + 1)
    } else {
      setShowSubmitConfirm(true)
    }
  }

  const handlePreviousSubject = () => {
    if (currentSubjectIndex > 0) {
      setCurrentSubjectIndex(prev => prev - 1)
    }
  }

  const handleJumpToSubject = (subjectIndex: number) => {
    setCurrentSubjectIndex(subjectIndex)
    setShowQuestionMenu(false)
  }

  const handleManualSubmit = async () => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('access')
      await axios.post(`${API_BASE}/cbt/attempts/${examAttemptId}/submit/`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setShowSubmitConfirm(false)
      onSubmitComplete()
    } catch (err) {
      console.error('Submit failed:', err)
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getSubjectProgress = (subjectId: number) => {
    return subjectProgress.find(sp => sp.subject_id === subjectId) || 
           { subject_id: subjectId, subject_name: '', answered_count: 0, total_questions: 0 }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header with Timer */}
      <div className="bg-yellow-600 text-white px-3 sm:px-6 py-3 flex-shrink-0 z-10 border-b-2 border-yellow-700">
        <div className="max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-2xl font-bold truncate">{testName}</h1>
              <p className="text-xs sm:text-sm text-yellow-100 truncate">
                {currentSubjectConfig?.subject_name || 'Loading...'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setShowQuestionMenu(!showQuestionMenu)}
                className="sm:hidden flex items-center justify-center w-10 h-10 bg-yellow-700 hover:bg-yellow-800 rounded-lg transition"
              >
                {showQuestionMenu ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="text-center flex-shrink-0">
                <div className={`text-2xl sm:text-4xl font-bold font-mono ${timeRemaining < 300 ? 'text-red-300 animate-pulse' : ''}`}>
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-xs text-yellow-100 mt-0.5">Time</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Subject Selection Strip - Only visible on mobile */}
      <div className="sm:hidden bg-white border-b border-gray-200 px-3 py-3 overflow-x-auto flex-shrink-0">
        <div className="flex gap-2 min-w-min">
          {subjectConfigs.map((config, idx) => {
            const progress = getSubjectProgress(config.subject_id)
            const isActive = idx === currentSubjectIndex
            return (
              <button
                key={config.subject_id}
                onClick={() => {
                  handleJumpToSubject(idx)
                  setShowQuestionMenu(false)
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                  isActive
                    ? 'bg-yellow-100 text-yellow-900 border-2 border-yellow-600'
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                }`}
              >
                <div className="text-xs leading-tight">
                  <div>{config.subject_name}</div>
                  <div className="text-gray-600 mt-0.5">
                    {progress.answered_count}/{config.num_questions}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop Subject Selection Strip - Only visible on desktop */}
      <div className="hidden sm:block bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-gray-700 flex-shrink-0">Selected Subjects:</h3>
          <div className="flex gap-3 flex-wrap">
            {subjectConfigs.map((config, idx) => {
              const progress = getSubjectProgress(config.subject_id)
              const isActive = idx === currentSubjectIndex
              return (
                <button
                  key={config.subject_id}
                  onClick={() => handleJumpToSubject(idx)}
                  className={`py-2 px-4 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-yellow-100 text-yellow-900 border-2 border-yellow-600 shadow-md'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{config.subject_name}</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
                      {progress.answered_count}/{config.num_questions}
                    </span>
                    {progress.answered_count === progress.total_questions && (
                      <span className="text-green-600 font-bold">✓</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative w-full">
        {/* Desktop side navigation removed - subjects now visible in top strip */}
        {/* Mobile Question Menu - Modal/Drawer */}
        {showQuestionMenu && (
          <div className="fixed inset-0 z-40 sm:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowQuestionMenu(false)} />
            <div className="absolute top-0 left-0 w-3/4 h-full bg-white shadow-lg flex flex-col overflow-hidden">
              <div className="bg-yellow-600 text-white p-4 flex items-center justify-between">
                <h3 className="font-bold text-sm">Subjects</h3>
                <button onClick={() => setShowQuestionMenu(false)} className="p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {subjectConfigs.map((config, idx) => {
                  const progress = getSubjectProgress(config.subject_id)
                  const isActive = idx === currentSubjectIndex
                  return (
                    <button
                      key={config.subject_id}
                      onClick={() => handleJumpToSubject(idx)}
                      className={`w-full py-2 px-3 rounded-lg text-left text-xs font-semibold transition ${
                        isActive
                          ? 'bg-yellow-100 text-yellow-900'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{config.subject_name}</span>
                        {progress.answered_count === progress.total_questions && (
                          <span className="text-green-600 font-bold">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {progress.answered_count}/{config.num_questions}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="bg-gray-50 border-t p-4 text-xs">
                <p className="text-gray-600">
                  Overall: <strong>{totalAnsweredAcross}</strong> / {totalQuestionsAcross}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Questions Content Area - Scrollable, centered, proper constraints */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="flex justify-center px-3 sm:px-6 py-6 sm:py-8 w-full">
            <div className="w-full max-w-2xl">
              {loading ? (
                <div className="text-center py-12 text-gray-600">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                  <p className="text-lg mt-4">Loading {currentSubjectConfig?.subject_name} questions...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <p className="text-lg">No questions available for this subject</p>
                </div>
              ) : (
                <>
                  {/* Questions Container */}
                  <div className="space-y-4 sm:space-y-6">
                    {questions.map((question) => (
                      <div key={question.id} className="bg-white p-3 sm:p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="mb-4 overflow-x-auto">
                          <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold mb-2 text-gray-900 break-words whitespace-normal">
                            <MathDisplay content={question.text} />
                          </div>
                          {(question.year !== null && question.year !== undefined && question.year !== '') && (
                            <p className="text-xs text-gray-500 italic">Year: {question.year}</p>
                          )}
                        </div>
                        
                        {question.image && (
                          <div className="mb-6">
                            <img 
                              src={question.image.startsWith('http') ? question.image : `${API_BASE.replace('/api', '')}${question.image}`} 
                              alt="Question" 
                              className="w-full h-auto rounded-lg border border-gray-200" 
                            />
                          </div>
                        )}

                        <div className="space-y-3">
                          {question.choices.map((choice) => (
                            <label
                              key={choice.id}
                              className="flex items-start p-2 sm:p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-yellow-50 hover:border-yellow-300 transition"
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={choice.id}
                                checked={selectedAnswers[question.id] === choice.id}
                                onChange={() => handleAnswerSelect(question.id, choice.id)}
                                className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-1 sm:mt-0.5"
                              />
                              <span className="ml-2 sm:ml-3 flex-1 text-xs sm:text-sm break-words overflow-x-auto">
                                <MathDisplay content={choice.text} />
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Controls - Fixed at bottom */}
                  <div className="mt-8 sm:mt-10 pt-6 border-t border-gray-200">
                    <div className="flex flex-col gap-3 sm:gap-4 w-full">
                      {/* Previous/Next Subject Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                        <button
                          onClick={handlePreviousSubject}
                          disabled={currentSubjectIndex === 0 || loading}
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          ← Previous Subject
                        </button>

                        <div className="flex-1 flex items-center justify-center py-2 text-xs sm:text-sm text-gray-600">
                          <span className="font-semibold">{currentSubjectIndex + 1}</span> of <span className="font-semibold ml-1">{subjectConfigs.length}</span>
                        </div>

                        <button
                          onClick={handleNextSubject}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {currentSubjectIndex === subjectConfigs.length - 1 ? 'Submit Exam →' : 'Next Subject →'}
                        </button>
                      </div>

                      {/* Submit Button - Only on last subject */}
                      {currentSubjectIndex === subjectConfigs.length - 1 && (
                        <button
                          onClick={() => setShowSubmitConfirm(true)}
                          disabled={submitting}
                          className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                        >
                          {submitting ? 'Submitting...' : '✓ Submit Exam'}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-sm w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Submit Exam?</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Are you sure you want to submit your exam? You have answered{' '}
              <strong>{totalAnsweredAcross}</strong> out of <strong>{totalQuestionsAcross}</strong> questions across all subjects.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 border border-gray-300 rounded-lg transition font-medium"
              >
                Return to Exam
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
