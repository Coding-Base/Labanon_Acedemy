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
} from '@mui/material';
import {
  Download,
  Share2,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { studentMockExamsAPI, MockExamResult } from '../api/mock_exams_api';
import showToast from '../utils/toast';

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
          // Transform attempt data to ResultData format
          const resultData: ResultData = {
            id: attemptData.id,
            attempt: attemptData.id,
            mock_exam: attemptData.mock_exam,
            total_marks_obtained: attemptData.obtained_marks,
            grade: attemptData.grade,
            percentage: typeof attemptData.percentage === 'string' ? parseFloat(attemptData.percentage) : attemptData.percentage,
            time_spent: attemptData.time_spent_seconds,
            subject_wise_stats: [],
            results: attemptData.results || [],
          };
          setResult(resultData);
        } else {
          // Fallback: fetch from attempt detail endpoint
          const response = await studentMockExamsAPI.getAttemptDetail(attemptIdNum);
          const attemptDetail = response.data;
          const resultData: ResultData = {
            id: attemptDetail.id,
            attempt: attemptDetail.id,
            mock_exam: attemptDetail.mock_exam,
            total_marks_obtained: attemptDetail.obtained_marks,
            grade: attemptDetail.grade,
            percentage: typeof attemptDetail.percentage === 'string' ? parseFloat(attemptDetail.percentage) : attemptDetail.percentage,
            time_spent: attemptDetail.time_spent_seconds,
            subject_wise_stats: [],
            results: attemptDetail.results || [],
          };
          setResult(resultData);
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

  const isPassed = result.total_marks_obtained >= result.mock_exam.passing_marks;
  const gradeColor =
    result.grade === 'A'
      ? '#00C896'
      : result.grade === 'B'
      ? '#FFB84D'
      : result.grade === 'C'
      ? '#6B63FF'
      : result.grade === 'D'
      ? '#FF9500'
      : '#FF5757';

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate('../')}
            className="mb-4"
          >
            Back to Exams
          </Button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {result.mock_exam.title}
          </h1>
          <p className="text-gray-600">Results & Analysis</p>
        </div>

        {/* Result Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <CircularProgress
                    variant="determinate"
                    value={Math.min(Math.max(result.percentage, 0), 100)}
                    size={120}
                    style={{ color: isPassed ? '#00C896' : '#FF5757' }}
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
            <Card>
              <CardContent className="p-6 text-center">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white"
                  style={{ backgroundColor: gradeColor }}
                >
                  {result.grade}
                </div>
                <p className="text-gray-600 text-sm">Grade</p>
                <p className={`text-lg font-bold mt-2 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
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
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 size={40} className="mx-auto mb-4 text-blue-600" />
                <p className="text-2xl font-bold text-gray-800">
                  {formatTime(result.time_spent)}
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
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp size={40} className="mx-auto mb-4 text-purple-600" />
                <p className="text-2xl font-bold text-gray-800">
                  {result.total_marks_obtained}/{result.mock_exam.total_marks}
                </p>
                <p className="text-gray-600 text-sm mt-2">Marks Obtained</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Subject-wise Performance */}
        {result.subject_wise_stats && result.subject_wise_stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Subject-wise Performance</h2>
                <div className="space-y-6">
                  {result.subject_wise_stats.map((subject, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-800">{subject.subject_name}</h3>
                        <span className="text-sm text-gray-600">
                          {subject.marks_obtained}/{subject.total_marks} ({subject.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(Math.max(typeof subject.percentage === 'string' ? parseFloat(subject.percentage) : subject.percentage, 0), 100)}
                        style={{
                          height: 10,
                          borderRadius: 5,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Question Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Question Review</h2>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Q#</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Your Answer</TableCell>
                      <TableCell>Correct Answer</TableCell>
                      <TableCell>Marks</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.results.map((res, idx) => (
                      <TableRow key={res.id} hover>
                        <TableCell className="font-semibold">{idx + 1}</TableCell>
                        <TableCell>
                          {res.is_correct ? (
                            <Chip
                              icon={<CheckCircle size={16} />}
                              label="Correct"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<XCircle size={16} />}
                              label="Incorrect"
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {res.selected_option ? `Option ${res.selected_option}` : 'Not Answered'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">Option A</TableCell>
                        <TableCell className="font-semibold">
                          {res.marks_obtained}/{res.marks_obtained}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => setSelectedQuestion(res.question)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recommendations</h2>
              <div className="space-y-3 text-gray-700">
                {isPassed ? (
                  <>
                    <p>
                      ✓ Great job! You've passed with a {result.grade} grade. Keep practicing to improve your score.
                    </p>
                    <p>
                      • Focus on improving your weak areas shown in the subject-wise analysis above.
                    </p>
                  </>
                ) : (
                  <>
                    <p>✗ You need to improve. Your current score is below the passing mark.</p>
                    <p>• Review the concepts for questions you answered incorrectly.</p>
                    <p>• Practice similar questions to strengthen your weak areas.</p>
                  </>
                )}
                <p>• Take more mock exams to build confidence and speed.</p>
              </div>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => navigate('../')}
              >
                Attempt Another Exam
              </Button>
            </CardActions>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default MockExamResultsPage;
