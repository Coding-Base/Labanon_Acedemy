import React, { useState, useMemo } from 'react'

interface Subject {
  subject_id: number
  subject_name: string
  num_questions: number
}

interface TestNamingAndTimeModalProps {
  isOpen: boolean
  onClose: () => void
  subjectConfigs: Subject[]
  onStartExam: (testName: string, timeLimit: number) => Promise<void>
  isLoading?: boolean
}

export default function TestNamingAndTimeModal({
  isOpen,
  onClose,
  subjectConfigs,
  onStartExam,
  isLoading = false
}: TestNamingAndTimeModalProps) {
  const [testName, setTestName] = useState('')
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(180)
  const [error, setError] = useState<string | null>(null)

  // Calculate reasonable default time (2-3 minutes per question)
  const totalQuestions = useMemo(
    () => subjectConfigs.reduce((sum, cfg) => sum + cfg.num_questions, 0),
    [subjectConfigs]
  )

  const handleStartExam = async () => {
    setError(null)

    // Validation
    if (!testName.trim()) {
      setError('Please enter a test name')
      return
    }

    if (testName.trim().length < 2) {
      setError('Test name must be at least 2 characters')
      return
    }

    if (testName.trim().length > 100) {
      setError('Test name must not exceed 100 characters')
      return
    }

    if (timeLimitMinutes < 1) {
      setError('Time limit must be at least 1 minute')
      return
    }

    if (timeLimitMinutes > 1440) {
      setError('Time limit cannot exceed 24 hours')
      return
    }

    try {
      await onStartExam(testName.trim(), timeLimitMinutes)
    } catch (err: any) {
      setError(err.message || 'Failed to start exam')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
        
        {/* HEADER (Fixed) */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-2xl font-bold mb-2">Name Your Test & Set Time Limit</h2>
          <p className="text-gray-600">Give your exam a name and set how long you have to complete it</p>
        </div>

        {/* BODY (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Test Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Name <span className="text-red-500">*</span>
              </label>
              <label className="block text-xs text-gray-500 mb-3">
                Example: "MY JAMB MOCK", "PHYSICS QUIZ", "COMBINED EXAM 2026"
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Enter a name for your test"
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-500 mt-2">
                {testName.length}/100 characters
              </p>
            </div>

            {/* Time Limit Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes) <span className="text-red-500">*</span>
              </label>
              <label className="block text-xs text-gray-500 mb-3">
                Suggested: {Math.ceil(totalQuestions * 2.5)} - {Math.ceil(totalQuestions * 3)} minutes
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Math.max(1, parseInt(e.target.value) || 180))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-2">
                {Math.floor(timeLimitMinutes / 60)}h {timeLimitMinutes % 60}m total
              </p>
            </div>

            {/* Test Summary */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Test Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    <strong>Test Name:</strong>
                  </span>
                  <span className="text-gray-900 font-medium">
                    {testName.trim() || '(Not set yet)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    <strong>Total Subjects:</strong>
                  </span>
                  <span className="text-gray-900 font-medium">{subjectConfigs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    <strong>Total Questions:</strong>
                  </span>
                  <span className="text-gray-900 font-medium">{totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">
                    <strong>Time Limit:</strong>
                  </span>
                  <span className="text-gray-900 font-medium">
                    {Math.floor(timeLimitMinutes / 60)}h {timeLimitMinutes % 60}m
                  </span>
                </div>
              </div>

              {/* Subjects Breakdown */}
              <div className="mt-4 pt-4 border-t border-yellow-200">
                <p className="text-xs font-medium text-gray-700 mb-2">Subjects:</p>
                <div className="space-y-1">
                  {subjectConfigs.map((cfg) => (
                    <div key={cfg.subject_id} className="text-xs text-gray-600 flex justify-between">
                      <span>{cfg.subject_name}</span>
                      <span className="font-medium">{cfg.num_questions} questions</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER (Fixed) */}
        <div className="p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-lg">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 font-medium"
            >
              Back
            </button>
            <button
              onClick={handleStartExam}
              disabled={!testName.trim() || isLoading}
              className="flex-1 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Starting...
                </>
              ) : (
                '🚀 Start Exam'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
