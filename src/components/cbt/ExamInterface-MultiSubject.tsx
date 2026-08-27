import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import MathDisplay from './MathDisplay'
import { Calculator, Menu, X } from 'lucide-react'
import useTokenRefresher from '../../utils/useTokenRefresher'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Question {
  id: number
  text: string
  image?: string
  choices: { id: number; text: string }[]
  user_answer_id: number | null
  is_answered: boolean
  year?: string | null
}

interface SubjectProgress {
  subject_id: number
  subject_name: string
  answered_count: number
  total_questions: number
}

interface ExamInterfaceProps {
  examAttemptId: number
  testName: string
  subjectConfigs: Array<{
    subject_id: number
    subject_name: string
    num_questions: number
  }>
  timeLimitMinutes: number
  onSubmitComplete: () => void
  isTrialAttempt?: boolean
  trialMessage?: string | null
}

export default function ExamInterface({
  examAttemptId,
  testName,
  subjectConfigs,
  timeLimitMinutes,
  onSubmitComplete,
  isTrialAttempt = false,
  trialMessage = null
}: ExamInterfaceProps) {
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Proactively refresh JWT token every 45 minutes to prevent logout during long exams
  useTokenRefresher(45)
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionsBySubject, setQuestionsBySubject] = useState<{ [subjectId: number]: Question[] }>({})
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number | null }>({})
  const [loading, setLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const timerInterval = useRef<any>(null)
  const pendingQuestionIndexRef = useRef<number | null>(null)

  const currentSubjectConfig = subjectConfigs[currentSubjectIndex]
  const currentQuestion = questions[currentQuestionIndex] || null
  const totalQuestionsAcross = subjectConfigs.reduce((sum, cfg) => sum + cfg.num_questions, 0)
  const totalAnsweredAcross = subjectConfigs.reduce((sum, cfg) => {
    const subjectQuestions = questionsBySubject[cfg.subject_id] || []
    if (subjectQuestions.length > 0) {
      return sum + subjectQuestions.filter(question => selectedAnswers[question.id] !== null && selectedAnswers[question.id] !== undefined).length
    }
    const progress = subjectProgress.find(sp => sp.subject_id === cfg.subject_id)
    return sum + Math.min(progress?.answered_count || 0, cfg.num_questions)
  }, 0)

  useEffect(() => {
    fetchProgress()
    fetchAllSubjectQuestions()
    startTimer()

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [examAttemptId])

  useEffect(() => {
    setCurrentQuestionIndex(pendingQuestionIndexRef.current ?? 0)
    pendingQuestionIndexRef.current = null
    fetchQuestionsForSubject()
  }, [currentSubjectIndex])

  useEffect(() => {
    if (!questions.length) return
    const initialAnswers = questions.reduce((acc, question) => {
      acc[question.id] = question.user_answer_id ?? selectedAnswers[question.id] ?? null
      return acc
    }, {} as { [key: number]: number | null })
    setSelectedAnswers(prev => ({ ...prev, ...initialAnswers }))
  }, [questions])

  const normalizeQuestions = (items: any[]): Question[] => {
    return (items || []).map((q: any) => ({ ...q, year: q.year ?? null }))
  }

  const mergeSelectedAnswers = (items: Question[]) => {
    setSelectedAnswers(prev => {
      const next = { ...prev }
      items.forEach(question => {
        next[question.id] = question.user_answer_id ?? next[question.id] ?? null
      })
      return next
    })
  }

  const fetchAllQuestionsForSubject = async (subjectId: number, expectedCount: number) => {
    try {
      const token = localStorage.getItem('access')
      const firstResponse = await axios.get(
        `${API_BASE}/cbt/attempts/${examAttemptId}/questions/?subject=${subjectId}&page=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const firstQuestions = normalizeQuestions(firstResponse.data.questions || [])
      const totalPages = Number(firstResponse.data.total_pages || 1)
      const totalQuestions = Number(firstResponse.data.total_questions || expectedCount || firstQuestions.length)

      if (totalPages <= 1) {
        return firstQuestions.slice(0, totalQuestions || undefined)
      }

      const remainingResponses = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) => (
          axios.get(
            `${API_BASE}/cbt/attempts/${examAttemptId}/questions/?subject=${subjectId}&page=${index + 2}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        ))
      )

      const allQuestions = [
        ...firstQuestions,
        ...remainingResponses.flatMap(response => normalizeQuestions(response.data.questions || []))
      ]

      return allQuestions.slice(0, totalQuestions || undefined)
    } catch (err) {
      console.error('Failed to load questions for subject:', err)
      return []
    }
  }

  const fetchQuestionsForSubject = async () => {
    if (!currentSubjectConfig) return
    const cached = questionsBySubject[currentSubjectConfig.subject_id]
    if (cached) {
      setQuestions(cached)
      return
    }

    setLoading(true)
    try {
      const subjectQuestions = await fetchAllQuestionsForSubject(currentSubjectConfig.subject_id, currentSubjectConfig.num_questions)
      setQuestions(subjectQuestions)
      setQuestionsBySubject(prev => ({ ...prev, [currentSubjectConfig.subject_id]: subjectQuestions }))
      mergeSelectedAnswers(subjectQuestions)
    } catch (err) {
      console.error('Failed to load questions for subject:', err)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAllSubjectQuestions = async () => {
    const entries = await Promise.all(
      subjectConfigs.map(async config => {
        const subjectQuestions = await fetchAllQuestionsForSubject(config.subject_id, config.num_questions)
        return [config.subject_id, subjectQuestions] as const
      })
    )

    const nextQuestionsBySubject = entries.reduce((acc, [subjectId, subjectQuestions]) => {
      acc[subjectId] = subjectQuestions
      return acc
    }, {} as { [subjectId: number]: Question[] })

    setQuestionsBySubject(nextQuestionsBySubject)
    if (currentSubjectConfig && nextQuestionsBySubject[currentSubjectConfig.subject_id]) {
      setQuestions(nextQuestionsBySubject[currentSubjectConfig.subject_id])
    }
    mergeSelectedAnswers(entries.flatMap(([, subjectQuestions]) => subjectQuestions))
  }

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(
        `${API_BASE}/cbt/attempts/${examAttemptId}/progress/`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data.subject_progress) {
        setSubjectProgress(response.data.subject_progress)
      }
    } catch (err) {
      console.error('Failed to load progress:', err)
    }
  }

  const startTimer = () => {
    if (timerInterval.current) clearInterval(timerInterval.current)
    timerInterval.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval.current)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleAutoSubmit = async () => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('access')
      await axios.post(`${API_BASE}/cbt/attempts/${examAttemptId}/submit/`, {}, { headers: { Authorization: `Bearer ${token}` } })
      onSubmitComplete()
    } catch (err) {
      console.error('Auto-submit failed:', err)
      setSubmitting(false)
    }
  }

  const handleAnswerSelect = async (questionId: number, choiceId: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: choiceId }))
    setQuestions(prev => prev.map(question => (
      question.id === questionId
        ? { ...question, user_answer_id: choiceId, is_answered: true }
        : question
    )))
    if (currentSubjectConfig) {
      setQuestionsBySubject(prev => ({
        ...prev,
        [currentSubjectConfig.subject_id]: (prev[currentSubjectConfig.subject_id] || questions).map(question => (
          question.id === questionId
            ? { ...question, user_answer_id: choiceId, is_answered: true }
            : question
        ))
      }))
    }

    try {
      const token = localStorage.getItem('access')
      await axios.post(
        `${API_BASE}/cbt/attempts/${examAttemptId}/submit-answer/`,
        { question_id: questionId, choice_id: choiceId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchProgress()
    } catch (err) {
      console.error('Failed to save answer:', err)
    }
  }

  const handleJumpToSubject = (subjectIndex: number) => {
    setCurrentSubjectIndex(subjectIndex)
    setCurrentQuestionIndex(0)
    setShowMobileMenu(false)
  }

  const handleJumpToQuestion = (questionIndex: number) => {
    setCurrentQuestionIndex(questionIndex)
    setShowMobileMenu(false)
  }

  const goPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      return
    }

    if (currentSubjectIndex > 0) {
      const previousSubjectIndex = currentSubjectIndex - 1
      pendingQuestionIndexRef.current = Math.max(0, subjectConfigs[previousSubjectIndex].num_questions - 1)
      setCurrentSubjectIndex(previousSubjectIndex)
    }
  }

  const goNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      return
    }

    if (currentSubjectIndex < subjectConfigs.length - 1) {
      pendingQuestionIndexRef.current = 0
      setCurrentSubjectIndex(prev => prev + 1)
      return
    }

    setShowSubmitConfirm(true)
  }

  const handleManualSubmit = async () => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('access')
      await axios.post(`${API_BASE}/cbt/attempts/${examAttemptId}/submit/`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setShowSubmitConfirm(false)
      onSubmitComplete()
    } catch (err) {
      console.error('Submit failed:', err)
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getSubjectProgress = (subjectId: number) => {
    const config = subjectConfigs.find(cfg => cfg.subject_id === subjectId)
    const subjectQuestions = questionsBySubject[subjectId] || []
    if (subjectQuestions.length > 0) {
      return {
        subject_id: subjectId,
        subject_name: config?.subject_name || '',
        answered_count: subjectQuestions.filter(question => selectedAnswers[question.id] !== null && selectedAnswers[question.id] !== undefined).length,
        total_questions: subjectQuestions.length
      }
    }

    const progress = subjectProgress.find(sp => sp.subject_id === subjectId)
    return progress
      ? { ...progress, answered_count: Math.min(progress.answered_count || 0, config?.num_questions || progress.total_questions || 0) }
      : { subject_id: subjectId, subject_name: '', answered_count: 0, total_questions: config?.num_questions || 0 }
  }

  const isLastQuestionInExam = currentSubjectIndex === subjectConfigs.length - 1 && currentQuestionIndex === questions.length - 1
  const isFirstQuestionInExam = currentSubjectIndex === 0 && currentQuestionIndex === 0

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {isTrialAttempt && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-3 sm:px-6 py-2 flex items-center gap-3">
          <span className="text-sm font-bold text-yellow-800">
            {trialMessage || 'Free Trial Attempt'}
          </span>
        </div>
      )}

      <header className="bg-yellow-600 text-white px-3 sm:px-6 py-2.5 flex-shrink-0 z-10 border-b-2 border-yellow-700">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-bold truncate">{testName}</h1>
            <p className="text-xs text-yellow-100 truncate">
              {totalAnsweredAcross}/{totalQuestionsAcross} answered
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="sm:hidden flex items-center justify-center w-9 h-9 bg-yellow-700 hover:bg-yellow-800 rounded-lg transition"
              aria-label="Open question menu"
            >
              <Menu size={18} />
            </button>
            <div className="text-right flex-shrink-0">
              <div className={`text-xl sm:text-3xl font-bold font-mono leading-none ${timeRemaining < 300 ? 'text-red-200 animate-pulse' : ''}`}>
                {formatTime(timeRemaining)}
              </div>
              <p className="text-[10px] sm:text-xs text-yellow-100 mt-0.5">Time Remaining</p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 overflow-x-auto">
          {subjectConfigs.map((config, idx) => {
            const progress = getSubjectProgress(config.subject_id)
            const isActive = idx === currentSubjectIndex
            return (
              <button
                key={config.subject_id}
                onClick={() => handleJumpToSubject(idx)}
                className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold whitespace-nowrap shadow-sm transition ${
                  isActive
                    ? 'bg-yellow-600 text-white border border-yellow-700'
                    : 'bg-yellow-100 text-yellow-900 border border-yellow-200 hover:bg-yellow-200'
                }`}
              >
                <span>{config.subject_name}</span>
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-yellow-700 text-white' : 'bg-white text-yellow-800'}`}>
                  {progress.answered_count}/{config.num_questions}
                </span>
              </button>
            )
          })}

          <button
            onClick={() => setShowCalculator(prev => !prev)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-md bg-orange-600 text-white text-xs sm:text-sm font-bold whitespace-nowrap shadow-sm hover:bg-orange-700 transition"
          >
            <Calculator className="w-4 h-4" />
            Calculator
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto relative">
        {showCalculator && <FloatingCalculator onClose={() => setShowCalculator(false)} />}

        <div className="px-3 sm:px-6 py-5 sm:py-8">
          <div className="max-w-6xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-16 text-gray-600">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600" />
                <p className="text-lg mt-4">Loading {currentSubjectConfig?.subject_name} questions...</p>
              </div>
            ) : !currentQuestion ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-lg">No questions available for this subject</p>
              </div>
            ) : (
              <>
                <section className="min-h-[280px]">
                  <h2 className="text-xl sm:text-2xl font-bold text-yellow-700 uppercase tracking-wide mb-2">
                    {currentSubjectConfig.subject_name}
                  </h2>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">
                    Question {currentQuestionIndex + 1}
                  </h3>

                  <div className="border-t border-gray-200 pt-5 mb-6">
                    <div className="text-sm sm:text-base md:text-lg text-gray-900 leading-relaxed break-words">
                      <MathDisplay content={currentQuestion.text} />
                    </div>
                    {(currentQuestion.year !== null && currentQuestion.year !== undefined && currentQuestion.year !== '') && (
                      <p className="text-xs text-gray-500 italic mt-3">Year: {currentQuestion.year}</p>
                    )}
                  </div>

                  {currentQuestion.image && (
                    <div className="mb-6">
                      <img
                        src={currentQuestion.image.startsWith('http') ? currentQuestion.image : `${API_BASE.replace('/api', '')}${currentQuestion.image}`}
                        alt="Question"
                        className="max-w-full h-auto rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  <div className="space-y-3 max-w-3xl">
                    {currentQuestion.choices.map((choice, index) => {
                      const isSelected = selectedAnswers[currentQuestion.id] === choice.id
                      const optionLabel = String.fromCharCode(65 + index)
                      return (
                        <label
                          key={choice.id}
                          className="flex items-center gap-4 cursor-pointer group"
                        >
                          <span className="w-10 text-base sm:text-lg font-semibold text-gray-700">
                            ({optionLabel})
                          </span>
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={choice.id}
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(currentQuestion.id, choice.id)}
                            className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0"
                          />
                          <span className={`text-sm sm:text-base flex-1 break-words ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                            <MathDisplay content={choice.text} />
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </section>

                <section className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                    <button
                      onClick={goPrevious}
                      disabled={isFirstQuestionInExam || loading}
                      className="px-6 py-3 bg-yellow-500 text-white rounded-md text-sm font-bold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>

                    <QuestionGrid
                      questions={questions}
                      currentQuestionIndex={currentQuestionIndex}
                      selectedAnswers={selectedAnswers}
                      onJump={handleJumpToQuestion}
                    />

                    <button
                      onClick={goNext}
                      disabled={loading}
                      className={`px-6 py-3 rounded-md text-sm font-bold text-white transition ${
                        isLastQuestionInExam
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-yellow-600 hover:bg-yellow-700'
                      }`}
                    >
                      {isLastQuestionInExam ? 'Submit' : 'Next'}
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </main>

      {showMobileMenu && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowMobileMenu(false)} />
          <div className="absolute top-0 left-0 w-4/5 max-w-sm h-full bg-white shadow-lg flex flex-col overflow-hidden">
            <div className="bg-yellow-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Exam Navigation</h3>
              <button onClick={() => setShowMobileMenu(false)} className="p-1">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Subjects</p>
                <div className="space-y-2">
                  {subjectConfigs.map((config, idx) => {
                    const isActive = idx === currentSubjectIndex
                    return (
                      <button
                        key={config.subject_id}
                        onClick={() => handleJumpToSubject(idx)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition ${
                          isActive ? 'bg-yellow-100 text-yellow-900' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {config.subject_name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Questions</p>
                <QuestionGrid
                  questions={questions}
                  currentQuestionIndex={currentQuestionIndex}
                  selectedAnswers={selectedAnswers}
                  onJump={handleJumpToQuestion}
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-sm w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Submit Exam?</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Are you sure you want to submit your exam? You have answered{' '}
              <strong>{totalAnsweredAcross}</strong> out of <strong>{totalQuestionsAcross}</strong> questions across all subjects.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 border border-gray-300 rounded-lg transition font-medium"
              >
                Return to Exam
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionGrid({
  questions,
  currentQuestionIndex,
  selectedAnswers,
  onJump,
  compact = false
}: {
  questions: Question[]
  currentQuestionIndex: number
  selectedAnswers: { [key: number]: number | null }
  onJump: (questionIndex: number) => void
  compact?: boolean
}) {
  return (
    <div className={`grid gap-1.5 flex-1 ${compact ? 'grid-cols-5' : 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12'}`}>
      {questions.map((question, index) => {
        const isCurrent = index === currentQuestionIndex
        const isAnswered = selectedAnswers[question.id] !== null && selectedAnswers[question.id] !== undefined

        return (
          <button
            key={question.id}
            onClick={() => onJump(index)}
            className={`h-9 min-w-9 px-2 rounded-sm text-xs font-bold border transition ${
              isCurrent
                ? 'bg-blue-500 text-white border-blue-600'
                : isAnswered
                  ? 'bg-yellow-600 text-white border-yellow-700 hover:bg-yellow-700'
                  : 'bg-yellow-100 text-yellow-900 border-yellow-200 hover:bg-yellow-200'
            }`}
          >
            {index + 1}
          </button>
        )
      })}
    </div>
  )
}

function FloatingCalculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState('0')
  const [storedValue, setStoredValue] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const inputDigit = (digit: string) => {
    setDisplay(prev => {
      if (waitingForOperand) {
        setWaitingForOperand(false)
        return digit
      }
      return prev === '0' ? digit : `${prev}${digit}`
    })
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (!display.includes('.')) setDisplay(prev => `${prev}.`)
  }

  const clear = () => {
    setDisplay('0')
    setStoredValue(null)
    setOperator(null)
    setWaitingForOperand(false)
  }

  const backspace = () => {
    if (waitingForOperand) return
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0')
  }

  const calculate = (first: number, second: number, op: string) => {
    switch (op) {
      case '+':
        return first + second
      case '-':
        return first - second
      case '*':
        return first * second
      case '/':
        return second === 0 ? NaN : first / second
      default:
        return second
    }
  }

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display)

    if (storedValue === null) {
      setStoredValue(inputValue)
    } else if (operator) {
      const result = calculate(storedValue, inputValue, operator)
      setDisplay(Number.isFinite(result) ? String(parseFloat(result.toFixed(10))) : 'Error')
      setStoredValue(result)
    }

    setWaitingForOperand(true)
    setOperator(nextOperator === '=' ? null : nextOperator)
  }

  const buttons = useMemo(() => [
    ['C', 'Back', '/'],
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '.', '='],
  ], [])

  const handleButton = (value: string) => {
    if (/^\d$/.test(value)) inputDigit(value)
    else if (value === '.') inputDecimal()
    else if (value === 'C') clear()
    else if (value === 'Back') backspace()
    else if (value === '=') performOperation('=')
    else if (value === '/') performOperation('/')
  }

  return (
    <div className="fixed sm:absolute right-3 top-28 sm:right-8 sm:top-8 z-40 w-[260px] bg-white border border-orange-200 rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-orange-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Calculator className="w-4 h-4" />
          Calculator
        </div>
        <button onClick={onClose} className="p-1 hover:bg-orange-700 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-3 mb-3 text-right text-2xl font-mono text-gray-900 overflow-hidden">
          {display}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {buttons.flat().map(value => (
            <button
              key={value}
              onClick={() => handleButton(value)}
              className={`h-11 rounded-lg font-bold transition ${
                value === '='
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : value === 'C' || value === 'Back' || value === '/'
                    ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {value}
            </button>
          ))}
          {['+', '-', 'x'].map(value => (
            <button
              key={value}
              onClick={() => performOperation(value === 'x' ? '*' : value)}
              className="h-11 rounded-lg font-bold bg-orange-100 text-orange-800 hover:bg-orange-200 transition"
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
