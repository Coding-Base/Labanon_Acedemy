// src/pages/StudentMockExamsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Badge,
  Pagination,
  Alert,
  Tooltip,
  IconButton,
  Chip,
  Modal,
  Backdrop,
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
        return '#10b981'; // Tailwind emerald-500
      case 'medium':
        return '#f59e0b'; // Tailwind amber-500
      case 'hard':
        return '#ef4444'; // Tailwind red-500
      default:
        return '#6366f1'; // Tailwind indigo-500
    }
  };

  const getDifficultyBgColor = (level: string, isDark: boolean) => {
    if (isDark) {
        switch (level.toLowerCase()) {
            case 'easy': return 'rgba(16, 185, 129, 0.2)';
            case 'medium': return 'rgba(245, 158, 11, 0.2)';
            case 'hard': return 'rgba(239, 68, 68, 0.2)';
            default: return 'rgba(99, 102, 241, 0.2)';
        }
    }
    switch (level.toLowerCase()) {
        case 'easy': return '#d1fae5'; // emerald-100
        case 'medium': return '#fef3c7'; // amber-100
        case 'hard': return '#fee2e2'; // red-100
        default: return '#e0e7ff'; // indigo-100
    }
  };

  // Determine dark mode simply for fallback inline styles
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="min-h-screen bg-transparent py-8 custom-scrollbar">
      <Container maxWidth="lg">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-100 mb-2">Mock Exams</h1>
          <p className="text-gray-600 dark:text-slate-300 text-lg">Practice tests to prepare for your exams</p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-10 shadow-sm border-0 ring-1 ring-gray-100 dark:ring-slate-700 bg-white dark:bg-slate-800 rounded-2xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
              <div className="w-full sm:col-span-1 md:col-span-2">
                  <TextField
                  fullWidth
                  placeholder="Search exams..."
                  variant="outlined"
                  size="medium"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  InputProps={{
                    startAdornment: <Search size={20} className="mr-3 text-gray-400 dark:text-slate-400" />,
                  }}
                />
              </div>
              <div className="w-full sm:col-span-1 md:col-span-1">
                <TextField
                  fullWidth
                  select
                  label="Difficulty"
                  value={difficultyFilter}
                  onChange={(e) => {
                    setDifficultyFilter(e.target.value);
                    setPage(1);
                  }}
                  size="medium"
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </TextField>
              </div>
              <div className="col-span-1 sm:col-span-2 md:col-span-1 flex justify-end">
                <Tooltip title="View attempt history">
                  <Button
                    variant="outlined"
                    color={showHistory ? 'primary' : 'inherit'}
                    onClick={() => setShowHistory(!showHistory)}
                    startIcon={
                        <Badge badgeContent={attempts.length} color="primary" sx={{ '& .MuiBadge-badge': { right: -3, top: -3 } }}>
                            <History size={20} />
                        </Badge>
                    }
                    className="h-[56px] px-6 rounded-lg border-gray-300 dark:border-slate-600 dark:text-slate-200"
                  >
                    History
                  </Button>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 w-80 h-screen bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-slate-700"
            >
              <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Attempt History</h2>
                <IconButton onClick={() => setShowHistory(false)} size="small" className="text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white">
                  <XIcon size={20} />
                </IconButton>
              </div>
              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                {attempts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                     <History size={48} className="mb-4 text-gray-400" />
                     <p className="text-gray-600 dark:text-slate-300 font-medium">No attempts yet</p>
                     <p className="text-sm text-gray-500 mt-1">Take an exam to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="p-4 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                        onClick={() => navigate(`results/${attempt.id}`)}
                      >
                        <p className="font-bold text-sm text-gray-800 dark:text-slate-100 mb-1 line-clamp-1">
                          {attempt.custom_mock_exam?.title}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                            <Chip 
                                size="small" 
                                label={`Score: ${attempt.total_marks_obtained}/${attempt.custom_mock_exam?.total_marks}`} 
                                color={attempt.passed ? "success" : "default"}
                                variant={attempt.passed ? "filled" : "outlined"}
                                className="font-semibold text-xs"
                            />
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                            {new Date(attempt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                        </div>
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
            <div className="flex flex-col items-center justify-center py-24">
              <CircularProgress size={48} className="mb-4" />
              <p className="text-gray-500 font-medium">Loading exams...</p>
            </div>
          ) : exams.length === 0 ? (
            <Alert severity="info" className="bg-white dark:bg-slate-800 shadow-sm rounded-xl py-4 text-lg items-center">
                No exams found matching your search or filter criteria.
            </Alert>
          ) : (
            <>
              {/* REMOVED the nested w-1/3 wrapper that was breaking the layout. The grid handles columns cleanly now. Increased gap to gap-6 for breathing room */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {exams.map((exam, idx) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="h-full"
                  >
                      <Card className="h-full flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <CardContent className="p-6 flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100 line-clamp-2 leading-tight">
                            {exam.title}
                          </h3>
                          {exam.is_published && (
                            <Chip
                              label="Published"
                              size="small"
                              className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold"
                            />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-6 line-clamp-2 leading-relaxed flex-grow">
                          {exam.description || "No description provided for this mock exam."}
                        </p>

                        {/* Pill-style Stats Grid for better readability */}
                        <div className="grid grid-cols-2 gap-3 mt-auto mb-2">
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                            <Clock size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 truncate">{exam.total_duration_minutes} mins</span>
                          </div>
                          
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                            <Award size={16} className="text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 truncate">{exam.total_marks} marks</span>
                          </div>

                          <div 
                            className="flex items-center gap-2 p-2.5 rounded-lg"
                            style={{ backgroundColor: getDifficultyBgColor(exam.difficulty_level, isDarkMode) }}
                          >
                            <Zap size={16} style={{ color: getDifficultyColor(exam.difficulty_level) }} className="flex-shrink-0" />
                            <span
                              className="text-xs font-bold truncate"
                              style={{ color: getDifficultyColor(exam.difficulty_level) }}
                            >
                              {exam.difficulty_level.charAt(0).toUpperCase() + exam.difficulty_level.slice(1)}
                            </span>
                          </div>

                          {exam.fee && exam.fee.fee_amount > 0 ? (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                              <Lock size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 truncate">{exam.fee.currency} {exam.fee.fee_amount}</span>
                            </div>
                          ) : (
                             <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                              <span className="text-xs font-bold text-green-600 dark:text-green-400 truncate w-full text-center">FREE</span>
                            </div>
                          )}
                        </div>
                      </CardContent>

                      <CardActions className="p-6 pt-0 mt-auto border-t border-gray-100 dark:border-slate-700/50">
                        <Button
                          fullWidth
                          size="large"
                          variant={unlockedExams.has(exam.id) || (exam.fee?.fee_amount === 0) ? 'contained' : 'outlined'}
                          color="primary"
                          className="font-bold py-2.5 rounded-xl shadow-sm"
                          onClick={() => handleStartExam(exam)}
                          startIcon={unlockedExams.has(exam.id) || (exam.fee?.fee_amount === 0) ? <Play size={18} /> : <Lock size={18} />}
                        >
                          {unlockedExams.has(exam.id) || (exam.fee?.fee_amount === 0) ? 'Start Exam' : 'Unlock Exam'}
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12 mb-4">
                    <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                    size="large"
                    shape="rounded"
                    className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700"
                    />
                </div>
              )}
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
          className: "bg-slate-900/60 backdrop-blur-sm"
        },
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
      >
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardContent className="p-8 text-gray-900 dark:text-slate-100">
            <h2 className="text-2xl font-extrabold mb-2">✨ Unlock Exam</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6 font-medium text-lg border-b dark:border-slate-700 pb-4">{exam.title}</p>
            
            {/* Unlock reason/message */}
            {unlockStatus && (
              <Alert 
                severity={unlockStatus.unlocked ? 'success' : 'info'} 
                className="mb-6 rounded-xl font-medium"
              >
                {unlockStatus.message}
              </Alert>
            )}

            {feeAmount === 0 ? (
              <Alert severity="success" className="mb-6 rounded-xl">
                🎉 This exam is completely FREE!
              </Alert>
            ) : (
              <>
                <Alert severity="info" className="mb-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                  💡 <strong>Did you know?</strong> If you've unlocked any CBT exam before, you get FREE access to all mock exams!
                </Alert>
                <div className="bg-gray-50 dark:bg-slate-900/50 p-5 rounded-xl mb-8 space-y-3 border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between items-center text-gray-600 dark:text-slate-400">
                    <span>Base Price:</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-200">
                      {exam.fee?.currency} {feeAmount}
                    </span>
                  </div>
                  {discountPercent > 0 && (
                    <>
                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                        <span>Discount ({discountPercent}%):</span>
                        <span className="font-semibold">- {exam.fee?.currency} {discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-slate-700 pt-3 mt-3 flex justify-between items-center">
                        <span className="font-bold text-gray-900 dark:text-white">Final Price:</span>
                        <span className="font-black text-xl text-indigo-600 dark:text-indigo-400">
                          {exam.fee?.currency} {finalAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  {discountPercent === 0 && (
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-3 mt-3 flex justify-between items-center">
                      <span className="font-bold text-gray-900 dark:text-white">Total:</span>
                      <span className="font-black text-xl text-indigo-600 dark:text-indigo-400">
                        {exam.fee?.currency} {feeAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

             <div className="flex gap-3 mt-4">
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={onClose} 
                disabled={isProcessing}
                className="py-3 rounded-xl font-bold border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300"
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleContinue}
                disabled={isProcessing}
                className="py-3 rounded-xl font-bold shadow-md"
              >
                {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Proceed to Payment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Modal>
  );
};

export default StudentMockExamsPage;