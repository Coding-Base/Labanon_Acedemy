import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react'
import QuestionCard from '../../components/QuestionCard'
import QuestionEditModal from '../../components/QuestionEditModal'
import showToast from '../../utils/toast'
import {
  fetchQuestionsForSubject,
  updateQuestionAndChoices,
  deleteQuestion,
  deleteQuestionsInBulk
} from '../../utils/questionAPI'

interface Subject {
  id: number
  name: string
  exam: number
}

interface QuestionManagementPageProps {
  subject: Subject
  onBack: () => void
}

const DEBOUNCE_DELAY = 500

export default function QuestionManagementPage({
  subject,
  onBack
}: QuestionManagementPageProps) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(
    new Set()
  )
  const [deleting, setDeleting] = useState(false)
  const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const PAGE_SIZE = 10

  // Fetch questions with search and pagination
  const loadQuestions = useCallback(async (page: number = 1, search: string = '') => {
    setLoading(true)
    try {
      const result = await fetchQuestionsForSubject(
        subject.id,
        page,
        PAGE_SIZE,
        search
      )

      setQuestions(result.results || [])
      setTotalCount(result.count || 0)
      setCurrentPage(page)
    } catch (err) {
      console.error('Failed to load questions:', err)
      showToast('Failed to load questions', 'error')
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [subject.id])

  // Initial load
  useEffect(() => {
    loadQuestions(1, '')
  }, [loadQuestions])

  // Handle search with debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current)
    }

    searchDebounceTimer.current = setTimeout(() => {
      setCurrentPage(1)
      loadQuestions(1, query)
    }, DEBOUNCE_DELAY)
  }

  // Handle edit
  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question)
    setShowEditModal(true)
  }

  // Handle save
  const handleSaveQuestion = async (updatePayload: any) => {
    if (!editingQuestion) return

    try {
      const updatedQuestion = await updateQuestionAndChoices(editingQuestion.id, updatePayload)
      
      // Update the question immediately in the list
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q.id === editingQuestion.id ? { ...q, ...updatedQuestion } : q
        )
      )
      
      showToast('Question updated successfully', 'success')
      setShowEditModal(false)
    } catch (err) {
      console.error('Failed to save question:', err)
      showToast('Failed to save question', 'error')
    }
  }

  // Handle delete single
  const handleDeleteQuestion = async (questionId: number) => {
    setDeleting(true)
    try {
      await deleteQuestion(questionId)
      showToast('Question deleted successfully', 'success')
      loadQuestions(currentPage, searchQuery)
    } catch (err) {
      console.error('Failed to delete question:', err)
      showToast('Failed to delete question', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedQuestionIds.size === 0) {
      showToast('Please select at least one question', 'error')
      return
    }

    if (
      !confirm(
        `Delete ${selectedQuestionIds.size} selected question(s)? This cannot be undone.`
      )
    ) {
      return
    }

    setDeleting(true)
    try {
      await deleteQuestionsInBulk(Array.from(selectedQuestionIds))
      showToast(
        `${selectedQuestionIds.size} question(s) deleted successfully`,
        'success'
      )
      setSelectedQuestionIds(new Set())
      loadQuestions(currentPage, searchQuery)
    } catch (err) {
      console.error('Bulk delete failed:', err)
      showToast('Failed to delete questions', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Handle question selection
  const toggleQuestionSelection = (questionId: number, selected: boolean) => {
    const newSelected = new Set(selectedQuestionIds)
    if (selected) {
      newSelected.add(questionId)
    } else {
      newSelected.delete(questionId)
    }
    setSelectedQuestionIds(newSelected)
  }

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedQuestionIds.size === questions.length) {
      setSelectedQuestionIds(new Set())
    } else {
      setSelectedQuestionIds(new Set(questions.map(q => q.id)))
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div>
      {/* Header */}
      <div className="mb-6 pb-4 border-b-2 border-gray-200">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-2 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Subjects
        </button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Manage Questions: {subject.name}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {totalCount} question{totalCount !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Search and bulk actions */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search questions by text..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedQuestionIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedQuestionIds.size === questions.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedQuestionIds.size} selected
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
          <span className="text-gray-600">Loading questions...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && questions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchQuery
              ? 'No questions match your search'
              : 'No questions found for this subject'}
          </p>
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Questions list */}
      {!loading && questions.length > 0 && (
        <div className="space-y-3 mb-8">
          {questions.map(question => (
            <QuestionCard
              key={question.id}
              question={question}
              isSelected={selectedQuestionIds.has(question.id)}
              onEdit={handleEditQuestion}
              onDelete={handleDeleteQuestion}
              onSelectionChange={toggleQuestionSelection}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadQuestions(currentPage - 1, searchQuery)}
            disabled={currentPage === 1 || loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </motion.button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <motion.button
                key={page}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => loadQuestions(page, searchQuery)}
                disabled={loading}
                className={`w-8 h-8 rounded-lg font-medium transition-all ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {page}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadQuestions(currentPage + 1, searchQuery)}
            disabled={currentPage === totalPages || loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      )}

      {/* Edit Modal */}
      <QuestionEditModal
        isOpen={showEditModal}
        question={editingQuestion}
        onClose={() => {
          setShowEditModal(false)
          setEditingQuestion(null)
        }}
        onSave={handleSaveQuestion}
      />
    </div>
  )
}
