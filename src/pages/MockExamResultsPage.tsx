// src/pages/MockExamResultsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Info
} from 'lucide-react';
import api from '../utils/axiosInterceptor';
import { studentMockExamsAPI } from '../api/mock_exams_api';
import showToast from '../utils/toast';
import { MathText } from '../utils/mathRenderer';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api';

// --- Interfaces based on real JSON response ---
interface OptionReview {
  id: number;
  text: string;
  is_correct: boolean;
  letter: string;
}

interface QuestionReview {
  id: number;
  question_text: string;
  marks: number;
  options: OptionReview[];
  explanation: string;
  user_selected_option_id: number | null;
  is_correct: boolean | null;
}

interface ResultData {
  id: number;
  mock_exam: {
    id?: number;
    title: string;
    description: string;
    total_marks: number;
    passing_marks: number;
    difficulty_level: string;
  };
  total_marks_obtained: number;
  grade: string;
  percentage: number;
  time_spent_seconds: number;
  passed: boolean;
  review_questions: QuestionReview[];
}

interface MockExamResultsPageProps {
  darkMode?: boolean;
}

const MockExamResultsPage: React.FC<MockExamResultsPageProps> = ({ darkMode = false }) => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const muiTheme = React.useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc',
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      primary: { main: '#ca8a04' },
      success: { main: '#16a34a' },
      error: { main: '#dc2626' }
    }
  }), [darkMode]);

  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const attemptIdNum = parseInt(attemptId || '0');

  useEffect(() => {
    const processAttemptData = (attemptData: any): ResultData => {
      const mockExam = attemptData.mock_exam || attemptData.custom_mock_exam || {};
      
      // Calculate time spent (fallback to start/end difference if time_spent is 0)
      let timeSpent = attemptData.time_spent_seconds ?? attemptData.time_spent ?? 0;
      if (!timeSpent && attemptData.start_time && attemptData.end_time) {
        const start = new Date(attemptData.start_time).getTime();
        const end = new Date(attemptData.end_time).getTime();
        timeSpent = Math.max(0, Math.floor((end - start) / 1000));
      }

      // Format basic scores
      const totalMarksPossible = Number(mockExam.total_marks || attemptData.total_marks || 0);
      const obtainedMarks = Number(attemptData.obtained_marks ?? attemptData.total_marks_obtained ?? 0);
      const percentageRaw = parseFloat(attemptData.percentage ?? '0');
      const percentage = !isNaN(percentageRaw) ? percentageRaw : (totalMarksPossible > 0 ? (obtainedMarks / totalMarksPossible) * 100 : 0);
      
      // Extract User Answers
      const rawResults = attemptData.results || attemptData.answers || [];
      const answerMap = new Map();
      rawResults.forEach((ans: any) => {
        const qId = ans.question_id || ans.question?.id || ans.question;
        const optId = ans.selected_option_id || ans.selected_option?.id || ans.selected_option;
        answerMap.set(qId, { optId, is_correct: ans.is_correct });
      });

      // Extract Questions from Exam Schema
      const reviewQuestions: QuestionReview[] = [];
      const allQuestions: any[] = [];
      
      if (Array.isArray(mockExam.subjects)) {
        mockExam.subjects.forEach((sub: any) => {
          if (Array.isArray(sub.questions)) allQuestions.push(...sub.questions);
        });
      } else if (Array.isArray(mockExam.questions)) {
        allQuestions.push(...mockExam.questions);
      }

      // Build comprehensive review array
      allQuestions.forEach((q: any) => {
        const uAns = answerMap.get(q.id);
        
        // Find the correct option to pull its explanation
        const optionsArray = q.options || [];
        const correctOption = optionsArray.find((o: any) => o.is_correct === true);
        const explanationFromCorrectOption = correctOption?.explanation;

        reviewQuestions.push({
          id: q.id,
          question_text: q.question_text || q.text || 'Unknown Question',
          marks: q.marks || 1,
          options: optionsArray.map((o: any) => ({
            id: o.id,
            text: o.option_text || o.text || '',
            is_correct: Boolean(o.is_correct),
            letter: o.option_letter || ''
          })),
          // Set explanation strictly from the correct option
          explanation: explanationFromCorrectOption || 'No explanation provided.',
          user_selected_option_id: uAns ? uAns.optId : null,
          is_correct: uAns ? Boolean(uAns.is_correct) : null,
        });
      });

      // Fallback if exam schema didn't have questions but results did (like CBT fallback)
      if (reviewQuestions.length === 0 && rawResults.length > 0) {
        rawResults.forEach((r: any, idx: number) => {
           // Try to pull explanation from nested correct_option data
           const fallbackExplanation = r.correct_option?.explanation || r.correct_option?.explain || 'No explanation provided.';
           
           reviewQuestions.push({
             id: r.id || idx,
             question_text: r.question?.question_text || r.question || `Question ${idx + 1}`,
             marks: r.max_marks || 1,
             options: [
               { id: r.selected_option_id || 1, text: r.selected_option_text || 'Your Answer', is_correct: r.is_correct, letter: '' },
               { id: 2, text: r.correct_option_text || 'Correct Answer', is_correct: true, letter: '' }
             ],
             explanation: fallbackExplanation,
             user_selected_option_id: r.selected_option_id || 1,
             is_correct: r.is_correct
           });
        });
      }

      return {
        id: attemptData.id,
        mock_exam: {
          id: mockExam.id,
          title: mockExam.title || 'Exam Results',
          description: mockExam.description || '',
          total_marks: totalMarksPossible,
          passing_marks: Number(mockExam.passing_marks || 50),
          difficulty_level: mockExam.difficulty_level || 'mixed',
        },
        total_marks_obtained: obtainedMarks,
        grade: attemptData.grade || 'N/A',
        percentage: percentage,
        time_spent_seconds: timeSpent,
        passed: Boolean(attemptData.passed),
        review_questions: reviewQuestions
      };
    };

    const fetchResults = async () => {
      try {
        const attemptData = (location.state as any)?.attemptData;
        if (attemptData) {
          setResult(processAttemptData(attemptData));
        } else {
          try {
            const response = await studentMockExamsAPI.getAttemptDetail(attemptIdNum);
            setResult(processAttemptData(response.data));
          } catch (err: any) {
            if (err?.response?.status === 404) {
              const cbtResp = await api.get(`${API_BASE}/cbt/attempts/${attemptIdNum}/performance/`);
              setResult(processAttemptData(cbtResp.data));
            } else {
              throw err;
            }
          }
        }
      } catch (error) {
        showToast('error', 'Failed to load results');
        navigate('../');
      } finally {
        setIsLoading(false);
      }
    };

    if (attemptIdNum) {
      fetchResults();
    }
  }, [attemptIdNum, navigate, location]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <CircularProgress size={60} thickness={4} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <Alert severity="error" className="max-w-md">Failed to load exam results data. Please try again.</Alert>
      </div>
    );
  }

  const isPassed = result.passed;
  const gradeColor =
    result.grade === 'A' ? muiTheme.palette.success.main :
    result.grade === 'B' ? muiTheme.palette.primary.main :
    result.grade === 'C' ? muiTheme.palette.warning.main :
    muiTheme.palette.error.main;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-gray-900'}`}>
        <div className="max-w-5xl mx-auto">
          
          {/* Top Navigation */}
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => {
              const examId = result.mock_exam.id || null;
              if (examId) navigate(`/student/mock-exams/exams/${examId}`);
              else navigate('/student/mock-exams');
            }}
            className={`mb-6 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}
          >
            Back to Exam
          </Button>

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                  {result.mock_exam.title}
                </h1>
                <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {result.mock_exam.description || 'Mock Exam Performance Review'}
                </p>
              </div>
              <div className="flex gap-2">
                <Chip label={`Difficulty: ${result.mock_exam.difficulty_level}`} variant="outlined" color="primary" />
                <Chip label={`Pass Mark: ${result.mock_exam.passing_marks}%`} variant="outlined" />
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {/* Score Percentage */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="h-full border-0 shadow-md rounded-2xl overflow-hidden" sx={{ bgcolor: darkMode ? 'background.paper' : 'white' }}>
                <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                  <div className="relative w-28 h-28 mx-auto mb-3">
                    <CircularProgress
                      variant="determinate"
                      value={Math.min(Math.max(result.percentage, 0), 100)}
                      size={112}
                      thickness={5}
                      style={{ color: isPassed ? muiTheme.palette.success.main : muiTheme.palette.error.main }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {result.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Final Score</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Grade */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="h-full border-0 shadow-md rounded-2xl" sx={{ bgcolor: darkMode ? 'background.paper' : 'white' }}>
                <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                  <div
                    className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-extrabold text-white shadow-inner"
                    style={{ backgroundColor: gradeColor }}
                  >
                    {result.grade}
                  </div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Grade Achieved</p>
                  <p className={`text-lg font-bold mt-1 ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPassed ? 'PASSED' : 'FAILED'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Marks */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="h-full border-0 shadow-md rounded-2xl" sx={{ bgcolor: darkMode ? 'background.paper' : 'white' }}>
                <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                    <TrendingUp size={32} style={{ color: muiTheme.palette.primary.main }} />
                  </div>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                    {result.total_marks_obtained} <span className={`text-lg font-normal ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>/ {result.mock_exam.total_marks}</span>
                  </p>
                  <p className={`text-sm font-medium mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Marks Obtained</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Time Spent */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="h-full border-0 shadow-md rounded-2xl" sx={{ bgcolor: darkMode ? 'background.paper' : 'white' }}>
                <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <Clock size={32} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                    {formatTime(result.time_spent_seconds)}
                  </p>
                  <p className={`text-sm font-medium mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Time Spent</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Detailed Question Review */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-3 mb-6 mt-12">
              <BookOpen className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                Answers & Explanations
              </h2>
            </div>

            {result.review_questions.length > 0 ? (
              <div className="space-y-6">
                {result.review_questions.map((q, idx) => (
                  <Card key={q.id} className="border-0 shadow-sm overflow-hidden rounded-2xl" sx={{ bgcolor: darkMode ? 'background.paper' : 'white' }}>
                    <div className={`h-2 w-full ${q.is_correct === true ? 'bg-green-500' : q.is_correct === false ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                    <CardContent className="p-6 md:p-8">
                      {/* Question Header */}
                      <div className="flex justify-between items-start mb-6 gap-4">
                        <div className="flex gap-4">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className={`text-lg font-semibold leading-relaxed ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                              <MathText text={q.question_text} />
                            </h3>
                            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Max marks: {q.marks}</p>
                          </div>
                        </div>
                        {q.is_correct === true && <CheckCircle2 className="text-green-500 w-8 h-8 flex-shrink-0" />}
                        {q.is_correct === false && <XCircle className="text-red-500 w-8 h-8 flex-shrink-0" />}
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 pl-12">
                        {q.options.map((opt) => {
                          const isCorrectOption = opt.is_correct;
                          const isUserSelection = q.user_selected_option_id === opt.id;
                          
                          // Style determination based on selection and correctness
                          let optionClasses = `p-4 border rounded-xl flex items-start gap-3 transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;
                          let textClasses = darkMode ? 'text-slate-300' : 'text-gray-700';
                          
                          if (isCorrectOption) {
                            optionClasses = `p-4 border-2 rounded-xl flex items-start gap-3 ${darkMode ? 'bg-green-900/20 border-green-500/50' : 'bg-green-50 border-green-400'}`;
                            textClasses = darkMode ? 'text-green-300 font-medium' : 'text-green-800 font-medium';
                          } else if (isUserSelection && !isCorrectOption) {
                            optionClasses = `p-4 border-2 rounded-xl flex items-start gap-3 ${darkMode ? 'bg-red-900/20 border-red-500/50' : 'bg-red-50 border-red-400'}`;
                            textClasses = darkMode ? 'text-red-300 font-medium' : 'text-red-800 font-medium';
                          }

                          return (
                            <div key={opt.id} className={optionClasses}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border ${isCorrectOption ? 'bg-green-500 text-white border-green-600' : isUserSelection ? 'bg-red-500 text-white border-red-600' : (darkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-gray-100 border-gray-300 text-gray-600')}`}>
                                {opt.letter || '-'}
                              </div>
                              <div className={textClasses}>
                                <MathText text={opt.text} />
                              </div>
                              {isCorrectOption && isUserSelection && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" />}
                              {isUserSelection && !isCorrectOption && <XCircle className="w-5 h-5 text-red-500 ml-auto flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Box */}
                      <div className={`mt-6 rounded-xl p-5 ${darkMode ? 'bg-slate-800/80 border border-slate-700' : 'bg-blue-50 border border-blue-100'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Info className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          <h4 className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Explanation</h4>
                        </div>
                        <div className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-blue-900/80'}`}>
                          <MathText text={q.explanation} />
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card sx={{ bgcolor: darkMode ? 'background.paper' : 'white' }}>
                <CardContent className="p-8 text-center">
                  <p className={darkMode ? 'text-slate-400' : 'text-gray-500'}>
                    Detailed question review is not available for this exam attempt.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Bottom Actions */}
            <div className="mt-10 flex justify-center pb-12">
              <Button
                variant="contained"
                size="large"
                className="px-10 py-3 rounded-xl font-bold shadow-lg"
                onClick={() => navigate('/student/mock-exams')}
                style={{ backgroundColor: muiTheme.palette.primary.main, color: 'white' }}
              >
                Attempt Another Exam
              </Button>
            </div>

          </motion.div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default MockExamResultsPage;