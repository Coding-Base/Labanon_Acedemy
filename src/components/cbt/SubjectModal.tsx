import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Subject {
  id: number
  name: string
  description: string
  question_count: number
}

interface Exam {
  id: number
  title: string
}

interface SubjectModalProps {
  isOpen: boolean
  onClose: () => void
  exam: Exam | null
  onSelectSubject: (subject: Subject) => void
}

export default function SubjectModal({ isOpen, onClose, exam, onSelectSubject }: SubjectModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && exam) {
      fetchSubjects()
    }
  }, [isOpen, exam])

  const fetchSubjects = async () => {
    if (!exam) return
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_BASE}/cbt/exams/${exam.id}/subjects/`)
      setSubjects(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !exam) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
        <p className="text-gray-600 mb-6">Select a subject to begin the test</p>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        {loading ? (
          <div className="text-center py-8">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No subjects available for this exam</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => onSelectSubject(subject)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 text-left transition"
              >
                <h3 className="font-bold text-lg">{subject.name}</h3>
                <p className="text-gray-600 text-sm">{subject.description}</p>
                <p className="text-gray-500 text-xs mt-2">{subject.question_count} questions available</p>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
      </div>
    </div>
  )
}
