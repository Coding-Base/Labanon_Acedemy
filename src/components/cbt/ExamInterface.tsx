import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Question {
  id: number
  text: string
  image?: string
  choices: { id: number; text: string }[]
  user_answer_id: number | null
  is_answered: boolean
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
      setQuestions(response.data.questions)
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
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex-shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{examTitle}</h1>
            <p className="text-green-100">{subjectName}</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${timeRemaining < 300 ? 'text-red-300' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
            <p className="text-blue-100 text-sm">Time Remaining</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Side Navigation Bar */}
        <div className="w-32 bg-white border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
          <h3 className="font-bold text-sm mb-4">Questions</h3>
          <div className="space-y-2">
            {progress?.progress.map((item: any) => (
              <button
                key={item.question_number}
                onClick={() => setCurrentPage(Math.ceil(item.question_number / pageSize))}
                className={`w-full py-2 px-2 text-xs rounded font-semibold transition ${
                  item.is_answered
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.question_number}
              </button>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t text-xs">
            <p className="text-gray-600">
              Answered: <strong>{answeredCount}</strong> / {numQuestions}
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="text-center py-8">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">No questions available</div>
          ) : (
            <div className="space-y-8 max-w-4xl">
              {questions.map((question) => (
                <div key={question.id} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-6">{question.text}</h3>
                  
                  {question.image && (
                    <div className="mb-6">
                      <img 
                        src={question.image.startsWith('http') ? question.image : `${API_BASE.replace('/api', '')}${question.image}`} 
                        alt="Question" 
                        className="max-w-full h-auto rounded-lg border border-gray-200" 
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    {question.choices.map((choice) => (
                      <label
                        key={choice.id}
                        className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={choice.id}
                          checked={selectedAnswers[question.id] === choice.id}
                          onChange={() => handleAnswerSelect(question.id, choice.id)}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="ml-3 flex-1">{choice.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-4 justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Previous
              </button>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
              className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm">
            <h2 className="text-xl font-bold mb-4">Submit Exam?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your exam? You have answered{' '}
              <strong>{answeredCount}</strong> out of <strong>{numQuestions}</strong> questions.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Return to Exam
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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
