import React, { useState } from 'react'
import { useRef, useEffect } from 'react'
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
  const selectedSubjectSetterRef = useRef<typeof setSelectedSubject | null>(null)

  useEffect(() => {
    selectedSubjectSetterRef.current = setSelectedSubject
  }, [setSelectedSubject])
  const [examAttemptId, setExamAttemptId] = useState<number | null>(null)
  const [selectedNumQuestions, setSelectedNumQuestions] = useState(10)
  const [selectedTimeLimitMinutes, setSelectedTimeLimitMinutes] = useState(60)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectExam = (exam: Exam) => {
    // Check if exam is globally unlocked for this user
    try { setSelectedExam(exam) } catch (e) { console.error('setSelectedExam call error', e) }
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
    try {
      if (typeof selectedSubjectSetterRef.current === 'function') {
        selectedSubjectSetterRef.current(subject)
      } else {
        console.error('selectedSubject setter not a function', selectedSubjectSetterRef.current)
      }
    } catch (e) {
      console.error('Error calling selectedSubject setter', e, selectedSubjectSetterRef.current)
    }
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
      console.error('Failed to start exam', err)
      alert(err.response?.data?.detail || 'Failed to start exam')
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
      {/* Activation / error banners handled inline via navigation or alerts */}

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
