// src/pages/MockExamInterface.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircularProgress,
  Button,
  Card,
  CardContent,
  Modal,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Alert,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, Flag } from 'lucide-react';
import { studentMockExamsAPI, MockExamQuestion, MockExamOption, MockExamAttempt } from '../api/mock_exams_api';
import showToast from '../utils/toast';
import { MathText } from '../utils/mathRenderer';

interface Answer {
  [key: number]: string | number | null;
}

interface MockExamInterfaceProps {
  darkMode?: boolean;
}

const MockExamInterface: React.FC<MockExamInterfaceProps> = ({ darkMode = false }) => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  // Create an explicit MUI theme to ensure nested Material components respect darkMode
  const muiTheme = React.useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc',
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      primary: { main: '#ca8a04' }, // Matched somewhat with yellow-600
    }
  }), [darkMode]);

  const [attempt, setAttempt] = useState<MockExamAttempt | null>(null);
  const [questions, setQuestions] = useState<MockExamQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);

  const attemptIdNum = parseInt(attemptId || '0');
  
  const resolvedAttemptId = attemptIdNum || (() => {
    try {
      const m = window.location.pathname.match(/attempt\/(\d+)/i);
      return m ? parseInt(m[1], 10) : 0;
    } catch (e) {
      return 0;
    }
  })();
  
  // Fetch attempt details
  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        const response = await studentMockExamsAPI.getAttemptDetail(resolvedAttemptId);
        const attemptData = response.data as MockExamAttempt;
        setAttempt(attemptData);

        // Calculate time remaining
        const startTime = new Date((attemptData as any).started_at).getTime();
        let durationMs = 120 * 60 * 1000; // Default 120 minutes
        const nowTime = Date.now();
        let remaining = 0;
        if (Number.isFinite(startTime)) {
          const elapsed = nowTime - startTime;
          remaining = Math.max(0, durationMs - elapsed);
        } else {
          remaining = durationMs;
        }
        if (!Number.isFinite(remaining)) remaining = 0;
        setTimeRemaining(remaining);

        // Fetch exam details to populate questions
        try {
          const examField = (attemptData as any).mock_exam || (attemptData as any).custom_mock_exam;
          const examId = typeof examField === 'number' ? examField : examField?.id;
          if (examId) {
            const examResp = await studentMockExamsAPI.getMockExamDetail(examId);
            const examData = examResp.data;

            let fetchedQuestions: MockExamQuestion[] = [];
            const normalizeQuestion = (q: any): MockExamQuestion => {
              const qTypeRaw = (q.question_type || q.questionType || '').toString().toLowerCase();
              let normalizedType: MockExamQuestion['question_type'] = 'MCQ';
              if (qTypeRaw.includes('multiple') || qTypeRaw === 'mcq') normalizedType = 'MCQ';
              else if (qTypeRaw.includes('true') || qTypeRaw.includes('false')) normalizedType = 'TrueOrFalse';
              else if (qTypeRaw.includes('essay')) normalizedType = 'Essay';
              else normalizedType = 'MCQ';

              const rawOptions = Array.isArray(q.options) ? q.options : q.options || [];
              const normalizedOptions: MockExamOption[] = rawOptions
                .map((opt: any) => ({
                  id: opt.id,
                  text: (opt.option_text || opt.text || '').toString(),
                  is_correct: Boolean(opt.is_correct),
                  order: opt.order || 0,
                }))
                .sort((a, b) => (a.order || 0) - (b.order || 0));

              return {
                id: q.id,
                question_text: q.question_text || q.questionText || '',
                question_type: normalizedType,
                marks: q.marks || q.marks_per_question || 0,
                difficulty: q.difficulty || q.difficulty_level || 'medium',
                options: normalizedOptions,
                explanation: q.explanation || '',
                question_image: q.question_image || null,
              } as MockExamQuestion;
            };

            if (Array.isArray(examData.subjects) && examData.subjects.length > 0) {
              examData.subjects.forEach((sub: any) => {
                const qs: any[] = sub.questions || [];
                qs.forEach((q) => {
                  fetchedQuestions.push(normalizeQuestion(q));
                });
              });
            } else if (Array.isArray(examData.questions)) {
              fetchedQuestions = examData.questions.map((q: any) => normalizeQuestion(q));
            }

            setQuestions(fetchedQuestions);

            if (examData.total_duration_minutes) {
              durationMs = examData.total_duration_minutes * 60 * 1000;
              if (Number.isFinite(startTime)) {
                const elapsed = Date.now() - startTime;
                let newRemaining = Math.max(0, durationMs - elapsed);
                if (!Number.isFinite(newRemaining)) newRemaining = 0;
                setTimeRemaining(newRemaining);
              } else {
                setTimeRemaining(durationMs);
              }
            }
          } else {
            setQuestions([]);
          }
        } catch (err) {
          console.error('Failed to fetch exam details', err);
          setQuestions([]);
        }

        if (attemptData.answers && Array.isArray(attemptData.answers)) {
          const answersMap: Answer = {};
          attemptData.answers.forEach((ans: any) => {
            answersMap[ans.question_id] = ans.selected_option_id || null;
          });
          setAnswers(answersMap);
        }

        setIsLoading(false);
      } catch (error) {
        showToast('error', 'Failed to load exam');
        navigate('/student/mock-exams');
      }
    };

    if (resolvedAttemptId) {
      fetchAttemptDetails();
    }
  }, [resolvedAttemptId, navigate]);

  useEffect(() => {
    if (!Number.isFinite(timeRemaining) || timeRemaining <= 0 || !attempt) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          handleSubmit(); 
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining, attempt]);

  const handleAnswerChange = (questionId: number, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMarkForReview = (questionId: number) => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) newSet.delete(questionId);
      else newSet.add(questionId);
      return newSet;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let timeSpentSeconds = 0;
      try {
        if (attempt && (attempt as any).started_at) {
          const started = new Date((attempt as any).started_at).getTime();
          if (Number.isFinite(started) && started > 0) {
            timeSpentSeconds = Math.max(0, Math.floor((Date.now() - started) / 1000));
          }
        }
      } catch (e) {
        if (Number.isFinite(timeRemaining)) timeSpentSeconds = Math.max(0, Math.floor((timeRemaining || 0) / 1000));
      }

      const response = await studentMockExamsAPI.submitMockExamAttempt(
        resolvedAttemptId,
        answers,
        timeSpentSeconds
      );
      showToast('success', 'Exam submitted successfully!');
      navigate(`/student/mock-exams/results/${resolvedAttemptId}`, { state: { attemptData: response.data } });
    } catch (error) {
      showToast('error', 'Failed to submit exam');
      setIsSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
    if (!Number.isFinite(ms) || ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter((v) => v !== null).length;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><CircularProgress /></div>;
  }

  if (!attempt || !currentQuestion) {
    return <div className="flex items-center justify-center min-h-screen"><Alert severity="error">Failed to load exam interface</Alert></div>;
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 to-slate-100 text-gray-900'}`}>
        
        {/* Header Bar */}
        <div className={`shadow-md p-4 sticky top-0 z-30 border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                Mock Exam {attempt.id}
              </h1>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Question {currentQuestionIdx + 1} of {totalQuestions}
              </p>
            </div>

            {/* Timer */}
            <div className={`text-center p-4 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-slate-700' : 'bg-yellow-100'}`}>
              <Clock size={20} style={{ color: Number.isFinite(timeRemaining) && timeRemaining < 300000 ? '#dc2626' : muiTheme.palette.primary.main }} />
              <span className={`text-2xl font-bold`} style={{ color: Number.isFinite(timeRemaining) && timeRemaining < 300000 ? '#dc2626' : muiTheme.palette.primary.main }}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            <Button
              variant="outlined"
              color="error"
              onClick={() => setShowConfirmSubmit(true)}
            >
              Submit Exam
            </Button>
          </div>

          <LinearProgress
            variant="determinate"
            value={(answeredCount / totalQuestions) * 100}
            className="mt-4"
          />
          <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Answered: {answeredCount}/{totalQuestions}
          </p>
        </div>

        <div className="flex-1 max-w-7xl mx-auto w-full py-8 px-4 flex gap-6">
          {/* Question Section */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="p-8">
                    <div className="mb-8">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className={`text-xl font-bold flex-1 ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                          <MathText text={currentQuestion.question_text} />
                        </h2>
                        <div className="flex gap-2 ml-4">
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {currentQuestion.marks} marks
                          </span>
                          {markedForReview.has(currentQuestion.id) && (
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                              <Flag size={14} />
                              Marked
                            </span>
                          )}
                        </div>
                      </div>

                      {currentQuestion.question_image && (
                        <img
                          src={currentQuestion.question_image}
                          alt="Question"
                          className="max-w-full h-64 object-contain mb-6"
                        />
                      )}
                    </div>

                    <div className="mb-8">
                      {currentQuestion.question_type === 'MCQ' && (
                        <RadioGroup
                          value={answers[currentQuestion.id]?.toString() || ''}
                          onChange={(e) =>
                            handleAnswerChange(currentQuestion.id, parseInt(e.target.value))
                          }
                        >
                          {(currentQuestion.options || []).map((option: MockExamOption, optIdx: number) => (
                            <FormControlLabel
                              key={option.id}
                              value={option.id?.toString() || ''}
                              control={<Radio />}
                              label={
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span className={`text-base ${darkMode ? 'text-slate-300' : 'text-gray-800'}`}>
                                    <MathText text={option.text} />
                                  </span>
                                </div>
                              }
                              className={`mb-3 p-3 border rounded-lg transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}
                            />
                          ))}
                        </RadioGroup>
                      )}

                      {currentQuestion.question_type === 'TrueOrFalse' && (
                        <RadioGroup
                          row
                          value={String(answers[currentQuestion.id] ?? '')}
                          onChange={(e) =>
                            handleAnswerChange(currentQuestion.id, e.target.value)
                          }
                        >
                          <FormControlLabel value="true" control={<Radio />} label="True" className="mr-8" />
                          <FormControlLabel value="false" control={<Radio />} label="False" />
                        </RadioGroup>
                      )}

                      {currentQuestion.question_type === 'Essay' && (
                        <TextField
                          fullWidth
                          multiline
                          rows={8}
                          placeholder="Enter your answer here..."
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) =>
                            handleAnswerChange(currentQuestion.id, e.target.value)
                          }
                          variant="outlined"
                        />
                      )}
                    </div>

                    {currentQuestion.explanation && (
                      <Alert severity="info" className="mb-6">
                        <strong>Tip:</strong> <MathText text={currentQuestion.explanation} />
                      </Alert>
                    )}

                    <div className="flex items-center gap-2 mb-6">
                      <Checkbox
                        checked={markedForReview.has(currentQuestion.id)}
                        onChange={() => handleMarkForReview(currentQuestion.id)}
                      />
                      <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>Mark this question for review</span>
                    </div>

                    <div className={`flex justify-between gap-4 pt-6 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                      <Button
                        variant="outlined"
                        startIcon={<ChevronLeft />}
                        onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                        disabled={currentQuestionIdx === 0}
                      >
                        Previous
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={() => setShowQuestionPalette(!showQuestionPalette)}
                      >
                        Go to Question
                      </Button>

                      <Button
                        variant="contained"
                        endIcon={<ChevronRight />}
                        onClick={() =>
                          setCurrentQuestionIdx(Math.min(currentQuestionIdx + 1, totalQuestions - 1))
                        }
                        disabled={currentQuestionIdx === totalQuestions - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Question Palette Sidebar */}
          <div className="w-64">
            <Card>
              <CardContent className="p-4">
                <h3 className={`font-bold mb-4 ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>Questions</h3>
                <div className="grid grid-cols-4 gap-2 max-h-96 overflow-auto">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`p-2 rounded font-semibold text-sm transition ${
                        idx === currentQuestionIdx
                          ? 'bg-yellow-500 text-white'
                          : answers[q.id] !== null
                          ? (darkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700')
                          : markedForReview.has(q.id)
                          ? (darkMode ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-100 text-orange-700')
                          : (darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <div className={`mt-6 space-y-2 text-xs border-t pt-4 ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 border rounded ${darkMode ? 'bg-green-900/40 border-green-500' : 'bg-green-100 border-green-500'}`}></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 border rounded ${darkMode ? 'bg-orange-900/40 border-orange-500' : 'bg-orange-100 border-orange-500'}`}></div>
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 border rounded ${darkMode ? 'bg-slate-700 border-slate-500' : 'bg-gray-100 border-gray-500'}`}></div>
                    <span>Not Visited</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        <Modal open={showConfirmSubmit} onClose={() => setShowConfirmSubmit(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center p-4"
          >
            <Card className="max-w-md w-full">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="text-orange-600" size={28} />
                  <h2 className="text-2xl font-bold">Submit Exam?</h2>
                </div>

                <div className={`p-4 rounded-lg mb-6 space-y-2 ${darkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    <strong>Questions Answered:</strong> {answeredCount}/{totalQuestions}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    <strong>Questions Marked for Review:</strong> {markedForReview.size}
                  </p>
                </div>

                <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Once submitted, you cannot change your answers. Are you sure you want to submit?
                </p>

                <div className="flex gap-3">
                  <Button fullWidth variant="outlined" onClick={() => setShowConfirmSubmit(false)}>
                    Cancel
                  </Button>
                  <Button fullWidth variant="contained" color="error" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={20} /> : 'Submit'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Modal>
      </div>
    </ThemeProvider>
  );
};

export default MockExamInterface;