import React, { useState, useEffect } from 'react'

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
}

interface QuestionConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  selectedSubjects: Subject[]
  onConfigureQuestions: (config: SubjectConfig[]) => void
}

export default function QuestionConfigurationModal({
  isOpen,
  onClose,
  selectedSubjects,
  onConfigureQuestions
}: QuestionConfigurationModalProps) {
  const [configs, setConfigs] = useState<SubjectConfig[]>([])
  const [error, setError] = useState<string | null>(null)

  // Reinitialize configs when selectedSubjects changes
  useEffect(() => {
    if (selectedSubjects && selectedSubjects.length > 0) {
      setConfigs(
        selectedSubjects.map(s => ({
          subject_id: s.id,
          subject_name: s.name,
          num_questions: Math.min(10, s.question_count || 0),
          available_questions: s.question_count || 0
        }))
      )
    }
  }, [selectedSubjects])

  const handleConfigChange = (subjectId: number, value: number) => {
    setError(null)
    const numValue = Math.max(1, parseInt(String(value)) || 1)
    const subject = configs.find(c => c.subject_id === subjectId)
    
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
      if (config.num_questions > config.available_questions) {
        setError(`${config.subject_name}: Maximum ${config.available_questions} questions available`)
        return
      }
    }

    onConfigureQuestions(configs)
  }

  if (!isOpen) return null

  const totalQuestions = configs.reduce((sum, cfg) => sum + cfg.num_questions, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
        
        {/* HEADER (Fixed) */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-2xl font-bold mb-2">Configure Questions per Subject</h2>
          <p className="text-gray-600">Set the number of questions for each subject</p>
        </div>

        {/* BODY (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {configs.map((config) => (
              <div key={config.subject_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{config.subject_name}</h3>
                    <p className="text-sm text-gray-500">
                      Maximum available: {config.available_questions} questions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 min-w-fit">
                    Number of Questions:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={config.available_questions}
                    value={config.num_questions}
                    onChange={(e) => handleConfigChange(config.subject_id, parseInt(e.target.value) || 1)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-600 min-w-fit">
                    / {config.available_questions}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">Total Questions:</span>{' '}
              <span className="text-xl font-bold text-yellow-700">{totalQuestions}</span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              You will be tested on {configs.length} subject{configs.length !== 1 ? 's' : ''} with {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} in total.
            </p>
          </div>
        </div>

        {/* FOOTER (Fixed) */}
        <div className="p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-lg">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
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
