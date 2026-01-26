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

interface ExamInterfaceProps {
  examAttemptId: number
  examTitle: string
  subjectName: string
  numQuestions: number
  timeLimitMinutes: number
  onSubmitComplete: () => void
}

export default function ExamInterface({
  examAttemptId,
  examTitle,
  subjectName,
  numQuestions,
  timeLimitMinutes,
  onSubmitComplete
}: ExamInterfaceProps) {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number | null }>({})
  const [loading, setLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [progress, setProgress] = useState<any>(null)
  const [showQuestionMenu, setShowQuestionMenu] = useState(false)
  const timerInterval = useRef<any>(null)

  const pageSize = 10
  const totalPages = Math.ceil(numQuestions / pageSize)
  const currentQuestion = questions.length > 0 ? questions[0] : null

  useEffect(() => {
    fetchQuestions()
    fetchProgress()
    startTimer()

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [examAttemptId])

  useEffect(() => {
    fetchQuestions()
  }, [currentPage])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(
        `${API_BASE}/cbt/attempts/${examAttemptId}/questions/?page=${currentPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // normalize year value so frontend can reliably detect presence
      setQuestions(
        (response.data.questions || []).map((q: any) => ({ ...q, year: q.year ?? null }))
      )
    } catch (err) {
      console.error('Failed to load questions:', err)
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
      setProgress(response.data)
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

  const answeredCount = progress?.answered_count || 0

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header with Timer */}
      <div className="bg-yellow-600 text-white px-3 sm:px-6 py-3 flex-shrink-0 z-10 border-b-2 border-yellow-700">
        <div className="max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-2xl font-bold truncate">{examTitle}</h1>
              <p className="text-xs sm:text-sm text-yellow-100 truncate">{subjectName}</p>
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

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative w-full">
        {/* Desktop Side Navigation Bar */}
        <div className="hidden sm:flex sm:flex-col sm:w-32 lg:w-40 bg-white border-r border-gray-200 p-3 sm:p-4 flex-shrink-0 overflow-y-auto">
          <h3 className="font-bold text-xs sm:text-sm mb-4 text-gray-800">Questions</h3>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {progress?.progress.map((item: any) => (
              <button
                key={item.question_number}
                onClick={() => setCurrentPage(Math.ceil(item.question_number / pageSize))}
                className={`w-full py-2 px-2 text-xs rounded font-semibold transition ${
                  item.is_answered
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.question_number}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t text-xs sticky bottom-0 bg-white">
            <p className="text-gray-600">
              Answered: <strong>{answeredCount}</strong> / {numQuestions}
            </p>
          </div>
        </div>

        {/* Mobile Question Menu - Modal/Drawer */}
        {showQuestionMenu && (
          <div className="fixed inset-0 z-40 sm:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowQuestionMenu(false)} />
            <div className="absolute top-0 left-0 w-3/4 h-full bg-white shadow-lg flex flex-col overflow-hidden">
              <div className="bg-yellow-600 text-white p-4 flex items-center justify-between">
                <h3 className="font-bold text-sm">Questions</h3>
                <button onClick={() => setShowQuestionMenu(false)} className="p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {progress?.progress.map((item: any) => (
                  <button
                    key={item.question_number}
                    onClick={() => {
                      setCurrentPage(Math.ceil(item.question_number / pageSize))
                      setShowQuestionMenu(false)
                    }}
                    className={`w-full py-2 px-3 text-xs rounded font-semibold transition text-left ${
                      item.is_answered
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Q {item.question_number}
                  </button>
                ))}
              </div>
              <div className="bg-gray-50 border-t p-4 text-xs">
                <p className="text-gray-600">
                  Answered: <strong>{answeredCount}</strong> / {numQuestions}
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
                  <p className="text-lg">Loading questions...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <p className="text-lg">No questions available</p>
                </div>
              ) : (
                <>
                  {/* Questions Container */}
                  <div className="space-y-4 sm:space-y-6">
                    {questions.map((question) => (
                      <div key={question.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="mb-4">
                          <div className="text-sm sm:text-lg font-bold mb-2 text-gray-900 break-words">
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
                              className="flex items-start p-3 sm:p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition"
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={choice.id}
                                checked={selectedAnswers[question.id] === choice.id}
                                onChange={() => handleAnswerSelect(question.id, choice.id)}
                                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                              />
                              <span className="ml-3 flex-1 text-xs sm:text-sm break-words">
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
                      {/* Previous/Next Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1 || loading}
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          Previous
                        </button>

                        <div className="flex-1 flex items-center justify-center py-2 text-xs sm:text-sm text-gray-600">
                          Page <span className="font-semibold mx-2">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                        </div>

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages || loading}
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          Next
                        </button>
                      </div>

                      {/* Submit Button - Full width on mobile */}
                      <button
                        onClick={() => setShowSubmitConfirm(true)}
                        disabled={submitting}
                        className="w-full px-6 py-3 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                      >
                        {submitting ? 'Submitting...' : 'Submit Exam'}
                      </button>
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
              <strong>{answeredCount}</strong> out of <strong>{numQuestions}</strong> questions.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 border border-gray-300 rounded-lg transition"
              >
                Return to Exam
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
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
