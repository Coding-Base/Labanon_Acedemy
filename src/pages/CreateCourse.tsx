// src/pages/CreateCourse.tsx - Wizard Version
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { SUPPORTED_CURRENCIES } from '../constants/currencies'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useVerificationStatus } from '../hooks/useVerificationStatus'
import { VerificationBanner } from '../components/VerificationBanner'
import { StepProgress } from '../components/wizard/StepProgress'
import { CourseStep1_BasicInfo } from '../components/wizard/CourseStep1_BasicInfo'
import { CourseStep2_Structure } from '../components/wizard/CourseStep2_Structure'
import { CourseStep3_Content } from '../components/wizard/CourseStep3_Content'
import { CourseStep4_Quiz } from '../components/wizard/CourseStep4_Quiz'
import { CourseStep5_Preview } from '../components/wizard/CourseStep5_Preview'

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

const levels = ['Beginner', 'Intermediate', 'Professional'] as const
type Level = (typeof levels)[number]

type Lesson = {
  id?: number | string
  title: string
  content?: string
  video_s3?: string
  video_s3_url?: string
  video_s3_status?: string
  youtube_url?: string
  video?: string
  [key: string]: any
}

type ModuleItem = {
  id?: number | string
  title: string
  order?: number
  lessons?: Lesson[]
  quiz?: {
    id?: number | string
    title: string
    description?: string
    passing_score: number
    is_required: boolean
    questions: Array<{
      id?: number | string
      text: string
      points: number
      explanation?: string
      options: Array<{
        id?: number | string
        text: string
        is_correct: boolean
      }>
    }>
  }
}

const STEP_LABELS = [
  'Basic Info',
  'Structure',
  'Content',
  'Quizzes',
  'Review'
]

