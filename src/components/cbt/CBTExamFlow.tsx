import React, { useState } from 'react'
import axios from 'axios'
import ExamTypeModal from './ExamTypeModal'
import SubjectSelectionModal from './SubjectSelectionModal'
import QuestionConfigurationModal from './QuestionConfigurationModal'
import TestNamingAndTimeModal from './TestNamingAndTimeModal'
import ExamInterface from './ExamInterface-MultiSubject'
import { useNavigate, useLocation } from 'react-router-dom'

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
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const startAfterActivation = queryParams.get('start_after_activation') === '1' || queryParams.get('start_after_activation') === 'true'
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
  const [isTrialAttempt, setIsTrialAttempt] = useState(false)
  const [trialMessage, setTrialMessage] = useState<string | null>(null)

  // Error state for better error handling and user feedback
  const [error, setError] = useState<{
    title: string
    message: string
    available_subjects?: string[]
    action?: string
    nextStep?: string
  } | null>(null)

  // Trial attempt state
  const [trialInfo, setTrialInfo] = useState<{
    trial_attempts_used: number
    trial_attempts_remaining: number
    trial_available: boolean
    trial_attempts_limit?: number
    trial_questions_limit?: number
  } | null>(null)

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

        // Check trial attempt info
        if (data.trial_attempts_used !== undefined) {
          setTrialInfo({
            trial_attempts_used: data.trial_attempts_used,
            trial_attempts_remaining: data.trial_attempts_remaining,
            trial_available: data.trial_available,
            trial_attempts_limit: data.trial_attempts_limit,
            trial_questions_limit: data.trial_questions_limit
          })
        }

        if (res.ok && data.unlocked) {
          // Determine if this is a JAMB exam (exam title or slug)
          const isJamb = String(exam.title || '').toLowerCase().includes('jamb') || String(exam.slug || '').toLowerCase() === 'jamb'

          if (isJamb) {
            // For JAMB: backend should return allowed_subjects (the selected subjects)
            if (data.allowed_subjects && Array.isArray(data.allowed_subjects)) {
              setAllowedSubjects(data.allowed_subjects)
            } else {
              // If backend didn't return allowed_subjects, fallback to empty array
              setAllowedSubjects([])
            }
            // If user just returned from payment and asked to auto-start, preselect allowed subjects and skip to question configuration
            if (startAfterActivation) {
              if (data.allowed_subjects && Array.isArray(data.allowed_subjects)) {
                setSelectedSubjects(data.allowed_subjects)
                setFlowStep('questions-config')
                return
              }
            }
          } else {
            // For non-JAMB exams, an unlocked activation grants access to all subjects.
            // Fetch the exam subjects and mark them as allowed.
            try {
              const subjectsRes = await axios.get(`${API_BASE}/cbt/exams/${exam.id}/subjects/`)
              setAllowedSubjects(subjectsRes.data || [])
              if (startAfterActivation) {
                setSelectedSubjects(subjectsRes.data || [])
                setFlowStep('questions-config')
                return
              }
            } catch (err) {
              console.error('Failed to load exam subjects for non-JAMB unlock:', err)
              setAllowedSubjects([])
            }
          }

          setFlowStep('subjects')
        } else {
          // Check if trial is available
          if (data.trial_available) {
            setAllowedSubjects([])
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
    setError(null)

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
      setIsTrialAttempt(response.data.is_trial_attempt || false)
      setTrialMessage(response.data.trial_message || null)
      setFlowStep('exam-interface')
    } catch (err: any) {
      console.error('Failed to start exam', err)
      const errorData = err.response?.data
      
      // Handle trial exhausted error
      if (errorData?.detail === 'You have exhausted your free trial attempts for this exam.') {
        setError({
          title: '🎁 Free Trial Exhausted',
          message: `You've used all ${errorData.trial_attempts_limit || 5} free attempts. Unlock this exam to continue practicing.`,
          action: 'Upgrade now to unlock unlimited attempts',
          nextStep: 'Unlock Exam'
        })
      }
      // PHASE 3: Display improved error messages with helpful context
      else if (errorData) {
        if (errorData.available_subjects && errorData.available_subjects.length > 0) {
          // User tried to access subjects they don't have access to
          setError({
            title: 'Subject Access Restricted',
            message: errorData.message || 'You cannot access all the subjects you selected.',
            available_subjects: errorData.available_subjects,
            action: errorData.action || 'Please go back and reselect your subjects.',
            nextStep: 'Back'
          })
        } else if (errorData.detail === 'You have not unlocked this exam yet.') {
          // User hasn't unlocked the exam
          setError({
            title: 'Exam Not Unlocked',
            message: errorData.detail,
            action: errorData.action || 'Complete the activation payment to unlock this exam.',
            nextStep: errorData.next_step || 'Unlock Exam'
          })
        } else {
          // Generic error
          setError({
            title: 'Error Starting Exam',
            message: errorData.detail || 'Could not start exam. Please try again.',
            action: 'If the problem persists, contact support.'
          })
        }
      } else {
        setError({
          title: 'Error Starting Exam',
          message: 'Could not start exam. Please try again.',
          action: 'If the problem persists, contact support.'
        })
      }
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
    setIsTrialAttempt(false)
    setTrialMessage(null)
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
        isTrialAttempt={isTrialAttempt}
        trialMessage={trialMessage}
      />
    )
  }

  return (
    <>
      {/* Error Dialog */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-red-600 mb-2">{error.title}</h3>
              <p className="text-gray-700 mb-4">{error.message}</p>
              
              {error.available_subjects && error.available_subjects.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Your Unlocked Subjects:</p>
                  <ul className="text-sm text-blue-800">
                    {error.available_subjects.map((subject, i) => (
                      <li key={i}>• {subject}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {error.action && (
                <p className="text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded">
                  {error.action}
                </p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setError(null)
                    if (error.nextStep === 'Back') {
                      setFlowStep('questions-config')
                      setSelectedSubjects([])
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded font-semibold hover:bg-gray-400"
                >
                  {error.nextStep === 'Back' ? 'Go Back' : 'Dismiss'}
                </button>
                {error.nextStep === 'Unlock Exam' && (
                  <button
                    onClick={() => {
                      setError(null)
                      window.location.href = `/activate?type=exam&exam_id=${selectedExam?.id}&exam_title=${selectedExam?.title}`
                    }}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded font-semibold hover:bg-yellow-700"
                  >
                    Unlock Exam
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Select Exam */}
      <ExamTypeModal
        isOpen={flowStep === 'exam'}
        onClose={handleCancel}
        onSelectExam={handleSelectExam}
      />

      {/* Trial Info Banner */}
      {trialInfo && flowStep === 'subjects' && trialInfo.trial_available && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 max-w-md w-full mx-4 z-40 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <p className="font-bold text-amber-900">Free Trial Available</p>
              <p className="text-sm text-amber-800 mt-1">
                {trialInfo.trial_attempts_remaining === (trialInfo.trial_attempts_limit || 5) 
                  ? `Start with ${trialInfo.trial_attempts_limit || 5} free attempts` 
                  : `${trialInfo.trial_attempts_remaining} attempt${trialInfo.trial_attempts_remaining !== 1 ? 's' : ''} remaining`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select Multiple Subjects (filtered to allowed subjects) */}
      <SubjectSelectionModal
        isOpen={flowStep === 'subjects'}
        onClose={() => {
          setFlowStep('exam')
          setSelectedExam(null)
          setSelectedSubjects([])
          setAllowedSubjects([])
          setTrialInfo(null)
        }}
        exam={selectedExam}
        onSelectSubjects={handleSelectSubjects}
        allowedSubjectIds={allowedSubjects.length > 0 ? allowedSubjects.map(s => s.id) : undefined}
        trialInfo={trialInfo}
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
        trialQuestionsLimit={trialInfo?.trial_available ? trialInfo.trial_questions_limit : undefined}
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
