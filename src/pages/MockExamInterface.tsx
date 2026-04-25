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
  Backdrop,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Box,
  Alert,
} from '@mui/material';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, Flag } from 'lucide-react';
import { useTheme } from '@mui/material';
import { studentMockExamsAPI, MockExamQuestion, MockExamOption, MockExamAttempt } from '../api/mock_exams_api';
import showToast from '../utils/toast';
import { MathText } from '../utils/mathRenderer';

interface Answer {
  [key: number]: string | number | null;
}

const MockExamInterface: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

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
  const theme = useTheme();
  // Fallback: sometimes nested routing or router context may not populate params as expected.
  // Try to extract attempt id from the pathname if parseInt gave 0.
  const resolvedAttemptId = attemptIdNum || (() => {
    try {
      const m = window.location.pathname.match(/attempt\/(\d+)/i);
      return m ? parseInt(m[1], 10) : 0;
    } catch (e) {
      return 0;
    }
  })();
  // Small debug aid when request isn't firing
  // eslint-disable-next-line no-console
  console.debug('MockExamInterface - resolvedAttemptId=', resolvedAttemptId);

  // Fetch attempt details
  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        const response = await studentMockExamsAPI.getAttemptDetail(resolvedAttemptId);
        const attemptData = response.data as MockExamAttempt;
        setAttempt(attemptData);

        // Calculate time remaining
        const startTime = new Date((attemptData as any).started_at).getTime();
        // Default duration - will be overridden if exam provides one
        let durationMs = 120 * 60 * 1000; // Default 120 minutes
        const nowTime = Date.now();
        let remaining = 0;
        if (Number.isFinite(startTime)) {
          const elapsed = nowTime - startTime;
          remaining = Math.max(0, durationMs - elapsed);
        } else {
          // started_at missing/invalid, set remaining to full duration
          remaining = durationMs;
        }
        // Guard against NaN
        if (!Number.isFinite(remaining)) remaining = 0;
        setTimeRemaining(remaining);

        // Fetch exam details to populate questions
        try {
          // attemptData may expose either `mock_exam` or `custom_mock_exam` (id or object)
          const examField = (attemptData as any).mock_exam || (attemptData as any).custom_mock_exam;
          const examId = typeof examField === 'number' ? examField : examField?.id;
          if (examId) {
            const examResp = await studentMockExamsAPI.getMockExamDetail(examId);
            const examData = examResp.data;

            // Build flat questions list from subjects (if subjects exist) or from examData.questions
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

            // If exam provides duration, recalc timeRemaining based on started_at
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

        // Initialize answers from existing attempt
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

  // Timer countdown
  useEffect(() => {
    if (!Number.isFinite(timeRemaining) || timeRemaining <= 0 || !attempt) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          handleSubmit(); // Auto-submit if time runs out
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, attempt]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      // Auto-save logic here
      console.log('Auto-saving answers...');
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [answers]);

  const handleAnswerChange = (questionId: number, value: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleMarkForReview = (questionId: number) => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Send time spent in seconds. Prefer computing from attempt.started_at if available.
      let timeSpentSeconds = 0;
      try {
        if (attempt && (attempt as any).started_at) {
          const started = new Date((attempt as any).started_at).getTime();
          if (Number.isFinite(started) && started > 0) {
            timeSpentSeconds = Math.max(0, Math.floor((Date.now() - started) / 1000));
          }
        }
      } catch (e) {
        // fallback to timeRemaining (ms -> seconds) if started_at missing
        if (Number.isFinite(timeRemaining)) timeSpentSeconds = Math.max(0, Math.floor((timeRemaining || 0) / 1000));
      }

      const response = await studentMockExamsAPI.submitMockExamAttempt(
        resolvedAttemptId,
        answers,
        timeSpentSeconds
      );
      showToast('success', 'Exam submitted successfully!');
      // Navigate with the attempt data in state to show results
      // Use relative path to stay within StudentDashboard context
      // Navigate to the student-scoped results route
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
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter((v) => v !== null).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (!attempt || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert severity="error">Failed to load exam interface</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Header Bar */}
      <div className="shadow-md p-4 sticky top-0 z-30" style={{ backgroundColor: theme.palette.background.paper }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Mock Exam {attempt.id}
            </h1>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIdx + 1} of {totalQuestions}
            </p>
          </div>

          {/* Timer */}
          <div className={`text-center p-4 rounded-lg flex items-center gap-2 bg-yellow-100 dark:bg-slate-800`}>
            <Clock size={20} style={{ color: Number.isFinite(timeRemaining) && timeRemaining < 300000 ? '#dc2626' : theme.palette.primary.main }} />
            <span className={`text-2xl font-bold`} style={{ color: Number.isFinite(timeRemaining) && timeRemaining < 300000 ? '#dc2626' : theme.palette.primary.main }}>
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

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={(answeredCount / totalQuestions) * 100}
          className="mt-4"
        />
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
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
              <Card style={{ backgroundColor: theme.palette.background.paper }}>
                <CardContent className="p-8">
                  {/* Question Text */}
                  <div className="mb-8">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-gray-800 flex-1">
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

                    {/* Question Image */}
                    {currentQuestion.question_image && (
                      <img
                        src={currentQuestion.question_image}
                        alt="Question"
                        className="max-w-full h-64 object-contain mb-6"
                      />
                    )}
                  </div>

                  {/* Answer Section */}
                  <div className="mb-8">
                    {currentQuestion.question_type === 'MCQ' && (
                      <RadioGroup
                        value={answers[currentQuestion.id]?.toString() || ''}
                        onChange={(e) =>
                          // MCQ options are numeric ids
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
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span className="text-base text-gray-800 dark:text-gray-200">
                                  <MathText text={option.text} />
                                </span>
                              </div>
                            }
                            className="mb-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                          />
                        ))}
                      </RadioGroup>
                    )}

                    {currentQuestion.question_type === 'TrueOrFalse' && (
                      <RadioGroup
                        row
                        value={String(answers[currentQuestion.id] ?? '')}
                        onChange={(e) =>
                          // store boolean-ish string; backend may expect specific format
                          handleAnswerChange(currentQuestion.id, e.target.value)
                        }
                      >
                        <FormControlLabel
                          value="true"
                          control={<Radio />}
                          label="True"
                          className="mr-8"
                        />
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

                  {/* Explanation */}
                  {currentQuestion.explanation && (
                    <Alert severity="info" className="mb-6">
                      <strong>Tip:</strong> <MathText text={currentQuestion.explanation} />
                    </Alert>
                  )}

                  {/* Mark for Review */}
                  <div className="flex items-center gap-2 mb-6">
                    <Checkbox
                      checked={markedForReview.has(currentQuestion.id)}
                      onChange={() => handleMarkForReview(currentQuestion.id)}
                    />
                    <span className="text-gray-700">Mark this question for review</span>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between gap-4 pt-6 border-t">
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
          <Card style={{ backgroundColor: theme.palette.background.paper }}>
            <CardContent className="p-4">
              <h3 className="font-bold text-gray-800 mb-4">Questions</h3>
              <div className="grid grid-cols-4 gap-2 max-h-96 overflow-auto">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`p-2 rounded font-semibold text-sm transition ${
                      idx === currentQuestionIdx
                        ? 'bg-yellow-500 text-white'
                        : answers[q.id] !== null
                        ? 'bg-green-100 text-green-700'
                        : markedForReview.has(q.id)
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 space-y-2 text-xs border-t pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-500 rounded"></div>
                  <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-500 rounded"></div>
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
          <Card className="max-w-md" style={{ backgroundColor: theme.palette.background.paper }}>
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="text-orange-600" size={28} />
                <h2 className="text-2xl font-bold">Submit Exam?</h2>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Questions Answered:</strong> {answeredCount}/{totalQuestions}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Questions Marked for Review:</strong> {markedForReview.size}
                </p>
              </div>

              <p className="text-gray-600 mb-6">
                Once submitted, you cannot change your answers. Are you sure you want to submit?
              </p>

              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setShowConfirmSubmit(false)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={20} /> : 'Submit'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Modal>
    </div>
  );
};

export default MockExamInterface;
