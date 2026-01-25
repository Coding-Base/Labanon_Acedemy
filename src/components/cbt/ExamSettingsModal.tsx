import React, { useState } from 'react'

interface Subject {
  id: number
  name: string
  question_count: number
}

interface Exam {
  id: number
  title: string
  time_limit_minutes: number
}

interface ExamSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  exam: Exam | null
  subject: Subject | null
  onStartExam: (numQuestions: number, timeLimitMinutes: number) => void
  isLoading: boolean
}

export default function ExamSettingsModal({
  isOpen,
  onClose,
  exam,
  subject,
  onStartExam,
  isLoading
}: ExamSettingsModalProps) {
  const [numQuestions, setNumQuestions] = useState(10)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(exam?.time_limit_minutes || 60)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    setError(null)

    if (numQuestions < 1) {
      setError('Number of questions must be at least 1')
      return
    }

    if (numQuestions > (subject?.question_count || 0)) {
      setError(`Maximum available questions: ${subject?.question_count}`)
      return
    }

    if (timeLimitMinutes < 1) {
      setError('Time limit must be at least 1 minute')
      return
    }

    onStartExam(numQuestions, timeLimitMinutes)
  }

  if (!isOpen || !exam || !subject) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-2">Exam Settings</h2>
        <p className="text-gray-600 mb-6">
          {exam.title} - {subject.name}
        </p>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions (max: {subject.question_count})
            </label>
            <input
              type="number"
              min="1"
              max={subject.question_count}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              You will answer <strong>{numQuestions} questions</strong> in <strong>{timeLimitMinutes} minutes</strong>
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {isLoading ? 'Starting...' : 'Start Exam'}
          </button>
        </div>
      </div>
    </div>
  )
}
