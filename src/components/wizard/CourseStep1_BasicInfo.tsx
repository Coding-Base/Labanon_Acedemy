import React from 'react'
import { AlertCircle } from 'lucide-react'
import { SUPPORTED_CURRENCIES } from '../../constants/currencies'

const levels = ['Beginner', 'Intermediate', 'Professional'] as const
type Level = typeof levels[number]

interface CourseStep1Props {
  title: string
  description: string
  level: Level
  price: string
  currency: string
  requiredTools: string
  outcome: string
  courseCategory: string
  errors: Record<string, any>
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onLevelChange: (value: Level) => void
  onPriceChange: (value: string) => void
  onCurrencyChange: (value: string) => void
  onRequiredToolsChange: (value: string) => void
  onOutcomeChange: (value: string) => void
  onCourseCategoryChange: (value: string) => void
}

/**
 * Step 1: Basic Course Information
 * Title, Description, Level, Price, Currency, etc.
 */
export function CourseStep1_BasicInfo({
  title,
  description,
  level,
  price,
  currency,
  requiredTools,
  outcome,
  courseCategory,
  errors,
  onTitleChange,
  onDescriptionChange,
  onLevelChange,
  onPriceChange,
  onCurrencyChange,
  onRequiredToolsChange,
  onOutcomeChange,
  onCourseCategoryChange,
}: CourseStep1Props) {
  const isTitleValid = title.trim().length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Course Information</h2>
        <p className="text-gray-600">Start by providing essential details about your course</p>
      </div>

      {/* Course Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g., Advanced Python Programming"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
            errors.title
              ? 'border-red-300 focus:ring-red-500'
              : isTitleValid
              ? 'border-green-300 focus:ring-green-500'
              : 'border-gray-300 focus:ring-brand-500'
          }`}
        />
        {errors.title && (
          <div className="text-sm text-red-600 mt-1 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {Array.isArray(errors.title) ? errors.title[0] : errors.title}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">Make it clear and descriptive</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe what students will learn and what the course covers..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-xs text-gray-500 mt-1">{description.length} characters</p>
      </div>

      {/* Course Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Badge/Category
        </label>
        <select
          value={courseCategory}
          onChange={(e) => onCourseCategoryChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="other">General Course</option>
          <option value="beginner">Beginner Friendly</option>
          <option value="master">Master Class</option>
          <option value="professional">Professional Development</option>
        </select>
      </div>

      {/* Level & Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Level
          </label>
          <select
            value={level}
            onChange={(e) => onLevelChange(e.target.value as Level)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {levels.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price ({currency})
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Currency
        </label>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {SUPPORTED_CURRENCIES.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.code} - {curr.label}
            </option>
          ))}
        </select>
      </div>

      {/* Learning Outcome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Learning Outcome / Key Takeaway
        </label>
        <textarea
          value={outcome}
          onChange={(e) => onOutcomeChange(e.target.value)}
          placeholder="What will students be able to do after completing this course?"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Required Tools */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Tools/Software
        </label>
        <textarea
          value={requiredTools}
          onChange={(e) => onRequiredToolsChange(e.target.value)}
          placeholder="List any tools, software, or materials students need (e.g., Python 3.9+, VS Code, Zoom)"
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> Provide clear and detailed information to help students understand if your course is right for them.
        </p>
      </div>
    </div>
  )
}
