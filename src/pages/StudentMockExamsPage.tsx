// src/pages/StudentMockExamsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Box,
  Chip,
  Modal,
  Backdrop,
  Badge,
  Pagination,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';

import {
  Search,
  Clock,
  Award,
  Zap,
  Lock,
  Play,
  History,
  Menu as MenuIcon,
  X as XIcon,
} from 'lucide-react';
import { studentMockExamsAPI, CustomMockExam, MockExamFee } from '../api/mock_exams_api';
import showToast from '../utils/toast';

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomMockExam[];
}

const StudentMockExamsPage: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<CustomMockExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [selectedExam, setSelectedExam] = useState<CustomMockExam | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState<any>(null);
  const [unlockedExams, setUnlockedExams] = useState<Set<number>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [attempts, setAttempts] = useState<any[]>([]);
  const pageSize = 12;

  // Fetch exams
  const fetchExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await studentMockExamsAPI.getMockExams(page, searchQuery, {
        difficulty: difficultyFilter || undefined,
      });
      const data = response.data as PaginatedResponse;
      setExams(data.results);
      setTotalPages(Math.ceil(data.count / pageSize));
    } catch (error) {
      showToast('error', 'Failed to load exams');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, difficultyFilter]);

  // Fetch attempts for history
  const fetchAttempts = useCallback(async () => {
    try {
      const response = await studentMockExamsAPI.getStudentAttempts(1);
      setAttempts(response.data.results || []);
    } catch (error) {
      console.error('Failed to load attempts:', error);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    if (showHistory) {
      fetchAttempts();
    }
  }, [showHistory, fetchAttempts]);

  // Check unlock status for exam
  const handleStartExam = async (exam: CustomMockExam) => {
    try {
      const response = await studentMockExamsAPI.checkUnlockStatus(exam.id);
      const { data } = response;
      setUnlockStatus(data);

      if (data.unlocked) {
        // Exam is unlocked - show appropriate message
        let message = '';
        if (data.reason === 'global_unlock') {
          message = '✓ You have full access to all mock exams';
        } else if (data.reason === 'existing_unlock') {
          message = '✓ Great! You\'ve unlocked CBT exams before, so mock exams are FREE for you';
        } else if (data.reason === 'free_exam') {
          message = '✓ This is a free exam';
        }
        showToast('success', message);
        
        // Start exam immediately
        const attemptResponse = await studentMockExamsAPI.startMockExamAttempt(exam.id);
        navigate(`attempt/${attemptResponse.data.id}`);
      } else {
        // Need to unlock with payment
        setSelectedExam(exam);
        setIsUnlockModalOpen(true);
      }
    } catch (error) {
      showToast('error', 'Failed to check exam status');
    }
  };

  const handleUnlock = async (paymentData: any) => {
    if (!selectedExam) return;

    try {
      await studentMockExamsAPI.unlockMockExam(selectedExam.id, paymentData);
      setUnlockedExams(prev => new Set([...prev, selectedExam.id]));
      setIsUnlockModalOpen(false);
      showToast('success', 'Exam unlocked successfully!');

      // Start attempt after unlocking
      const attemptResponse = await studentMockExamsAPI.startMockExamAttempt(selectedExam.id);
      navigate(`attempt/${attemptResponse.data.id}`);
    } catch (error) {
      showToast('error', 'Failed to unlock exam');
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'easy':
        return '#00C896';
      case 'medium':
        return '#FFB84D';
      case 'hard':
        return '#FF5757';
      default:
        return '#6B63FF';
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-8 custom-scrollbar">
      <Container maxWidth="lg">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-100 mb-2">Mock Exams</h1>
          <p className="text-gray-600 dark:text-slate-300">Practice tests to prepare for your exams</p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-6 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                  <TextField
                  fullWidth
                  placeholder="Search exams..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  InputProps={{
                    startAdornment: <Search size={18} className="mr-2 text-gray-400 dark:text-slate-400" />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Difficulty"
                  value={difficultyFilter}
                  onChange={(e) => {
                    setDifficultyFilter(e.target.value);
                    setPage(1);
                  }}
                  size="small"
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={12} md={4} className="flex justify-end gap-2">
                <Tooltip title="View attempt history">
                  <IconButton
                    onClick={() => setShowHistory(!showHistory)}
                    color={showHistory ? 'primary' : 'default'}
                  >
                    <Badge badgeContent={attempts.length} color="primary">
                      <History size={20} />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 w-80 h-screen bg-white dark:bg-slate-900 shadow-2xl z-40 flex flex-col"
            >
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold">Attempt History</h2>
                <button onClick={() => setShowHistory(false)}>
                  <XIcon size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {attempts.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-300 text-center py-8">No attempts yet</p>
                ) : (
                  <div className="space-y-2">
                    {attempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer border-gray-100 dark:border-slate-700"
                      >
                        <p className="font-semibold text-sm text-gray-800 dark:text-slate-100">
                          {attempt.custom_mock_exam?.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-300">
                          Score: {attempt.total_marks_obtained}/{attempt.custom_mock_exam?.total_marks}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-300">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exams Grid */}
        <AnimatePresence mode="wait">
            {isLoading ? (
            <div className="flex justify-center py-12">
              <CircularProgress />
            </div>
          ) : exams.length === 0 ? (
            <Alert severity="info" className="bg-white dark:bg-slate-800">No exams found. Try adjusting your filters.</Alert>
          ) : (
            <>
              <Grid container spacing={3}>
                {exams.map((exam, idx) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Grid item xs={12} sm={6} md={4} sx={{ height: '100%' }}>
                      <Card className="h-full hover:shadow-xl transition-shadow bg-white dark:bg-slate-800">
                      <CardContent className="pb-2">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-gray-800 dark:text-slate-100 line-clamp-2">
                            {exam.title}
                          </h3>
                          {exam.is_published && (
                            <Chip
                              label="Published"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-3 line-clamp-2">
                          {exam.description}
                        </p>

                        <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{exam.total_duration_minutes} mins</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award size={16} />
                            <span>{exam.total_marks} marks</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap size={16} />
                            <span
                              className="font-semibold"
                              style={{ color: getDifficultyColor(exam.difficulty_level) }}
                            >
                              {exam.difficulty_level.charAt(0).toUpperCase() +
                                exam.difficulty_level.slice(1)}
                            </span>
                          </div>
                            {exam.fee && exam.fee.fee_amount > 0 && (
                            <div className="flex items-center gap-2">
                              <Lock size={16} />
                              <span>{exam.fee.currency} {exam.fee.fee_amount}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>

                      <CardActions>
                        <Button
                          fullWidth
                          variant={unlockedExams.has(exam.id) ? 'contained' : 'outlined'}
                          color="primary"
                          onClick={() => handleStartExam(exam)}
                          startIcon={unlockedExams.has(exam.id) ? <Play size={18} /> : <Lock size={18} />}
                        >
                          {unlockedExams.has(exam.id) ? 'Start Exam' : 'Unlock'}
                        </Button>
                      </CardActions>
                    </Card>
                    </Grid>
                  </motion.div>
                ))}
              </Grid>

              {/* Pagination */}
              <div className="flex justify-center mt-8">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </div>
            </>
          )}
        </AnimatePresence>
      </Container>

      {/* Unlock Modal */}
      <MockExamUnlockModal
        isOpen={isUnlockModalOpen}
        exam={selectedExam}
        unlockStatus={unlockStatus}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlock={handleUnlock}
      />
    </div>
  );
};

// ============ UNLOCK MODAL COMPONENT ============

interface UnlockModalProps {
  isOpen: boolean;
  exam: CustomMockExam | null;
  unlockStatus: any;
  onClose: () => void;
  onUnlock: (paymentData: any) => void;
}

const MockExamUnlockModal: React.FC<UnlockModalProps> = ({
  isOpen,
  exam,
  unlockStatus,
  onClose,
  onUnlock,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!exam) return null;

  const feeAmount = exam.fee?.fee_amount || 0;
  const discountPercent = exam.fee?.discount_percentage || 0;
  const discountAmount = (feeAmount * discountPercent) / 100;
  const finalAmount = feeAmount - discountAmount;

  const handleContinue = async () => {
    setIsProcessing(true);
    try {
      onUnlock({
        amount: finalAmount,
        currency: exam.fee?.currency || 'NGN',
      });
    } catch (error) {
      showToast('error', 'Failed to process unlock');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <CardContent className="p-6 text-gray-900 dark:text-slate-100">
            <h2 className="text-2xl font-bold mb-4">✨ Unlock Exam</h2>
            <p className="text-gray-600 dark:text-slate-300 mb-2 font-semibold">{exam.title}</p>
            
            {/* Unlock reason/message */}
            {unlockStatus && (
              <Alert 
                severity={unlockStatus.unlocked ? 'success' : 'info'} 
                className="mb-4 bg-white dark:bg-slate-800"
              >
                {unlockStatus.message}
              </Alert>
            )}

            {feeAmount === 0 ? (
              <Alert severity="success" className="mb-4">
                🎉 This exam is completely FREE!
              </Alert>
            ) : (
              <>
                <Alert severity="info" className="mb-4">
                  💡 <strong>Did you know?</strong> If you've unlocked any CBT exam before, you get FREE access to all mock exams!
                </Alert>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4 rounded-lg mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Base Price:</span>
                    <span className="font-semibold">
                      {exam.fee?.currency} {feeAmount}
                    </span>
                  </div>
                  {discountPercent > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discountPercent}%):</span>
                        <span>- {exam.fee?.currency} {discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between font-bold text-lg text-indigo-600">
                        <span>Final Price:</span>
                        <span>
                          {exam.fee?.currency} {finalAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  {discountPercent === 0 && (
                    <div className="border-t pt-3 flex justify-between font-bold text-lg text-indigo-600">
                      <span>Total:</span>
                      <span>
                        {exam.fee?.currency} {feeAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

              <div className="flex gap-3">
              <Button fullWidth variant="outlined" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleContinue}
                disabled={isProcessing}
              >
                {isProcessing ? <CircularProgress size={20} /> : 'Proceed to Payment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Modal>
  );
};

export default StudentMockExamsPage;
