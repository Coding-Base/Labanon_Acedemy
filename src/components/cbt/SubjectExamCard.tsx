import React from 'react';
import { HelpCircle, Clock, Lock, Play } from 'lucide-react';

interface SubjectExamCardProps {
  subject: {
    id: number;
    name: string;
    description: string;
    question_count: number;
  };
  examTitle: string;
  examTimeLimitMinutes: number;
  colorIndex: number;
  isLocked: boolean;
  isTrialAvailable: boolean;
  onStartExam: () => void;
}

const COLORS = [
  { border: 'border-orange-500', bg: 'bg-orange-500', text: 'text-orange-500' },
  { border: 'border-green-500', bg: 'bg-green-500', text: 'text-green-500' },
  { border: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-500' },
  { border: 'border-purple-500', bg: 'bg-purple-500', text: 'text-purple-500' },
  { border: 'border-teal-500', bg: 'bg-teal-500', text: 'text-teal-500' },
  { border: 'border-pink-500', bg: 'bg-pink-500', text: 'text-pink-500' },
  { border: 'border-red-500', bg: 'bg-red-500', text: 'text-red-500' },
  { border: 'border-gray-500', bg: 'bg-gray-500', text: 'text-gray-500' },
];

const SubjectExamCard: React.FC<SubjectExamCardProps> = ({
  subject,
  examTitle,
  examTimeLimitMinutes,
  colorIndex,
  isLocked,
  isTrialAvailable,
  onStartExam,
}) => {
  const color = COLORS[colorIndex % COLORS.length];

  return (
    <div className="relative group flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full">
      {/* Accent left border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.bg}`} />
      
      {isLocked && !isTrialAvailable && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 z-10 flex flex-col items-center justify-center backdrop-blur-[1px]">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg mb-2">
            <Lock className="w-6 h-6 text-gray-400 dark:text-slate-500" />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Premium Content</span>
        </div>
      )}

      <div className="p-5 pl-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">
            {subject.name}
          </h3>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
            {examTitle}
          </span>
        </div>

        {isTrialAvailable && (
          <div className="mb-2 inline-block">
            <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Free Trial Available
            </span>
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4 flex-grow">
          {subject.description || 'No description provided.'}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400 mb-5">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>{subject.question_count} Qs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{examTimeLimitMinutes} mins</span>
          </div>
        </div>

        <button
          onClick={onStartExam}
          disabled={isLocked && !isTrialAvailable}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="w-4 h-4 fill-current" />
          {isTrialAvailable ? 'Start Free Trial' : 'Start Exam'}
        </button>
      </div>
    </div>
  );
};

export default SubjectExamCard;
