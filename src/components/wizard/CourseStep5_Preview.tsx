import React from 'react'
import { AlertCircle, CheckCircle2, Image as ImageIcon, Upload } from 'lucide-react'

interface CourseStep5Props {
  title: string
  description: string
  price: string
  currency: string
  level: string
  courseType: 'normal' | 'scheduled'
  modulesCount: number
  courseImagePreview: string | null
  onCourseImageInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  isSaving: boolean
  isPublishing: boolean
  isVerified: boolean
  verificationMessage?: string
  onSaveDraft: () => void
  onPublish: () => void
}

/**
 * Step 5: Preview & Publish
 * Review course information and publish or save as draft
 */
export function CourseStep5_Preview({
  title,
  description,
  price,
  currency,
  level,
  courseType,
  modulesCount,
  courseImagePreview,
  onCourseImageInput,
  isSaving,
  isPublishing,
  isVerified,
  verificationMessage,
  onSaveDraft,
  onPublish,
}: CourseStep5Props) {
  const isTitleValid = title.trim().length > 0
  const isDescriptionValid = description.trim().length > 0
  const hasContent = courseType === 'scheduled' || modulesCount > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Publish</h2>
        <p className="text-gray-600">Check your course details and publish when ready</p>
      </div>

      {/* Course Image Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Course Thumbnail Image
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative">
          <input
            type="file"
            accept="image/*"
            onChange={onCourseImageInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {courseImagePreview ? (
            <div className="flex flex-col items-center">
              <img
                src={courseImagePreview}
                alt="Course thumbnail"
                className="h-32 object-contain mb-3 rounded"
              />
              <p className="text-sm text-gray-700">Click to change image</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <ImageIcon className="w-12 h-12 mb-2" />
              <p className="font-medium">Click to upload course thumbnail</p>
              <p className="text-xs mt-1">PNG or JPG recommended</p>
            </div>
          )}
        </div>
      </div>

      {/* Course Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Course Summary</h3>

        {/* Title */}
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Title</p>
          <div className="flex items-start gap-2 mt-1">
            {isTitleValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium text-gray-900">{title || '(Not provided)'}</p>
              {!isTitleValid && (
                <p className="text-xs text-red-600 mt-1">Title is required</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Description</p>
          <div className="flex items-start gap-2 mt-1">
            {isDescriptionValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-gray-700 text-sm line-clamp-2">
                {description || '(Not provided)'}
              </p>
              {!isDescriptionValid && (
                <p className="text-xs text-red-600 mt-1">Description is required</p>
              )}
            </div>
          </div>
        </div>

        {/* Level & Price */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Level</p>
            <p className="font-medium text-gray-900 mt-1">{level}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Price</p>
            <p className="font-medium text-gray-900 mt-1">
              {price} {currency}
            </p>
          </div>
        </div>

        {/* Course Type */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-semibold">Course Type</p>
          <p className="font-medium text-gray-900 mt-1">
            {courseType === 'normal' ? 'Self-Paced' : 'Scheduled Live'}
          </p>
        </div>

        {/* Content Status */}
        {courseType === 'normal' && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase font-semibold">Modules</p>
            <div className="flex items-center gap-2 mt-1">
              {hasContent ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <p className="font-medium text-gray-900">
                {modulesCount} module{modulesCount !== 1 ? 's' : ''} created
              </p>
            </div>
            {!hasContent && (
              <p className="text-xs text-yellow-600 mt-2">
                Consider adding content modules before publishing
              </p>
            )}
          </div>
        )}
      </div>

      {/* Verification Status Banner */}
      {!isVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900">Account Not Verified</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {verificationMessage || 'Your account is pending verification. You can save this as a draft, but cannot publish until verified by the master admin.'}
              </p>
              <a
                href="/dashboard/compliance"
                className="text-sm font-medium text-yellow-700 hover:text-yellow-900 underline mt-2 inline-block"
              >
                Go to Compliance Dashboard →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onSaveDraft}
          disabled={!isTitleValid || !isDescriptionValid || isSaving}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Save as Draft
            </>
          )}
        </button>

        <button
          onClick={onPublish}
          disabled={!isTitleValid || !isDescriptionValid || isPublishing || !isVerified}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition ${
            isVerified && isTitleValid && isDescriptionValid
              ? 'bg-brand-600 hover:bg-brand-700 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'
          } disabled:opacity-50`}
          title={!isVerified ? 'Your account must be verified to publish' : 'Publish this course'}
        >
          {isPublishing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Publish Course
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> You can save as a draft and edit later, or publish now to make your course available to students.
        </p>
      </div>
    </div>
  )
}
