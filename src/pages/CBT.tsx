import React, { useEffect, useState } from 'react'
import axios from 'axios'
import CBTExamFlow from '../components/cbt/CBTExamFlow'
import { FileText } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface ExamAttempt {
  id: number
  exam_title: string
  subject_name: string
  num_questions: number
  score: number
  started_at: string
  submitted_at: string
  time_taken_seconds: number
  correct_answers: number
  total_questions: number
}

export default function CBTPage() {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showCBTFlow, setShowCBTFlow] = useState(false)

  useEffect(() => {
    loadAttempts()
  }, [page])

  const loadAttempts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/cbt/attempt-list/?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAttempts(response.data.results)
      setTotalPages(response.data.total_pages)
    } catch (err) {
      console.error('Failed to load attempts:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}h ${mins}m`
    }
    return `${mins}m ${secs}s`
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 70) return 'bg-yellow-100 text-green-800'
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (showCBTFlow) {
    return <CBTExamFlow onClose={() => setShowCBTFlow(false)} />
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            CBT & Exams
          </h2>
          <p className="text-gray-600 mt-1">Take practice exams and track your progress</p>
        </div>
        <button
          onClick={() => setShowCBTFlow(true)}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-yellow--600 text-white rounded-lg hover:shadow-lg font-semibold transition"
        >
          Take CBT Test
        </button>
      </div>

      {/* Exams List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your exams...</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-yellow--50 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exams Taken Yet</h3>
          <p className="text-gray-600 mb-6">Start your first CBT exam to see your results here</p>
          <button
            onClick={() => setShowCBTFlow(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Take Your First Exam
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {attempts.map((attempt) => (
              <a
                key={attempt.id}
                href={`/performance/${attempt.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{attempt.exam_title}</h3>
                    <p className="text-gray-600">{attempt.subject_name}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${getScoreColor(attempt.score, attempt.num_questions)}`}>
                    {attempt.score}/{attempt.num_questions} ({((attempt.score / attempt.num_questions) * 100).toFixed(1)}%)
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Questions</p>
                    <p className="font-semibold text-gray-900">{attempt.num_questions}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Correct</p>
                    <p className="font-semibold text-green-600">{attempt.correct_answers}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time Taken</p>
                    <p className="font-semibold text-gray-900">{formatTime(attempt.time_taken_seconds)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(attempt.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
