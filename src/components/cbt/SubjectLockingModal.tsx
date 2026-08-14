import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Check, ChevronRight, AlertCircle } from 'lucide-react'

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
  subject_select_limit?: number
}

interface SubjectLockingModalProps {
  isOpen: boolean
  exam: Exam | null
  onSubjectsSelected: (subjects: Subject[], subjectIds: number[]) => void
  onClose: () => void
}

export default function SubjectLockingModal({
  isOpen,
  exam,
  onSubjectsSelected,
  onClose
}: SubjectLockingModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const limit = exam?.subject_select_limit || 5

  useEffect(() => {
    if (isOpen && exam) {
      fetchSubjects()
      setShowConfirmation(false)
    }
  }, [isOpen, exam])

  const fetchSubjects = async () => {
    if (!exam) return
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_BASE}/cbt/exams/${exam.id}/subjects/`)
      setSubjects(response.data)
      setSelectedSubjects([])
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load subjects')
      console.error('Error fetching subjects:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSubject = (subject: Subject) => {
    setSelectedSubjects(prev => {
      const isSelected = prev.some(s => s.id === subject.id)
      if (isSelected) {
        return prev.filter(s => s.id !== subject.id)
      } else if (prev.length < limit) {
        return [...prev, subject]
      }
      return prev
    })
  }

  const handleConfirm = () => {
    if (selectedSubjects.length === 0) {
      setError('Please select at least 1 subject')
      return
    }
    if (selectedSubjects.length > limit) {
      setError(`You can select at most ${limit} subjects`)
      return
    }
    setError(null)
    setShowConfirmation(true)
  }

  const handleFinalProceed = () => {
    setShowConfirmation(false)
    const subjectIds = selectedSubjects.map(s => s.id)
    onSubjectsSelected(selectedSubjects, subjectIds)
  }

  const isValidSelection = selectedSubjects.length > 0 && selectedSubjects.length <= limit
  const isMaxSelected = selectedSubjects.length >= limit

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-6 border-b border-yellow-800 z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Select Exam Subjects</h2>
                    <p className="text-yellow-100 text-sm">Choose up to {limit} subjects to unlock for this exam</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition text-xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Exam Info */}
              {exam && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-1">Exam:</h3>
                  <p className="text-yellow-800">{exam.title}</p>
                </div>
              )}

              {/* Selection Counter */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedSubjects.length}
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Selected Subjects</p>
                    <p className="text-sm text-blue-700">
                      {selectedSubjects.length === 0 && `Pick up to ${limit} subjects`}
                      {selectedSubjects.length > 0 && selectedSubjects.length <= limit && `Selected ${selectedSubjects.length} of max ${limit} subjects`}
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{
                    scale: isValidSelection ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 0.5, repeat: isValidSelection ? Infinity : 0 }}
                >
                  {isValidSelection ? (
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  )}
                </motion.div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin" />
                </div>
              )}

              {/* Subjects Grid */}
              {!loading && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 uppercase tracking-wide">Available Subjects</p>
                  <div className="grid grid-cols-1 gap-3">
                    {subjects.map(subject => {
                      const isSelected = selectedSubjects.some(s => s.id === subject.id)
                      const isDisabled = isMaxSelected && !isSelected

                      return (
                        <motion.button
                          key={subject.id}
                          whileHover={isDisabled ? {} : { scale: 1.01 }}
                          whileTap={isDisabled ? {} : { scale: 0.99 }}
                          onClick={() => !isDisabled && toggleSubject(subject)}
                          disabled={isDisabled}
                          className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100/50 shadow-sm'
                              : isDisabled
                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                              : 'border-gray-300 hover:border-yellow-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{subject.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">{subject.description}</p>
                            </div>
                            <motion.div
                              animate={{
                                scale: isSelected ? 1 : 0.8,
                                opacity: isSelected ? 1 : 0,
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                  : 'bg-gray-300'
                              }`}
                            >
                              <Check className="w-5 h-5 text-white" />
                            </motion.div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Selected Subjects Summary */}
              {selectedSubjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <p className="text-sm font-medium text-green-900 mb-2">Your Selection:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map(subject => (
                      <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-green-300 rounded-full px-3 py-1 text-sm font-medium text-green-800 flex items-center space-x-2 shadow-sm"
                      >
                        <span>{subject.name}</span>
                        <button
                          onClick={() => toggleSubject(subject)}
                          className="hover:text-red-600 transition font-bold"
                        >
                          ✕
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 z-10">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <motion.button
                whileHover={isValidSelection ? { scale: 1.02 } : {}}
                whileTap={isValidSelection ? { scale: 0.98 } : {}}
                onClick={handleConfirm}
                disabled={!isValidSelection}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  isValidSelection
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue to Payment
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>

          {/* Nested Confirmation Modal Overlay */}
          <AnimatePresence>
            {showConfirmation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
                onClick={() => setShowConfirmation(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 flex flex-col"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Confirm Subjects</h3>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    Are you sure you want to select these subjects? Once unlocked, your subject selection <strong className="text-red-600">cannot be changed</strong>.
                  </p>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Selected Subjects</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubjects.map(subject => (
                        <span
                          key={subject.id}
                          className="bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm"
                        >
                          {subject.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleFinalProceed}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Confirm & Proceed
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
