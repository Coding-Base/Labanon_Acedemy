import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { TrendingUp, Clock, Target, Award, AlertCircle } from 'lucide-react'

 
function CbtReviewForm({ performance }: { performance: any }) {
  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('access')
      const payload = {
        rating,
        message,
        category: 'cbt',
        cbt_exam: performance.exam_title,
        cbt_subject: performance.subject_name,
        cbt_score: performance.percentage_score
      }
      await axios.post(`${API_BASE}/users/reviews/`, payload, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      setMessage('')
      alert('Thanks for your feedback — it will appear after moderation.')
    } catch (e) {
      alert('Failed to submit review')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-3">
        <div className="flex items-center gap-3">
          <label className="text-sm">Rating</label>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="p-2 rounded">
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full mt-3 p-3 rounded text-gray-900" rows={3} placeholder="How was the exam?" />
      </div>
      <div className="md:col-span-1 flex items-center">
        <button onClick={submit} disabled={submitting || message.trim() === ''} className="w-full bg-white text-yellow-600 font-bold py-2 rounded">{submitting ? 'Sending…' : 'Send Feedback'}</button>
      </div>
    </div>
  )
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Performance {
  id: number
  user_name: string
  exam_title: string
  subject_name: string
  num_questions: number
  time_limit_minutes: number
  time_taken_seconds: number
  score: number
  correct_count: number
  wrong_count: number
  percentage_score: number
  started_at: string
  submitted_at: string
  student_answers: any[]
  wrong_answers: any[]
}

export default function PerformancePage() {
  const navigate = useNavigate()
  const { attemptId } = useParams()
  const [performance, setPerformance] = useState<Performance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedWrongAnswer, setExpandedWrongAnswer] = useState<number | null>(null)

  useEffect(() => {
    fetchPerformance()
  }, [attemptId])

  const fetchPerformance = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/cbt/attempts/${attemptId}/performance/`, { headers: { Authorization: `Bearer ${token}` } })
      setPerformance(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load performance')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading performance data...</div>
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

  if (!performance) {
    return <div className="text-center py-8">No performance data found</div>
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const scoreColor =
    performance.percentage_score >= 70
      ? 'text-yellow-700'
      : performance.percentage_score >= 50
        ? 'text-yellow-600'
        : 'text-red-600'

  const scoreBgColor =
    performance.percentage_score >= 70
      ? 'from-yellow-50 to-yellow-100'
      : performance.percentage_score >= 50
        ? 'from-yellow-50 to-yellow-100'
        : 'from-red-50 to-red-100'

  // Prepare chart data
  const answerData = [
    { name: 'Correct', value: performance.correct_count, color: '#10b981' },
    { name: 'Wrong', value: performance.wrong_count, color: '#ef4444' }
  ]

  const timeData = [
    { name: 'Time Used', value: performance.time_taken_seconds / 60 },
    { name: 'Time Remaining', value: Math.max(0, (performance.time_limit_minutes * 60 - performance.time_taken_seconds) / 60) }
  ]

  const performanceMetrics = [
    {
      label: 'Accuracy',
      value: performance.percentage_score.toFixed(1),
      unit: '%',
      icon: Target,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Correct Answers',
      value: performance.correct_count,
      unit: `/ ${performance.num_questions}`,
      icon: Award,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Time Efficiency',
      value: ((performance.time_taken_seconds / (performance.time_limit_minutes * 60)) * 100).toFixed(1),
      unit: '%',
      icon: Clock,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Speed',
      value: (performance.num_questions / (performance.time_taken_seconds / 60)).toFixed(2),
      unit: 'q/min',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className={`bg-gradient-to-br ${scoreBgColor} rounded-2xl shadow-2xl p-8 mb-8 border border-opacity-20`}>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-gray-900">{performance.exam_title}</h1>
            <p className="text-gray-700 mb-6 text-lg">{performance.subject_name}</p>

            <div className={`text-6xl font-bold ${scoreColor} mb-4 drop-shadow-lg`}>
              {performance.percentage_score.toFixed(1)}%
            </div>

            <p className="text-gray-600 text-sm">
              {performance.percentage_score >= 70 && '🎉 Excellent Performance!'}
              {performance.percentage_score >= 50 && performance.percentage_score < 70 && '👍 Good Attempt!'}
              {performance.percentage_score < 50 && '📚 Keep Practicing!'}
            </p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {performanceMetrics.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${metric.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-gray-500 text-sm">{metric.unit}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pie Chart - Answer Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Answer Distribution</h2>
            <div className="flex justify-center items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={answerData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {answerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time Analysis Chart */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Time Analysis</h2>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Time Used</p>
                <p className="text-2xl font-bold text-yellow-700">{formatTime(performance.time_taken_seconds)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Time Limit</p>
                <p className="text-2xl font-bold text-yellow-600">{performance.time_limit_minutes} min</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Details */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📋 Exam Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="text-gray-600 text-sm font-medium">Total Questions</p>
              <p className="text-3xl font-bold text-yellow-700 mt-1">{performance.num_questions}</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="text-gray-600 text-sm font-medium">Correct Answers</p>
              <p className="text-3xl font-bold text-yellow-700 mt-1">{performance.correct_count}</p>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <p className="text-gray-600 text-sm font-medium">Wrong Answers</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{performance.wrong_count}</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="text-gray-600 text-sm font-medium">Time Limit</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{performance.time_limit_minutes}m</p>
            </div>
          </div>
        </div>

        {/* Timeline Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">⏱️ Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600">Started</p>
                <p className="font-semibold text-gray-900">{new Date(performance.started_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="font-semibold text-gray-900">{new Date(performance.submitted_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600">Total Duration</p>
                <p className="font-semibold text-gray-900">{formatTime(performance.time_taken_seconds)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wrong Answers Section */}
        {performance.wrong_answers && performance.wrong_answers.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold mb-6 text-red-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Questions You Got Wrong ({performance.wrong_answers.length})
            </h2>

            <div className="space-y-4">
              {performance.wrong_answers.map((answer, idx) => (
                <div key={idx} className="border-l-4 border-red-500 bg-red-50 rounded-lg p-6 hover:shadow-md transition">
                  <button
                    onClick={() =>
                      setExpandedWrongAnswer(expandedWrongAnswer === idx ? null : idx)
                    }
                    className="w-full text-left flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-red-600 transition">{answer.question_text}</p>
                      <div className="mt-3 flex gap-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                          <p className="text-sm text-red-600">
                            Your answer: <strong>{answer.user_answer}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                          <p className="text-sm text-yellow-700">
                            Correct: <strong>{answer.correct_answer}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`ml-4 text-gray-600 transition transform ${expandedWrongAnswer === idx ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {expandedWrongAnswer === idx && (
                    <div className="mt-4 pt-4 border-t border-red-200 bg-white p-4 rounded">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <p className="text-sm text-gray-700">
                          <strong>Explanation:</strong> {answer.explanation || 'No explanation available'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Feedback */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <h2 className="text-xl font-bold mb-4">📊 Performance Insights</h2>
          <div className="space-y-3">
            {performance.percentage_score >= 70 && (
              <p>✅ Excellent work! You've demonstrated strong mastery of the material. Keep up this momentum!</p>
            )}
            {performance.percentage_score >= 50 && performance.percentage_score < 70 && (
              <p>📚 Good effort! You've understood most of the material. Focus on the areas where you struggled to improve further.</p>
            )}
            {performance.percentage_score < 50 && (
              <p>💪 Keep practicing! Review the incorrect answers and study the related topics to improve your understanding.</p>
            )}
            <p>• Time used: {formatTime(performance.time_taken_seconds)} ({((performance.time_taken_seconds / (performance.time_limit_minutes * 60)) * 100).toFixed(1)}% of allocated time)</p>
            <p>• Accuracy rate: {performance.percentage_score.toFixed(1)}%</p>
            <p>• Questions attempted: {performance.num_questions}</p>
          </div>
        </div>

        {/* CBT Review Submission Card (appears after exam completion) */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <h3 className="text-lg font-bold mb-2">How was this exam?</h3>
          <p className="text-sm mb-4">Share a short review about this CBT exam. Your feedback helps us improve.</p>
          <CbtReviewForm performance={performance} />
        </div>

        {/* All Answers Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold mb-6 text-gray-900">📝 All Answers Review</h2>

          <div className="space-y-3">
            {performance.student_answers?.map((answer, idx) => (
              <div
                key={idx}
                className={`border-l-4 rounded-lg p-4 transition transform hover:scale-102 ${
                  answer.is_correct
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                          answer.is_correct ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      >
                        {answer.is_correct ? '✓' : '✗'}
                      </span>
                      <p className="font-semibold text-gray-900">{answer.question_text}</p>
                    </div>
                      <p className={`text-sm mt-2 ml-11 ${answer.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                      Your answer: <strong>{answer.selected_choice_text ?? (typeof answer.selected_choice === 'number' ? 'Choice #' + answer.selected_choice : answer.selected_choice)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => navigate('/student/overview')}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg hover:shadow-lg font-semibold transition transform hover:scale-105"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/student/progress')}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg hover:shadow-lg font-semibold transition transform hover:scale-105"
          >
            📊 View All Results
          </button>
        </div>
      </div>
    </div>
  )
}
