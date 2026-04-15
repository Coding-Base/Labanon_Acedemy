// src/pages/MasterAdminMockPanel.tsx - Enhanced with Exam Structure Management
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tabs,
  Tab,
  Box,
  Container,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Modal,
  FormControlLabel,
  Checkbox,
  Grid,
  Collapse,
  useTheme,
  Typography,
} from '@mui/material'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
  Settings,
  Archive,
  Download,
  ChevronDown,
  ChevronRight,
  Check,
  X,
} from 'lucide-react'
import { adminMockExamsAPI, CustomMockExam } from '../api/mock_exams_api'
import showToast from '../utils/toast'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mock-exams-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

// ============ MAIN MOCK ADMIN PANEL ============
const MasterAdminMockPanel: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState(0)
  const [exams, setExams] = useState<CustomMockExam[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [examStructureOpen, setExamStructureOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<CustomMockExam | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_area: '',
    difficulty_level: 'medium' as const,
    total_duration_minutes: 120,
    total_marks: 100,
    passing_marks: 50,
    instructions: '',
  })

  // Fetch exams
  const fetchExams = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await adminMockExamsAPI.getMockExams(1, '', {})
      setExams(response.data.results || [])
    } catch (error) {
      showToast('error', 'Failed to load exams')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  // Create or update exam
  const handleSaveExam = async () => {
    try {
      if (selectedExam) {
        // Update
        await adminMockExamsAPI.updateMockExam(selectedExam.id, formData)
        showToast('success', 'Exam updated successfully')
      } else {
        // Create
        await adminMockExamsAPI.createMockExam(formData)
        showToast('success', 'Exam created successfully')
      }
      setOpenDialog(false)
      setSelectedExam(null)
      setFormData({
        title: '',
        description: '',
        subject_area: '',
        difficulty_level: 'medium',
        total_duration_minutes: 120,
        total_marks: 100,
        passing_marks: 50,
        instructions: '',
      })
      fetchExams()
    } catch (error) {
      showToast('error', 'Failed to save exam')
    }
  }

  // Publish exam
  const handlePublish = async (examId: number) => {
    try {
      await adminMockExamsAPI.publishMockExam(examId)
      showToast('success', 'Exam published successfully')
      fetchExams()
    } catch (error) {
      showToast('error', 'Failed to publish exam')
    }
  }

  // Delete exam
  const handleDelete = async (examId: number) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await adminMockExamsAPI.deleteMockExam(examId)
        showToast('success', 'Exam deleted successfully')
        fetchExams()
      } catch (error) {
        showToast('error', 'Failed to delete exam')
      }
    }
  }

  const handleOpenDialog = (exam?: CustomMockExam) => {
    if (exam) {
      setSelectedExam(exam)
      setFormData({
        title: exam.title,
        description: exam.description,
        subject_area: exam.subject_area,
        difficulty_level: exam.difficulty_level as any,
        total_duration_minutes: exam.total_duration_minutes,
        total_marks: exam.total_marks,
        passing_marks: exam.passing_marks,
        instructions: exam.instructions || '',
      })
    } else {
      setSelectedExam(null)
      setFormData({
        title: '',
        description: '',
        subject_area: '',
        difficulty_level: 'medium',
        total_duration_minutes: 120,
        total_marks: 100,
        passing_marks: 50,
        instructions: '',
      })
    }
    setOpenDialog(true)
  }

  const openExamStructure = (exam: CustomMockExam) => {
    setSelectedExamId(exam.id)
    setSelectedExam(exam)
    setExamStructureOpen(true)
  }

  return (
    <div
      className={`min-h-screen py-8 ${
        darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 to-slate-100'
      }`}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`text-4xl font-bold mb-2 ${
              darkMode ? 'text-slate-100' : 'text-gray-800'
            }`}
          >
            Mock Exams Management
          </h1>
          <p className={darkMode ? 'text-slate-400' : 'text-gray-600'}>
            Create, edit, and manage mock exams for students
          </p>
        </div>

        {/* Tabs */}
        <Card className={darkMode ? '!bg-slate-800 !border-slate-700' : ''}>
          <Box sx={{ borderBottom: 1, borderColor: darkMode ? '#475569' : 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              aria-label="mock exams tabs"
            >
              <Tab label="Exams" />
              <Tab label="Activity Overview" />
              <Tab label="Fee Management" />
              <Tab label="Platform Integration" />
            </Tabs>
          </Box>

          {/* Exams Tab */}
          <TabPanel value={activeTab} index={0}>
            <div className="mb-6">
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={() => handleOpenDialog()}
                sx={{
                  backgroundColor: '#FBBF24',
                  color: '#1F2937',
                  '&:hover': { backgroundColor: '#F59E0B' },
                  fontWeight: 'bold',
                }}
              >
                Create New Exam
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <CircularProgress />
              </div>
            ) : exams.length === 0 ? (
              <Alert severity="info">
                No exams created yet. Click the button above to create one.
              </Alert>
            ) : (
              <TableContainer
                component={Paper}
                className={darkMode ? '!bg-slate-800 !border-slate-700' : ''}
              >
                <Table>
                  <TableHead style={{ backgroundColor: darkMode ? '#334155' : '#f5f5f5' }}>
                    <TableRow>
                      <TableCell className={darkMode ? '!text-slate-100' : ''}>Title</TableCell>
                      <TableCell className={darkMode ? '!text-slate-100' : ''}>
                        Subject Area
                      </TableCell>
                      <TableCell className={darkMode ? '!text-slate-100' : ''}>
                        Difficulty
                      </TableCell>
                      <TableCell className={darkMode ? '!text-slate-100' : ''}>Duration</TableCell>
                      <TableCell className={darkMode ? '!text-slate-100' : ''}>Marks</TableCell>
                      <TableCell className={darkMode ? '!text-slate-100' : ''}>Status</TableCell>
                      <TableCell className={darkMode ? '!text-slate-100' : ''}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.id} hover className={darkMode ? 'hover:!bg-slate-700' : ''}>
                        <TableCell
                          className={`font-semibold ${darkMode ? '!text-slate-100' : ''}`}
                        >
                          {exam.title}
                        </TableCell>
                        <TableCell className={darkMode ? '!text-slate-300' : ''}>
                          {exam.subject_area}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              exam.difficulty_level.charAt(0).toUpperCase() +
                              exam.difficulty_level.slice(1)
                            }
                            size="small"
                            variant={exam.difficulty_level === 'easy' ? 'filled' : 'outlined'}
                            color={
                              exam.difficulty_level === 'easy'
                                ? 'success'
                                : exam.difficulty_level === 'medium'
                                ? 'warning'
                                : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>{exam.total_duration_minutes} min</TableCell>
                        <TableCell>{exam.total_marks}</TableCell>
                        <TableCell>
                          <Chip
                            label={exam.is_published ? 'Published' : 'Draft'}
                            variant="outlined"
                            color={exam.is_published ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(exam)}
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => openExamStructure(exam)}
                              title="Manage Structure (Subjects/Questions)"
                              sx={{
                                color: theme.palette.primary.main,
                                fontWeight: 'bold',
                              }}
                            >
                              <Settings size={18} />
                            </IconButton>
                            {!exam.is_published && (
                              <IconButton
                                size="small"
                                onClick={() => handlePublish(exam.id)}
                                title="Publish"
                              >
                                <Eye size={18} />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(exam.id)}
                              title="Delete"
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </IconButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Activity Overview Tab */}
          <TabPanel value={activeTab} index={1}>
            <ActivityOverviewTab darkMode={darkMode} />
          </TabPanel>

          {/* Fee Management Tab */}
          <TabPanel value={activeTab} index={2}>
            <FeeManagementTab exams={exams} darkMode={darkMode} />
          </TabPanel>

          {/* Platform Integration Tab */}
          <TabPanel value={activeTab} index={3}>
            <PlatformIntegrationTab darkMode={darkMode} />
          </TabPanel>
        </Card>
      </Container>

      {/* Create/Edit Exam Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: darkMode ? '#1E293B' : 'white',
            color: darkMode ? '#E2E8F0' : 'inherit',
          },
        }}
      >
        <DialogTitle sx={{ color: darkMode ? '#E2E8F0' : 'inherit' }}>
          {selectedExam ? 'Edit Exam' : 'Create New Exam'}
        </DialogTitle>
        <DialogContent className="space-y-4 pt-4">
          <TextField
            fullWidth
            label="Exam Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Subject Area"
            value={formData.subject_area}
            onChange={(e) => setFormData({ ...formData, subject_area: e.target.value })}
            variant="outlined"
          />
          <TextField
            fullWidth
            select
            label="Difficulty Level"
            value={formData.difficulty_level}
            onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as any })}
            variant="outlined"
          >
            <MenuItem value="easy">Easy</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
            <MenuItem value="mixed">Mixed</MenuItem>
          </TextField>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={formData.total_duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, total_duration_minutes: parseInt(e.target.value) })
                }
                variant="outlined"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Total Marks"
                value={formData.total_marks}
                onChange={(e) =>
                  setFormData({ ...formData, total_marks: parseInt(e.target.value) })
                }
                variant="outlined"
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            type="number"
            label="Passing Marks"
            value={formData.passing_marks}
            onChange={(e) =>
              setFormData({ ...formData, passing_marks: parseInt(e.target.value) })
            }
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            multiline
            rows={3}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{ color: darkMode ? '#CBD5E1' : 'inherit' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveExam}
            sx={{
              backgroundColor: '#FBBF24',
              color: '#1F2937',
              '&:hover': { backgroundColor: '#F59E0B' },
            }}
          >
            {selectedExam ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exam Structure Modal */}
      {examStructureOpen && selectedExamId && (
        <ExamStructureModal
          examId={selectedExamId}
          exam={selectedExam}
          open={examStructureOpen}
          onClose={() => setExamStructureOpen(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  )
}

// ============ EXAM STRUCTURE MODAL ============
interface ExamStructureModalProps {
  examId: number
  exam: CustomMockExam | null
  open: boolean
  onClose: () => void
  darkMode?: boolean
}

const ExamStructureModal: React.FC<ExamStructureModalProps> = ({
  examId,
  exam,
  open,
  onClose,
  darkMode = false,
}) => {
  const theme = useTheme()
  const [subjects, setSubjects] = useState<any[]>([])
  const [questions, setQuestions] = useState<{ [key: number]: any[] }>({})
  const [options, setOptions] = useState<{ [key: number]: any[] }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)

  // Dialogs
  const [openSubjectDialog, setOpenSubjectDialog] = useState(false)
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null)

  // Inline editing for options
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null)
  const [editingOptionText, setEditingOptionText] = useState('')
  const [editingOptionIsCorrect, setEditingOptionIsCorrect] = useState(false)
  const [editingOptionImage, setEditingOptionImage] = useState<File | null>(null)

  // Form states
  const [subjectForm, setSubjectForm] = useState({ subject_name: '', order_index: 1 })
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_image_file: null as File | null,
    question_type: 'multiple_choice',
    marks: 1,
    difficulty: 'medium',
    explanation: '',
    explanation_image_file: null as File | null,
  })

  // Fetch exam structure
  const fetchExamStructure = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log('Fetching exam structure for exam ID:', examId)
      const examData = await adminMockExamsAPI.getExamWithStructure(examId)
      console.log('Exam structure fetched:', examData)
      setSubjects(examData.subjects || [])

      // Build questions and options maps
      const questionsMap: { [key: number]: any[] } = {}
      const optionsMap: { [key: number]: any[] } = {}

      for (const subject of examData.subjects || []) {
        questionsMap[subject.id] = subject.questions || []
        for (const question of subject.questions || []) {
          optionsMap[question.id] = question.options || []
        }
      }

      setQuestions(questionsMap)
      setOptions(optionsMap)
      console.log('Questions map:', questionsMap)
      console.log('Options map:', optionsMap)
    } catch (error) {
      console.error('Error fetching exam structure:', error)
      showToast('error', 'Failed to load exam structure')
    } finally {
      setIsLoading(false)
    }
  }, [examId])

  useEffect(() => {
    if (open) {
      fetchExamStructure()
    }
  }, [open, fetchExamStructure])

  // Add Subject
  const handleAddSubject = async () => {
    if (!subjectForm.subject_name.trim()) {
      showToast('error', 'Subject name is required')
      return
    }
    try {
      console.log('Adding subject:', subjectForm)
      await adminMockExamsAPI.addSubject(examId, {
        subject_name: subjectForm.subject_name,
        order_index: subjectForm.order_index,
      })
      showToast('success', 'Subject added successfully')
      setOpenSubjectDialog(false)
      setSubjectForm({ subject_name: '', order_index: 1 })
      await fetchExamStructure()
    } catch (error: any) {
      console.error('Error adding subject:', error)
      const errorMsg = error?.response?.data?.detail || error?.response?.data || 'Failed to add subject'
      showToast('error', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    }
  }

  // Add Question
  const handleAddQuestion = async () => {
    if (!selectedSubject || !questionForm.question_text.trim()) {
      showToast('error', 'Subject and question text are required')
      return
    }
    try {
      console.log('Adding question:', questionForm)
      await adminMockExamsAPI.addQuestion(selectedSubject.id, {
        question_text: questionForm.question_text,
        question_image_file: questionForm.question_image_file,
        question_type: questionForm.question_type,
        marks: questionForm.marks,
        difficulty: questionForm.difficulty,
        explanation: questionForm.explanation,
        explanation_image_file: questionForm.explanation_image_file,
      })
      showToast('success', 'Question added successfully')
      setOpenQuestionDialog(false)
      setQuestionForm({
        question_text: '',
        question_image_file: null,
        question_type: 'multiple_choice',
        marks: 1,
        difficulty: 'medium',
        explanation: '',
        explanation_image_file: null,
      })
      await fetchExamStructure()
    } catch (error: any) {
      console.error('Error adding question:', error)
      const errorMsg = error?.response?.data?.detail || error?.response?.data || 'Failed to add question'
      showToast('error', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    }
  }

  // Update Option (PATCH - update existing) with text, correct flag, and optional image
  const handleUpdateOption = async (option: any) => {
    if (!editingOptionText.trim()) {
      showToast('error', 'Option text cannot be empty')
      return
    }
    try {
      console.log('Updating option:', option.id, { 
        option_text: editingOptionText, 
        is_correct: editingOptionIsCorrect,
        has_image: !!editingOptionImage
      })

      // Build FormData for file upload support
      const formData = new FormData()
      formData.append('option_text', editingOptionText)
      formData.append('is_correct', editingOptionIsCorrect.toString())
      if (editingOptionImage) {
        formData.append('option_image_file', editingOptionImage)
      }

      await adminMockExamsAPI.updateOption(option.id, formData as any)
      showToast('success', 'Option saved successfully')
      setEditingOptionId(null)
      setEditingOptionText('')
      setEditingOptionIsCorrect(false)
      setEditingOptionImage(null)
      await fetchExamStructure()
    } catch (error: any) {
      console.error('Error updating option:', error)
      const errorMsg = error?.response?.data?.detail || error?.response?.data || 'Failed to update option'
      showToast('error', typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    }
  }

  // Toggle option as correct
  const handleToggleCorrect = async (option: any) => {
    try {
      console.log('Toggling correct:', option.id, { is_correct: !option.is_correct })
      await adminMockExamsAPI.updateOption(option.id, {
        option_text: option.option_text,
        is_correct: !option.is_correct,
      })
      showToast('success', `Marked as ${!option.is_correct ? 'correct' : 'incorrect'}`)
      await fetchExamStructure()
    } catch (error: any) {
      console.error('Error toggling correct:', error)
      showToast('error', 'Failed to update option')
    }
  }

  // Delete Subject
  const handleDeleteSubject = async (subjectId: number) => {
    if (window.confirm('Delete this subject and all its questions? This cannot be undone.')) {
      try {
        await adminMockExamsAPI.deleteSubject(subjectId)
        showToast('success', 'Subject deleted successfully')
        fetchExamStructure()
      } catch (error) {
        showToast('error', 'Failed to delete subject')
      }
    }
  }

  // Delete Question
  const handleDeleteQuestion = async (questionId: number) => {
    if (window.confirm('Delete this question and all its options? This cannot be undone.')) {
      try {
        await adminMockExamsAPI.deleteQuestion(questionId)
        showToast('success', 'Question deleted successfully')
        fetchExamStructure()
      } catch (error) {
        showToast('error', 'Failed to delete question')
      }
    }
  }

  // Delete Option
  const handleDeleteOption = async (optionId: number) => {
    if (window.confirm('Delete this option?')) {
      try {
        await adminMockExamsAPI.deleteOption(optionId)
        showToast('success', 'Option deleted successfully')
        fetchExamStructure()
      } catch (error) {
        showToast('error', 'Failed to delete option')
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: darkMode ? '#1E293B' : 'white',
          color: darkMode ? '#E2E8F0' : 'inherit',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          color: theme.palette.primary.main,
          fontWeight: 'bold',
          borderBottom: `1px solid ${darkMode ? '#334155' : '#e0e0e0'}`,
        }}
      >
        Exam Structure: {exam?.title}
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Add Subject Button */}
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={() => setOpenSubjectDialog(true)}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': { backgroundColor: theme.palette.primary.dark },
                }}
              >
                + Add Subject
              </Button>
            </Box>

            {/* Subjects List */}
            <Box>
              {subjects.length === 0 ? (
                <Alert severity="info">
                  No subjects added yet. Click "+ Add Subject" to create one.
                </Alert>
              ) : (
                subjects.map((subject, idx) => (
                  <Card
                    key={subject.id}
                    sx={{
                      mb: 2,
                      backgroundColor: darkMode ? '#334155' : '#f9fafb',
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                    }}
                  >
                    <CardContent>
                      {/* Subject Header */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          mb: expandedSubject === subject.id ? 2 : 0,
                        }}
                        onClick={() =>
                          setExpandedSubject(
                            expandedSubject === subject.id ? null : subject.id
                          )
                        }
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {expandedSubject === subject.id ? (
                            <ChevronDown size={20} />
                          ) : (
                            <ChevronRight size={20} />
                          )}
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 'bold',
                              color: darkMode ? '#E2E8F0' : '#1F2937',
                            }}
                          >
                            {subject.subject_name}
                          </Typography>
                          <Chip
                            label={`${questions[subject.id]?.length || 0} questions`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSubject(subject)
                              setOpenQuestionDialog(true)
                            }}
                            title="Add Question"
                          >
                            <Plus size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSubject(subject.id)
                            }}
                            title="Delete Subject"
                          >
                            <Trash2 size={18} className="text-red-500" />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Questions List */}
                      <Collapse in={expandedSubject === subject.id}>
                        <Box sx={{ ml: 4 }}>
                          {questions[subject.id]?.length === 0 ? (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              No questions added yet.
                            </Alert>
                          ) : (
                            questions[subject.id]?.map((question, qIdx) => (
                              <Card
                                key={question.id}
                                sx={{
                                  mb: 1.5,
                                  backgroundColor: darkMode ? '#1E293B' : '#ffffff',
                                  borderLeft: `3px solid ${theme.palette.secondary.main}`,
                                }}
                              >
                                <CardContent sx={{ pb: 1 }}>
                                  {/* Question Header */}
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      cursor: 'pointer',
                                    }}
                                    onClick={() =>
                                      setExpandedQuestion(
                                        expandedQuestion === question.id ? null : question.id
                                      )
                                    }
                                  >
                                    <Box sx={{ flex: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {expandedQuestion === question.id ? (
                                          <ChevronDown size={16} />
                                        ) : (
                                          <ChevronRight size={16} />
                                        )}
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color: darkMode ? '#CBD5E1' : '#4b5563',
                                            fontWeight: 500,
                                          }}
                                        >
                                          Q{qIdx + 1}: {question.question_text}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Chip
                                          label={`${question.marks} marks`}
                                          size="small"
                                          variant="outlined"
                                        />
                                        <Chip
                                          label={question.difficulty}
                                          size="small"
                                          color={
                                            question.difficulty === 'easy'
                                              ? 'success'
                                              : question.difficulty === 'medium'
                                              ? 'warning'
                                              : 'error'
                                          }
                                          variant="outlined"
                                        />
                                      </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteQuestion(question.id)
                                        }}
                                        title="Delete Question"
                                      >
                                        <Trash2 size={16} className="text-red-500" />
                                      </IconButton>
                                    </Box>
                                  </Box>

                                  {/* Options List */}
                                  <Collapse in={expandedQuestion === question.id}>
                                    <Box sx={{ ml: 4, mt: 2 }}>
                                      {options[question.id]?.length === 0 ? (
                                        <Typography variant="caption" sx={{ color: 'gray' }}>
                                          No options added yet.
                                        </Typography>
                                      ) : (
                                        options[question.id]?.map((option, oIdx) => (
                                          <Box
                                            key={option.id}
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              gap: 1.5,
                                              p: 1.5,
                                              backgroundColor: option.is_correct
                                                ? darkMode
                                                  ? 'rgba(34, 197, 94, 0.1)'
                                                  : 'rgba(34, 197, 94, 0.05)'
                                                : darkMode
                                                ? 'rgba(255,255,255,0.05)'
                                                : 'rgba(0,0,0,0.02)',
                                              borderRadius: 1,
                                              border: option.is_correct ? '1px solid rgb(34, 197, 94)' : 'none',
                                              mb: 0.5,
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                              <Chip
                                                label={option.option_letter}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 'bold', minWidth: '40px' }}
                                              />
                                              {editingOptionId === option.id ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                                                  <TextField
                                                    size="small"
                                                    value={editingOptionText}
                                                    onChange={(e) => setEditingOptionText(e.target.value)}
                                                    autoFocus
                                                    placeholder="Option text"
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                        handleUpdateOption(option)
                                                      } else if (e.key === 'Escape') {
                                                        setEditingOptionId(null)
                                                        setEditingOptionImage(null)
                                                      }
                                                    }}
                                                    variant="outlined"
                                                  />
                                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <FormControlLabel
                                                      control={
                                                        <Checkbox
                                                          size="small"
                                                          checked={editingOptionIsCorrect}
                                                          onChange={(e) => setEditingOptionIsCorrect(e.target.checked)}
                                                        />
                                                      }
                                                      label="Correct answer"
                                                      sx={{ m: 0 }}
                                                    />
                                                    <TextField
                                                      type="file"
                                                      size="small"
                                                      inputProps={{ accept: 'image/*' }}
                                                      onChange={(e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0]
                                                        if (file) setEditingOptionImage(file)
                                                      }}
                                                      variant="standard"
                                                      sx={{ flex: 1, maxWidth: '200px' }}
                                                    />
                                                  </Box>
                                                </Box>
                                              ) : (
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    flex: 1,
                                                    cursor: 'pointer',
                                                    color: darkMode ? '#CBD5E1' : '#1F2937',
                                                    '&:hover': {
                                                      backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                                      borderRadius: '4px',
                                                      padding: '2px 4px',
                                                    },
                                                  }}
                                                  onClick={() => {
                                                    setEditingOptionId(option.id)
                                                    setEditingOptionText(option.option_text)
                                                    setEditingOptionIsCorrect(option.is_correct)
                                                    setEditingOptionImage(null)
                                                  }}
                                                >
                                                  {option.option_text || '(empty - click to add text)'}
                                                </Typography>
                                              )}
                                            </Box>

                                            {/* Right side buttons */}
                                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                              {editingOptionId === option.id ? (
                                                <>
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => handleUpdateOption(option)}
                                                    title="Save"
                                                    sx={{ color: 'green' }}
                                                  >
                                                    <Check size={16} />
                                                  </IconButton>
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => setEditingOptionId(null)}
                                                    title="Cancel"
                                                    sx={{ color: 'gray' }}
                                                  >
                                                    <X size={16} />
                                                  </IconButton>
                                                </>
                                              ) : (
                                                <>
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => handleToggleCorrect(option)}
                                                    title={option.is_correct ? 'Mark as incorrect' : 'Mark as correct'}
                                                    sx={{
                                                      color: option.is_correct ? 'green' : 'gray',
                                                    }}
                                                  >
                                                    {option.is_correct ? '✓' : '○'}
                                                  </IconButton>
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteOption(option.id)}
                                                    title="Delete Option"
                                                  >
                                                    <Trash2 size={14} className="text-red-500" />
                                                  </IconButton>
                                                </>
                                              )}
                                            </Box>
                                          </Box>
                                        ))
                                      )}
                                    </Box>
                                  </Collapse>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e0e0e0'}` }}>
        <Button onClick={onClose} sx={{ color: darkMode ? '#CBD5E1' : 'inherit' }}>
          Close
        </Button>
      </DialogActions>

      {/* Add Subject Dialog */}
      <Dialog
        open={openSubjectDialog}
        onClose={() => setOpenSubjectDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: darkMode ? '#1E293B' : 'white' },
        }}
      >
        <DialogTitle>Add Subject</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Subject Name"
            value={subjectForm.subject_name}
            onChange={(e) => setSubjectForm({ ...subjectForm, subject_name: e.target.value })}
            placeholder="e.g., English, Mathematics"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Order Index"
            value={subjectForm.order_index}
            onChange={(e) =>
              setSubjectForm({ ...subjectForm, order_index: parseInt(e.target.value) })
            }
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubjectDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddSubject}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': { backgroundColor: theme.palette.primary.dark },
            }}
          >
            Add Subject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Question Dialog */}
      <Dialog
        open={openQuestionDialog}
        onClose={() => setOpenQuestionDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: darkMode ? '#1E293B' : 'white' },
        }}
      >
        <DialogTitle>Add Question to {selectedSubject?.subject_name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Question"
            value={questionForm.question_text}
            onChange={(e) =>
              setQuestionForm({ ...questionForm, question_text: e.target.value })
            }
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Question Type"
            value={questionForm.question_type}
            onChange={(e) =>
              setQuestionForm({ ...questionForm, question_type: e.target.value })
            }
            sx={{ mb: 2 }}
          >
            <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
            <MenuItem value="radio">Radio Button</MenuItem>
            <MenuItem value="checkbox">Checkboxes</MenuItem>
            <MenuItem value="true_false">True/False</MenuItem>
            <MenuItem value="fill_blank">Fill in the Blank</MenuItem>
            <MenuItem value="short_answer">Short Answer</MenuItem>
            <MenuItem value="essay">Essay</MenuItem>
            <MenuItem value="matching">Matching</MenuItem>
            <MenuItem value="ordering">Ordering</MenuItem>
          </TextField>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Question Image (optional)
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setQuestionForm({ ...questionForm, question_image_file: file })
              }}
              style={{
                display: 'block',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
              }}
            />
            {questionForm.question_image_file && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'green' }}>
                ✓ {questionForm.question_image_file.name} selected
              </Typography>
            )}
          </Box>
          <TextField
            fullWidth
            label="Explanation (optional)"
            multiline
            rows={2}
            value={questionForm.explanation}
            onChange={(e) =>
              setQuestionForm({ ...questionForm, explanation: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Explanation Image (optional)
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setQuestionForm({ ...questionForm, explanation_image_file: file })
              }}
              style={{
                display: 'block',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
              }}
            />
            {questionForm.explanation_image_file && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'green' }}>
                ✓ {questionForm.explanation_image_file.name} selected
              </Typography>
            )}
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Marks"
                value={questionForm.marks}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) })
                }
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Difficulty"
                value={questionForm.difficulty}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, difficulty: e.target.value })
                }
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQuestionDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddQuestion}
            sx={{
              backgroundColor: theme.palette.primary.main,
              '&:hover': { backgroundColor: theme.palette.primary.dark },
            }}
          >
            Add Question
          </Button>
        </DialogActions>
      </Dialog>

    </Dialog>
  )
}

