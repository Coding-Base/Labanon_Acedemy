import React, { useState } from 'react'
import { AlertCircle, Search } from 'lucide-react'
import { SUPPORTED_CURRENCIES } from '../../constants/currencies'
import useDebounce from '../../utils/useDebounce'

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
  isSeries?: boolean
  selectedSubCourseIds?: number[]
  availableCourses?: any[]
  errors: Record<string, any>
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onLevelChange: (value: Level) => void
  onPriceChange: (value: string) => void
  onCurrencyChange: (value: string) => void
  onRequiredToolsChange: (value: string) => void
  onOutcomeChange: (value: string) => void
  onCourseCategoryChange: (value: string) => void
  onIsSeriesChange?: (value: boolean) => void
  onSubCourseIdsChange?: (ids: number[]) => void
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
  isSeries = false,
  selectedSubCourseIds = [],
  availableCourses = [],
  errors,
  onTitleChange,
  onDescriptionChange,
  onLevelChange,
  onPriceChange,
  onCurrencyChange,
  onRequiredToolsChange,
  onOutcomeChange,
  onCourseCategoryChange,
  onIsSeriesChange,
  onSubCourseIdsChange,
}: CourseStep1Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const isTitleValid = title.trim().length > 0

  const toggleSubCourse = (courseId: number) => {
    if (!onSubCourseIdsChange) return
    if (selectedSubCourseIds.includes(courseId)) {
      onSubCourseIdsChange(selectedSubCourseIds.filter(id => id !== courseId))
    } else {
      onSubCourseIdsChange([...selectedSubCourseIds, courseId])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Course Information</h2>
        <p className="text-gray-600">Start by providing essential details about your course</p>
      </div>

      {/* Course Nature Selector (Singular vs Series) */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <label className="block text-sm font-bold text-gray-900 mb-3">Course Nature *</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              onIsSeriesChange?.(false)
            }}
            className={`p-4 rounded-xl border-2 text-left transition ${
              !isSeries ? 'border-brand-600 bg-brand-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <h4 className="font-semibold text-gray-900">Singular Course</h4>
            <p className="text-xs text-gray-600 mt-1">A standalone course with its own modules, lessons, quizzes, and certificate.</p>
          </button>

          <button
            type="button"
            onClick={() => {
              onIsSeriesChange?.(true)
              onPriceChange('0')
            }}
            className={`p-4 rounded-xl border-2 text-left transition ${
              isSeries ? 'border-brand-600 bg-brand-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <h4 className="font-semibold text-gray-900">Series (Umbrella Course)</h4>
            <p className="text-xs text-gray-600 mt-1">An umbrella course grouping multiple existing courses. Completing all awards a Series certificate!</p>
          </button>
        </div>
      </div>

      {/* Sub-courses Picker for Series */}
      {isSeries && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-amber-950">Sub-courses in this Series *</h3>
              <p className="text-xs text-amber-800">Select the courses that belong under this umbrella Series.</p>
            </div>
            <span className="text-xs font-semibold bg-amber-200 text-amber-900 px-3 py-1 rounded-full">
              {selectedSubCourseIds.length} Selected
            </span>
          </div>

          {/* Search bar inside Series selector */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-amber-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500 bg-white"
            />
          </div>

          {availableCourses.length === 0 ? (
            <p className="text-xs text-amber-700 italic">No existing courses found. Create standard courses first to group them into a Series.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pt-2">
              {availableCourses
                .filter(c => !c.is_series && c.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
                .map((c) => {
                  const isSelected = selectedSubCourseIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleSubCourse(c.id)}
                      className={`p-3 rounded-lg border text-left flex items-start justify-between transition ${
                        isSelected
                          ? 'border-amber-600 bg-white shadow-sm ring-1 ring-amber-600'
                          : 'border-amber-200 bg-white/60 hover:bg-white'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-xs text-gray-900 line-clamp-1">{c.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{c.level} • ₦{c.price || 0}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 pointer-events-none"
                      />
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      )}


      {/* Course/Series Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isSeries ? 'Series Title *' : 'Course Title *'}
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
      <div className={isSeries ? "block" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
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

        {!isSeries && (
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
        )}
      </div>

      {/* Currency */}
      {!isSeries && (
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
      )}


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
