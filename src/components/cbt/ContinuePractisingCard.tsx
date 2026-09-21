import React from 'react';
import { Clock, CheckCircle2, ChevronRight, PlayCircle } from 'lucide-react';

interface ContinuePractisingCardProps {
  attempt: {
    id: number;
    exam_title: string;
    subject_name: string | null;
    test_name?: string;
    num_questions: number;
    score?: number | null;
    started_at: string;
    submitted_at?: string | null;
    time_taken_seconds?: number | null;
    correct_answers?: number;
    total_questions?: number;
    is_submitted: boolean;
  };
  onContinue: () => void;
  colorIndex?: number;
}

const COLORS = [
  { accent: 'bg-orange-500', text: 'text-orange-500' },
  { accent: 'bg-green-500', text: 'text-green-500' },
  { accent: 'bg-blue-500', text: 'text-blue-500' },
  { accent: 'bg-purple-500', text: 'text-purple-500' },
  { accent: 'bg-teal-500', text: 'text-teal-500' },
  { accent: 'bg-pink-500', text: 'text-pink-500' },
  { accent: 'bg-red-500', text: 'text-red-500' },
  { accent: 'bg-gray-500', text: 'text-gray-500' },
];

const ContinuePractisingCard: React.FC<ContinuePractisingCardProps> = ({
  attempt,
  onContinue,
  colorIndex = 0,
}) => {
  const color = COLORS[Math.abs(colorIndex) % COLORS.length];
  
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  };

  return (
    <div className="relative flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className={`absolute top-0 left-0 right-0 h-1 ${color.accent}`} />
      
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <div className="pr-4">
            <h4 className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">
              {attempt.subject_name || attempt.test_name || 'Practice Test'}
            </h4>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
              {attempt.exam_title}
            </p>
          </div>
          {attempt.is_submitted && attempt.score !== null && attempt.score !== undefined && (
            <div className={`flex-shrink-0 px-2 py-1 rounded-md border text-sm font-bold ${getScoreColor(attempt.score)}`}>
              {Math.round(attempt.score)}%
            </div>
          )}
        </div>

        <div className="flex-grow">
          {!attempt.is_submitted ? (
            <div className="mb-4">
              <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                <span>In Progress</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${color.accent}`} style={{ width: '50%' }}></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Completed</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {attempt.is_submitted 
                ? `Finished: ${formatDate(attempt.submitted_at || attempt.started_at)}` 
                : `Started: ${formatDate(attempt.started_at)}`}
            </span>
          </div>

          <button
            onClick={onContinue}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !attempt.is_submitted 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50' 
                : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600'
            }`}
          >
            {!attempt.is_submitted ? (
              <>
                Continue <PlayCircle className="w-4 h-4" />
              </>
            ) : (
              <>
                Review <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContinuePractisingCard;
