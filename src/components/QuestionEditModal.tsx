import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Loader2 } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import axios from 'axios'
import showToast from '../utils/toast'

interface Choice {
  text: string
  is_correct: boolean
}

interface Question {
  id: number
  subject: number
  text: string
  image?: string
  choices: any[]
  year?: string
  explanation?: string
}

interface QuestionEditModalProps {
  isOpen: boolean
  question: Question | null
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function QuestionEditModal({
  isOpen,
  question,
  onClose,
  onSave
}: QuestionEditModalProps) {
  const [formData, setFormData] = useState({
    text: '',
    year: '',
    explanation: '',
    choiceA: '',
    choiceB: '',
    choiceC: '',
    choiceD: '',
    correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
    image: null as File | null,
    imageUrl: '' as string
  })

  const [imagePreview, setImagePreview] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const quillRef = useRef<any>(null)

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    if (imageUrl.startsWith('/')) {
      const baseUrl = API_BASE.replace(/\/api\/?$/, '')
      return baseUrl + imageUrl
    }
    return imageUrl
  }

  // Initialize form when modal opens or question changes
  useEffect(() => {
    if (isOpen && question) {
      setFormData({
        text: question.text || '',
        year: question.year || '',
        explanation: question.explanation || '',
        choiceA: (question.choices?.[0]?.text) || '',
        choiceB: (question.choices?.[1]?.text) || '',
        choiceC: (question.choices?.[2]?.text) || '',
        choiceD: (question.choices?.[3]?.text) || '',
        correctAnswer: findCorrectAnswerLabel(question.choices),
        image: null,
        imageUrl: question.image || ''
      })
      setImagePreview(getImageUrl(question.image))
    }
  }, [isOpen, question])

  const findCorrectAnswerLabel = (
    choices: any[]
  ): 'A' | 'B' | 'C' | 'D' => {
    const labels = ['A', 'B', 'C', 'D']
    const correctIdx = choices?.findIndex(c => c.is_correct)
    return (labels[correctIdx] as 'A' | 'B' | 'C' | 'D') || 'A'
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      showToast('Image size must be less than 5MB', 'error')
      return
    }

    setFormData(prev => ({ ...prev, image: file }))

    // Show preview
    const reader = new FileReader()
    reader.onload = e => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: null, imageUrl: '' }))
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateForm = (): boolean => {
    if (!formData.text.trim()) {
      showToast('Question text is required', 'error')
      return false
    }

    const choices = [
      formData.choiceA.trim(),
      formData.choiceB.trim(),
      formData.choiceC.trim(),
      formData.choiceD.trim()
    ].filter(Boolean)

    if (choices.length < 2) {
      showToast('At least 2 choices are required', 'error')
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!question || !validateForm()) return

    setSaving(true)
    try {
      // Prepare choices
      const choiceTexts = {
        A: formData.choiceA.trim(),
        B: formData.choiceB.trim(),
        C: formData.choiceC.trim(),
        D: formData.choiceD.trim()
      }

      const choices: Choice[] = (
        Object.entries(choiceTexts) as [string, string][]
      )
        .filter(([_, text]) => text)
        .map(([label, text]) => ({
          text,
          is_correct: label === formData.correctAnswer
        }))

      // Update question with new text/explanation and choices
      // Strip HTML tags from Quill output to preserve original formatting
      const stripHtmlTags = (html: string) => {
        const div = document.createElement('div')
        div.innerHTML = html
        return div.textContent || div.innerText || ''
      }

      const updatePayload = {
        text: stripHtmlTags(formData.text).trim(),
        year: formData.year.trim(),
        explanation: stripHtmlTags(formData.explanation).trim(),
        choices
      }

      await onSave(updatePayload)

      // Upload image if changed
      if (formData.image) {
        try {
          setImageUploading(true)
          const formDataImg = new FormData()
          formDataImg.append('image', formData.image)

          const token = localStorage.getItem('access')
          await axios.patch(`${API_BASE}/cbt/questions/${question.id}/`, formDataImg, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          })
        } catch (err) {
          console.error('Image upload failed:', err)
          // Don't fail the whole save just because image upload failed
        } finally {
          setImageUploading(false)
        }
      }

      showToast('Question updated successfully', 'success')
      onClose()
    } catch (err) {
      console.error('Save failed:', err)
      showToast('Failed to save question', 'error')
    } finally {
      setSaving(false)
    }
  }

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'clean']
      ]
    }
  }), [])

  const handleQuillChange = useCallback((val: string) => {
    setFormData(prev => ({ ...prev, text: val }))
  }, [])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-auto p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Edit Question</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Question Text *
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={formData.text}
                  onChange={handleQuillChange}
                  modules={quillModules}
                  placeholder="Enter question text..."
                  style={{ minHeight: '150px' }}
                />
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Year
              </label>
              <input
                type="text"
                value={formData.year}
                onChange={e => setFormData(prev => ({ ...prev, year: e.target.value }))}
                placeholder="e.g., 2023, 2024"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Image Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Question Image
              </label>
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="relative max-h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="max-h-48 object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all"
                    >
                      Change Image
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRemoveImage}
                      className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all"
                    >
                      Remove Image
                    </motion.button>
                  </div>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-all flex flex-col items-center justify-center gap-2 text-gray-600"
                >
                  <Upload className="w-6 h-6" />
                  <span>Click to add image</span>
                  <span className="text-xs text-gray-500">PNG, JPG, GIF (max 5MB)</span>
                </motion.button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Choices */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Answer Choices *
              </label>
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map(label => (
                  <div key={label} className="flex gap-3 items-start">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={label}
                      checked={formData.correctAnswer === label}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          correctAnswer: e.target.value as 'A' | 'B' | 'C' | 'D'
                        }))
                      }
                      className="mt-3 w-4 h-4 cursor-pointer"
                      title={`Mark as correct answer`}
                    />
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Option {label}
                        {formData.correctAnswer === label && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded font-semibold">
                            Correct
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={String(formData[`choice${label}` as keyof typeof formData] || '')}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            [`choice${label}`]: e.target.value
                          }))
                        }
                        placeholder={`Enter option ${label}`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Explanation
              </label>
              <textarea
                value={formData.explanation}
                onChange={e =>
                  setFormData(prev => ({ ...prev, explanation: e.target.value }))
                }
                placeholder="Explain why this answer is correct..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={saving || imageUploading}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || imageUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving || imageUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
