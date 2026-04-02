import React from 'react'
import { Calendar, Clock, MapPin, Link as LinkIcon, AlertCircle } from 'lucide-react'

interface CourseStep2Props {
  courseType: 'normal' | 'scheduled'
  startDate: string
  endDate: string
  meetingTime: string
  meetingPlace: string
  meetingLink: string
  errors: Record<string, any>
  onCourseTypeChange: (type: 'normal' | 'scheduled') => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onMeetingTimeChange: (value: string) => void
  onMeetingPlaceChange: (value: string) => void
  onMeetingLinkChange: (value: string) => void
}

/**
 * Step 2: Course Structure
 * Choose between Normal (self-paced) or Scheduled (live lessons) courses
 */
export function CourseStep2_Structure({
  courseType,
  startDate,
  endDate,
  meetingTime,
  meetingPlace,
  meetingLink,
  errors,
  onCourseTypeChange,
  onStartDateChange,
  onEndDateChange,
  onMeetingTimeChange,
  onMeetingPlaceChange,
  onMeetingLinkChange,
}: CourseStep2Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Structure</h2>
        <p className="text-gray-600">Decide how your course will be delivered to students</p>
      </div>

      {/* Course Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Normal Course Card */}
        <button
          onClick={() => onCourseTypeChange('normal')}
          className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
            courseType === 'normal'
              ? 'border-brand-600 bg-brand-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${courseType === 'normal' ? 'bg-brand-600' : 'bg-gray-200'}`}>
              <svg
                className={`w-6 h-6 ${courseType === 'normal' ? 'text-white' : 'text-gray-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C6.448 6.253 3 9.92 3 14.477M12 6.253c5.552 0 9 3.667 9 8.224m0 0a5.652 5.652 0 00-9-8.224m9 8.224c0 5.074-3.665 8.773-9 8.773"
                />
              </svg>
            </div>
            <div className="text-left flex-1">
              <h3 className={`font-semibold ${courseType === 'normal' ? 'text-brand-900' : 'text-gray-900'}`}>
                Self-Paced Course
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Students learn at their own pace with recorded videos, lessons, and quizzes
              </p>
            </div>
            {courseType === 'normal' && (
              <div className="text-brand-600 mt-1">✓</div>
            )}
          </div>
        </button>

        {/* Scheduled Course Card */}
        <button
          onClick={() => onCourseTypeChange('scheduled')}
          className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
            courseType === 'scheduled'
              ? 'border-brand-600 bg-brand-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${courseType === 'scheduled' ? 'bg-brand-600' : 'bg-gray-200'}`}>
              <Calendar className={`w-6 h-6 ${courseType === 'scheduled' ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <div className="text-left flex-1">
              <h3 className={`font-semibold ${courseType === 'scheduled' ? 'text-brand-900' : 'text-gray-900'}`}>
                Scheduled Live Course
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Live lessons on specific dates and times with real-time interaction
              </p>
            </div>
            {courseType === 'scheduled' && (
              <div className="text-brand-600 mt-1">✓</div>
            )}
          </div>
        </button>
      </div>

      {/* Scheduled Course Specific Fields */}
      {courseType === 'scheduled' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Schedule Details</h3>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.dates
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-brand-500'
                  }`}
                />
              </div>
              {errors.dates && (
                <p className="text-sm text-red-600 mt-1">{errors.dates}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Meeting Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => onMeetingTimeChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.time
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-brand-500'
                }`}
              />
            </div>
            {errors.time && (
              <p className="text-sm text-red-600 mt-1">{errors.time}</p>
            )}
          </div>

          {/* Meeting Place */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Place *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={meetingPlace}
                onChange={(e) => onMeetingPlaceChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
              >
                <option value="zoom">Zoom</option>
                <option value="google-meet">Google Meet</option>
                <option value="teams">Microsoft Teams</option>
                <option value="webex">Webex</option>
                <option value="physical">Physical/In-person</option>
              </select>
            </div>
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Link *
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => onMeetingLinkChange(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.link
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-brand-500'
                }`}
              />
            </div>
            {errors.link && (
              <p className="text-sm text-red-600 mt-1">{errors.link}</p>
            )}
          </div>
        </div>
      )}

      {/* Normal Course Info */}
      {courseType === 'normal' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            ✓ <strong>Next Step:</strong> Add your course modules, lessons, and videos in the Content step
          </p>
        </div>
      )}

      {/* Scheduled Course Info */}
      {courseType === 'scheduled' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-700">
            💡 <strong>Note:</strong> Scheduled courses don't have modules. All students attend the same live lessons at specified times.
          </p>
        </div>
      )}
    </div>
  )
}