// ============ ACTIVITY OVERVIEW TAB ============
const ActivityOverviewTab: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => {
  const [overview, setOverview] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await adminMockExamsAPI.getActivityOverview()
        setOverview(response.data)
      } catch (error) {
        showToast('error', 'Failed to load activity overview')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOverview()
  }, [])

  if (isLoading) {
    return <CircularProgress />
  }

  if (!overview) {
    return <Alert severity="error">Failed to load overview data</Alert>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={darkMode ? '!bg-slate-800 !border-slate-700' : ''}>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-amber-500">{overview.total_exams}</div>
              <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Total Exams
              </p>
              <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                {overview.published_exams} published, {overview.draft_exams} draft
              </p>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={darkMode ? '!bg-slate-800 !border-slate-700' : ''}>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-green-500">
                {overview.total_students_attempted}
              </div>
              <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Students Attempted
              </p>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={darkMode ? '!bg-slate-800 !border-slate-700' : ''}>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-amber-500">
                {overview.average_completion_rate.toFixed(1)}%
              </div>
              <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Avg Completion Rate
              </p>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={darkMode ? '!bg-slate-800 !border-slate-700' : ''}>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-violet-500">
                {overview.average_score.toFixed(1)}%
              </div>
              <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Avg Score
              </p>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Most Attempted Exam */}
      {overview.most_attempted_exam && (
        <Card className={darkMode ? '!bg-slate-800 !border-slate-700' : ''}>
          <CardContent>
            <h3
              className={`font-bold text-lg mb-3 flex items-center gap-2 ${
                darkMode ? 'text-amber-400' : ''
              }`}
            >
              <BarChart3 size={20} /> Most Attempted Exam
            </h3>
            <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>
              {overview.most_attempted_exam.title}
            </p>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              {overview.most_attempted_exam.total_attempts} attempts
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {overview.recent_activities && (
        <Card className={darkMode ? '!bg-slate-800 !border-slate-700' : ''}>
          <CardContent>
            <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-slate-100' : ''}`}>
              Recent Activity
            </h3>
            <div className="space-y-3">
              {overview.recent_activities.slice(0, 5).map((activity: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 pb-3 border-b last:border-b-0 ${
                    darkMode ? 'border-slate-700' : ''
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-800'}`}>
                      {activity.action}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============ FEE MANAGEMENT TAB ============
interface FeeManagementTabProps {
  exams: CustomMockExam[]
  darkMode?: boolean
}

const FeeManagementTab: React.FC<FeeManagementTabProps> = ({ exams, darkMode = false }) => {
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [feeAmount, setFeeAmount] = useState('0')
  const [discountPercent, setDiscountPercent] = useState('0')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSetFee = async () => {
    if (!selectedExamId) {
      showToast('error', 'Please select an exam')
      return
    }

    try {
      setIsSubmitting(true)
      await adminMockExamsAPI.setMockExamFee(selectedExamId, {
        fee_amount: parseFloat(feeAmount),
        discount_percentage: parseInt(discountPercent),
        currency: 'NGN',
      })
      showToast('success', 'Fee updated successfully')
      setFeeAmount('0')
      setDiscountPercent('0')
      setSelectedExamId(null)
    } catch (error) {
      showToast('error', 'Failed to set fee')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className={darkMode ? '!bg-slate-800 !border-slate-700' : ''}>
        <CardContent className="space-y-4">
          <TextField
            fullWidth
            select
            label="Select Exam"
            value={selectedExamId || ''}
            onChange={(e) => setSelectedExamId(parseInt(e.target.value) || null)}
            variant="outlined"
          >
            {exams.map((exam) => (
              <MenuItem key={exam.id} value={exam.id}>
                {exam.title}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            type="number"
            label="Fee Amount (NGN)"
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
            placeholder="Set 0 for free exam"
            variant="outlined"
          />
          <TextField
            fullWidth
            type="number"
            label="Discount (%)"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            inputProps={{ min: 0, max: 100 }}
            variant="outlined"
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleSetFee}
            disabled={isSubmitting}
            sx={{
              backgroundColor: '#FBBF24',
              color: '#1F2937',
              '&:hover': { backgroundColor: '#F59E0B' },
              '&:disabled': { opacity: 0.6 },
            }}
          >
            {isSubmitting ? 'Saving...' : 'Set Fee'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ PLATFORM INTEGRATION TAB ============
const PlatformIntegrationTab: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => {
  return (
    <Alert severity="info">
      Platform integration configuration will be available soon. You can configure external
      platform connections (JAMB, WAEC, NECO) here.
    </Alert>
  )
}

export default MasterAdminMockPanel
