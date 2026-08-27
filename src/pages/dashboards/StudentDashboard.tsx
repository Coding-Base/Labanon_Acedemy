// src/pages/dashboards/StudentDashboard.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// 1. USE SECURE API INSTANCE
import api from '../../utils/axiosInterceptor';
import useTokenRefresher from '../../utils/useTokenRefresher';
import {
  Home,
  BookOpen,
  FileText,
  CreditCard,
  User,
  BarChart3,
  ChevronRight,
  Calendar,
  Award,
  Clock,
  TrendingUp,
  Bell,
  LogOut,
  PlayCircle,
  CheckCircle,
  Mail,
  Users,
  Star,
  Target,
  FileCheck,
  Download,
  ShoppingCart,
  Trophy,
  Loader2,
  Crown,
  Menu,
  X,
  Zap,
  Moon,
  Sun,
  BookMarked,
  Gift,
  MessageSquare,
  Copy,
  Sparkles,
  ArrowRight,
  Settings
} from 'lucide-react';
import labanonLogo from '../labanonlogo.png';
import MyCourses from '../MyCourses';
import CBTPage from '../CBT';
import PaymentsPage from '../Payments';
import Profile from '../Profile';
import Cart from '../Cart';
import UserMessages from '../../components/UserMessages';
import DirectMessageInbox from '../../components/DirectMessageInbox';
import ProgressPage from '../../components/cbt/ProgressPage';
import CoursePlayer from '../CoursePlayer';
import CourseDetail from '../CourseDetail';
import MessageModal from '../../components/MessageModal';
import CertificatesPage from '../CertificatesPage';
import SchedulePage from '../../components/SchedulePage';
import GospelVideoModal from '../../components/GospelVideoModal';
import StudentMockExamsPage from '../StudentMockExamsPage';
import MockExamInterface from '../MockExamInterface';
import MockExamResultsPage from '../MockExamResultsPage';
import { DownloadsCard } from '../../components/Materials';
import StudentLessonsPage from '../../components/StudentLessonsPage';
import SubscriptionSettings from '../SubscriptionSettings';

// --- Types ---
interface DashboardSummary {
  username: string;
  enrollments_count: number;
  attempts_count: number;
  avg_score: number | null;
  completed_courses: number;
  total_study_time: number;
  rank: number;
  role?: string;
  id?: number;
  date_joined?: string;
  [k: string]: any;
}

interface LeaderboardUser {
  id: number;
  name: string;
  score: number;
  exams_taken: number;
  avatar_initial: string;
  is_current_user?: boolean;
}

