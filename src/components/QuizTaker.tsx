import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Clock, AlertCircle } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000/api'

interface QuizOption {
  id: number
  text: string
  order: number
}

interface QuizQuestion {
  id: number
  text: string
  points: number
  explanation: string
  options: QuizOption[]
  order: number
}

interface ModuleQuiz {
  id: number
  module: number
  title: string
  description: string
  passing_score: number
  is_required: boolean
  questions: QuizQuestion[]
  total_points: number
}

interface QuizAttempt {
  id: number
  quiz: number
  score: number
  passed: boolean
  earned_points: number
  total_points: number
  submitted_at: string
  answers: any[]
}

interface QuizTakerProps {
  quizId: number
  onComplete?: (attempt: QuizAttempt) => void
  onClose?: () => void
}

export default function QuizTaker({ quizId, onComplete, onClose }: QuizTakerProps) {
  const [quiz, setQuiz] = useState<ModuleQuiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number }>({})
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  async function loadQuiz() {
    try {
      setLoading(true)
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/module-quizzes/${quizId}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      setQuiz(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to load quiz:', err)
      setError('Failed to load quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function submitQuiz() {
    if (!quiz) return

    setSubmitting(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) {
        setError('Please log in to submit the quiz')
        return
      }

      // Convert selectedAnswers to format expected by backend
      const answers = Object.entries(selectedAnswers).map(([questionId, optionId]) => ({
        question_id: Number(questionId),
        option_id: optionId
      }))

      const response = await axios.post(
        `${API_BASE}/module-quizzes/${quizId}/submit_answers/`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setAttempt(response.data)
      if (onComplete) {
        onComplete(response.data)
      }
    } catch (err: any) {
      console.error('Failed to submit quiz:', err)
      setError(err?.response?.data?.detail || 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error || 'Quiz not found'}
      </div>
    )
  }

  // Show results if submitted
  if (attempt) {
    const passed = attempt.passed
    const percentage = attempt.score || 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          {passed ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            </motion.div>
          )}

          <h2 className="text-3xl font-bold mb-2">
            {passed ? 'Quiz Passed! 🎉' : 'Quiz Not Passed'}
          </h2>

          <div className="bg-white rounded-lg p-6 border border-gray-200 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Your Score</span>
              <span className="text-4xl font-bold text-green-600">{percentage.toFixed(1)}%</span>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Passing Score</span>
              <span className="text-lg font-semibold">{quiz.passing_score}%</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Points Earned</span>
              <span className="text-lg font-semibold">
                {attempt.earned_points} / {attempt.total_points}
              </span>
            </div>
          </div>

          {passed && quiz.is_required && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              ✓ You can now proceed to the next module
            </div>
          )}

          {!passed && quiz.is_required && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-700">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              You need to score at least {quiz.passing_score}% to proceed. Try again!
            </div>
          )}
        </div>

        {/* Show answer review */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
          <div className="space-y-4">
            {attempt.answers.map((answer: any, idx: number) => {
              const question = quiz.questions.find((q) => q.id === answer.question)
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    answer.is_correct
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {answer.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">{question?.text}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Your answer: <strong>{answer.selected_option?.text}</strong>
                      </p>
                      {question?.explanation && (
                        <p className="text-sm text-gray-700 italic border-t border-current pt-2 mt-2">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Close
            </button>
          )}
          <button
            onClick={() => {
              setAttempt(null)
              setCurrentQuestionIndex(0)
              setSelectedAnswers({})
            }}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Retake Quiz
          </button>
        </div>
      </motion.div>
    )
  }

  // Show quiz questions
  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        This quiz has no questions configured yet.
        {onClose && (
          <div className="mt-4">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded">Close</button>
          </div>
        )}
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const hasAnsweredAll = Object.keys(selectedAnswers).length === quiz.questions.length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Quiz Header */}
      <div className="bg-gradient-to-r from-green-600 to-yellow-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
        {quiz.description && <p className="text-green-50">{quiz.description}</p>}
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span>Passing Score: {quiz.passing_score}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
          className="bg-green-600 h-2 rounded-full"
        />
      </div>

      {/* Current Question */}
      <motion.div
        key={currentQuestion?.id || `q-${currentQuestionIndex}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {currentQuestion?.text || 'Question'}
        </h3>

        <div className="space-y-3">
          {(currentQuestion.options || []).map((option) => {
            const isSelected = selectedAnswers[currentQuestion.id] === option.id
            return (
              <label
                key={option.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-green-50 border-green-500 border-2'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion?.id}`}
                  checked={isSelected}
                  onChange={() =>
                    setSelectedAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: option.id
                    }))
                  }
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-3 text-gray-900">{option.text}</span>
              </label>
            )
          })}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex((idx) => Math.max(0, idx - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition"
          >
            Previous
          </button>

          {!isLastQuestion ? (
            <button
              onClick={() => setCurrentQuestionIndex((idx) => idx + 1)}
              disabled={!selectedAnswers[currentQuestion.id]}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={!hasAnsweredAll || submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Question Indicators */}
      <div className="flex flex-wrap gap-2">
        {quiz.questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestionIndex(idx)}
            className={`w-10 h-10 rounded-lg font-semibold transition ${
              idx === currentQuestionIndex
                ? 'bg-green-600 text-white'
                : selectedAnswers[q.id]
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
