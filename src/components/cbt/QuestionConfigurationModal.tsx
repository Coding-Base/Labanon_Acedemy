import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Subject {
  id: number
  name: string
  question_count: number
}

interface SubjectConfig {
  subject_id: number
  subject_name: string
  num_questions: number
  available_questions: number
  year: string
}

interface YearOption {
  year: string
  question_count: number
}

interface QuestionConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  selectedSubjects: Subject[]
  onConfigureQuestions: (config: SubjectConfig[]) => void
  trialQuestionsLimit?: number
}

export default function QuestionConfigurationModal({
  isOpen,
  onClose,
  selectedSubjects,
  onConfigureQuestions,
  trialQuestionsLimit
}: QuestionConfigurationModalProps) {
  const [configs, setConfigs] = useState<SubjectConfig[]>([])
  const [error, setError] = useState<string | null>(null)
  const [yearsMap, setYearsMap] = useState<Record<number, YearOption[]>>({})
  const [loadingYears, setLoadingYears] = useState<Record<number, boolean>>({})

  // Fetch available years for all selected subjects
  useEffect(() => {
    if (!isOpen || !selectedSubjects || selectedSubjects.length === 0) return

    const fetchYears = async () => {
      const token = localStorage.getItem('access')
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined

      for (const subject of selectedSubjects) {
        setLoadingYears(prev => ({ ...prev, [subject.id]: true }))
        try {
          const res = await axios.get(`${API_BASE}/cbt/subjects/${subject.id}/available_years/`, { headers })
          if (res.data?.years) {
            setYearsMap(prev => ({ ...prev, [subject.id]: res.data.years }))
          }
        } catch (e) {
          console.error(`Failed to fetch years for subject ${subject.id}`, e)
        } finally {
          setLoadingYears(prev => ({ ...prev, [subject.id]: false }))
        }
      }
    }

    fetchYears()
  }, [isOpen, selectedSubjects])

  // Reinitialize configs when selectedSubjects changes
  useEffect(() => {
    if (selectedSubjects && selectedSubjects.length > 0) {
      setConfigs(
        selectedSubjects.map(s => ({
          subject_id: s.id,
          subject_name: s.name,
          num_questions: Math.min(trialQuestionsLimit || 10, s.question_count || 0),
          available_questions: s.question_count || 0,
          year: 'simulate'
        }))
      )
    }
  }, [selectedSubjects, trialQuestionsLimit])

  const handleYearChange = (subjectId: number, selectedYear: string) => {
    setError(null)
    const subject = selectedSubjects.find(s => s.id === subjectId)
    const availableYearsForSubj = yearsMap[subjectId] || []

    let maxAvailable = subject?.question_count || 0
    if (selectedYear !== 'simulate') {
      const found = availableYearsForSubj.find(y => String(y.year) === selectedYear)
      if (found) {
        maxAvailable = found.question_count
      }
    }

    setConfigs(prev =>
      prev.map(cfg => {
        if (cfg.subject_id !== subjectId) return cfg
        const adjustedNum = Math.min(cfg.num_questions, maxAvailable > 0 ? maxAvailable : 1)
        return {
          ...cfg,
          year: selectedYear,
          available_questions: maxAvailable,
          num_questions: Math.max(1, adjustedNum)
        }
      })
    )
  }

  const handleConfigChange = (subjectId: number, value: number) => {
    setError(null)
    const numValue = Math.max(1, parseInt(String(value)) || 1)
    const subject = configs.find(c => c.subject_id === subjectId)
    
    if (trialQuestionsLimit !== undefined && numValue > trialQuestionsLimit) {
      setError(`Free trial is limited to maximum ${trialQuestionsLimit} questions per subject`)
      return
    }

    if (subject && numValue > subject.available_questions) {
      return
    }

    setConfigs(prev =>
      prev.map(cfg =>
        cfg.subject_id === subjectId
          ? { ...cfg, num_questions: numValue }
          : cfg
      )
    )
  }

  const handleProceed = () => {
    setError(null)

    // Validation
    for (const config of configs) {
      if (config.num_questions < 1) {
        setError(`${config.subject_name}: Minimum 1 question required`)
        return
      }
      if (trialQuestionsLimit !== undefined && config.num_questions > trialQuestionsLimit) {
        setError(`${config.subject_name}: Free trial is limited to maximum ${trialQuestionsLimit} questions per subject`)
        return
      }
      if (config.num_questions > config.available_questions) {
        const yearContext = config.year !== 'simulate' ? ` for year ${config.year}` : ''
        setError(`${config.subject_name}: Maximum ${config.available_questions} questions available${yearContext}`)
        return
      }
    }

    onConfigureQuestions(configs)
  }

  if (!isOpen) return null

  const totalQuestions = configs.reduce((sum, cfg) => sum + cfg.num_questions, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border dark:border-slate-700">
        
        {/* HEADER (Fixed) */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-slate-100">Configure Questions per Subject</h2>
          <p className="text-gray-600 dark:text-slate-400">Set the number of questions for each subject</p>
        </div>

        {/* BODY (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {configs.map((config) => (
              <div key={config.subject_id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-850">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{config.subject_name}</h3>
                    {/* Maximum available questions text hidden */}
                  </div>
                </div>

                {/* Question Year Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 min-w-fit">
                    Select Exam Year:
                  </label>
                  {loadingYears[config.subject_id] ? (
                    <div className="text-xs text-gray-400 dark:text-slate-500 py-2">Loading available years...</div>
                  ) : (
                    <select
                      value={config.year || 'simulate'}
                      onChange={(e) => handleYearChange(config.subject_id, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm bg-white dark:bg-slate-800 font-medium text-gray-800 dark:text-slate-200"
                    >
                      <option value="simulate">🔀 Simulate (Mixed Years - Auto Pick)</option>
                      {(yearsMap[config.subject_id] || []).map((y) => (
                        <option key={y.year} value={y.year}>
                          📅 Year {y.year}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 min-w-fit">
                    Number of Questions {trialQuestionsLimit !== undefined ? `(Max ${trialQuestionsLimit} for Free Trial)` : ''}:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={trialQuestionsLimit !== undefined ? Math.min(trialQuestionsLimit, config.available_questions) : config.available_questions}
                    value={config.num_questions}
                    onChange={(e) => handleConfigChange(config.subject_id, parseInt(e.target.value) || 1)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="mt-8 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
            <p className="text-gray-700 dark:text-slate-300">
              <span className="font-semibold text-gray-900 dark:text-slate-100">Total Questions:</span>{' '}
              <span className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{totalQuestions}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
              You will be tested on {configs.length} subject{configs.length !== 1 ? 's' : ''} with {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} in total.
            </p>
          </div>
        </div>

        {/* FOOTER (Fixed) */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex-shrink-0 bg-gray-50 dark:bg-slate-900/50 rounded-b-lg">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition font-medium"
            >
              Back
            </button>
            <button
              onClick={handleProceed}
              className="flex-1 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
            >
              Continue
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
