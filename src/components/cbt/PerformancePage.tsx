import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import showToast from '../../utils/toast'
import MathDisplay from './MathDisplay'
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
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Clock, Target, Award, AlertCircle, CheckCircle, ChevronDown, HelpCircle, ArrowLeft, BarChart3 } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

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
      showToast('Thanks for your feedback — it will appear after moderation.', 'success')
    } catch (e) {
      showToast('Failed to submit review', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-yellow-100 font-semibold">Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="p-2 rounded bg-slate-900 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
          >
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Star{n !== 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full mt-3 p-3 rounded-lg bg-slate-900 text-white border border-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-yellow-400 focus:outline-none text-sm"
          rows={3}
          placeholder="How was the exam? Share your feedback..."
        />
      </div>
      <div className="md:col-span-1 flex items-end">
        <button
          onClick={submit}
          disabled={submitting || message.trim() === ''}
          className="w-full bg-white text-slate-900 font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-50 transition disabled:opacity-50 text-sm shadow-md"
        >
          {submitting ? 'Sending…' : 'Send Feedback'}
        </button>
      </div>
    </div>
  )
}

interface Performance {
  id: number
  user_name: string
  exam_title: string
  test_name?: string
  subject_name?: string
  subjects?: Array<{
    subject_id: number
    subject_name: string
    num_questions: number
    correct_count: number
  }>
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
  const [expandedWrongAnswer, setExpandedWrongAnswer] = useState<number | string | null>(null)

  useEffect(() => {
    fetchPerformance()
  }, [attemptId])

  const fetchPerformance = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/cbt/attempts/${attemptId}/performance/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPerformance(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load performance')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mb-4"></div>
        <p className="text-slate-300 font-medium">Loading your performance results...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Results</h2>
          <p className="text-slate-300 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/student')}
            className="w-full px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!performance) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center text-slate-400">No performance data found</div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const isPassed = performance.percentage_score >= 50
  const isExcellent = performance.percentage_score >= 70

  const answerData = [
    { name: 'Correct', value: performance.correct_count, color: '#10b981' },
    { name: 'Wrong', value: performance.wrong_count, color: '#f43f5e' }
  ]

  const timeData = [
    { name: 'Time Used', value: Math.round(performance.time_taken_seconds / 60) },
    { name: 'Time Remaining', value: Math.max(0, Math.round((performance.time_limit_minutes * 60 - performance.time_taken_seconds) / 60)) }
  ]

  const performanceMetrics = [
    {
      label: 'Score Accuracy',
      value: `${performance.percentage_score.toFixed(1)}%`,
      unit: isExcellent ? 'Mastery' : isPassed ? 'Pass' : 'Needs Practice',
      icon: Target,
      color: isPassed ? 'text-emerald-400' : 'text-rose-400',
      badgeBg: isPassed ? 'bg-emerald-950/60 border-emerald-800' : 'bg-rose-950/60 border-rose-800'
    },
    {
      label: 'Correct Questions',
      value: `${performance.correct_count}`,
      unit: `/ ${performance.num_questions} total`,
      icon: Award,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-950/60 border-amber-800'
    },
    {
      label: 'Time Efficiency',
      value: `${((performance.time_taken_seconds / (performance.time_limit_minutes * 60)) * 100).toFixed(1)}%`,
      unit: `used of ${performance.time_limit_minutes}m`,
      icon: Clock,
      color: 'text-blue-400',
      badgeBg: 'bg-blue-950/60 border-blue-800'
    },
    {
      label: 'Answering Speed',
      value: (performance.num_questions / Math.max(0.1, performance.time_taken_seconds / 60)).toFixed(2),
      unit: 'questions/min',
      icon: TrendingUp,
      color: 'text-purple-400',
      badgeBg: 'bg-purple-950/60 border-purple-800'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/student/cbt')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg transition font-medium text-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to CBT Hub</span>
          </button>

          <span className="text-xs text-slate-400">
            Attempt #{attemptId} • {new Date(performance.submitted_at).toLocaleDateString()}
          </span>
        </div>

        {/* Hero Score Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl p-8 md:p-10">
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              {performance.test_name ? 'Custom Test Results' : 'Exam Results'}
            </span>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
              {performance.test_name || performance.exam_title}
            </h1>

            {performance.subjects && performance.subjects.length > 0 ? (
              <p className="text-slate-300 text-sm mb-6">
                Multi-Subject Exam: <span className="text-yellow-400 font-semibold">{performance.subjects.map(s => s.subject_name).join(', ')}</span>
              </p>
            ) : (
              <p className="text-slate-300 text-sm mb-6">{performance.subject_name}</p>
            )}

            {/* Main Score Display */}
            <div className="my-6">
              <div className={`text-6xl sm:text-7xl font-black tracking-tight drop-shadow-md ${
                isExcellent ? 'text-emerald-400' : isPassed ? 'text-yellow-400' : 'text-rose-400'
              }`}>
                {performance.percentage_score.toFixed(1)}%
              </div>
              <p className="text-slate-300 font-medium mt-2 text-base">
                {isExcellent ? '🌟 Outstanding Mastery!' : isPassed ? '👍 Good Job! You Passed.' : '📖 Needs More Practice.'}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceMetrics.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{metric.label}</span>
                  <div className={`p-2 rounded-lg border ${metric.badgeBg}`}>
                    <Icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">{metric.value}</span>
                  <span className="text-xs text-slate-400 font-medium">{metric.unit}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Multi-Subject Breakdown (if applicable) */}
        {performance.subjects && performance.subjects.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              <span>Subject-Wise Performance</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {performance.subjects.map((subject, idx) => {
                const subjectPercentage = (subject.correct_count / subject.num_questions) * 100
                const passed = subjectPercentage >= 50
                return (
                  <div key={idx} className="bg-slate-850/80 bg-slate-800 border border-slate-700/80 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-base text-white truncate">{subject.subject_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${passed ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'}`}>
                        {subjectPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      {subject.correct_count} of {subject.num_questions} questions correct
                    </p>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, Math.max(5, subjectPercentage))}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Wrong Answers Review Section (High Contrast) */}
        {performance.wrong_answers && performance.wrong_answers.length > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <span className="p-1.5 bg-rose-950/80 border border-rose-800 text-rose-400 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                </span>
                <span>Questions to Review ({performance.wrong_answers.length})</span>
              </h2>
              <span className="text-xs text-slate-400">
                Click any question to view its detailed solution
              </span>
            </div>

            {/* List of Wrong Answers */}
            <div className="space-y-4">
              {performance.wrong_answers.map((answer, idx) => {
                const answerKey = idx
                const isExpanded = expandedWrongAnswer === answerKey

                return (
                  <div
                    key={idx}
                    className="border-l-4 border-rose-500 bg-slate-800/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-xs hover:border-slate-600 transition"
                  >
                    <button
                      onClick={() => setExpandedWrongAnswer(isExpanded ? null : answerKey)}
                      className="w-full text-left p-5 flex items-start justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        {/* Subject Badge */}
                        {answer.subject && (
                          <span className="inline-block px-2 py-0.5 bg-slate-900 border border-slate-700 text-yellow-400 text-xs font-semibold rounded mb-2">
                            {answer.subject}
                          </span>
                        )}

                        {/* Question Text with LaTeX */}
                        <div className="font-bold text-base text-slate-100 group-hover:text-yellow-300 transition break-words">
                          <MathDisplay content={answer.question_text || ''} />
                        </div>

                        {/* User Answer vs Correct Answer Badges */}
                        <div className="mt-3.5 flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-200 text-xs font-medium">
                            <span className="text-rose-400 font-bold">Your answer:</span>
                            <span className="font-semibold"><MathDisplay content={answer.user_answer || 'Unanswered'} /></span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs font-medium">
                            <span className="text-emerald-400 font-bold">Correct:</span>
                            <span className="font-semibold"><MathDisplay content={answer.correct_answer || ''} /></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 mt-1">
                        <span className={`p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center transition transform ${isExpanded ? 'rotate-180 text-yellow-400' : ''}`}>
                          <ChevronDown size={18} />
                        </span>
                      </div>
                    </button>

                    {/* Expandable Explanation Area */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-700 bg-slate-900/95 text-slate-200">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex-shrink-0 mt-0.5">
                            <HelpCircle size={16} />
                          </div>
                          <div className="flex-1 min-w-0 text-sm">
                            <p className="font-bold text-yellow-400 mb-1.5 uppercase tracking-wider text-xs">
                              Explanation & Solution:
                            </p>
                            <div className="text-slate-200 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                              {answer.explanation ? (
                                <MathDisplay content={answer.explanation} />
                              ) : (
                                <p className="text-slate-400 italic">No explanation available for this question.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Perfect Score!</h3>
            <p className="text-slate-400 text-sm">You answered all questions correctly in this exam.</p>
          </div>
        )}

        {/* Exam Review Feedback Submission */}
        <div className="bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 rounded-2xl p-6 md:p-8 text-slate-900 shadow-xl">
          <h3 className="text-xl font-extrabold text-slate-950 mb-1">How was this exam?</h3>
          <p className="text-sm text-yellow-950 mb-4 font-medium">Share your experience to help us keep improving question quality.</p>
          <CbtReviewForm performance={performance} />
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={() => navigate('/student/cbt')}
            className="flex-1 py-3.5 px-6 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg transition text-center text-sm"
          >
            ← Practice Another Exam
          </button>
          <button
            onClick={() => navigate('/student/progress')}
            className="flex-1 py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold rounded-xl shadow-lg transition text-center text-sm"
          >
            📊 View All History & Progress
          </button>
        </div>

      </div>
    </div>
  )
}
