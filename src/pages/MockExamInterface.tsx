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
import { studentMockExamsAPI, MockExamQuestion, MockExamOption, MockExamAttempt } from '../api/mock_exams_api';
import showToast from '../utils/toast';

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

  // Fetch attempt details
  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        const response = await studentMockExamsAPI.getAttemptDetail(attemptIdNum);
        const attemptData = response.data as MockExamAttempt;
        setAttempt(attemptData);

        // Calculate time remaining
        const startTime = new Date(attemptData.start_time).getTime();
        const durationMs = attemptData.mock_exam.total_duration_minutes * 60 * 1000;
        const nowTime = Date.now();
        const elapsed = nowTime - startTime;
        const remaining = Math.max(0, durationMs - elapsed);
        setTimeRemaining(remaining);

        // Fetch questions (from exam detail)
        // This is simplified - ideally you'd fetch from API
        setQuestions(attemptData.mock_exam.subjects[0]?.questions || []);

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
        navigate('../');
      }
    };

    if (attemptIdNum) {
      fetchAttemptDetails();
    }
  }, [attemptIdNum, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || !attempt) return;

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
      const response = await studentMockExamsAPI.submitMockExamAttempt(
        attemptIdNum,
        answers,
        timeRemaining
      );
      showToast('success', 'Exam submitted successfully!');
      // Navigate with the attempt data in state to show results
      // Use relative path to stay within StudentDashboard context
      navigate(`../mock-exams/results/${attemptIdNum}`, { state: { attemptData: response.data } });
    } catch (error) {
      showToast('error', 'Failed to submit exam');
      setIsSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header Bar */}
      <div className="bg-white shadow-md p-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {attempt.mock_exam.title}
            </h1>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIdx + 1} of {totalQuestions}
            </p>
          </div>

          {/* Timer */}
          <div
            className={`text-center p-4 rounded-lg flex items-center gap-2 ${
              timeRemaining < 300000 ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            <Clock
              size={20}
              className={timeRemaining < 300000 ? 'text-red-600' : 'text-blue-600'}
            />
            <span
              className={`text-2xl font-bold ${
                timeRemaining < 300000 ? 'text-red-600' : 'text-blue-600'
              }`}
            >
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
        <p className="text-xs text-gray-600 mt-2">
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
                  {/* Question Text */}
                  <div className="mb-8">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-gray-800 flex-1">
                        {currentQuestion.question_text}
                      </h2>
                      <div className="flex gap-2 ml-4">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
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
                    {currentQuestion.question_type === 'multiple_choice' && (
                      <RadioGroup
                        value={answers[currentQuestion.id]?.toString() || ''}
                        onChange={(e) =>
                          handleAnswerChange(currentQuestion.id, parseInt(e.target.value))
                        }
                      >
                        {currentQuestion.options.map((option: MockExamOption) => (
                          <FormControlLabel
                            key={option.id}
                            value={option.id.toString()}
                            control={<Radio />}
                            label={
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{option.option_letter}.</span>
                                <span className="text-base text-gray-800">{option.option_text}</span>
                              </div>
                            }
                            className="mb-3 p-3 border rounded-lg hover:bg-gray-50"
                          />
                        ))}
                      </RadioGroup>
                    )}

                    {currentQuestion.question_type === 'true_false' && (
                      <RadioGroup
                        row
                        value={answers[currentQuestion.id]?.toString() || ''}
                        onChange={(e) =>
                          handleAnswerChange(currentQuestion.id, parseInt(e.target.value))
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

                    {currentQuestion.question_type === 'essay' && (
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
                      <strong>Tip:</strong> {currentQuestion.explanation}
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
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold text-gray-800 mb-4">Questions</h3>
              <div className="grid grid-cols-4 gap-2 max-h-96 overflow-auto">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`p-2 rounded font-semibold text-sm transition ${
                      idx === currentQuestionIdx
                        ? 'bg-blue-500 text-white'
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
          <Card className="max-w-md">
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
