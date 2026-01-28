import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { TrendingUp, BookOpen, Award, Clock, Target } from 'lucide-react'

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

export default function ProgressPage() {
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchAttempts()
  }, [currentPage])

  const fetchAttempts = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/cbt/attempt-list/?page=${currentPage}`, { headers: { Authorization: `Bearer ${token}` } })
      setAttempts(response.data.results)
      setTotalPages(response.data.total_pages)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load exam history')
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
    if (percentage >= 70) return 'text-yellow-700 bg-yellow-50'
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate('/student')}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-yellow-700" />
            Exam History & Analytics
          </h1>
          <p className="text-gray-600">Track your performance and progress over time</p>
        </div>

        {/* Overall Statistics */}
        {attempts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-700 text-sm font-medium">Total Attempts</p>
                  <p className="text-3xl font-bold text-yellow-700 mt-2">{attempts.length}</p>
                </div>
                <div className="bg-yellow-200 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-700 text-sm font-medium">Average Score</p>
                  <p className="text-3xl font-bold text-yellow-700 mt-2">
                    {(
                      attempts.reduce((sum, a) => sum + (a.score / a.num_questions) * 100, 0) / attempts.length
                    ).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-yellow-200 p-3 rounded-lg">
                  <Target className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow--50 to-yellow--100 rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-700 text-sm font-medium">Best Score</p>
                  <p className="text-3xl font-bold text-yellow-700 mt-2">
                    {Math.max(...attempts.map(a => (a.score / a.num_questions) * 100)).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-yellow-200 p-3 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700 text-sm font-medium">Total Time</p>
                  <p className="text-3xl font-bold text-orange-700 mt-2">
                    {(attempts.reduce((sum, a) => sum + a.time_taken_seconds, 0) / 3600).toFixed(1)}h
                  </p>
                </div>
                <div className="bg-orange-200 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Trend Chart */}
        {attempts.length > 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Performance Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attempts.map((a, i) => ({
                attempt: `Exam ${i + 1}`,
                score: ((a.score / a.num_questions) * 100).toFixed(1),
                time: (a.time_taken_seconds / 60).toFixed(0)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="attempt" />
                <YAxis yAxisId="left" label={{ value: 'Score %', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Time (min)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="time" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
            <p className="text-gray-600 mt-4">Loading exam history...</p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-6 text-lg">You haven't taken any exams yet</p>
            <button
              onClick={() => navigate('/student/cbt')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg hover:shadow-lg font-semibold"
            >
              🚀 Take Your First Exam
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 All Exam Attempts</h2>
            <div className="space-y-4">
              {attempts.map((attempt, idx) => {
                const percentage = (attempt.score / attempt.num_questions) * 100
                const scoreColor = percentage >= 70 ? 'from-yellow-500 to-yellow-600' : percentage >= 50 ? 'from-yellow-500 to-yellow-600' : 'from-red-500 to-red-600'
                
                return (
                  <button
                    key={attempt.id}
                    onClick={() => navigate(`/performance/${attempt.id}`)}
                    className="w-full bg-gray-50 rounded-lg shadow hover:shadow-md transition p-6 text-left border border-gray-200 hover:border-yellow-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      {/* Score Badge */}
                      <div className={`bg-gradient-to-br ${scoreColor} rounded-lg p-6 text-white text-center min-w-24`}>
                        <p className="text-3xl font-bold">{percentage.toFixed(0)}</p>
                        <p className="text-sm font-semibold">%</p>
                      </div>

                      {/* Exam Info */}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{attempt.exam_title}</h3>
                        <p className="text-gray-600 text-sm">{attempt.subject_name}</p>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs font-medium">QUESTIONS</p>
                            <p className="font-bold text-gray-900 text-lg">{attempt.num_questions}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-medium">CORRECT</p>
                            <p className="font-bold text-yellow-700 text-lg">{attempt.correct_answers}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-medium">WRONG</p>
                            <p className="font-bold text-red-600 text-lg">{attempt.num_questions - attempt.correct_answers}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-medium">TIME</p>
                            <p className="font-bold text-yellow-700 text-lg">{formatTime(attempt.time_taken_seconds)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-medium">DATE</p>
                            <p className="font-bold text-gray-900">{new Date(attempt.submitted_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Click Indicator */}
                      <div className="text-right">
                        <p className="text-yellow-700 font-semibold">View Details →</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex gap-4 justify-center mt-8 mb-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-semibold transition ${
                        currentPage === page
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
