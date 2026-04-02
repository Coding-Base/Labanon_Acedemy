import React, { useState } from 'react'
import { AlertCircle, BookOpen, Plus, Trash2 } from 'lucide-react'
import { QuizBuilder } from '../QuizBuilder'

type QuizQuestion = {
  id?: number | string
  text: string
  points: number
  explanation?: string
  options: Array<{
    id?: number | string
    text: string
    is_correct: boolean
  }>
}

type Quiz = {
  id?: number | string
  title: string
  description?: string
  passing_score: number
  is_required: boolean
  questions: QuizQuestion[]
}

type ModuleWithQuiz = {
  id?: number | string
  title: string
  order?: number
  lessons?: any[]
  quiz?: Quiz
}

interface CourseStep4Props {
  courseType: 'normal' | 'scheduled'
  modules: ModuleWithQuiz[]
  onModulesChange: (modules: ModuleWithQuiz[]) => void
}

/**
 * Step 4: Quiz Configuration
 * Create and manage quizzes for each module
 */
export function CourseStep4_Quiz({
  courseType,
  modules,
  onModulesChange,
}: CourseStep4Props) {
  const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null)

  if (courseType === 'scheduled') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quizzes</h2>
          <p className="text-gray-600">Quiz configuration for scheduled courses</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <p className="text-purple-700">
            <strong>Note:</strong> Quizzes are not available for scheduled live courses. 
            You can add assessments after the course ends if needed.
          </p>
        </div>
      </div>
    )
  }

  if (modules.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quizzes</h2>
          <p className="text-gray-600">Add quizzes to test your students' knowledge</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">No Modules Yet</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You haven't created any modules yet. Go back to the Content step to create modules first.
                Then you can add quizzes to each module.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const addQuizToModule = (moduleIdx: number) => {
    const updatedModules = [...modules]
    if (!updatedModules[moduleIdx].quiz) {
      updatedModules[moduleIdx].quiz = {
        title: `${updatedModules[moduleIdx].title} Quiz`,
        description: '',
        passing_score: 70,
        is_required: true,
        questions: []
      }
      onModulesChange(updatedModules)
      setEditingModuleIndex(moduleIdx)
    } else {
      setEditingModuleIndex(moduleIdx)
    }
  }

  const removeQuizFromModule = (moduleIdx: number) => {
    const updatedModules = [...modules]
    updatedModules[moduleIdx] = { ...updatedModules[moduleIdx], quiz: undefined }
    onModulesChange(updatedModules)
    if (editingModuleIndex === moduleIdx) {
      setEditingModuleIndex(null)
    }
  }

  const updateModuleQuiz = (moduleIdx: number, updatedQuiz: Quiz) => {
    const updatedModules = [...modules]
    updatedModules[moduleIdx] = { ...updatedModules[moduleIdx], quiz: updatedQuiz }
    onModulesChange(updatedModules)
  }

  const editingModule = editingModuleIndex !== null ? modules[editingModuleIndex] : null
  const editingQuiz = editingModule?.quiz

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Quizzes</h2>
        <p className="text-gray-600">Add quizzes to each module to test student knowledge after course completion</p>
      </div>

      {/* Quiz Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Quiz Features</h3>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>✓ Add a quiz to each module</li>
              <li>✓ Multiple choice questions with explanations</li>
              <li>✓ Set passing scores and point values</li>
              <li>✓ Mark quizzes as optional or required</li>
              <li>✓ Students must pass the quiz to progress to next module</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Module List */}
        <div className="col-span-1 space-y-3">
          <h3 className="font-semibold text-gray-900">Modules</h3>
          <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
            {modules.map((mod, idx) => (
              <div
                key={idx}
                className={`p-4 cursor-pointer transition ${
                  editingModuleIndex === idx
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => setEditingModuleIndex(idx)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{mod.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {mod.quiz ? '✓ Quiz Added' : 'No quiz'}
                    </p>
                  </div>
                  {mod.quiz && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeQuizFromModule(idx)
                      }}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Remove quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz Editor */}
        <div className="col-span-2">
          {editingModule ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  {editingModule.title} - Quiz Settings
                </h3>

                {!editingQuiz ? (
                  <button
                    onClick={() => addQuizToModule(editingModuleIndex!)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Quiz to This Module
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* Quick Settings */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quiz Title
                        </label>
                        <input
                          type="text"
                          value={editingQuiz.title}
                          onChange={(e) =>
                            updateModuleQuiz(editingModuleIndex!, {
                              ...editingQuiz,
                              title: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <textarea
                          value={editingQuiz.description || ''}
                          onChange={(e) =>
                            updateModuleQuiz(editingModuleIndex!, {
                              ...editingQuiz,
                              description: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passing Score (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingQuiz.passing_score}
                          onChange={(e) =>
                            updateModuleQuiz(editingModuleIndex!, {
                              ...editingQuiz,
                              passing_score: parseInt(e.target.value) || 70
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingQuiz.is_required}
                          onChange={(e) =>
                            updateModuleQuiz(editingModuleIndex!, {
                              ...editingQuiz,
                              is_required: e.target.checked
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">
                          Required to pass (students must complete this quiz)
                        </span>
                      </label>
                    </div>

                    {/* Quiz Builder */}
                    <div className="border-t pt-4">
                      <QuizBuilder
                        quiz={editingQuiz}
                        onQuizChange={(updatedQuiz) =>
                          updateModuleQuiz(editingModuleIndex!, updatedQuiz)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">Select a module to add or edit its quiz</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
