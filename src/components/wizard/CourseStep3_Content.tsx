import React, { useState, useEffect } from 'react'
import { Trash2, Plus, Edit2, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Loader, Film, X } from 'lucide-react'
import { VideoUploadWidget } from '../VideoUploadWidget'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

type Lesson = {
  id?: number | string
  title: string
  content?: string
  video_s3?: string
  video_s3_url?: string
  youtube_url?: string
  [key: string]: any
}

type ModuleItem = {
  id?: number | string
  title: string
  order?: number
  lessons?: Lesson[]
}

interface PendingVideo {
  videoId: string;
  moduleIdx: number;
  status: 'processing' | 'ready';
  cloudfrontUrl?: string;
}

interface CourseStep3Props {
  courseType: 'normal' | 'scheduled'
  modules: ModuleItem[]
  currentModuleIndex: number | null
  moduleTitleInput: string
  lessonTitle: string
  lessonContent: string
  editingLessonIndex: number | null
  errors: Record<string, any>
  onModulesChange: (modules: ModuleItem[]) => void
  onCurrentModuleIndexChange: (index: number | null) => void
  onModuleTitleInputChange: (value: string) => void
  onLessonTitleChange: (value: string) => void
  onLessonContentChange: (value: string) => void
  onEditingLessonIndexChange: (index: number | null) => void
  onVideoUploadComplete?: (videoId: string, moduleIdx: number, lessonIdx: number) => void
  pendingVideo?: PendingVideo | null
  onClearPendingVideo?: () => void
}

/**
 * Step 3: Content
 * Manage modules, lessons, and videos (only for normal courses)
 */
