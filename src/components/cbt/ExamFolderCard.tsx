import React from 'react';
import { FolderOpen, ChevronRight } from 'lucide-react';

interface ExamFolderCardProps {
  title?: string;
  description?: string;
  subjectCount?: number;
  colorIndex?: number;
  onClick?: () => void;
  exam?: {
    id?: number;
    title: string;
    description?: string;
    subject_count?: number;
  };
}

const FOLDER_COLORS = [
  { bg: 'bg-orange-500', bgLight: 'bg-orange-100', text: 'text-orange-500', darkText: 'dark:text-orange-300' },
  { bg: 'bg-green-500', bgLight: 'bg-green-100', text: 'text-green-500', darkText: 'dark:text-green-300' },
  { bg: 'bg-blue-500', bgLight: 'bg-blue-100', text: 'text-blue-500', darkText: 'dark:text-blue-300' },
  { bg: 'bg-purple-500', bgLight: 'bg-purple-100', text: 'text-purple-500', darkText: 'dark:text-purple-300' },
  { bg: 'bg-teal-500', bgLight: 'bg-teal-100', text: 'text-teal-500', darkText: 'dark:text-teal-300' },
  { bg: 'bg-pink-500', bgLight: 'bg-pink-100', text: 'text-pink-500', darkText: 'dark:text-pink-300' },
  { bg: 'bg-red-500', bgLight: 'bg-red-100', text: 'text-red-500', darkText: 'dark:text-red-300' },
  { bg: 'bg-gray-500', bgLight: 'bg-gray-100', text: 'text-gray-500', darkText: 'dark:text-gray-300' },
];

const ExamFolderCard: React.FC<ExamFolderCardProps> = ({
  title,
  description,
  subjectCount,
  colorIndex = 0,
  onClick,
  exam,
}) => {
  const displayTitle = title || exam?.title || '';
  const displayDesc = description ?? exam?.description ?? '';
  const displayCount = subjectCount ?? exam?.subject_count ?? 0;
  const color = FOLDER_COLORS[Math.abs(colorIndex) % FOLDER_COLORS.length];

  return (
    <div
      onClick={onClick}
      className="group flex flex-col justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-yellow-500/60 dark:hover:border-yellow-500/60 transition-all duration-200 cursor-pointer h-full min-h-[190px]"
    >
      <div>
        {/* Top: Folder Icon & Chevron */}
        <div className="flex items-center justify-between mb-3.5">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${color.bgLight} dark:bg-slate-700/80 transition-transform group-hover:scale-105`}>
            <FolderOpen className={`w-6 h-6 ${color.text} ${color.darkText}`} />
          </div>
          <div className="flex items-center text-gray-400 dark:text-slate-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 group-hover:translate-x-1 transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors line-clamp-1" title={displayTitle}>
          {displayTitle}
        </h3>

        {/* Description - spacious with 3 full lines and relaxed line-height */}
        <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
          {displayDesc || 'Explore past questions, mock tests, and subject practice.'}
        </p>
      </div>

      {/* Bottom: Subject / Exam count badge */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700/60 mt-auto">
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-md">
          {displayCount} {displayCount === 1 ? 'Subject' : 'Subjects'}
        </span>
        <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          Explore <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

export default ExamFolderCard;
