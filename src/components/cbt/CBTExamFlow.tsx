import React, { useState } from 'react'
import axios from 'axios'
import ExamTypeModal from './ExamTypeModal'
import SubjectSelectionModal from './SubjectSelectionModal'
import QuestionConfigurationModal from './QuestionConfigurationModal'
import TestNamingAndTimeModal from './TestNamingAndTimeModal'
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

interface SubjectConfig {
  subject_id: number
  subject_name: string
  num_questions: number
  available_questions: number
}

type FlowStep = 'exam' | 'subjects' | 'questions-config' | 'naming-time' | 'exam-interface'

export default function CBTExamFlow({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [flowStep, setFlowStep] = useState<FlowStep>('exam')

  // Exam selection state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)

  // Multi-subject selection state
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([])
  const [allowedSubjects, setAllowedSubjects] = useState<Subject[]>([])  // NEW: subjects the student has unlocked

  // Question configuration state
  const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfig[]>([])

  // Test naming and timing state
  const [testName, setTestName] = useState('')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(180)

  // Exam attempt state
  const [examAttemptId, setExamAttemptId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Handle exam selection with activation check
  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam)

    // Check if exam is globally unlocked for this user
    ;(async () => {
      try {
        const token = localStorage.getItem('access')
        if (!token) {
          window.location.href = '/login'
          return
        }

        const res = await fetch(`${API_BASE}/payments/activation-status/?exam=${exam.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()

        if (res.ok && data.unlocked) {
          // NEW: Load the allowed subjects for this exam
          if (data.allowed_subjects && Array.isArray(data.allowed_subjects)) {
            setAllowedSubjects(data.allowed_subjects)
          }
          setFlowStep('subjects')
        } else {
          // Redirect to activation/checkout page
          const qs = new URLSearchParams({
            type: 'exam',
            exam_id: String(exam.id),
            exam_title: exam.title
          })
          navigate(`/activate?${qs.toString()}`)
        }
      } catch (err) {
        console.error('Activation check failed', err)
        // Fallback: let user proceed to subject selection
        setFlowStep('subjects')
      }
    })()
  }

  // Handle subject selection with multi-select and activation checks
  const handleSelectSubjects = async (subjects: Subject[]) => {
    setSelectedSubjects(subjects)
    setFlowStep('questions-config')
  }

  // Handle question configuration
  const handleConfigureQuestions = (configs: SubjectConfig[]) => {
    setSubjectConfigs(configs)
    // Set default time based on total questions (2.5 minutes per question)
    const totalQuestions = configs.reduce((sum, cfg) => sum + cfg.num_questions, 0)
    const suggestedTime = Math.ceil(totalQuestions * 2.5)
    setTimeLimitMinutes(suggestedTime)
    setFlowStep('naming-time')
  }

  // Handle test naming and time setup
  const handleStartMultiSubjectExam = async (name: string, timeLimit: number) => {
    if (!selectedExam) return

    setTestName(name)
    setTimeLimitMinutes(timeLimit)
    setIsLoading(true)

    try {
      const token = localStorage.getItem('access')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const payload = {
        exam: selectedExam.id,
        subjects_config: subjectConfigs.map(cfg => ({
          subject_id: cfg.subject_id,
          num_questions: cfg.num_questions
        })),
        time_limit_minutes: timeLimit,
        test_name: name
      }

      const response = await axios.post(`${API_BASE}/cbt/start-exam/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setExamAttemptId(response.data.exam_attempt_id)
      setFlowStep('exam-interface')
    } catch (err: any) {
      console.error('Failed to start exam', err)
      alert(err.response?.data?.detail || 'Failed to start exam. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle completion and navigate to performance
  const handleExamComplete = () => {
    if (examAttemptId) {
      navigate(`/performance/${examAttemptId}`)
    }
  }

  // Handle cancel/close
  const handleCancel = () => {
    setFlowStep('exam')
    setSelectedExam(null)
    setSelectedSubjects([])
    setAllowedSubjects([])
    setSubjectConfigs([])
    setTestName('')
    setExamAttemptId(null)
    onClose()
  }

  // Render exam interface when ready
  if (flowStep === 'exam-interface' && examAttemptId && selectedExam && subjectConfigs.length > 0) {
    return (
      <ExamInterface
        examAttemptId={examAttemptId}
        testName={testName}
        subjectConfigs={subjectConfigs.map(cfg => ({
          subject_id: cfg.subject_id,
          subject_name: cfg.subject_name,
          num_questions: cfg.num_questions
        }))}
        timeLimitMinutes={timeLimitMinutes}
        onSubmitComplete={handleExamComplete}
      />
    )
  }

  return (
    <>
      {/* Step 1: Select Exam */}
      <ExamTypeModal
        isOpen={flowStep === 'exam'}
        onClose={handleCancel}
        onSelectExam={handleSelectExam}
      />

      {/* Step 2: Select Multiple Subjects (filtered to allowed subjects) */}
      <SubjectSelectionModal
        isOpen={flowStep === 'subjects'}
        onClose={() => {
          setFlowStep('exam')
          setSelectedExam(null)
          setSelectedSubjects([])
          setAllowedSubjects([])
        }}
        exam={selectedExam}
        onSelectSubjects={handleSelectSubjects}
        allowedSubjectIds={allowedSubjects.length > 0 ? allowedSubjects.map(s => s.id) : undefined}
      />

      {/* Step 3: Configure Questions per Subject */}
      <QuestionConfigurationModal
        isOpen={flowStep === 'questions-config'}
        onClose={() => {
          setFlowStep('subjects')
          setSelectedSubjects([])
        }}
        selectedSubjects={selectedSubjects}
        onConfigureQuestions={handleConfigureQuestions}
      />

      {/* Step 4: Name Test and Set Time */}
      <TestNamingAndTimeModal
        isOpen={flowStep === 'naming-time'}
        onClose={() => {
          setFlowStep('questions-config')
        }}
        subjectConfigs={subjectConfigs}
        onStartExam={handleStartMultiSubjectExam}
        isLoading={isLoading}
      />
    </>
  )
}
