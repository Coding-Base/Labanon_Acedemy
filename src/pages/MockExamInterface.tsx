// src/pages/MockExamInterface.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircularProgress,
  Modal,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Alert,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, Flag, Calculator, X } from 'lucide-react';
import { studentMockExamsAPI, MockExamQuestion, MockExamOption, MockExamAttempt } from '../api/mock_exams_api';
import showToast from '../utils/toast';
import { MathText } from '../utils/mathRenderer';

interface Answer {
  [key: number]: string | number | null;
}

interface EnrichedQuestion extends MockExamQuestion {
  _subjectName: string;
}

interface SubjectInfo {
  name: string;
  questionIndices: number[];
}

interface MockExamInterfaceProps {
  darkMode?: boolean;
}

/** Fisher-Yates shuffle (in-place) */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MockExamInterface: React.FC<MockExamInterfaceProps> = ({ darkMode = false }) => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const muiTheme = React.useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc',
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      primary: { main: '#ca8a04' },
    }
  }), [darkMode]);

  const [attempt, setAttempt] = useState<MockExamAttempt | null>(null);
  const [questions, setQuestions] = useState<EnrichedQuestion[]>([]);
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcReset, setCalcReset] = useState(false);
  const [examTitle, setExamTitle] = useState('Mock Exam');

  const attemptIdNum = parseInt(attemptId || '0');
  
  const resolvedAttemptId = attemptIdNum || (() => {
    try {
      const m = window.location.pathname.match(/attempt\/(\d+)/i);
      return m ? parseInt(m[1], 10) : 0;
    } catch (e) {
      return 0;
    }
  })();
  
  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        const response = await studentMockExamsAPI.getAttemptDetail(resolvedAttemptId);
        const attemptData = response.data as MockExamAttempt;
        setAttempt(attemptData);

        const startTime = new Date((attemptData as any).started_at).getTime();
        let durationMs = 120 * 60 * 1000;
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

        try {
          const examField = (attemptData as any).mock_exam || (attemptData as any).custom_mock_exam;
          const examId = typeof examField === 'number' ? examField : examField?.id;
          if (examId) {
            const examResp = await studentMockExamsAPI.getMockExamDetail(examId);
            const examData = examResp.data;

            let fetchedQuestions: EnrichedQuestion[] = [];
            const normalizeQuestion = (q: any, subjectName: string): EnrichedQuestion => {
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
                _subjectName: subjectName,
              } as EnrichedQuestion;
            };

            if (examData.title) setExamTitle(examData.title);
            const subjectNames: string[] = [];

            if (Array.isArray(examData.subjects) && examData.subjects.length > 0) {
              examData.subjects.forEach((sub: any) => {
                const sName = sub.subject_name || sub.name || 'General';
                subjectNames.push(sName);
                const qs: any[] = sub.questions || [];
                const subjectQs = qs.map((q) => normalizeQuestion(q, sName));
                // Shuffle within each subject
                fetchedQuestions.push(...shuffleArray(subjectQs));
              });
            } else if (Array.isArray(examData.questions)) {
              fetchedQuestions = shuffleArray(
                examData.questions.map((q: any) => normalizeQuestion(q, 'General'))
              );
              subjectNames.push('General');
            }

            setSubjectsList(subjectNames);
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
    if (!Number.isFinite(ms) || ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculator logic
  const calcHandleNumber = (num: string) => {
    if (calcReset) { setCalcDisplay(num); setCalcReset(false); return; }
    setCalcDisplay(calcDisplay === '0' ? num : calcDisplay + num);
  };
  const calcHandleOp = (op: string) => {
    setCalcPrev(parseFloat(calcDisplay));
    setCalcOp(op);
    setCalcReset(true);
  };
  const calcHandleEquals = () => {
    if (calcPrev === null || !calcOp) return;
    const cur = parseFloat(calcDisplay);
    let result = 0;
    switch (calcOp) {
      case '+': result = calcPrev + cur; break;
      case '-': result = calcPrev - cur; break;
      case '×': result = calcPrev * cur; break;
      case '÷': result = cur !== 0 ? calcPrev / cur : 0; break;
    }
    setCalcDisplay(String(Number.isFinite(result) ? parseFloat(result.toFixed(8)) : 0));
    setCalcPrev(null); setCalcOp(null); setCalcReset(true);
  };
  const calcClear = () => { setCalcDisplay('0'); setCalcPrev(null); setCalcOp(null); setCalcReset(false); };

  // Subject-aware computed data
  const subjectInfoMap = useMemo(() => {
    const map: Record<string, { total: number; answered: number; firstIdx: number }> = {};
    questions.forEach((q, idx) => {
      const s = q._subjectName || 'General';
      if (!map[s]) map[s] = { total: 0, answered: 0, firstIdx: idx };
      map[s].total++;
      if (answers[q.id] !== undefined && answers[q.id] !== null) map[s].answered++;
    });
    return map;
  }, [questions, answers]);

  // Compact pagination: show max ~11 buttons to avoid overflow
  const getPaginationRange = (current: number, total: number): (number | 'ellipsis')[] => {
    if (total <= 11) return Array.from({ length: total }, (_, i) => i);
    const range: (number | 'ellipsis')[] = [];
    if (current <= 4) {
      for (let i = 0; i < 7; i++) range.push(i);
      range.push('ellipsis', total - 1);
    } else if (current >= total - 5) {
      range.push(0, 'ellipsis');
      for (let i = total - 7; i < total; i++) range.push(i);
    } else {
      range.push(0, 'ellipsis');
      for (let i = current - 2; i <= current + 2; i++) range.push(i);
      range.push('ellipsis', total - 1);
    }
    return range;
  };

  const currentQuestion = questions[currentQuestionIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><CircularProgress /></div>;
  }

  if (!attempt || !currentQuestion) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Alert severity="error">Failed to load exam interface</Alert></div>;
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="w-full flex flex-col bg-transparent">
        
        {/* Header Bar */}
        <div className={`shadow-md px-4 py-3 sticky top-0 z-30 border-b rounded-xl mb-0 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-lg md:text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-800'}`}>{examTitle}</h1>
              <p className="text-sm text-yellow-600 font-medium">{answeredCount}/{totalQuestions} answered</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`text-2xl md:text-3xl font-mono font-bold tracking-wider`} style={{ color: Number.isFinite(timeRemaining) && timeRemaining < 300000 ? '#dc2626' : '#ca8a04' }}>
                  {formatTime(timeRemaining)}
                </span>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Time Remaining</p>
              </div>
              <button onClick={() => setShowConfirmSubmit(true)} className="px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-500 hover:text-white transition-colors">
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* Subject Tabs */}
        <div className={`flex items-center gap-2 px-4 py-2 overflow-x-auto border-b rounded-b-xl ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
          {subjectsList.map((subj) => {
            const info = subjectInfoMap[subj];
            const isActive = currentQuestion?._subjectName === subj;
            return (
              <button key={subj} onClick={() => { if (info) setCurrentQuestionIdx(info.firstIdx); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${isActive ? 'bg-yellow-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                {subj}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-yellow-700 text-yellow-100' : darkMode ? 'bg-slate-600 text-slate-400' : 'bg-gray-300 text-gray-600'}`}>
                  {info?.answered || 0}/{info?.total || 0}
                </span>
              </button>
            );
          })}
          <button onClick={() => setShowCalculator(true)} className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${darkMode ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
            <Calculator size={16} /> Calculator
          </button>
        </div>

        <div className="flex-1 max-w-5xl mx-auto w-full py-4 flex flex-col gap-6">
          {/* Question Section */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`shadow-lg rounded-xl border p-8 flex flex-col min-h-[60vh] ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                  
                  {/* Question Header */}
                  <div className="mb-6 border-b pb-4 border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-yellow-600 uppercase tracking-widest mb-2">
                      {currentQuestion._subjectName || 'GENERAL'}
                    </h2>
                    <div className="flex justify-between items-center">
                      <p className={`font-bold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Question {currentQuestionIdx + 1}
                      </p>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? 'bg-yellow-900/30 text-yellow-500' : 'bg-yellow-100 text-yellow-700'}`}>
                          {currentQuestion.marks} marks
                        </span>
                        {markedForReview.has(currentQuestion.id) && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${darkMode ? 'bg-orange-900/30 text-orange-500' : 'bg-orange-100 text-orange-700'}`}>
                            <Flag size={12} /> Marked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question Body */}
                  <div className="mb-8 flex-1">
                    <div className={`text-lg font-medium mb-6 ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                      <MathText text={currentQuestion.question_text} />
                    </div>

                    {currentQuestion.question_image && (
                      <img
                        src={currentQuestion.question_image}
                        alt="Question"
                        className="max-w-2xl w-full object-contain mb-8 rounded-lg border border-gray-200 dark:border-slate-700"
                      />
                    )}

                    {/* Options */}
                    <div>
                      {currentQuestion.question_type === 'MCQ' && (
                        <div className="space-y-4">
                          {(currentQuestion.options || []).map((option: MockExamOption, optIdx: number) => {
                            const isSelected = String(answers[currentQuestion.id]) === String(option.id);
                            return (
                              <label
                                key={option.id}
                                className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border transition-all duration-200 ${
                                  isSelected 
                                    ? (darkMode ? 'bg-slate-700 border-yellow-500 shadow-[0_0_0_1px_rgba(234,179,8,1)]' : 'bg-yellow-50 border-yellow-500 shadow-[0_0_0_1px_rgba(234,179,8,1)]')
                                    : (darkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/80' : 'bg-white border-gray-200 hover:bg-gray-50')
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${currentQuestion.id}`}
                                  value={option.id}
                                  checked={isSelected}
                                  onChange={(e) => handleAnswerChange(currentQuestion.id, parseInt(e.target.value))}
                                  className="mt-1 w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                />
                                <div className="flex gap-3 pt-0.5">
                                  <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                    ({String.fromCharCode(65 + optIdx)})
                                  </span>
                                  <span className={`${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                    <MathText text={option.text} />
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {currentQuestion.question_type === 'TrueOrFalse' && (
                        <div className="flex gap-6">
                          {['true', 'false'].map((val) => {
                            const isSelected = String(answers[currentQuestion.id]) === val;
                            return (
                              <label
                                key={val}
                                className={`flex items-center gap-3 p-4 w-40 rounded-xl cursor-pointer border transition-all duration-200 ${
                                  isSelected 
                                    ? (darkMode ? 'bg-slate-700 border-yellow-500 shadow-[0_0_0_1px_rgba(234,179,8,1)]' : 'bg-yellow-50 border-yellow-500 shadow-[0_0_0_1px_rgba(234,179,8,1)]')
                                    : (darkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/80' : 'bg-white border-gray-200 hover:bg-gray-50')
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${currentQuestion.id}`}
                                  value={val}
                                  checked={isSelected}
                                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                  className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                />
                                <span className={`font-semibold capitalize ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                  {val}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {currentQuestion.question_type === 'Essay' && (
                        <textarea
                          rows={8}
                          placeholder="Type your answer here..."
                          value={(answers[currentQuestion.id] as string) || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-yellow-500 focus:outline-none transition-all ${
                            darkMode 
                              ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      )}
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={markedForReview.has(currentQuestion.id)}
                          onChange={() => handleMarkForReview(currentQuestion.id)}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                        />
                        <span className={`text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 group-hover:text-slate-300' : 'text-gray-600 group-hover:text-gray-800'}`}>
                          Mark this question for review
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Inline Pagination */}
                  <div className={`mt-auto pt-6 border-t flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <button
                      onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                      disabled={currentQuestionIdx === 0}
                      className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        darkMode 
                          ? 'bg-yellow-900/30 text-yellow-500 hover:bg-yellow-900/50' 
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      Previous
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 flex-1 max-w-full overflow-x-auto custom-scrollbar pb-1">
                      {getPaginationRange(currentQuestionIdx, totalQuestions).map((idx, i) => {
                        if (idx === 'ellipsis') {
                          return <span key={`ell-${i}`} className={`px-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>...</span>;
                        }
                        const isCurrent = idx === currentQuestionIdx;
                        const qId = questions[idx as number].id;
                        const isAnswered = answers[qId] !== undefined && answers[qId] !== null;
                        const isMarked = markedForReview.has(qId);
                        
                        let btnClass = darkMode 
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';

                        if (isCurrent) {
                          btnClass = 'bg-yellow-500 text-white border-yellow-500 shadow-md';
                        } else if (isAnswered) {
                          btnClass = darkMode 
                            ? 'bg-green-900/40 text-green-400 border-green-800/50' 
                            : 'bg-green-50 text-green-700 border-green-200';
                        } else if (isMarked) {
                          btnClass = darkMode 
                            ? 'bg-orange-900/40 text-orange-400 border-orange-800/50' 
                            : 'bg-orange-50 text-orange-700 border-orange-200';
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentQuestionIdx(idx as number)}
                            className={`w-9 h-9 flex items-center justify-center rounded border font-semibold text-sm transition-all ${btnClass}`}
                          >
                            {(idx as number) + 1}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentQuestionIdx(Math.min(currentQuestionIdx + 1, totalQuestions - 1))}
                      disabled={currentQuestionIdx === totalQuestions - 1}
                      className={`px-8 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-yellow-500 text-white hover:bg-yellow-600 shadow-md`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Calculator Modal */}
        <Modal open={showCalculator} onClose={() => setShowCalculator(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-[80]"
          >
            <div className={`w-72 p-5 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                  <Calculator size={18} /> Calculator
                </h3>
                <button onClick={() => setShowCalculator(false)} className={`p-1 rounded-full ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <X size={18} />
                </button>
              </div>
              <div className={`w-full p-3 mb-4 rounded-lg text-right font-mono text-2xl font-bold truncate overflow-hidden ${darkMode ? 'bg-slate-900 text-slate-100 shadow-inner' : 'bg-gray-100 text-gray-800 shadow-inner'}`}>
                {calcDisplay}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={calcClear} className="col-span-2 py-2.5 rounded-lg font-bold bg-red-500 text-white hover:bg-red-600 active:bg-red-700">C</button>
                <button onClick={() => calcHandleOp('÷')} className={`py-2.5 rounded-lg font-bold ${darkMode ? 'bg-slate-700 text-yellow-500 hover:bg-slate-600' : 'bg-gray-200 text-yellow-700 hover:bg-gray-300'}`}>÷</button>
                <button onClick={() => calcHandleOp('×')} className={`py-2.5 rounded-lg font-bold ${darkMode ? 'bg-slate-700 text-yellow-500 hover:bg-slate-600' : 'bg-gray-200 text-yellow-700 hover:bg-gray-300'}`}>×</button>
                
                {['7','8','9'].map(n => <button key={n} onClick={() => calcHandleNumber(n)} className={`py-2.5 rounded-lg font-bold text-lg ${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>{n}</button>)}
                <button onClick={() => calcHandleOp('-')} className={`py-2.5 rounded-lg font-bold ${darkMode ? 'bg-slate-700 text-yellow-500 hover:bg-slate-600' : 'bg-gray-200 text-yellow-700 hover:bg-gray-300'}`}>−</button>
                
                {['4','5','6'].map(n => <button key={n} onClick={() => calcHandleNumber(n)} className={`py-2.5 rounded-lg font-bold text-lg ${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>{n}</button>)}
                <button onClick={() => calcHandleOp('+')} className={`py-2.5 rounded-lg font-bold ${darkMode ? 'bg-slate-700 text-yellow-500 hover:bg-slate-600' : 'bg-gray-200 text-yellow-700 hover:bg-gray-300'}`}>+</button>
                
                {['1','2','3'].map(n => <button key={n} onClick={() => calcHandleNumber(n)} className={`py-2.5 rounded-lg font-bold text-lg ${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>{n}</button>)}
                <button onClick={calcHandleEquals} className="row-span-2 py-2.5 rounded-lg font-bold text-xl bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700">=</button>
                
                <button onClick={() => calcHandleNumber('0')} className={`col-span-2 py-2.5 rounded-lg font-bold text-lg ${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>0</button>
                <button onClick={() => calcHandleNumber('.')} className={`py-2.5 rounded-lg font-bold text-lg ${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>.</button>
              </div>
            </div>
          </motion.div>
        </Modal>

        {/* Submit Confirmation Modal */}
        <Modal open={showConfirmSubmit} onClose={() => setShowConfirmSubmit(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-[70]"
          >
            <div className={`max-w-md w-full p-8 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="text-red-500" size={28} />
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Submit Exam?</h2>
              </div>

              <div className={`p-4 rounded-xl mb-6 space-y-2 ${darkMode ? 'bg-slate-900/50 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={`text-sm flex justify-between ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <strong>Questions Answered:</strong> <span>{answeredCount} / {totalQuestions}</span>
                </p>
                <p className={`text-sm flex justify-between ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <strong>Marked for Review:</strong> <span>{markedForReview.size}</span>
                </p>
              </div>

              <p className={`mb-8 font-medium ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Once submitted, you cannot change your answers. Are you sure you want to finish the exam?
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmSubmit(false)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-50`}
                >
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Yes, Submit'}
                </button>
              </div>
            </div>
          </motion.div>
        </Modal>
      </div>
    </ThemeProvider>
  );
};

export default MockExamInterface;