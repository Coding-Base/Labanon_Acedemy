import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Exam {
  id: number
  title: string
  slug: string
  description: string
  time_limit_minutes: number
}

interface ExamTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectExam: (exam: Exam) => void
}

export default function ExamTypeModal({ isOpen, onClose, onSelectExam }: ExamTypeModalProps) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchExams()
    }
  }, [isOpen])

  const fetchExams = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_BASE}/cbt/exams/`)
      setExams(response.data.results || response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-8 max-w-2xl w-full mx-4 border dark:border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-slate-100">Select Exam Type</h2>

        {error && <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>}

        {loading ? (
          <div className="text-center py-8 text-gray-600 dark:text-slate-400">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">No exams available</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {exams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => onSelectExam(exam)}
                className="p-4 border-2 border-gray-200 dark:border-slate-700 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-slate-800 text-left transition"
              >
                <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100">{exam.title}</h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">{exam.description}</p>
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-2">Duration: {exam.time_limit_minutes} minutes</p>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