export default function CreateCourse() {
  const navigate = useNavigate()
  const location = useLocation()
  const { status: verificationStatus, loading: verificationLoading } = useVerificationStatus()
  
  // Wizard navigation
  const [currentStep, setCurrentStep] = useState(1)
  
  // Course fields
  const [courseType, setCourseType] = useState<'normal' | 'scheduled'>('normal')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('0')
  const [currency, setCurrency] = useState('NGN')
  const [description, setDescription] = useState('')
  const [requiredTools, setRequiredTools] = useState('')
  const [level, setLevel] = useState<Level>(levels[0])
  const [outcome, setOutcome] = useState('')
  const [courseCategory, setCourseCategory] = useState('other')
  
  // Scheduled course fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [meetingPlace, setMeetingPlace] = useState('zoom')
  const [meetingLink, setMeetingLink] = useState('')

  // Content management
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null)
  const [moduleTitleInput, setModuleTitleInput] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null)

  // Image upload
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null)
  const [courseImagePreview, setCourseImagePreview] = useState<string | null>(null)

  // UI state
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Encoding status tracking (restored from old version)
  const [isEncodingVideo, setIsEncodingVideo] = useState(false)
  const [encodingVideoId, setEncodingVideoId] = useState<string | null>(null)
  const videoPollingRefs = useRef<Record<string, number>>({})

  // ===== VIDEO POLLING HELPERS (from old version) =====
  async function waitForVideoReady(videoId: string, token: string | null, timeoutMs = 30000, intervalMs = 3000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await axios.get(`${API_BASE}/videos/${videoId}/`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        const data = res.data
        if (data && data.status === 'ready') return data
      } catch (err) {}
      await new Promise((r) => setTimeout(r, intervalMs))
    }
    return null
  }

  async function ensureAllVideosReady(token: string | null, timeoutMs = 120000) {
    const pending: string[] = []
    modules.forEach((mod) => {
      (mod.lessons || []).forEach((ls: any) => {
        if (ls.video_s3 && !ls.video_s3_url) pending.push(ls.video_s3)
      })
    })
    const unique = Array.from(new Set(pending))
    if (unique.length === 0) return
    const promises = unique.map((id) => waitForVideoReady(id, token, timeoutMs))
    const results = await Promise.all(promises)
    setModules((prev) => {
      const copy = prev.map((m) => ({ ...m, lessons: (m.lessons || []).map((ls: any) => ({ ...ls })) }))
      results.forEach((res) => {
        if (res && res.id) {
          for (let mi = 0; mi < copy.length; mi++) {
            const mod = copy[mi]
            for (let li = 0; li < (mod.lessons || []).length; li++) {
              const ls = mod.lessons![li]
              if (ls.video_s3 === res.id) {
                copy[mi].lessons![li] = { 
                  ...ls, 
                  video_s3_url: res.cloudfront_url, 
                  video_s3_status: res.status 
                }
              }
            }
          }
        }
      })
      return copy
    })
  }

  function startPollingForVideo(videoId: string, moduleIdx: number, lessonIdx: number) {
    console.log('[CreateCourse] startPollingForVideo called:', { videoId, moduleIdx, lessonIdx })
    const token = localStorage.getItem('access')
    if (!videoId || !token) {
      console.warn('[CreateCourse] Missing videoId or token:', { videoId: !!videoId, token: !!token })
      return
    }
    if (videoPollingRefs.current[videoId]) {
      console.log('[CreateCourse] Already polling this video:', videoId)
      return
    }
    
    // Immediately update modules with initial video info (status: processing)
    console.log('[CreateCourse] Initializing modules with video info')
    setModules((prev) => {
      const copy = JSON.parse(JSON.stringify(prev))
      if (copy[moduleIdx] && copy[moduleIdx].lessons && copy[moduleIdx].lessons[lessonIdx]) {
        copy[moduleIdx].lessons[lessonIdx] = {
          ...copy[moduleIdx].lessons[lessonIdx],
          video_s3: videoId,
          video_s3_status: 'processing'
        }
      }
      return copy
    })
    
    // Start encoding feedback
    console.log('[CreateCourse] Setting encoding state: true')
    setIsEncodingVideo(true)
    setEncodingVideoId(videoId)
    
    const interval = window.setInterval(async () => {
      try {
        console.log('[CreateCourse] Polling video:', videoId)
        const res = await axios.get(`${API_BASE}/videos/${videoId}/`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        const data = res.data
        console.log('[CreateCourse] Full video response:', data)
        console.log('[CreateCourse] Video status poll:', { videoId, status: data?.status, cloudfront_url: data?.cloudfront_url })
        if (data && data.status === 'ready') {
          console.log('[CreateCourse] 🎉 Video READY! Attaching to lesson:', { videoId, moduleIdx, lessonIdx, cloudfront_url: data.cloudfront_url })
          setModules((prev) => {
            const copy = JSON.parse(JSON.stringify(prev))  // Deep copy
            console.log('[CreateCourse] Before update:', { 
              moduleIdx, 
              lessonIdx,
              lesson: copy[moduleIdx]?.lessons?.[lessonIdx]
            })
            
            if (copy[moduleIdx] && copy[moduleIdx].lessons) {
              const lesson = copy[moduleIdx].lessons![lessonIdx]
              console.log('[CreateCourse] Updating lesson with video URL:', data.cloudfront_url)
              copy[moduleIdx].lessons![lessonIdx] = { 
                ...lesson, 
                video_s3_url: data.cloudfront_url, 
                video_s3_status: data.status 
              }
              console.log('[CreateCourse] After update:', copy[moduleIdx].lessons![lessonIdx])
            }
            console.log('[CreateCourse] Setting new modules state')
            return copy
          })
          window.clearInterval(videoPollingRefs.current[videoId])
          delete videoPollingRefs.current[videoId]
          
          // Stop encoding feedback
          console.log('[CreateCourse] Encoding complete, hiding loader')
          setIsEncodingVideo(false)
          setEncodingVideoId(null)
          
          // Show success message
          alert('✓ Video encoding complete — URL attached to lesson.')
        }
      } catch (err) {
        console.error('[CreateCourse] Polling error:', err)
      }
    }, 3000)
    videoPollingRefs.current[videoId] = interval as unknown as number
  }

  // Log whenever modules changes in parent
  useEffect(() => {
    console.log('[CreateCourse Parent] modules state changed:', modules)
    modules.forEach((mod, mIdx) => {
      mod.lessons?.forEach((lesson, lIdx) => {
        console.log(`[CreateCourse Parent] Module ${mIdx}, Lesson ${lIdx}:`, {
          title: lesson.title,
          video_s3_url: lesson.video_s3_url ? '✓ PRESENT' : lesson.video_s3_url ? lesson.video_s3_url : '✗ MISSING'
        })
      })
    })
  }, [modules])

  // Load course for editing
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const courseId = params.get('courseId')
    let mounted = true

    async function loadCourse(id: string) {
      try {
        const token = localStorage.getItem('access')
        const res = await axios.get(`${API_BASE}/courses/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!mounted) return
        
        const data = res.data
        setTitle(data.title || '')
        setDescription(data.description || '')
        setPrice(String(data.price ?? 0))
        setCurrency(data.currency || 'NGN')
        setCourseImagePreview(data.image || null)
        setLevel(data.level || levels[0])
        setOutcome(data.outcome || '')
        setRequiredTools(data.required_tools || '')
        setCourseCategory(data.course_type || 'other')

        // Check if scheduled
        if (data.meeting_link || (data.start_date && data.meeting_place)) {
          setCourseType('scheduled')
          setStartDate(data.start_date || '')
          setEndDate(data.end_date || '')
          setMeetingTime(data.meeting_time || '')
          setMeetingPlace(data.meeting_place || 'zoom')
          setMeetingLink(data.meeting_link || '')
        } else {
          setCourseType('normal')
        }

        // Load modules
        const mods = (data.modules || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          order: m.order || 0,
          lessons: (m.lessons || []).map((ls: any) => ({
            id: ls.id,
            title: ls.title,
            content: ls.content,
            video: ls.video,
            video_s3: ls.video_s3,
            video_s3_url: ls.video_s3_url,
            youtube_url: ls.youtube_url
          })),
          // Load quiz if it exists for this module
          ...(m.quiz ? {
            quiz: {
              id: m.quiz.id,
              title: m.quiz.title,
              description: m.quiz.description || '',
              passing_score: m.quiz.passing_score || 70,
              is_required: m.quiz.is_required || false,
              questions: (m.quiz.questions || []).map((q: any) => ({
                id: q.id,
                text: q.text,
                points: q.points || 1,
                explanation: q.explanation || '',
                options: (q.options || []).map((opt: any) => ({
                  id: opt.id,
                  text: opt.text,
                  is_correct: opt.is_correct || false
                }))
              }))
            }
          } : {})
        }))
        setModules(mods)
        if (mods.length > 0) setCurrentModuleIndex(0)
      } catch (err) {
        console.error('Failed to load course for editing', err)
      }
    }

    if (courseId) loadCourse(courseId)
    return () => { mounted = false }
  }, [location.search])

  // Navigation
  const handleNextStep = () => {
    if (currentStep < STEP_LABELS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  // Submit handler
  const handleCourseSubmit = async (publish: boolean) => {
    setErrors({})
    setGeneralError(null)

    // Validation
    if (!title.trim()) {
      setErrors(prev => ({ ...prev, title: ['Title required'] }))
      return
    }

    if (courseType === 'scheduled') {
      let hasError = false
      if (!startDate || !endDate) {
        setErrors(prev => ({ ...prev, dates: 'Start and End dates are required' }))
        hasError = true
      }
      if (!meetingTime) {
        setErrors(prev => ({ ...prev, time: 'Meeting time is required' }))
        hasError = true
      }
      if (!meetingLink) {
        setErrors(prev => ({ ...prev, link: 'Meeting link is required' }))
        hasError = true
      }
      if (hasError) return
    }

    publish ? setPublishing(true) : setSaving(true)

    try {
      const token = localStorage.getItem('access')
      const params = new URLSearchParams(location.search)
      const courseId = params.get('courseId')

      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description)
      formData.append('price', String(Number(price) || 0))
      formData.append('currency', currency)
      formData.append('published', publish ? 'true' : 'false')
      formData.append('level', level)
      formData.append('outcome', outcome)
      formData.append('required_tools', requiredTools)
      formData.append('course_type', courseCategory)

      if (courseType === 'scheduled') {
        formData.append('start_date', startDate)
        formData.append('end_date', endDate)
        formData.append('meeting_time', meetingTime)
        formData.append('meeting_place', meetingPlace)
        formData.append('meeting_link', meetingLink)
      }

      if (courseImageFile) {
        formData.append('image_upload', courseImageFile)
      }

      let createdCourseId = courseId

      if (courseId) {
        await axios.patch(`${API_BASE}/courses/${courseId}/`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
      } else {
        const res = await axios.post(`${API_BASE}/courses/`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
        createdCourseId = res.data.id
      }

      // Save modules (only for normal courses)
      if (courseType === 'normal' && createdCourseId && modules.length > 0) {
        for (let mi = 0; mi < modules.length; mi++) {
          const mod = modules[mi]
          let moduleId = mod.id
          try {
            if (moduleId) {
              await axios.patch(`${API_BASE}/modules/${moduleId}/`, 
                { title: mod.title, order: mi },
                { headers: { Authorization: `Bearer ${token}` } }
              )
            } else {
              const mres = await axios.post(`${API_BASE}/modules/`,
                { course: createdCourseId, title: mod.title, order: mi },
                { headers: { Authorization: `Bearer ${token}` } }
              )
              moduleId = mres.data.id
            }
          } catch (err) { continue }

          // Save lessons
          for (let li = 0; li < (mod.lessons || []).length; li++) {
            const ls = mod.lessons![li]
            try {
              const lessonPayload: any = {
                module: moduleId,
                title: ls.title,
                content: ls.content
              }
              if (ls.video_s3) lessonPayload.video_s3 = ls.video_s3
              if (ls.video_s3_url) lessonPayload.video_s3_url = ls.video_s3_url
              if (ls.youtube_url) lessonPayload.youtube_url = ls.youtube_url

              if (ls.id) {
                await axios.patch(`${API_BASE}/lessons/${ls.id}/`, lessonPayload,
                  { headers: { Authorization: `Bearer ${token}` } }
                )
              } else {
                await axios.post(`${API_BASE}/lessons/`, lessonPayload,
                  { headers: { Authorization: `Bearer ${token}` } }
                )
              }
            } catch (err) { console.error(err) }
          }

          // Save module quiz
          if (mod.quiz && mod.quiz.questions && mod.quiz.questions.length > 0) {
            try {
              const quizPayload = {
                module: moduleId,
                title: mod.quiz.title,
                description: mod.quiz.description || '',
                passing_score: mod.quiz.passing_score || 70,
                is_required: mod.quiz.is_required || false
              }

              let quizId: number | string
              if (mod.quiz.id) {
                // Update existing quiz
                await axios.patch(`${API_BASE}/module-quizzes/${mod.quiz.id}/`, quizPayload, 
                  { headers: { Authorization: `Bearer ${token}` } }
                )
                quizId = mod.quiz.id
              } else {
                // Create new quiz
                const qres = await axios.post(`${API_BASE}/module-quizzes/`, quizPayload,
                  { headers: { Authorization: `Bearer ${token}` } }
                )
                quizId = qres.data.id
              }

              // Save quiz questions
              for (let qi = 0; qi < mod.quiz.questions.length; qi++) {
                const q = mod.quiz.questions[qi]
                try {
                  const questionPayload = {
                    quiz: quizId,
                    text: q.text,
                    points: q.points || 1,
                    explanation: q.explanation || '',
                    order: qi
                  }

                  let questionId: number | string
                  if (q.id) {
                    // Update existing question
                    await axios.patch(`${API_BASE}/quiz-questions/${q.id}/`, questionPayload, 
                      { headers: { Authorization: `Bearer ${token}` } }
                    )
                    questionId = q.id
                  } else {
                    // Create new question
                    const qres = await axios.post(`${API_BASE}/quiz-questions/`, questionPayload,
                      { headers: { Authorization: `Bearer ${token}` } }
                    )
                    questionId = qres.data.id
                  }

                  // Save quiz options (answers)
                  if (q.options && q.options.length > 0) {
                    for (let oi = 0; oi < q.options.length; oi++) {
                      const opt = q.options[oi]
                      try {
                        const optionPayload = {
                          question: questionId,
                          text: opt.text,
                          is_correct: opt.is_correct || false,
                          order: oi
                        }

                        if (opt.id) {
                          // Update existing option
                          await axios.patch(`${API_BASE}/quiz-options/${opt.id}/`, optionPayload,
                            { headers: { Authorization: `Bearer ${token}` } }
                          )
                        } else {
                          // Create new option
                          await axios.post(`${API_BASE}/quiz-options/`, optionPayload,
                            { headers: { Authorization: `Bearer ${token}` } }
                          )
                        }
                      } catch (err) { console.error('Error saving quiz option:', err) }
                    }
                  }
                } catch (err) { console.error('Error saving quiz question:', err) }
              }
            } catch (err) { console.error('Error saving quiz:', err) }
          }
        }
      }

      alert(publish ? 'Course Published!' : 'Draft Saved!')
      navigate('/tutor/manage')
    } catch (err: any) {
      console.error(err)
      if (err?.response?.data) setErrors(err.response.data)
      else setGeneralError('Failed to save/publish course')
    } finally {
      publish ? setPublishing(false) : setSaving(false)
    }
  }

  const saveDraft = () => handleCourseSubmit(false)
  const publishCourse = () => {
    if (verificationStatus && !verificationStatus.is_verified && verificationStatus.verification_status !== 'not_applicable') {
      alert(`You cannot publish courses until your account is verified.\n\n${verificationStatus.reason}`)
      return
    }
    handleCourseSubmit(true)
  }

  const onCourseImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      setCourseImageFile(file)
      const reader = new FileReader()
      reader.onload = () => setCourseImagePreview(String(reader.result))
      reader.readAsDataURL(file)
    }
  }

  // ==================== RENDER WIZARD ====================
  const canPublish = verificationStatus?.is_verified !== false || verificationStatus?.verification_status === 'not_applicable'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create a Course</h1>
          <p className="text-gray-600 mt-2">Complete the steps below to create and publish your course</p>
        </div>

        {/* Verification Banner */}
        {!verificationLoading && verificationStatus && (
          <VerificationBanner
            isVerified={verificationStatus.is_verified}
            verificationStatus={verificationStatus.verification_status}
            reason={verificationStatus.reason}
          />
        )}

        {/* Main Wizard Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Step Progress */}
          <StepProgress
            currentStep={currentStep}
            totalSteps={STEP_LABELS.length}
            stepLabels={STEP_LABELS}
            onStepClick={handleStepClick}
          />

          {/* Error Messages */}
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {generalError}
            </div>
          )}

          {/* Step Content */}
          <div className="mb-8 min-h-[400px]">
            {currentStep === 1 && (
              <CourseStep1_BasicInfo
                title={title}
                description={description}
                level={level}
                price={price}
                currency={currency}
                requiredTools={requiredTools}
                outcome={outcome}
                courseCategory={courseCategory}
                errors={errors}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onLevelChange={setLevel}
                onPriceChange={setPrice}
                onCurrencyChange={setCurrency}
                onRequiredToolsChange={setRequiredTools}
                onOutcomeChange={setOutcome}
                onCourseCategoryChange={setCourseCategory}
              />
            )}

            {currentStep === 2 && (
              <CourseStep2_Structure
                courseType={courseType}
                startDate={startDate}
                endDate={endDate}
                meetingTime={meetingTime}
                meetingPlace={meetingPlace}
                meetingLink={meetingLink}
                errors={errors}
                onCourseTypeChange={setCourseType}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onMeetingTimeChange={setMeetingTime}
                onMeetingPlaceChange={setMeetingPlace}
                onMeetingLinkChange={setMeetingLink}
              />
            )}

            {currentStep === 3 && (
              <CourseStep3_Content
                courseType={courseType}
                modules={modules}
                currentModuleIndex={currentModuleIndex}
                moduleTitleInput={moduleTitleInput}
                lessonTitle={lessonTitle}
                lessonContent={lessonContent}
                editingLessonIndex={editingLessonIndex}
                errors={errors}
                onModulesChange={setModules}
                onCurrentModuleIndexChange={setCurrentModuleIndex}
                onModuleTitleInputChange={setModuleTitleInput}
                onLessonTitleChange={setLessonTitle}
                onLessonContentChange={setLessonContent}
                onEditingLessonIndexChange={setEditingLessonIndex}
                onVideoUploadComplete={startPollingForVideo}
              />
            )}

            {currentStep === 4 && (
              <CourseStep4_Quiz
                courseType={courseType}
                modules={modules}
                onModulesChange={setModules}
              />
            )}

            {currentStep === 5 && (
              <CourseStep5_Preview
                title={title}
                description={description}
                price={price}
                currency={currency}
                level={level}
                courseType={courseType}
                modulesCount={modules.length}
                courseImagePreview={courseImagePreview}
                onCourseImageInput={onCourseImageInput}
                isSaving={saving}
                isPublishing={publishing}
                isVerified={canPublish}
                verificationMessage={verificationStatus?.reason}
                onSaveDraft={saveDraft}
                onPublish={publishCourse}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="text-sm text-gray-600">
              Step {currentStep} of {STEP_LABELS.length}
            </div>

            <button
              onClick={handleNextStep}
              disabled={currentStep === STEP_LABELS.length}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Encoding Feedback Overlay */}
        {isEncodingVideo && encodingVideoId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            {/* Blur background */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md z-40" />
            
            {/* Content */}
            <div className="relative z-50 flex flex-col items-center justify-center gap-6 bg-white rounded-lg p-8 w-[90%] md:w-1/3 shadow-2xl">
              {/* Loader Animation */}
              <div className="flex items-center justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                  <div className="absolute inset-0 border-4 border-brand-600 rounded-full animate-spin border-r-transparent border-t-transparent" />
                </div>
              </div>

              {/* Text */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Encoding Video</h3>
                <p className="text-sm text-gray-600">Your video is being processed and optimized for playback. This may take a few minutes.</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setIsEncodingVideo(false)
                    setEncodingVideoId(null)
                    if (encodingVideoId && videoPollingRefs.current[encodingVideoId]) {
                      window.clearInterval(videoPollingRefs.current[encodingVideoId])
                      delete videoPollingRefs.current[encodingVideoId]
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition"
                >
                  Minimise
                </button>
                <button
                  onClick={() => {
                    setIsEncodingVideo(false)
                    setEncodingVideoId(null)
                    if (encodingVideoId && videoPollingRefs.current[encodingVideoId]) {
                      window.clearInterval(videoPollingRefs.current[encodingVideoId])
                      delete videoPollingRefs.current[encodingVideoId]
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
