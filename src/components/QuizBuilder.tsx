import React, { useState } from 'react'
import { Trash2, Plus, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

type QuizOption = {
  id?: number | string
  text: string
  is_correct: boolean
}

type QuizQuestion = {
  id?: number | string
  text: string
  points: number
  explanation?: string
  options: QuizOption[]
}

type Quiz = {
  id?: number | string
  title: string
  description?: string
  passing_score: number
  is_required: boolean
  questions: QuizQuestion[]
}

interface QuizBuilderProps {
  quiz: Quiz | null
  onQuizChange: (quiz: Quiz) => void
}

export function QuizBuilder({ quiz, onQuizChange }: QuizBuilderProps) {
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null)
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)
  const [questionText, setQuestionText] = useState('')
  const [questionPoints, setQuestionPoints] = useState('1')
  const [questionExplanation, setQuestionExplanation] = useState('')
  const [options, setOptions] = useState<QuizOption[]>([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ])

  if (!quiz) {
    return (
      <div className="text-center py-6 text-gray-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
        <p>No quiz created yet. Create modules and lessons first.</p>
      </div>
    )
  }

  const addQuestion = () => {
    if (!questionText.trim()) return
    if (options.filter(o => o.text.trim()).length < 2) {
      alert('Please add at least 2 answer options')
      return
    }
    if (!options.some(o => o.is_correct)) {
      alert('Please mark at least one option as correct')
      return
    }

    const newQuestion: QuizQuestion = {
      text: questionText.trim(),
      points: parseInt(questionPoints) || 1,
      explanation: questionExplanation,
      options: options.filter(o => o.text.trim())
    }

    const updatedQuestions = editingQuestionIndex !== null
      ? quiz.questions.map((q, idx) =>
          idx === editingQuestionIndex ? { ...q, ...newQuestion } : q
        )
      : [...quiz.questions, newQuestion]

    onQuizChange({ ...quiz, questions: updatedQuestions })
    resetForm()
  }

  const deleteQuestion = (index: number) => {
    const updatedQuestions = quiz.questions.filter((_, idx) => idx !== index)
    onQuizChange({ ...quiz, questions: updatedQuestions })
  }

  const resetForm = () => {
    setQuestionText('')
    setQuestionPoints('1')
    setQuestionExplanation('')
    setOptions([
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ])
    setEditingQuestionIndex(null)
  }

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options]
    newOptions[index].text = text
    setOptions(newOptions)
  }

  const handleOptionCorrectToggle = (index: number) => {
    const newOptions = [...options]
    newOptions[index].is_correct = !newOptions[index].is_correct
    setOptions(newOptions)
  }

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              value={quiz.title}
              onChange={(e) => onQuizChange({ ...quiz, title: e.target.value })}
              placeholder="e.g., Module 1 Assessment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passing Score (%)
            </label>
            <input
              type="number"
              value={quiz.passing_score}
              onChange={(e) => onQuizChange({ ...quiz, passing_score: parseInt(e.target.value) || 60 })}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer h-fit">
              <input
                type="checkbox"
                checked={quiz.is_required}
                onChange={(e) => onQuizChange({ ...quiz, is_required: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Required</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Description (Optional)
          </label>
          <textarea
            value={quiz.description || ''}
            onChange={(e) => onQuizChange({ ...quiz, description: e.target.value })}
            placeholder="Tell students what this quiz covers..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Questions List */}
      {quiz.questions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p>No questions yet. Add your first question below.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Questions ({quiz.questions.length})</h3>
            <span className="text-sm text-gray-600">Total Points: {totalPoints}</span>
          </div>
          {quiz.questions.map((question, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() =>
                  setExpandedQuestionIndex(expandedQuestionIndex === idx ? null : idx)
                }
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
              >
                <div className="text-left flex-1">
                  <span className="font-medium text-gray-900">Q{idx + 1}: {question.text.substring(0, 60)}</span>
                  <span className="ml-2 text-xs text-gray-500">({question.points} pts)</span>
                </div>
                {expandedQuestionIndex === idx ? (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {expandedQuestionIndex === idx && (
                <div className="p-4 border-t border-gray-200 space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 mb-2">{question.text}</p>
                    <div className="space-y-2">
                      {question.options.map((option, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <input
                            type="radio"
                            name={`correct-${idx}`}
                            disabled
                            checked={option.is_correct}
                            className="w-4 h-4"
                          />
                          <span className="flex-1 text-gray-700">{option.text}</span>
                          {option.is_correct && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {question.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-900">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => {
                        setEditingQuestionIndex(idx)
                        setQuestionText(question.text)
                        setQuestionPoints(String(question.points))
                        setQuestionExplanation(question.explanation || '')
                        setOptions(question.options)
                        setExpandedQuestionIndex(null)
                      }}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded transition flex items-center gap-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteQuestion(idx)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Question Form */}
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-brand-900">
          {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Text *
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="What is the main topic of this lesson?"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points for this Question *
            </label>
            <input
              type="number"
              value={questionPoints}
              onChange={(e) => setQuestionPoints(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Explanation (Optional)
          </label>
          <textarea
            value={questionExplanation}
            onChange={(e) => setQuestionExplanation(e.target.value)}
            placeholder="Explain the correct answer to help students learn..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Answer Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Answer Options *
          </label>
          <div className="space-y-2">
            {options.map((option, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="radio"
                  name="correct-answer"
                  checked={option.is_correct}
                  onChange={() => handleOptionCorrectToggle(idx)}
                  className="w-4 h-4 flex-shrink-0"
                  title="Mark as correct answer"
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => setOptions([...options, { text: '', is_correct: false }])}
            className="mt-2 text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Another Option
          </button>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <button
            onClick={addQuestion}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
          >
            {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
          </button>
          {editingQuestionIndex !== null && (
            <button
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
