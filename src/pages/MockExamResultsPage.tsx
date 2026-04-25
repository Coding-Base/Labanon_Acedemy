// src/pages/MockExamResultsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  useTheme,
} from '@mui/material';
import {
  Download,
  Share2,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import api from '../utils/axiosInterceptor';
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api';
import { studentMockExamsAPI, MockExamResult } from '../api/mock_exams_api';
import showToast from '../utils/toast';
import { MathText } from '../utils/mathRenderer';

interface ResultData {
  id: number;
  attempt: number;
  mock_exam: {
    title: string;
    total_marks: number;
    passing_marks: number;
    difficulty_level: string;
  };
  total_marks_obtained: number;
  grade: string;
  percentage: number;
  time_spent: number;
  subject_wise_stats: Array<{
    subject_name: string;
    marks_obtained: number;
    total_marks: number;
    percentage: number;
  }>;
  results: MockExamResult[];
}

const MockExamResultsPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useTheme();
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const attemptIdNum = parseInt(attemptId || '0');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Check if we have data from navigation state (from submission)
        const attemptData = (location.state as any)?.attemptData;
        if (attemptData) {
          // Debug: log attempt payload arriving via navigate state
          // eslint-disable-next-line no-console
          console.debug('MockExamResultsPage: attemptData from navigation state', attemptData);
          // Transform attempt data to ResultData format (normalize different backend shapes)
          const mockExam = attemptData.mock_exam || attemptData.custom_mock_exam || {};
          const totalObtainedRaw = attemptData.obtained_marks ?? attemptData.total_marks_obtained ?? attemptData.marks_obtained ?? null;
          const percentageRaw = attemptData.percentage ?? null;
          const percentage = typeof percentageRaw === 'string' ? parseFloat(percentageRaw) : (percentageRaw ?? null);
          const timeSpent = attemptData.time_spent_seconds ?? attemptData.time_spent ?? attemptData.time_spent_ms ?? 0;

          const rawResults = attemptData.results || attemptData.answers || [];
          const normalizedResults: MockExamResult[] = (rawResults || []).map((r: any, idx: number) => {
            const selectedText = r.selected_option_text || r.selected_option?.option_text || r.selected_option?.text || (r.selected_option ? `Option ${r.selected_option}` : null);
            const correctText = r.correct_option_text || r.correct_option?.option_text || r.correct_option?.text || (r.correct_answer_letter ? `Option ${r.correct_answer_letter}` : null);
            const marksObtained = r.marks_obtained ?? 0;
            const maxMarks = r.marks ?? r.max_marks ?? r.marks_possible ?? (r.question?.marks || 0) ?? 0;
            const isCorrect = r.is_correct ?? (marksObtained > 0);
            const normalized: any = {
              id: r.id ?? idx,
              attempt: attemptData.id,
              question: r.question,
              selected_option: r.selected_option ?? null,
              marks_obtained: marksObtained,
              is_correct: Boolean(isCorrect),
              time_taken: r.time_taken ?? 0,
              max_marks: maxMarks,
            };
            if (selectedText) normalized.selected_option_text = selectedText;
            if (correctText) normalized.correct_option_text = correctText;
            return normalized as MockExamResult;
          });

          // compute totals and percentage from normalized results, but prefer server totals if results are empty
          const totalMarksPossible = (mockExam.total_marks ?? mockExam.total_marks_per_exam ?? 0) || normalizedResults.reduce((s, r: any) => s + ((r.max_marks ?? 0) || 0), 0);
          const totalObtFromResults = normalizedResults.reduce((s, r: any) => s + (Number(r.marks_obtained) || 0), 0);
          const totalObt = (normalizedResults.length > 0) ? totalObtFromResults : (Number(totalObtainedRaw) || totalObtFromResults || 0);
          const pct = (percentage !== null && !Number.isNaN(Number(percentage))) ? Number(percentage) : (totalMarksPossible > 0 ? (totalObt / totalMarksPossible) * 100 : 0);
          // derive grade if not provided
          const derivedGrade = attemptData.grade || attemptData.letter_grade || (
            pct >= 70 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'
          );

          const resultData: ResultData = {
            id: attemptData.id,
            attempt: attemptData.id,
            mock_exam: {
              title: mockExam.title || '',
              total_marks: mockExam.total_marks ?? mockExam.total_marks_per_exam ?? 0,
              passing_marks: mockExam.passing_marks ?? mockExam.passing_mark ?? 0,
              difficulty_level: mockExam.difficulty_level || mockExam.difficulty || 'mixed',
            },
            total_marks_obtained: totalObt,
            grade: attemptData.grade || derivedGrade,
            percentage: pct,
            time_spent: timeSpent,
            subject_wise_stats: attemptData.subject_wise_stats || [],
            results: normalizedResults,
          };
          setResult(resultData);
        } else {
          // Fallback: try mock-exams attempt endpoint first, then CBT performance endpoint
          let attemptDetail: any = null;
          try {
            const response = await studentMockExamsAPI.getAttemptDetail(attemptIdNum);
            attemptDetail = response.data;
          } catch (err: any) {
            // If not found on mock-exams, try CBT performance endpoint
            if (err?.response?.status === 404) {
              try {
                const cbtResp = await api.get(`${API_BASE}/cbt/attempts/${attemptIdNum}/performance/`);
                const cbtData = cbtResp.data;
                // Map CBT performance response into ResultData shape (best-effort)
                const normalizedResults: MockExamResult[] = (cbtData.questions || cbtData.results || []).map((q: any, idx: number) => {
                  const selected = q.selected_option_text || q.selected_choice || q.selected || null;
                  const correct = q.correct_option_text || q.correct_answer || q.correct || null;
                  return {
                    id: q.id ?? idx,
                    attempt: attemptIdNum,
                    question: q.question || q.question_text || q.prompt || null,
                    selected_option: q.selected_option ?? null,
                    selected_option_text: selected,
                    correct_option_text: correct,
                    marks_obtained: q.score ?? q.marks_obtained ?? 0,
                    max_marks: q.max_marks ?? q.marks_possible ?? q.marks ?? 0,
                    is_correct: q.is_correct ?? (Number(q.score || 0) > 0),
                    time_taken: q.time_taken ?? 0,
                  } as MockExamResult;
                });

                const totalMarksPossible = cbtData.total_marks ?? normalizedResults.reduce((s, r: any) => s + ((r.max_marks ?? 0) || 0), 0);
                const totalObt = cbtData.total_score ?? cbtData.score ?? normalizedResults.reduce((s, r: any) => s + (Number(r.marks_obtained) || 0), 0);
                const pct = totalMarksPossible > 0 ? (Number(totalObt) / Number(totalMarksPossible)) * 100 : (cbtData.percentage ?? 0);

                const resultData: ResultData = {
                  id: cbtData.id ?? attemptIdNum,
                  attempt: cbtData.attempt_id ?? attemptIdNum,
                  mock_exam: {
                    title: cbtData.title || cbtData.exam_title || `CBT Attempt ${attemptIdNum}`,
                    total_marks: Number(totalMarksPossible) || 0,
                    passing_marks: Number(cbtData.passing_marks) || 0,
                    difficulty_level: cbtData.difficulty || 'mixed',
                  },
                  total_marks_obtained: Number(totalObt) || 0,
                  grade: cbtData.grade || (pct >= 70 ? 'A' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'),
                  percentage: Number(pct) || 0,
                  time_spent: cbtData.time_spent_seconds ?? cbtData.time_spent ?? 0,
                  subject_wise_stats: cbtData.subject_wise_stats || [],
                  results: normalizedResults,
                };

                setResult(resultData);
                attemptDetail = null; // handled by CBT branch
              } catch (cbtErr) {
                // fallback failure - rethrow original
                throw err;
              }
            } else {
              throw err;
            }
          }

          // If we have a mock-exams attempt detail, normalize it
          if (attemptDetail) {
            const mockExam = attemptDetail.mock_exam || attemptDetail.custom_mock_exam || {};
            const totalObtained = attemptDetail.obtained_marks ?? attemptDetail.total_marks_obtained ?? attemptDetail.marks_obtained ?? 0;
            const percentage = typeof attemptDetail.percentage === 'string' ? parseFloat(attemptDetail.percentage) : (attemptDetail.percentage ?? 0);
            const timeSpent = attemptDetail.time_spent_seconds ?? attemptDetail.time_spent ?? 0;
            const rawResults = attemptDetail.results || attemptDetail.answers || [];
            const normalizedResults: MockExamResult[] = (rawResults || []).map((r: any, idx: number) => {
              const selectedText = r.selected_option_text || r.selected_option?.option_text || r.selected_option?.text || (r.selected_option ? `Option ${r.selected_option}` : null);
              const correctText = r.correct_option_text || r.correct_option?.option_text || r.correct_option?.text || (r.correct_answer_letter ? `Option ${r.correct_answer_letter}` : null);
              const marksObtained = r.marks_obtained ?? 0;
              const maxMarks = r.marks ?? r.max_marks ?? r.marks_possible ?? (r.question?.marks || 0) ?? 0;
              const isCorrect = r.is_correct ?? (marksObtained > 0);
              const normalized: any = {
                id: r.id ?? idx,
                attempt: attemptDetail.id,
                question: r.question,
                selected_option: r.selected_option ?? null,
                marks_obtained: marksObtained,
                is_correct: Boolean(isCorrect),
                time_taken: r.time_taken ?? 0,
                max_marks: maxMarks,
              };
              if (selectedText) normalized.selected_option_text = selectedText;
              if (correctText) normalized.correct_option_text = correctText;
              return normalized as MockExamResult;
            });

            const totalMarksPossible = (mockExam.total_marks ?? mockExam.total_marks_per_exam ?? 0) || normalizedResults.reduce((s, r: any) => s + ((r.max_marks ?? 0) || 0), 0);
            const totalObt2 = normalizedResults.reduce((s, r: any) => s + (Number(r.marks_obtained) || 0), 0);
            const pct2 = totalMarksPossible > 0 ? (totalObt2 / totalMarksPossible) * 100 : 0;
            const derivedGrade2 = attemptDetail.grade || attemptDetail.letter_grade || (
              pct2 >= 70 ? 'A' : pct2 >= 60 ? 'B' : pct2 >= 50 ? 'C' : pct2 >= 40 ? 'D' : 'F'
            );

            const resultData: ResultData = {
              id: attemptDetail.id,
              attempt: attemptDetail.id,
              mock_exam: {
                title: mockExam.title || '',
                total_marks: mockExam.total_marks ?? mockExam.total_marks_per_exam ?? 0,
                passing_marks: mockExam.passing_marks ?? mockExam.passing_mark ?? 0,
                difficulty_level: mockExam.difficulty_level || mockExam.difficulty || 'mixed',
              },
              total_marks_obtained: totalObt2,
              grade: derivedGrade2,
              percentage: pct2,
              time_spent: timeSpent,
              subject_wise_stats: attemptDetail.subject_wise_stats || [],
              results: normalizedResults,
            };
            setResult(resultData);
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

  const handleDownloadReport = () => {
    // Generate PDF report
    showToast('success', 'Report downloaded');
  };

  const handleShareResults = async () => {
    const shareText = `I scored ${result?.total_marks_obtained}/${result?.mock_exam.total_marks} (${result?.percentage.toFixed(1)}%) on ${result?.mock_exam.title} mock exam!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mock Exam Results',
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText);
      showToast('success', 'Results copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert severity="error">Failed to load results</Alert>
      </div>
    );
  }

  const passingMarksNum = Number(result.mock_exam.passing_marks || 0);
  const isPassed = (result as any).passed !== undefined
    ? Boolean((result as any).passed)
    : (passingMarksNum > 0
      ? Number(result.total_marks_obtained) >= passingMarksNum
      : (result.grade ? result.grade !== 'F' : result.percentage >= 50)
    );
  const gradeColor =
    result.grade === 'A'
      ? theme.palette.success.main
      : result.grade === 'B'
      ? theme.palette.warning.main
      : result.grade === 'C'
      ? theme.palette.secondary.main
      : result.grade === 'D'
      ? theme.palette.info.main
      : theme.palette.error.main;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Compute performance metrics from results
  const correctCount = result?.results.filter((r: any) => r.is_correct).length || 0;
  const incorrectCount = (result?.results.length || 0) - correctCount;
  const accuracy = (result?.results.length || 0) > 0 ? (correctCount / (result?.results.length || 1)) * 100 : 0;
  const sumTimeTaken = result?.results.reduce((s: number, r: any) => s + (Number(r.time_taken) || 0), 0);
  const effectiveTimeSpent = (result?.time_spent && Number(result.time_spent) > 0) ? Number(result.time_spent) : (sumTimeTaken || 0);
  const avgTimePerQuestion = (result?.results.length || 0) > 0 ? effectiveTimeSpent / (result?.results.length || 1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8" style={{ backgroundColor: theme.palette.background.default }}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => {
              // Navigate back to the mock exam page if available, otherwise to the exams list
              const examId = (result && (result as any).mock_exam && (result as any).mock_exam.id) || null;
              if (examId) navigate(`/student/mock-exams/exams/${examId}`);
              else navigate('/student/mock-exams');
            }}
            className="mb-4"
          >
            Back to Exam
          </Button>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-100 mb-2">
            {result.mock_exam.title}
          </h1>
          <p className="text-gray-600 dark:text-slate-300">Results & Performance Analysis</p>
        </div>

        {/* Result Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card style={{ backgroundColor: theme.palette.background.paper }}>
              <CardContent className="p-6 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <CircularProgress
                    variant="determinate"
                    value={Math.min(Math.max(result.percentage, 0), 100)}
                    size={120}
                    style={{ color: isPassed ? theme.palette.success.main : theme.palette.error.main }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{result.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">Percentage</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Grade Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card style={{ backgroundColor: theme.palette.background.paper }}>
              <CardContent className="p-6 text-center">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white"
                  style={{ backgroundColor: gradeColor }}
                >
                  {result.grade}
                </div>
                <p className="text-gray-600 text-sm">Grade</p>
                <p className="text-lg font-bold mt-2" style={{ color: isPassed ? theme.palette.success.main : theme.palette.error.main }}>
                  {isPassed ? '✓ PASSED' : '✗ FAILED'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Time Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card style={{ backgroundColor: theme.palette.background.paper }}>
              <CardContent className="p-6 text-center">
                <Clock size={40} className="mx-auto mb-4" style={{ color: theme.palette.primary.main }} />
                <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                  {formatTime(effectiveTimeSpent)}
                </p>
                <p className="text-gray-600 text-sm mt-2">Time Spent</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Marks Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card style={{ backgroundColor: theme.palette.background.paper }}>
              <CardContent className="p-6 text-center">
                <TrendingUp size={40} className="mx-auto mb-4" style={{ color: theme.palette.primary.main }} />
                <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                  {result.total_marks_obtained}/{result.mock_exam.total_marks}
                </p>
                <p className="text-gray-600 text-sm mt-2">Marks Obtained</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Answers & Explanations - simplified view */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="mb-8 border-l-4" style={{ borderLeftColor: theme.palette.primary.main, backgroundColor: theme.palette.background.paper }}>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4" style={{ color: theme.palette.primary.main }}>✅ Answers & Explanations</h2>
              <div className="space-y-6">
                {result.results.map((res, idx) => {
                  const q = (res as any).question || {};
                  const questionText = q.question_text || q.text || String(q) || `Question ${idx + 1}`;
                  const userAnswer = (res as any).selected_option_text || (res.selected_option ? `Option ${res.selected_option}` : 'Not answered');
                  const correctAnswer = (res as any).correct_option_text || q.correct_answer || '—';
                  const optionExplanation = (res as any).selected_option?.explanation || (res as any).selected_option?.explain || null;
                  const correctOptionExplanation = (res as any).correct_option?.explanation || (res as any).correct_option?.explain || null;
                  const explanation = optionExplanation || correctOptionExplanation || q.explanation || (res as any).explanation || 'No explanation provided.';
                  return (
                    <div key={res.id} className="p-4 rounded-md" style={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      <h3 className="font-semibold text-gray-800 dark:text-slate-100">{idx + 1}. {questionText}</h3>
                      <div className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                        <p><strong>Your answer:</strong> {userAnswer}</p>
                        <p><strong>Correct answer:</strong> {correctAnswer}</p>
                        <p className="mt-2"><strong>Explanation:</strong></p>
                        <div className="prose dark:prose-invert max-w-none mt-1 text-sm" dangerouslySetInnerHTML={{ __html: explanation }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
            <CardActions className="flex gap-3 justify-end p-6">
              <Button
                variant="outlined"
                startIcon={<Download size={18} />}
                onClick={handleDownloadReport}
              >
                Download Report
              </Button>
              <Button
                variant="contained"
                startIcon={<Share2 size={18} />}
                onClick={handleShareResults}
              >
                Share Results
              </Button>
            </CardActions>
          </Card>

          <div className="mb-8">
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                const examId = (result && (result as any).mock_exam && (result as any).mock_exam.id) || null;
                if (examId) navigate(`/student/mock-exams/exams/${examId}`);
                else navigate('/student/mock-exams');
              }}
              style={{ backgroundColor: theme.palette.primary.main }}
            >
              Attempt Another Exam
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MockExamResultsPage;
