import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Award, Zap, Lock } from 'lucide-react';
import PaymentCheckout from '../../components/PaymentCheckout';
import { studentMockExamsAPI } from '../../api/mock_exams_api';
import showToast from '../../utils/toast';

interface CustomMockExam {
  id: number;
  title: string;
  description: string;
  total_duration_minutes: number;
  total_marks: number;
  difficulty_level: string;
  fee?: {
    fee_amount: number;
    currency: string;
    discount_percentage?: number;
  };
}

interface UnlockStatus {
  unlocked: boolean;
  reason: string;
  fee_amount?: number;
  currency?: string;
  message: string;
}

const MockExamUnlockPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<CustomMockExam | null>(null);
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!examId) return;

      try {
        setLoading(true);
        const [examRes, unlockRes] = await Promise.all([
          studentMockExamsAPI.getMockExamDetail(Number(examId)),
          studentMockExamsAPI.checkUnlockStatus(Number(examId))
        ]);

        setExam(examRes.data);
        setUnlockStatus(unlockRes.data);

        // If already unlocked, redirect back to exam list
        if (unlockRes.data.unlocked) {
          showToast('success', unlockRes.data.message);
          navigate('/student/mock-exams');
        }
      } catch (err: any) {
        setError('Failed to load exam details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [examId, navigate]);

  const handlePaymentSuccess = async () => {
    try {
      // Start exam attempt after successful payment
      const attemptRes = await studentMockExamsAPI.startMockExamAttempt(Number(examId));
      showToast('success', 'Exam unlocked successfully! Starting exam...');
      navigate(`/mock-exams/attempt/${attemptRes.data.id}`);
    } catch (err: any) {
      showToast('error', 'Failed to start exam. Please try again.');
      console.error(err);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6366f1';
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
      case 'easy': return '#d1fae5';
      case 'medium': return '#fef3c7';
      case 'hard': return '#fee2e2';
      default: return '#e0e7ff';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (error || !exam || !unlockStatus) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">{error || 'Exam not found'}</p>
          <button
            onClick={() => navigate('/student/mock-exams')}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
          >
            Back to Mock Exams
          </button>
        </div>
      </div>
    );
  }

  const feeAmount = exam.fee?.fee_amount || 0;
  const discountPercent = exam.fee?.discount_percentage || 0;
  const discountAmount = (feeAmount * discountPercent) / 100;
  const finalAmount = feeAmount - discountAmount;
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Unlock Mock Exam
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Complete payment to access this mock exam
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Exam Details */}
          <div className="space-y-6">
            {/* Exam Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {exam.title}
              </h2>

              <p className="text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">
                {exam.description || 'No description provided for this mock exam.'}
              </p>

              {/* Exam Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                  <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Duration</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{exam.total_duration_minutes} mins</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                  <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Marks</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{exam.total_marks}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg col-span-2" style={{ backgroundColor: getDifficultyBgColor(exam.difficulty_level, isDarkMode) }}>
                  <Zap className="w-5 h-5 flex-shrink-0" style={{ color: getDifficultyColor(exam.difficulty_level) }} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Difficulty</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">{exam.difficulty_level}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Unlock Status */}
            {unlockStatus && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Payment Required
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {unlockStatus.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fee Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Fee Breakdown
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-slate-400">Base Price</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {exam.fee?.currency} {feeAmount.toLocaleString()}
                  </span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({discountPercent}%)</span>
                    <span className="font-semibold">- {exam.fee?.currency} {discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-slate-700 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="font-black text-2xl text-indigo-600 dark:text-indigo-400">
                      {exam.fee?.currency} {finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Complete Payment
              </h3>

              <PaymentCheckout
                itemId={exam.id}
                itemType="mock_exam"
                amount={finalAmount}
                currency={exam.fee?.currency || 'NGN'}
                itemTitle={exam.title}
                onSuccess={handlePaymentSuccess}
                meta={{ exam_id: exam.id }}
              />
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Secure Payment
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    Your payment is processed securely through our payment partners.
                    You'll gain immediate access to this mock exam after successful payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/student/mock-exams')}
            className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            ← Back to Mock Exams
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockExamUnlockPage;