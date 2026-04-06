import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import { MathText, stripHtmlKeepMath } from '../utils/mathRenderer'

interface Choice {
  id?: number
  text: string
  is_correct: boolean
}

interface QuestionCardProps {
  question: {
    id: number
    text: string
    image?: string
    choices: Choice[]
    year?: string
    explanation?: string
    created_at?: string
  }
  isSelected?: boolean
  onEdit: (question: any) => void
  onDelete: (questionId: number) => void
  onSelectionChange?: (questionId: number, selected: boolean) => void
}

export default function QuestionCard({
  question,
  isSelected = false,
  onEdit,
  onDelete,
  onSelectionChange
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const correctChoice = question.choices?.find(c => c.is_correct)
  const correctLabel = question.choices?.length
    ? ['A', 'B', 'C', 'D', 'E', 'F'][question.choices.findIndex(c => c.is_correct)] || 'Unknown'
    : 'Unknown'

  const handleImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    if (imageUrl.startsWith('/')) {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
      const baseUrl = apiBase.replace(/\/api\/?$/, '')
      return baseUrl + imageUrl
    }
    return imageUrl
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-white border-2 rounded-lg p-5 transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header with checkbox, question num, actions */}
      <div className="flex gap-3 items-start mb-3">
        {onSelectionChange && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectionChange(question.id, e.target.checked)}
            className="mt-1 w-4 h-4 cursor-pointer rounded"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm break-words line-clamp-2">
            Q{question.id}. <MathText text={question.text} />
          </div>
          {question.year && (
            <p className="text-xs text-gray-500 mt-0.5">Year: {question.year}</p>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(question)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Edit question"
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (confirm('Delete this question? This cannot be undone.')) {
                onDelete(question.id)
              }
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Delete question"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Image preview (always show if exists) */}
      {question.image && (
        <div className="mb-3 max-h-32 overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
          <img
            src={handleImageUrl(question.image)}
            alt="Question"
            className="max-h-32 object-contain"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Choices and info - collapsed by default */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2 border-t pt-3"
        >
          {/* Choices */}
          <div className="grid grid-cols-2 gap-2">
            {question.choices?.map((choice, idx) => {
              const choiceLabel = String.fromCharCode(65 + idx) // A, B, C, D...
              return (
                <div
                  key={choice.id || idx}
                  className={`text-xs p-2 rounded border ${
                    choice.is_correct
                      ? 'bg-green-50 border-green-300 text-green-900 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="font-semibold">{choiceLabel})</span> {choice.text}
                </div>
              )
            })}
          </div>

          {/* Correct answer indicator */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600">
              ✓ <span className="text-green-700">Correct: {correctLabel}</span>
            </p>
          </div>

          {/* Explanation */}
          {question.explanation && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-700">
              <p className="font-medium text-yellow-900 mb-1">Explanation:</p>
              <div className="line-clamp-3 overflow-hidden">
                <MathText text={stripHtmlKeepMath(question.explanation)} />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Collapsed summary */}
      {!expanded && (
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="font-medium">
            ✓ Correct: <span className="text-green-700 font-semibold">{correctLabel}</span>
          </span>
          {question.choices && (
            <span>{question.choices.length} options</span>
          )}
          {question.explanation && (
            <span className="flex items-center gap-1 text-blue-600">
              <span>Has explanation</span>
            </span>
          )}
          {question.image && (
            <span className="flex items-center gap-1 text-purple-600">
              <ImageIcon className="w-3 h-3" />
              Has image
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
