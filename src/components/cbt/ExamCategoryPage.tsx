import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  Search, ChevronRight, ChevronLeft, Home, 
  ArrowUpDown, Clock, BookOpen, Users 
} from 'lucide-react';
import SubjectExamCard from './SubjectExamCard';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export interface Exam {
  id: number;
  title: string;
  slug: string;
  description: string;
  time_limit_minutes: number;
  subject_count?: number;
}

export interface Subject {
  id: number;
  name: string;
  description: string;
  question_count: number;
}

export interface TrialInfo {
  trial_attempts_used: number;
  trial_attempts_remaining: number;
  trial_available: boolean;
  trial_attempts_limit?: number;
  trial_questions_limit?: number;
}

export interface ExamCategoryPageProps {
  exam: Exam;
  onBack: () => void;
  onStartExam: (exam: Exam, subjects: Subject[], trialInfo: TrialInfo | null, allowedSubjectIds: number[]) => void;
}

interface ActivationStatus {
  unlocked: boolean;
  trial_available: boolean;
  trial_attempts_used: number;
  trial_attempts_remaining: number;
  trial_attempts_limit?: number;
  trial_questions_limit?: number;
  allowed_subjects?: any[];
}

export default function ExamCategoryPage({ exam, onBack, onStartExam }: ExamCategoryPageProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activationStatus, setActivationStatus] = useState<ActivationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOption, setSortOption] = useState('A-Z');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Custom debounce implementation
  const debounce = useCallback((func: (...args: any[]) => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }, []);

  const updateSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
      setCurrentPage(1); // Reset to first page on search
    }, 300),
    [debounce]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    updateSearch(e.target.value);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [subjectsRes, activationRes] = await Promise.all([
          axios.get(`${API_BASE}/cbt/exams/${exam.id}/subjects/`, { headers }),
          axios.get(`${API_BASE}/payments/activation-status/?exam=${exam.id}`, { headers }).catch(err => {
            console.warn("Could not fetch activation status", err);
            return { data: { unlocked: false, trial_available: false, trial_attempts_used: 0, trial_attempts_remaining: 0 } };
          })
        ]);

        if (isMounted) {
          const subjectsData = Array.isArray(subjectsRes.data)
            ? subjectsRes.data
            : (subjectsRes.data?.results || [])
          setSubjects(subjectsData);
          setActivationStatus(activationRes.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Failed to load exam subjects. Please try again later.');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [exam.id]);

  const filteredAndSortedSubjects = useMemo(() => {
    let result = [...subjects];

    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase();
      result = result.filter(subject => 
        subject.name.toLowerCase().includes(lowerSearch)
      );
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'Z-A':
          return b.name.localeCompare(a.name);
        case 'Most Questions':
          return b.question_count - a.question_count;
        case 'Fewest Questions':
          return a.question_count - b.question_count;
        case 'A-Z':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [subjects, debouncedSearch, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedSubjects.length / itemsPerPage);
  
  const currentSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedSubjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedSubjects, currentPage, itemsPerPage]);

  const getPaginationNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push('...');
      }
    }
    return pages.filter((item, index, arr) => arr.indexOf(item) === index);
  };

  const checkLockStatus = (subjectId: number) => {
    if (!activationStatus) return { isLocked: true, isTrialAvailable: false };

    let isLocked = true;
    let isTrialAvailable = false;

    if (activationStatus.unlocked === true) {
      // Check if this exam uses allowed_subjects (JAMB style)
      if (activationStatus.allowed_subjects && activationStatus.allowed_subjects.length > 0) {
        const allowedIds = activationStatus.allowed_subjects.map((s: any) => 
          typeof s === 'number' ? s : s?.id
        ).filter(Boolean);
        isLocked = !allowedIds.includes(subjectId);
      } else {
        isLocked = false;
      }
    } else if (activationStatus.unlocked === false && activationStatus.trial_available === true) {
      isLocked = false;
      isTrialAvailable = true;
    } else {
      isLocked = true;
      isTrialAvailable = false;
    }

    return { isLocked, isTrialAvailable };
  };

  const getTrialInfo = (): TrialInfo | null => {
    if (!activationStatus || !activationStatus.trial_available) return null;
    return {
      trial_attempts_used: activationStatus.trial_attempts_used,
      trial_attempts_remaining: activationStatus.trial_attempts_remaining,
      trial_available: activationStatus.trial_available,
      trial_attempts_limit: activationStatus.trial_attempts_limit,
      trial_questions_limit: activationStatus.trial_questions_limit,
    };
  };

  const handleStartExam = (subject: Subject) => {
    const rawAllowed = activationStatus?.allowed_subjects || [];
    const allowedSubjectIds = rawAllowed.map((s: any) => 
      typeof s === 'number' ? s : s?.id
    ).filter(Boolean);
    onStartExam(exam, [subject], getTrialInfo(), allowedSubjectIds);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800/50 hover:bg-red-200 dark:hover:bg-red-800/80 rounded transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-gray-500 dark:text-gray-400 font-medium">
        <div className="flex items-center space-x-2">
          <Home className="w-4 h-4" />
          <span>Home</span>
          <ChevronRight className="w-4 h-4" />
          <button 
            onClick={onBack}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            CBT & Exams
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">{exam.title}</span>
        </div>
      </nav>

      {/* Category Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {exam.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-3xl mb-6 leading-relaxed">
          {exam.description}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full">
            <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
            <span>{exam.subject_count || subjects.length} Subjects</span>
          </div>
          <div className="flex items-center bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4 mr-2 text-green-500" />
            <span>{exam.time_limit_minutes} mins default duration</span>
          </div>
        </div>
      </div>

      {/* Search and Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-all"
          >
            <option value="A-Z">A-Z</option>
            <option value="Z-A">Z-A</option>
            <option value="Most Questions">Most Questions</option>
            <option value="Fewest Questions">Fewest Questions</option>
          </select>
        </div>
      </div>

      {/* Subjects Grid */}
      {currentSubjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentSubjects.map((subject, index) => {
            const { isLocked, isTrialAvailable } = checkLockStatus(subject.id);
            return (
              <SubjectExamCard
                key={subject.id}
                subject={subject}
                examTitle={exam.title}
                examTimeLimitMinutes={exam.time_limit_minutes}
                colorIndex={index % 5}
                isLocked={isLocked}
                isTrialAvailable={isTrialAvailable}
                onStartExam={() => handleStartExam(subject)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No subjects found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {debouncedSearch ? "Try adjusting your search query." : "There are currently no subjects available for this exam."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredAndSortedSubjects.length)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{filteredAndSortedSubjects.length}</span> subjects
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {getPaginationNumbers().map((pageNum, idx) => (
              <React.Fragment key={idx}>
                {pageNum === '...' ? (
                  <span className="px-3 py-2 text-gray-500 dark:text-gray-400">...</span>
                ) : (
                  <button
                    onClick={() => setCurrentPage(pageNum as number)}
                    className={`px-3.5 py-1.5 text-sm rounded-lg transition-colors ${
                      currentPage === pageNum 
                        ? 'bg-blue-600 text-white font-medium shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
