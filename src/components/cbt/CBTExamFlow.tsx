import React, { useState } from 'react'
import axios from 'axios'
import ExamTypeModal from './ExamTypeModal'
import SubjectModal from './SubjectModal'
import ExamSettingsModal from './ExamSettingsModal'
import ExamInterface from './ExamInterface'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Exam {
  id: number
  title: string
  slug: string
  description: string
  time_limit_minutes: number
}

interface Subject {
  id: number
  name: string
  description: string
  question_count: number
}

export default function CBTExamFlow({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [showExamTypeModal, setShowExamTypeModal] = useState(true)
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showExamInterface, setShowExamInterface] = useState(false)

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [examAttemptId, setExamAttemptId] = useState<number | null>(null)
  const [selectedNumQuestions, setSelectedNumQuestions] = useState(10)
  const [selectedTimeLimitMinutes, setSelectedTimeLimitMinutes] = useState(60)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectExam = (exam: Exam) => {
    // Check if exam is globally unlocked for this user
    setSelectedExam(exam)
    setError(null)
    (async () => {
      try {
        const token = localStorage.getItem('access')
        if (!token) { window.location.href = '/login'; return }
        const res = await fetch(`${API_BASE}/payments/activation-status/?exam=${exam.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok && data.unlocked) {
          setShowExamTypeModal(false)
          setShowSubjectModal(true)
        } else {
          // Redirect to activation/checkout page
          const qs = new URLSearchParams({ type: 'exam', exam_id: String(exam.id), exam_title: exam.title })
          navigate(`/activate?${qs.toString()}`)
        }
      } catch (err) {
        // If check fails, fall back to subject modal but show error
        console.error('Activation check failed', err)
        setShowExamTypeModal(false)
        setShowSubjectModal(true)
      }
    })()
  }

  const handleSelectSubject = (subject: Subject) => {
    // For interview-style exams we check subject-level activation
    setSelectedSubject(subject)
    setError(null)
    (async () => {
      try {
        const token = localStorage.getItem('access')
        if (!token) { window.location.href = '/login'; return }
        const res = await fetch(`${API_BASE}/payments/activation-status/?exam=${selectedExam?.id}&subject=${subject.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok && data.unlocked) {
          setShowSubjectModal(false)
          setShowSettingsModal(true)
        } else {
          const qs = new URLSearchParams({ type: 'interview', exam_id: String(selectedExam?.id || ''), subject_id: String(subject.id), subject_name: subject.name })
          navigate(`/activate?${qs.toString()}`)
        }
      } catch (err) {
        console.error('Activation check failed', err)
        setShowSubjectModal(false)
        setShowSettingsModal(true)
      }
    })()
  }

  const handleStartExam = async (numQuestions: number, timeLimitMinutes: number) => {
    if (!selectedExam || !selectedSubject) return

    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('access')
      const response = await axios.post(`${API_BASE}/cbt/start-exam/`, {
        exam: selectedExam.id,
        subject: selectedSubject.id,
        num_questions: numQuestions,
        time_limit_minutes: timeLimitMinutes
      }, { headers: { Authorization: `Bearer ${token}` } })

      setExamAttemptId(response.data.exam_attempt_id)
      setSelectedNumQuestions(numQuestions)
      setSelectedTimeLimitMinutes(timeLimitMinutes)
      setShowSettingsModal(false)
      setShowExamInterface(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start exam')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExamComplete = () => {
    if (examAttemptId) {
      navigate(`/performance/${examAttemptId}`)
    }
  }

  const handleCancel = () => {
    setShowExamTypeModal(false)
    setShowSubjectModal(false)
    setShowSettingsModal(false)
    setShowExamInterface(false)
    setSelectedExam(null)
    setSelectedSubject(null)
    setExamAttemptId(null)
    onClose()
  }

  if (showExamInterface && examAttemptId && selectedExam && selectedSubject) {
    return (
      <ExamInterface
        examAttemptId={examAttemptId}
        examTitle={selectedExam.title}
        subjectName={selectedSubject.name}
        numQuestions={selectedNumQuestions}
        timeLimitMinutes={selectedTimeLimitMinutes}
        onSubmitComplete={handleExamComplete}
      />
    )
  }

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-40">
          {error}
        </div>
      )}

      <ExamTypeModal
        isOpen={showExamTypeModal}
        onClose={handleCancel}
        onSelectExam={handleSelectExam}
      />

      <SubjectModal
        isOpen={showSubjectModal}
        onClose={() => {
          setShowSubjectModal(false)
          setShowExamTypeModal(true)
          setSelectedExam(null)
        }}
        exam={selectedExam}
        onSelectSubject={handleSelectSubject}
      />

      <ExamSettingsModal
        isOpen={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false)
          setShowSubjectModal(true)
          setSelectedSubject(null)
        }}
        exam={selectedExam}
        subject={selectedSubject}
        onStartExam={handleStartExam}
        isLoading={isLoading}
      />
    </>
  )
}
