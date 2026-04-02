import React, { useState, useEffect } from 'react'
import { Trash2, Plus, Edit2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
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
}: CourseStep3Props) {
  const [expandedModuleIndex, setExpandedModuleIndex] = useState<number | null>(0)
  useEffect(() => {
    console.log('[CourseStep3] Modules updated:', modules)
    modules.forEach((mod, mIdx) => {
      console.log(`[CourseStep3] Module ${mIdx}:`, mod.title)
      mod.lessons?.forEach((lesson, lIdx) => {
        console.log(`  [CourseStep3] Lesson ${lIdx}:`, {
          title: lesson.title,
          video_s3_url: lesson.video_s3_url ? '✓ PRESENT' : '✗ MISSING',
          video_s3_status: lesson.video_s3_status
        })
      })
    })
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

  const addOrUpdateLesson = () => {
    if (currentModuleIndex === null) return
    if (!lessonTitle.trim()) return

    const newModules = modules.map((mod, idx) => {
      if (idx === currentModuleIndex) {
        const updatedLessons = editingLessonIndex !== null
          ? (mod.lessons || []).map((ls, lIdx) =>
              lIdx === editingLessonIndex
                ? { ...ls, title: lessonTitle, content: lessonContent }  // Preserves video_s3_url, youtube_url, etc.
                : ls
            )
          : [...(mod.lessons || []), { title: lessonTitle, content: lessonContent }]
        return { ...mod, lessons: updatedLessons }
      }
      return mod
    })

    onModulesChange(newModules)
    onLessonTitleChange('')
    onLessonContentChange('')
    onEditingLessonIndexChange(null)
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
              <button
                onClick={() =>
                  setExpandedModuleIndex(expandedModuleIndex === mIdx ? null : mIdx)
                }
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
              >
                <span className="font-medium text-gray-900">{module.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {(module.lessons || []).length} lesson{(module.lessons || []).length !== 1 ? 's' : ''}
                  </span>
                  {expandedModuleIndex === mIdx ? (
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              </button>

              {/* Module Content */}
              {expandedModuleIndex === mIdx && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  {/* Lessons List */}
                  {(module.lessons || []).length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700">Lessons</h4>
                      {(module.lessons || []).map((lesson, lIdx) => {
                        const hasVideo = !!(lesson.video_s3_url || lesson.youtube_url);
                        console.log('[CourseStep3] Rendering lesson:', { 
                          title: lesson.title, 
                          video_s3_url: lesson.video_s3_url, 
                          hasVideo 
                        });
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
                        <h5 className="font-semibold text-gray-900 mb-3">Add Video to Lesson</h5>
                        <VideoUploadWidget
                          onUploadComplete={(videoData) => {
                            console.log('[CourseStep3] onUploadComplete triggered:', { 
                              currentModuleIndex, 
                              editingLessonIndex, 
                              videoData 
                            })
                            
                            // Immediately trigger polling in parent with indices
                            // Parent will handle state updates
                            const videoId = videoData.video_id || videoData.video_s3
                            if (videoId && currentModuleIndex !== null && onVideoUploadComplete) {
                              // Calculate lesson index - if editing, use that; otherwise use last lesson
                              const lessonIdx = editingLessonIndex !== null 
                                ? editingLessonIndex 
                                : Math.max(0, (modules[currentModuleIndex]?.lessons?.length ?? 1) - 1)
                              console.log('[CourseStep3] Calling parent callback to start polling:', { 
                                videoId, 
                                currentModuleIndex, 
                                lessonIdx,
                                editingLessonIndex,
                                calculatedFrom: editingLessonIndex !== null ? 'editingLessonIndex' : 'lessonCount'
                              })
                              onVideoUploadComplete(videoId, currentModuleIndex, lessonIdx)
                            } else if (videoId && currentModuleIndex !== null) {
                              // Fallback if no callback
                              const lessonIdx = editingLessonIndex ?? (modules[currentModuleIndex]?.lessons?.length ?? 0) - 1
                              console.log('[CourseStep3] No callback, updating locally:', { 
                                videoId, 
                                currentModuleIndex, 
                                lessonIdx
                              })
                              const newModules = modules.map((mod, idx) => {
                                if (idx === currentModuleIndex) {
                                  const updatedLessons = (mod.lessons || []).map((ls, lIdx) => {
                                    if (lIdx === lessonIdx) {
                                      return {
                                        ...ls,
                                        video_s3: videoId,
                                        video_s3_url: videoData.cloudfront_url,
                                        video_s3_status: videoData.status || 'processing'
                                      }
                                    }
                                    return ls
                                  })
                                  return { ...mod, lessons: updatedLessons }
                                }
                                return mod
                              })
                              onModulesChange(newModules)
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