export function CourseStep3_Content({
  courseType,
  modules,
  currentModuleIndex,
  moduleTitleInput,
  lessonTitle,
  lessonContent,
  editingLessonIndex,
  errors,
  onModulesChange,
  onCurrentModuleIndexChange,
  onModuleTitleInputChange,
  onLessonTitleChange,
  onLessonContentChange,
  onEditingLessonIndexChange,
  onVideoUploadComplete,
  pendingVideo,
  onClearPendingVideo,
}: CourseStep3Props) {
  const [expandedModuleIndex, setExpandedModuleIndex] = useState<number | null>(0)
  const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null)
  const [editModuleTitle, setEditModuleTitle] = useState('')
  useEffect(() => {
    // Track module changes silently
  }, [modules])
  if (courseType === 'scheduled') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Content</h2>
          <p className="text-gray-600">Scheduled courses don't require content modules</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <p className="text-purple-700">
            <strong>Note:</strong> Since you selected a scheduled live course, you don't need to create modules or add content here.
            Students will join your scheduled live classes at the specified times.
          </p>
        </div>
      </div>
    )
  }

  const addModule = () => {
    if (!moduleTitleInput.trim()) return
    const newModule: ModuleItem = {
      title: moduleTitleInput.trim(),
      order: modules.length,
      lessons: []
    }
    onModulesChange([...modules, newModule])
    onModuleTitleInputChange('')
    onCurrentModuleIndexChange(modules.length)
  }

  const saveModuleTitle = (mIdx: number) => {
    if (!editModuleTitle.trim()) return
    const newModules = modules.map((mod, idx) =>
      idx === mIdx ? { ...mod, title: editModuleTitle.trim() } : mod
    )
    onModulesChange(newModules)
    setEditingModuleIndex(null)
  }

  const addOrUpdateLesson = () => {
    if (currentModuleIndex === null) return
    if (!lessonTitle.trim()) return

    // Build the video data from pendingVideo if it exists for this module
    const videoData: Record<string, any> = {}
    if (pendingVideo && pendingVideo.moduleIdx === currentModuleIndex) {
      videoData.video_s3 = pendingVideo.videoId
      if (pendingVideo.status === 'ready' && pendingVideo.cloudfrontUrl) {
        videoData.video_s3_url = pendingVideo.cloudfrontUrl
      }
    }

    const newModules = modules.map((mod, idx) => {
      if (idx === currentModuleIndex) {
        const updatedLessons = editingLessonIndex !== null
          ? (mod.lessons || []).map((ls, lIdx) =>
              lIdx === editingLessonIndex
                ? { ...ls, title: lessonTitle, content: lessonContent, ...videoData }  // Merge video + preserves existing fields
                : ls
            )
          : [...(mod.lessons || []), { title: lessonTitle, content: lessonContent, ...videoData }]
        return { ...mod, lessons: updatedLessons }
      }
      return mod
    })

    onModulesChange(newModules)
    onLessonTitleChange('')
    onLessonContentChange('')
    onEditingLessonIndexChange(null)
    // Clear pending video after it's been merged into the lesson
    if (pendingVideo && pendingVideo.moduleIdx === currentModuleIndex) {
      onClearPendingVideo?.()
    }
  }

  const deleteLesson = (moduleIdx: number, lessonIdx: number) => {
    const newModules = modules.map((mod, idx) => {
      if (idx === moduleIdx) {
        return {
          ...mod,
          lessons: (mod.lessons || []).filter((_, lIdx) => lIdx !== lessonIdx)
        }
      }
      return mod
    })
    onModulesChange(newModules)
  }

  const deleteModule = (moduleIdx: number) => {
    const newModules = modules.filter((_, idx) => idx !== moduleIdx)
    onModulesChange(newModules)
    onCurrentModuleIndexChange(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Management</h2>
        <p className="text-gray-600">Create modules and add lessons to structure your course</p>
      </div>

      {/* Add Module Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Create New Module</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={moduleTitleInput}
            onChange={(e) => onModuleTitleInputChange(e.target.value)}
            placeholder="e.g., Module 1: Getting Started"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={addModule}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        </div>
      </div>

      {/* Modules List */}
      {modules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No modules yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((module, mIdx) => (
            <div key={mIdx} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Module Header */}
              <div className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between border-b border-gray-200">
                {editingModuleIndex === mIdx ? (
                  <div className="flex-1 flex items-center gap-2 mr-4">
                    <input
                      type="text"
                      value={editModuleTitle}
                      onChange={(e) => setEditModuleTitle(e.target.value)}
                      className="flex-1 px-2 py-1 border border-brand-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm bg-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveModuleTitle(mIdx)
                        if (e.key === 'Escape') setEditingModuleIndex(null)
                      }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); saveModuleTitle(mIdx); }}
                      className="p-1.5 text-green-600 hover:bg-green-100 rounded transition"
                      title="Save"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingModuleIndex(null); }}
                      className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <button
                      onClick={() => setExpandedModuleIndex(expandedModuleIndex === mIdx ? null : mIdx)}
                      className="font-medium text-gray-900 flex-1 text-left"
                    >
                      {module.title}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditModuleTitle(module.title);
                        setEditingModuleIndex(mIdx);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition"
                      title="Edit module title"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {(module.lessons || []).length} lesson{(module.lessons || []).length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setExpandedModuleIndex(expandedModuleIndex === mIdx ? null : mIdx)}
                    className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                  >
                    {expandedModuleIndex === mIdx ? (
                      <ChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Module Content */}
              {expandedModuleIndex === mIdx && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  {/* Lessons List */}
                  {(module.lessons || []).length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">Lessons</h4>
                      {(module.lessons || []).map((lesson, lIdx) => {
                        const hasVideo = !!(lesson.video_s3_url || lesson.youtube_url);
                        return (
                        <div
                          key={`${mIdx}-${lIdx}-${lesson.title}`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{lesson.title}</p>
                            <div className="flex gap-4 text-xs text-gray-500 mt-1">
                              {lesson.content && <span>✓ Content</span>}
                              {hasVideo && (
                                <span>✓ Video</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                onCurrentModuleIndexChange(mIdx)
                                onEditingLessonIndexChange(lIdx)
                                onLessonTitleChange(lesson.title)
                                onLessonContentChange(lesson.content || '')
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit lesson"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteLesson(mIdx, lIdx)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete lesson"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Add/Edit Lesson Form */}
                  {currentModuleIndex === mIdx && (
                    <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-brand-900">
                        {editingLessonIndex !== null ? 'Edit Lesson' : 'Add New Lesson'}
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lesson Title
                        </label>
                        <input
                          type="text"
                          value={lessonTitle}
                          onChange={(e) => onLessonTitleChange(e.target.value)}
                          placeholder="e.g., Introduction to Variables"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lesson Content
                        </label>
                        <ReactQuill
                          value={lessonContent}
                          onChange={(value) => onLessonContentChange(value)}
                          theme="snow"
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, 3, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ list: 'ordered' }, { list: 'bullet' }],
                              ['blockquote', 'code-block', 'link'],
                              ['clean']
                            ]
                          }}
                        />
                      </div>

                      {/* Video Upload Section */}
                      <div className="border-t pt-4 mt-4">
                        <h5 className="font-semibold text-gray-900 mb-3">
                          <Film className="w-4 h-4 inline mr-2" />
                          Add Video to Lesson
                        </h5>

                        {/* Show existing video info when editing a lesson that already has a video */}
                        {editingLessonIndex !== null && (() => {
                          const existingLesson = modules[mIdx]?.lessons?.[editingLessonIndex]
                          if (existingLesson?.video_s3_url || existingLesson?.youtube_url) {
                            return (
                              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span className="text-sm text-green-700">
                                  This lesson already has a video. Upload a new one below to replace it.
                                </span>
                              </div>
                            )
                          }
                          return null
                        })()}

                        {/* Pending video indicator */}
                        {pendingVideo && pendingVideo.moduleIdx === mIdx && (
                          <div className={`mb-3 p-3 rounded-lg flex items-center gap-2 ${
                            pendingVideo.status === 'ready'
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-yellow-50 border border-yellow-200'
                          }`}>
                            {pendingVideo.status === 'ready' ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span className="text-sm text-green-700">
                                  ✓ Video ready — it will be attached when you click "{editingLessonIndex !== null ? 'Update Lesson' : 'Add Lesson'}"
                                </span>
                              </>
                            ) : (
                              <>
                                <Loader className="w-4 h-4 text-yellow-600 flex-shrink-0 animate-spin" />
                                <span className="text-sm text-yellow-700">
                                  Video encoding in progress... It will be attached when you add the lesson.
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        <VideoUploadWidget
                          onUploadComplete={(videoData) => {
                            // Only notify parent to start polling — no direct module mutation
                            const videoId = videoData.video_id || videoData.video_s3
                            if (videoId && currentModuleIndex !== null && onVideoUploadComplete) {
                              const lessonIdx = editingLessonIndex ?? 0
                              onVideoUploadComplete(videoId, currentModuleIndex, lessonIdx)
                            }
                          }}
                          onError={(error) => {
                            console.error('Video upload error:', error)
                          }}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={addOrUpdateLesson}
                          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                        >
                          {editingLessonIndex !== null ? 'Update Lesson' : 'Add Lesson'}
                        </button>
                        {editingLessonIndex !== null && (
                          <button
                            onClick={() => {
                              onEditingLessonIndexChange(null)
                              onLessonTitleChange('')
                              onLessonContentChange('')
                              onClearPendingVideo?.()
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lesson Form for Non-Selected Module */}
                  {currentModuleIndex !== mIdx && (
                    <button
                      onClick={() => onCurrentModuleIndexChange(mIdx)}
                      className="w-full px-4 py-2 border border-dashed border-brand-300 rounded-lg text-brand-600 hover:bg-brand-50 transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Lesson to this Module
                    </button>
                  )}

                  {/* Delete Module Button */}
                  <button
                    onClick={() => deleteModule(mIdx)}
                    className="w-full px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Module
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> You can add videos and quizzes to your lessons. Start by creating modules and lessons here.
        </p>
      </div>
    </div>
  )
}