export default function StudentDashboard(props: { summary?: DashboardSummary }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Proactively refresh JWT token every 50 minutes (same as other dashboards)
  useTokenRefresher(50);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showDirectMessages, setShowDirectMessages] = useState(false);
  const [directMessageUnreadCount, setDirectMessageUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('studentDashboardDarkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const initialFromState = (location.state as any)?.summary;
  const [summary, setSummary] = useState<DashboardSummary | null>(props.summary ?? initialFromState ?? null);
  const [loadingSummary, setLoadingSummary] = useState(!summary);

  // --- Dynamic Stats State ---
  const [streak, setStreak] = useState(0);
  const [calculatedRating, setCalculatedRating] = useState(3.0); 
  const [realStudyHours, setRealStudyHours] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | string>('—');
  const [memberSince, setMemberSince] = useState<string>('');
  const [referralData, setReferralData] = useState<any | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const base = '/student';
  const loggedOutRef = useRef(false);

  // Pro Popup Logic (Frequency-capped to max 2-3 times per day)
  const [showProModal, setShowProModal] = useState(false);
  const [isProUser, setIsProUser] = useState(false);

  useEffect(() => {
    async function checkProStatusAndTriggerPopup() {
      try {
        const token = localStorage.getItem('access');
        if (!token) return;
        const res = await api.get('/subscriptions/my-status/');
        if (res.data?.is_pro) {
          setIsProUser(true);
          return;
        }

        // Frequency capping check (max 3 times in 24h, min 2.5h apart)
        const now = Date.now();
        const rawHistory = localStorage.getItem('lha_pro_popup_history');
        let history: number[] = [];
        try {
          history = rawHistory ? JSON.parse(rawHistory) : [];
        } catch {
          history = [];
        }

        const recentHistory = history.filter((t: number) => now - t < 24 * 60 * 60 * 1000);
        const lastShown = recentHistory.length > 0 ? Math.max(...recentHistory) : 0;
        const cooldownPassed = now - lastShown > 2.5 * 60 * 60 * 1000;

        if (recentHistory.length < 3 && (recentHistory.length === 0 || cooldownPassed)) {
          const timer = setTimeout(() => {
            setShowProModal(true);
            const updatedHistory = [...recentHistory, now];
            localStorage.setItem('lha_pro_popup_history', JSON.stringify(updatedHistory));
          }, 3000);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error('Pro status check error', err);
      }
    }
    checkProStatusAndTriggerPopup();
  }, []);

  // Fetch unread direct message count
  useEffect(() => {
    const fetchDirectMessageUnreadCount = async () => {
      try {
        const token = localStorage.getItem('access');
        if (!token) return;
        const response = await api.get('/messages/direct/unread_count/');
        setDirectMessageUnreadCount(response.data.unread_count || 0);
      } catch (err) {
        console.warn('Failed to fetch unread message count:', err);
      }
    };

    fetchDirectMessageUnreadCount();
    const interval = setInterval(fetchDirectMessageUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('studentDashboardDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const doLogout = useCallback((reason?: string) => {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login', { replace: true });
  }, [navigate]);

  // --- ALGORITHMS ---
  const calculateStreak = (activities: string[]) => {
    if (!activities.length) return 0;
    
    const sortedDates = activities
      .map(d => new Date(d).setHours(0,0,0,0))
      .sort((a, b) => b - a);
    
    const uniqueDates = [...new Set(sortedDates)];
    
    let currentStreak = 0;
    const today = new Date().setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (uniqueDates[0] === today || uniqueDates[0] === yesterday.getTime()) {
      currentStreak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const curr = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i+1]);
        const diffTime = Math.abs(curr.getTime() - next.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) currentStreak++;
        else break;
      }
    }
    return currentStreak;
  };

  useEffect(() => {
    let mounted = true;
    async function loadFullData() {
      const token = localStorage.getItem('access');
      if (!token) { doLogout('no token'); return; }
      
      if (!summary) setLoadingSummary(true);

      try {
        const [userRes, summaryRes] = await Promise.all([
          api.get('/users/me/'),
          api.get('/dashboard/')
        ]);

        if (!mounted) return;

        const userData = userRes.data;
        const dashData = summaryRes.data;
        
        setSummary({ ...dashData, ...userData });

        const joinDate = new Date(userData.date_joined || new Date());
        setMemberSince(joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

        const [attemptsRes, enrollmentsRes] = await Promise.all([
          api.get('/cbt/attempt-list/', { params: { page_size: 100 } })
            .catch((err) => {
              console.error('Error fetching attempts:', err);
              return { data: { results: [] } };
            }),
          api.get('/enrollments/', { params: { page_size: 100 } })
            .catch((err) => {
              console.error('Error fetching enrollments:', err);
              return { data: { results: [] } };
            })
        ]);

        const attempts = attemptsRes.data.results || [];
        const enrollments = enrollmentsRes.data.results || [];

        const activityDates: string[] = [
          ...attempts.map((a: any) => a.started_at),
          ...enrollments.map((e: any) => e.updated_at || e.created_at)
        ].filter(Boolean);
        setStreak(calculateStreak(activityDates));

        const attemptsCount = attempts.length;
        const newRating = Math.min(5.0, 3.0 + (Number(attemptsCount || 0) * 0.08));
        const validRating = isFinite(newRating) ? newRating : 3.0;
        setCalculatedRating(Number(validRating.toFixed(2)) || 3.0);

        const examSeconds = attempts.reduce((acc: number, curr: any) => acc + (curr.time_taken_seconds || 0), 0);
        const examHours = examSeconds / 3600;

        const courseHours = enrollments.reduce((acc: number, curr: any) => {
          const progress = parseFloat(curr.progress || 0);
          const duration = parseFloat(curr.course?.duration || 5); 
          return acc + ((progress / 100) * duration);
        }, 0);

        const totalHours = Number(examHours || 0) + Number(courseHours || 0);
        const validHours = isFinite(totalHours) ? totalHours : 0;
        setRealStudyHours(Number(validHours.toFixed(1)) || 0);

        let leaderboardData: LeaderboardUser[] = [];
        try {
          const leaderboardRes = await api.get('/cbt/leaderboard/', { params: { limit: 50 } }).catch(() => null);
          if (leaderboardRes?.data) {
            const data = Array.isArray(leaderboardRes.data) ? leaderboardRes.data : (leaderboardRes.data.results || []);
            leaderboardData = data.map((item: any, idx: number) => {
              let scoreValue = item.avg_score !== undefined ? item.avg_score : (item.high_score || item.best_score || 0);
              if (typeof scoreValue === 'string') {
                scoreValue = parseFloat(scoreValue);
              }
              scoreValue = (typeof scoreValue === 'number' && isFinite(scoreValue)) ? scoreValue : 0;
              
              return {
                id: item.id || item.user_id || idx,
                name: item.username || item.user?.username || item.name || 'Student',
                score: scoreValue,
                exams_taken: item.attempts_count !== undefined ? item.attempts_count : (item.exams_taken || 0),
                avatar_initial: (item.name || item.username || item.user?.username || 'S').charAt(0).toUpperCase()
              };
            });
          }
        } catch (err) {
          console.error('Failed to fetch leaderboard:', err);
        }

        const getNumericScore = (scoreField: any): number => {
          if (typeof scoreField === 'number' && isFinite(scoreField)) return scoreField;
          if (typeof scoreField === 'string') {
            const parsed = parseFloat(scoreField);
            return isFinite(parsed) ? parsed : 0;
          }
          return 0;
        };

        let myBestScore = 0;
        if (attempts.length > 0) {
          const scores = attempts.map((a: any) => getNumericScore(a.score));
          const validScores = scores.filter((s) => isFinite(s) && s >= 0);
          myBestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
        }

        const currentUserEntry: LeaderboardUser = {
            id: userData.id,
            name: userData.username || 'You',
            score: myBestScore,
            exams_taken: attempts.length,
            avatar_initial: userData.username?.charAt(0).toUpperCase(),
            is_current_user: true
        };

        const allBoard = [...leaderboardData, currentUserEntry].sort((a, b) => b.score - a.score);
        const uniqueBoard = Array.from(new Map(allBoard.map(item => [item.id, item])).values())
                                .sort((a, b) => b.score - a.score);

        setLeaderboard(uniqueBoard);

        const rankIndex = uniqueBoard.findIndex(u => u.id === userData.id);
        setUserRank(rankIndex !== -1 ? rankIndex + 1 : '—');

      } catch (err: any) {
        console.error('Failed to load dashboard data', err);
        if (err?.response?.status === 401) doLogout('401 on load');
      } finally {
        if (mounted) setLoadingSummary(false);
      }
    }

    loadFullData();
    return () => { mounted = false; };
  }, [doLogout, props.summary, location.state]);

  const loadReferralData = useCallback(async () => {
    setReferralLoading(true);
    try {
      const res = await api.get('/referrals/me/');
      // normalize points_balance to string/number for display
      const data = res.data || {};
      setReferralData({
        ...data,
        points_balance: data.points_balance,
        settings: data.settings || {}
      });
    } catch (err) {
      console.warn('Failed to load referral data:', err);
    } finally {
      setReferralLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadingSummary) loadReferralData();
  }, [loadingSummary, loadReferralData]);

  if (loadingSummary) return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading your student portal...</p>
      </div>
    </div>
  );

  const navItems = [
    { path: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
    { path: 'courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
    { path: 'lessons', label: 'Lessons', icon: <BookMarked className="w-5 h-5" /> },
    { path: 'cbt', label: 'CBT & Exams', icon: <FileText className="w-5 h-5" /> },
    { path: 'mock-exams', label: 'Mock Exams', icon: <Zap className="w-5 h-5" /> },
    { path: 'referrer', label: 'Referrer', icon: <Gift className="w-5 h-5" /> },
    { path: 'cart', label: 'Shopping Cart', icon: <ShoppingCart className="w-5 h-5" /> },
    { path: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> }, 
    { path: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
    { path: 'progress', label: 'Progress', icon: <TrendingUp className="w-5 h-5" /> },
    { path: 'certificates', label: 'Certificates', icon: <Award className="w-5 h-5" /> },
    { path: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { path: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { path: 'subscription', label: 'Subscription Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  const stats = [
    { title: 'Enrollments', value: summary?.enrollments_count || 0, icon: <BookOpen className="w-6 h-6" />, color: 'from-yellow-600 to-yellow-500', change: 'Active courses', trend: 'up' },
    { title: 'Exam Attempts', value: summary?.attempts_count || 0, icon: <FileCheck className="w-6 h-6" />, color: 'from-yellow-500 to-yellow-400', change: 'Lifetime attempts', trend: 'up' },
    { title: 'Average Score', value: summary?.avg_score ? `${Math.round(summary.avg_score)}%` : '—', icon: <Target className="w-6 h-6" />, color: 'from-yellow-500 to-yellow-400', change: 'Performance', trend: 'up' },
    { title: 'Completed Courses', value: summary?.completed_courses || 0, icon: <CheckCircle className="w-6 h-6" />, color: 'from-orange-500 to-amber-400', change: 'Certificates', trend: 'neutral' },
    { title: 'Study Time', value: `${realStudyHours}h`, icon: <Clock className="w-6 h-6" />, color: 'from-yellow-500 to-indigo-400', change: 'Calculated time', trend: 'up' },
    { title: 'Global Rank', value: `#${userRank}`, icon: <Trophy className="w-6 h-6" />, color: 'from-rose-500 to-pink-400', change: 'Among all students', trend: 'up' }
  ];

  const quickActions = [
    { title: 'Take Practice Test', icon: <FileText className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-700', path: 'cbt' },
    { title: 'Join Live Class', icon: <Users className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-600', path: 'schedule' }, 
    { title: 'Download Materials', icon: <Download className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-700', path: 'courses' },
    { title: 'View Leaderboard', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-amber-100 text-amber-600', path: 'leaderboard' }
  ];

  const isActivePath = (p: string) => {
    const normalized = location.pathname.replace(/\/+$/, '');
    if (p === 'overview') return normalized === base || normalized === `${base}/overview`;
    return normalized === `${base}/${p}`;
  };

  const ReferrerPage = () => (
    <div className="space-y-6">
      <div className={`bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden`}>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Earn by Referring</h2>
          <p className="opacity-90">Share your referral link and earn rewards</p>
        </div>
        <Gift className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white opacity-20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} rounded-2xl border p-6 text-center`}>
          <div className="text-3xl font-bold text-yellow-600 mb-2">0</div>
          <p className={`${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Total Referrals</p>
        </div>
        <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} rounded-2xl border p-6 text-center`}>
          <div className="text-3xl font-bold text-green-600 mb-2">₦0</div>
          <p className={`${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Earnings</p>
        </div>
        <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} rounded-2xl border p-6 text-center`}>
          <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
          <p className={`${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Verified Signups</p>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} rounded-2xl border p-8`}>
        <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Your Referral Link</h3>
        <div className={`flex gap-3 p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
          <input 
            type="text" 
            value="https://lighthubacademy.org/ref/YOUR_UNIQUE_CODE" 
            readOnly 
            className={`flex-1 ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-700'} border-none outline-none`}
          />
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">Copy</button>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'} rounded-2xl border p-6`}>
        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>📌 Coming Soon</h3>
        <p className={`${darkMode ? 'text-slate-300' : 'text-gray-600'} mb-4`}>Our referral program is coming soon! Get ready to earn rewards by sharing LightHub Academy with your friends and colleagues.</p>
        <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          <li>✓ Earn ₦1,000 per successful referral</li>
          <li>✓ Unlimited earning potential</li>
          <li>✓ Real-time tracking dashboard</li>
          <li>✓ Monthly payouts</li>
        </ul>
      </div>
    </div>
  );

  const copyToClipboard = async (value: string, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(label);
    } catch (err) {
      setCopyMessage('Could not copy');
    }
    setTimeout(() => setCopyMessage(''), 1800);
  };

  const RealReferrerPage = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lighthubacademy.org';
    const code = referralData?.code || '';
    const registerLink = code ? `${origin}/register?ref=${encodeURIComponent(code)}` : '';
    const marketplaceLink = code ? `${origin}/marketplace?ref=${encodeURIComponent(code)}` : '';
    const events = referralData?.recent_events || [];

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-600 to-green-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Earn by Referring</h2>
            <p className="opacity-90">Share your code, earn points, and spend them on courses or materials.</p>
          </div>
          <Gift className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white opacity-20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} rounded-2xl border p-6 text-center`}>
            <div className="text-3xl font-bold text-yellow-600 mb-2">{referralData?.total_referrals || 0}</div>
            <p className={`${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Total Referrals</p>
          </div>
          <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} rounded-2xl border p-6 text-center`}>
            <div className="text-3xl font-bold text-green-600 mb-2">{Number(referralData?.points_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className={`${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Credit Balance (NGN)</p>
          </div>
          <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} rounded-2xl border p-6 text-center`}>
            <div className="text-3xl font-bold text-blue-600 mb-2">{referralData?.verified_signups || 0}</div>
            <p className={`${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Verified Signups</p>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} rounded-2xl border p-8`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Your Referral Links</h3>
            {referralLoading && <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />}
          </div>
          <div className={`flex gap-3 p-4 rounded-lg mb-3 ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
            <input type="text" value={registerLink || 'Loading your referral link...'} readOnly className={`flex-1 ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-700'} border-none outline-none`} />
            <button onClick={() => copyToClipboard(registerLink, 'Registration link copied')} disabled={!registerLink} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 disabled:opacity-50"><Copy className="w-4 h-4" /> Copy</button>
          </div>
          <div className={`flex gap-3 p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
            <input type="text" value={marketplaceLink || 'Loading your marketplace link...'} readOnly className={`flex-1 ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-700'} border-none outline-none`} />
            <button onClick={() => copyToClipboard(marketplaceLink, 'Marketplace link copied')} disabled={!marketplaceLink} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"><Copy className="w-4 h-4" /> Copy</button>
          </div>
          {copyMessage && <p className="text-sm text-green-600 mt-3">{copyMessage}</p>}
          {code && <p className={`text-sm mt-4 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Code: <span className="font-mono font-semibold">{code}</span> - each course purchase earns {((referralData?.settings?.referral_percent || 0.05) * 100).toFixed(2)}% of the platform share as credits.</p>}
        </div>

        <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} rounded-2xl border overflow-hidden`}>
          <div className="p-6 border-b border-gray-200">
            <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Recent Referral Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {events.length === 0 ? (
              <div className={`p-6 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>No referral activity yet.</div>
            ) : events.map((event: any) => (
              <div key={event.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className={`font-medium capitalize ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{String(event.event_type || '').replace(/_/g, ' ')}</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{event.referred_name || event.item_title || 'Referral points'} - {new Date(event.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-bold ${event.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>{event.points > 0 ? '+' : ''}{event.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const LeaderboardPage = () => (
    <div className={`space-y-6 ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Global Leaderboard</h2>
          <p className="opacity-90">Top performers across all JAMB CBT Exams</p>
        </div>
        <Trophy className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white opacity-20" />
      </div>

      <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl shadow-sm border overflow-hidden`}>
        <div className="hidden sm:block">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'} border-b`}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Rank</th>
                <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Student</th>
                <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>Exams Taken</th>
                <th className={`px-6 py-4 text-right text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-500'} uppercase tracking-wider`}>High Score</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
              {leaderboard.map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`transition-colors ${user.is_current_user ? (darkMode ? 'bg-yellow-900/30 border-l-4 border-yellow-500' : 'bg-yellow-50 border-l-4 border-yellow-500') : (darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50')}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && <Crown className="w-5 h-5 text-yellow-500 mr-2" />}
                      {index === 1 && <Crown className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-gray-400'} mr-2`} />}
                      {index === 2 && <Crown className="w-5 h-5 text-amber-700 mr-2" />}
                      <span className={`font-bold ${index < 3 ? (darkMode ? 'text-white' : 'text-gray-900') : (darkMode ? 'text-slate-400' : 'text-gray-500')}`}>#{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                        index === 0 ? 'bg-yellow-500' : (darkMode ? 'bg-slate-600' : 'bg-gray-400')
                      }`}>
                        {user.avatar_initial}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user.name} {user.is_current_user && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-yellow-200 text-yellow-800">You</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    {user.exams_taken} Tests
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-yellow-600">
                    {(typeof user.score === 'number' && isFinite(user.score) ? user.score.toFixed(1) : '0.0')} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden p-4 space-y-3">
          {leaderboard.map((user, index) => (
            <div key={user.id} className={`p-3 rounded-lg border ${user.is_current_user ? (darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200') : (darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-gray-100')}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' : (darkMode ? 'bg-slate-600' : 'bg-gray-400')}`}>{user.avatar_initial}</div>
                  <div>
                    <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name} {user.is_current_user && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-yellow-200 text-yellow-800">You</span>}</div>
                    <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{user.exams_taken} Tests</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-600 font-bold">{typeof user.score === 'number' && isFinite(user.score) ? user.score.toFixed(1) : '0.0'} pts</div>
                  <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>#{index + 1}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`student-dashboard ${darkMode ? 'dark-mode bg-slate-950 text-slate-100' : 'bg-gradient-to-br from-gray-50 to-yellow-50'} fixed inset-0 w-full flex flex-col overflow-hidden`}>
      <style>{`
        .student-dashboard .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(250,204,21,0.9) rgba(15,23,42,0.18);
        }
        .student-dashboard .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .student-dashboard .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.06);
          border-radius: 999px;
        }
        .student-dashboard .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(250,204,21,0.95), rgba(249,115,22,0.95));
          border-radius: 999px;
          border: 2px solid rgba(255,255,255,0.06);
        }
        .student-dashboard .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          filter: brightness(0.95);
        }
        @media (max-width: 1024px) {
          .student-dashboard .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        }
        .student-dashboard.dark-mode .bg-white { background-color: #0f1724 !important; }
        .student-dashboard.dark-mode .bg-white/90 { background-color: rgba(15,23,36,0.9) !important; }
        .student-dashboard.dark-mode .bg-white\\/10 { background-color: rgba(255,255,255,0.04) !important; }
        .student-dashboard.dark-mode .bg-gray-50 { background-color: #0b1220 !important; }
        .student-dashboard.dark-mode .text-gray-900 { color: #e6eef8 !important; }
        .student-dashboard.dark-mode .text-gray-800 { color: #cbd5e1 !important; }
        .student-dashboard.dark-mode .text-gray-700 { color: #94a3b8 !important; }
        .student-dashboard.dark-mode .text-gray-600 { color: #8b98a8 !important; }
        .student-dashboard.dark-mode .text-gray-500 { color: #64748b !important; }
        .student-dashboard.dark-mode .border-gray-200 { border-color: #1f2937 !important; }
        .student-dashboard.dark-mode .border-gray-100 { border-color: #111827 !important; }
        .student-dashboard.dark-mode .bg-gray-100 { background-color: #0b1220 !important; }
        .student-dashboard.dark-mode .bg-gray-50 { background-color: #071023 !important; }
        .student-dashboard.dark-mode input, .student-dashboard.dark-mode textarea, .student-dashboard.dark-mode select {
          background-color: #0b1220 !important; color: #e6eef8 !important; border-color: #1f2937 !important;
        }
      `}</style>
      
      <GospelVideoModal />
      
      {/* Header is fixed flex-none */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className={`flex-none z-40 ${darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/90'} backdrop-blur-lg border-b shadow-sm h-16`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`lg:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} mr-3 transition-colors`} aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'} aria-expanded={sidebarOpen}>
                <Menu className={`w-6 h-6 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`} />
              </button>
              <Link to={base} className="flex items-center space-x-3 group">
                <img src={labanonLogo} alt="LightHub Academy logo" width={32} height={32} className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
                <div><h1 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Student Portal</h1></div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`} title={darkMode ? 'Light mode' : 'Dark mode'}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowMessageModal(true)} className={`relative p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`} title="Send message">
                <Bell className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowInbox(true)} className={`relative p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`} title="Inbox">
                <Mail className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowDirectMessages(true)} className={`relative p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`} title="Direct Messages">
                <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                {directMessageUnreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {directMessageUnreadCount}
                  </span>
                )}
              </motion.button>
              <div className={`hidden md:flex items-center space-x-3 pl-4 border-l ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                    {summary?.username?.charAt(0).toUpperCase()}
                  </div>
                  {isProUser && (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 p-0.5 rounded-full shadow-sm" title="Pro Member">
                      <Crown className="w-3 h-3 fill-slate-950" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{summary?.username}</p>
                    {isProUser && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm flex items-center space-x-0.5">
                        <Crown className="w-2.5 h-2.5 fill-slate-950" />
                        <span>PRO</span>
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                    {isProUser ? 'Pro Student Account' : 'Student Account'}
                  </p>
                </div>
              </div>
              <motion.button onClick={() => doLogout('user clicked logout')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all">
                <LogOut className="w-4 h-4" /><span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 gap-6 relative">
        <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden lg:flex w-64 flex-col flex-none">
          <div className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 flex flex-col h-full border overflow-hidden`}>
            <div className="mb-6 flex-none">
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                    {summary?.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                  {isProUser && (
                    <div className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 p-1 rounded-xl shadow-md border border-yellow-300" title="Pro Student">
                      <Crown className="w-3.5 h-3.5 fill-slate-950" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className={`font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{summary?.username}</h3>
                    {isProUser && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm flex items-center space-x-0.5">
                        <Crown className="w-2.5 h-2.5 fill-slate-950" />
                        <span>PRO</span>
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {isProUser ? 'Pro Student' : 'Student'}
                  </p>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`w-3 h-3 ${i <= Math.round(calculatedRating) ? 'text-yellow-400 fill-current' : darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                    ))}
                    <span className={`ml-1 text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>{calculatedRating}</span>
                  </div>
                </div>
              </div>

              <div className={`space-y-2 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Member Since</span>
                  <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{memberSince || '...'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Learning Streak</span>
                  <span className="font-semibold text-orange-600">{streak} days 🔥</span>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const active = isActivePath(item.path);
                  return (
                    <motion.div key={item.path} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                      <button
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          active 
                            ? darkMode
                              ? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 text-yellow-400 border-l-4 border-yellow-500 shadow-sm'
                              : 'bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border-l-4 border-yellow-500 shadow-sm'
                            : darkMode
                            ? 'text-slate-300 hover:bg-slate-700/50 hover:text-yellow-400'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-yellow-600'
                        }`}
                      >
                        <div className={`${active ? 'text-yellow-500' : darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{item.icon}</div>
                        <span className="font-medium">{item.label}</span>
                        {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </nav>

            <motion.button
              onClick={() => navigate('/student/pro')}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`relative group mt-6 flex-none w-full py-3.5 px-4 rounded-2xl font-extrabold shadow-xl transition-all overflow-hidden flex items-center justify-center space-x-2.5 ${
                isProUser
                  ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-yellow-500/50 text-yellow-400 hover:border-yellow-400 shadow-yellow-900/20'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 border border-yellow-300/60 text-slate-950 shadow-yellow-500/25'
              }`}
            >
              <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
              >
                <Crown className={`w-5 h-5 ${isProUser ? 'text-yellow-400 fill-yellow-400' : 'text-slate-950 fill-slate-950'}`} />
              </motion.div>
              <span className="tracking-wide text-xs md:text-sm font-black">
                {isProUser ? 'EXPLORE OTHER PLANS' : 'UPGRADE TO PRO'}
              </span>
              <Sparkles className={`w-4 h-4 ${isProUser ? 'text-yellow-400 animate-pulse' : 'text-amber-950 animate-pulse'}`} />
            </motion.button>
          </div>
        </motion.aside>

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div 
                key="overlay"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 0.5 }} 
                exit={{ opacity: 0 }} 
                className="lg:hidden fixed inset-0 bg-black z-40" 
                onClick={() => setSidebarOpen(false)} 
              />
              <motion.aside 
                key="sidebar"
                initial={{ x: -300, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                exit={{ x: -300, opacity: 0 }} 
                className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-2xl p-6 flex flex-col`}
              >
                <div className={`flex items-center justify-between mb-8 pb-4 border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <h2 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Menu</h2>
                  <button onClick={() => setSidebarOpen(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                    <X className={`w-6 h-6 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`} />
                  </button>
                </div>
                <nav className="space-y-2 flex-1 overflow-y-auto pr-2 -mr-2">
                  {navItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(`${base}/${item.path}`);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        darkMode
                          ? 'text-slate-300 hover:bg-slate-700 hover:text-yellow-400'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-yellow-600'
                      }`}
                    >
                      <div className={darkMode ? 'text-slate-500' : 'text-gray-500'}>{item.icon}</div>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
                  <button
                    onClick={() => {
                      navigate('/student/pro');
                      setSidebarOpen(false);
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-extrabold shadow-md flex items-center justify-center space-x-2 text-xs ${
                      isProUser
                        ? 'bg-slate-900 border border-yellow-500/60 text-yellow-400'
                        : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-slate-950'
                    }`}
                  >
                    <Crown className={`w-4 h-4 ${isProUser ? 'fill-yellow-400' : 'fill-slate-950'}`} />
                    <span>{isProUser ? 'EXPLORE OTHER PLANS' : 'UPGRADE TO PRO'}</span>
                  </button>

                  <button onClick={() => doLogout('user clicked logout (mobile)')} className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold hover:bg-red-600 hover:text-white transition-all">Logout</button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col min-w-0 bg-transparent rounded-2xl relative overflow-hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg border flex-1 flex flex-col overflow-hidden`}>
            
            {/* THIS INNER DIV CONTROLS THE SCROLL FOR ALL ROUTES */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              <div className="min-h-full p-6 pb-24 lg:pb-6">
                <Routes>
                  <Route path="overview" element={
                    <div className="w-full min-h-full">
                      <div className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Welcome back, <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{summary?.username}</span>! 👋</h1>
                            <p className={`${darkMode ? 'text-slate-400' : 'text-gray-600'} mt-2`}>Track your progress, access courses, and ace your exams</p>
                          </div>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg">
                            <PlayCircle className="w-5 h-5 inline mr-2" />Continue Learning
                          </motion.button>
                        </div>
                      </div>

                      {/* PRO & PLATFORM ANNOUNCEMENTS NEWS FEED */}
                      <div className="mb-8">
                        {isProUser ? (
                          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white border border-yellow-500/40 shadow-xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="space-y-2 max-w-2xl">
                                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider border border-yellow-500/30">
                                  <Crown className="w-3.5 h-3.5 fill-yellow-400" />
                                  <span>Pro Membership Active 🚀</span>
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-white">
                                  Full Pro Access Unlocked across CBT Exams &amp; Mock Sessions! ✨
                                </h2>
                                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                                  You are currently on an active Pro Plan. Enjoy unlimited practice tests, custom mock exam simulations, and downloadable study guides.
                                </p>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <motion.button
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => navigate('/student/subscription')}
                                  className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-slate-950 font-extrabold text-xs md:text-sm shadow-xl shadow-yellow-500/20 flex items-center justify-center space-x-2 whitespace-nowrap"
                                >
                                  <Settings className="w-4 h-4 text-slate-950" />
                                  <span>Manage Subscription</span>
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => navigate('/student/pro')}
                                  className="px-4 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 flex items-center justify-center space-x-1.5 whitespace-nowrap"
                                >
                                  <span>Explore Other Plans</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white border border-yellow-500/30 shadow-xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="space-y-2 max-w-2xl">
                                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider border border-yellow-500/30">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>News &amp; Pro Highlights</span>
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-white">
                                  Ace JAMB, WAEC &amp; NECO with Unlimited CBT Practice on Pro! ⚡
                                </h2>
                                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                                  Unlock all exam past questions, custom timed mock sessions, and unlimited downloadable study guides with our flexible monthly Pro subscription.
                                </p>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <motion.button
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => navigate('/student/pro')}
                                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 text-slate-950 font-extrabold text-xs md:text-sm shadow-xl shadow-yellow-500/20 flex items-center justify-center space-x-2 whitespace-nowrap"
                                >
                                  <Crown className="w-4 h-4 fill-slate-950" />
                                  <span>Explore Pro Tiers</span>
                                  <ArrowRight className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {stats.map((stat) => (
                          <div key={stat.title} className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'} mb-1`}>{stat.title}</p>
                                <p className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{stat.value}</p>
                                <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'} mt-1`}>{stat.change}</p>
                              </div>
                              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                                <div className="text-white">{stat.icon}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mb-8">
                        <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
                          <DownloadsCard darkMode={darkMode} />
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-100'} rounded-xl shadow-sm border p-4 flex items-center justify-between gap-4`}>
                          <div>
                            <div className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Share Feedback</div>
                            <div className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Tell us about your experience</div>
                            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'} mt-1`}>Leave a review about the platform or your recent exam.</div>
                          </div>
                          <div>
                            <Link to="/reviews?role=student" className="px-4 py-2 bg-yellow-600 text-white rounded">Write a Review</Link>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                          <div className="mb-8">
                            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-4">
                              {quickActions.map((action) => (
                                <motion.button key={action.title} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(action.path)} className={`${action.color} p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all border border-transparent hover:border-gray-200`}>
                                  {action.icon}
                                  <span className="text-sm font-semibold text-center">{action.title}</span>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-1">
                          <div className={`${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} border rounded-2xl shadow-sm p-5`}>
                            <div className="flex justify-between items-center mb-4">
                              <h3 className={`font-bold flex items-center ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}><Trophy className="w-5 h-5 text-yellow-500 mr-2" /> Top Scorers</h3>
                              <Link to="/student/leaderboard" className="text-sm text-yellow-600 hover:underline">See More</Link>
                            </div>
                            <div className="space-y-4">
                              {leaderboard.slice(0, 3).map((user, idx) => (
                                <div key={user.id} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                  <div className="flex items-center">
                                    <span className={`font-bold mr-3 ${idx===0?'text-yellow-600':idx===1?'text-gray-500':'text-amber-700'}`}>#{idx+1}</span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${darkMode ? 'bg-slate-600 text-slate-100' : 'bg-gray-300 text-gray-700'}`}>{user.avatar_initial}</div>
                                    <div className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>{user.name}</div>
                                  </div>
                                  <div className={`text-sm font-bold text-yellow-700`}>{typeof user.score === 'number' && isFinite(user.score) ? user.score.toFixed(1) : '0.0'}</div>
                                </div>
                              ))}
                              {leaderboard.length === 0 && <div className={`text-sm ${darkMode ? 'text-slate-500' : 'text-gray-500'} text-center py-4`}>No data available</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  } />

                  <Route path="courses" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><MyCourses /></div>} />
                  <Route path="courses/:id" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><CoursePlayer /></div>} />
                  <Route path="courses/:id/details" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><CourseDetail /></div>} />
                  
                  <Route path="lessons" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><StudentLessonsPage darkMode={darkMode} /></div>} />
                  
                  <Route path="cbt" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><CBTPage /></div>} />
                  <Route path="mock-exams" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><StudentMockExamsPage /></div>} />
                  <Route path="mock-exams/attempt/:attemptId" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><MockExamInterface darkMode={darkMode} /></div>} />
                  <Route path="mock-exams/results/:attemptId" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><MockExamResultsPage darkMode={darkMode} /></div>} />
                  
                  <Route path="referrer" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><RealReferrerPage /></div>} />
                  <Route path="cart" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><Cart /></div>} />
                  <Route path="payments" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><PaymentsPage /></div>} />
                  <Route path="profile" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><Profile /></div>} />
                  <Route path="progress" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><ProgressPage /></div>} />
                  <Route path="leaderboard" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><LeaderboardPage /></div>} />
                  <Route path="certificates" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><CertificatesPage /></div>} />
                  <Route path="subscription" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><SubscriptionSettings /></div>} />
                  <Route path="settings" element={<div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}><SubscriptionSettings /></div>} />
                  <Route path="schedule" element={
                      <div className={`w-full min-h-full ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          <SchedulePage userRole="student" />
                      </div>
                  } />
                  
                  <Route path="" element={<div className="w-full min-h-full flex items-center justify-center"><p className={`${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Redirecting...</p></div>} />
                  <Route path="*" element={
                    <div className={`w-full min-h-full flex items-center justify-center text-center ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                      <div>
                        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Page Not Found</h3>
                        <button onClick={() => navigate('/student')} className="px-6 py-2 bg-yellow-600 text-white rounded-lg">Go to Dashboard</button>
                      </div>
                    </div>
                  } />
                </Routes>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      <div className={`lg:hidden fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[60] flex justify-around items-center h-16`}>
        {navItems.slice(0, 5).map((item) => {
          const active = isActivePath(item.path);
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center p-2 flex-1 ${active ? 'text-yellow-600' : (darkMode ? 'text-slate-400' : 'text-gray-600')}`}>
              <div className={`${active ? 'text-yellow-600' : (darkMode ? 'text-slate-500' : 'text-gray-500')} mb-1`}>{React.cloneElement(item.icon, { size: 20 })}</div>
              <span className={`text-xs font-medium ${darkMode ? 'text-slate-300' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <MessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} />
      <UserMessages isOpen={showInbox} onClose={() => setShowInbox(false)} />
      {/* Direct Messages Modal */}
      {showDirectMessages && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Direct Messages from Administrator</h2>
              <button
                onClick={() => setShowDirectMessages(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <DirectMessageInbox />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* SMART PRO UPGRADE POPUP MODAL (2-3x per day max) */}
      <AnimatePresence>
        {showProModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 max-w-lg w-full border-2 border-yellow-500/50 shadow-2xl text-white space-y-6"
            >
              <button
                onClick={() => setShowProModal(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl text-slate-950 shadow-lg">
                  <Crown className="w-7 h-7 fill-slate-950" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-yellow-400">Special Student Offer</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">Supercharge Your Exam Prep!</h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Upgrade to <strong>LightHub Pro</strong> today and unlock full access to all JAMB UTME, WAEC SSCE, and NECO past question banks, custom mock exams, and downloadable syllabus PDFs.
              </p>

              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Unlimited CBT Practice Attempts (No limits)</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>All Subject Combinations Unlocked</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Custom Timed Mock Exam Simulator</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowProModal(false);
                    navigate('/student/pro');
                  }}
                  className="w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all text-center flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Explore Pro Plans</span>
                </button>

                <button
                  onClick={() => {
                    setShowProModal(false);
                    // Dismiss for rest of today
                    const now = Date.now();
                    const history = [now, now, now];
                    localStorage.setItem('lha_pro_popup_history', JSON.stringify(history));
                  }}
                  className="w-full sm:w-auto px-4 py-3.5 text-xs text-slate-400 hover:text-slate-200 font-semibold"
                >
                  Don't show again today
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
