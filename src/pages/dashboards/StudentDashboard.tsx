// src/pages/dashboards/StudentDashboard.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// 1. USE SECURE API INSTANCE
import api from '../../utils/axiosInterceptor';
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
  X 
} from 'lucide-react';
import labanonLogo from '../labanonlogo.png';
import MyCourses from '../MyCourses';
import CBTPage from '../CBT';
import PaymentsPage from '../Payments';
import Profile from '../Profile';
import Cart from '../Cart';
import UserMessages from '../../components/UserMessages';
import ProgressPage from '../../components/cbt/ProgressPage';
import CoursePlayer from '../CoursePlayer';
import CourseDetail from '../CourseDetail';
import MessageModal from '../../components/MessageModal';
import CertificatesPage from '../CertificatesPage';
import SchedulePage from '../../components/SchedulePage';
import GospelVideoModal from '../../components/GospelVideoModal';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

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

  const base = '/student';
  const loggedOutRef = useRef(false);

  const doLogout = useCallback((reason?: string) => {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login', { replace: true });
  }, [navigate]);

  // --- ALGORITHMS ---

  // 1. Calculate Consecutive Days Streak
  const calculateStreak = (activities: string[]) => {
    if (!activities.length) return 0;
    
    // Sort dates descending
    const sortedDates = activities
      .map(d => new Date(d).setHours(0,0,0,0))
      .sort((a, b) => b - a);
    
    // Remove duplicates
    const uniqueDates = [...new Set(sortedDates)];
    
    let currentStreak = 0;
    const today = new Date().setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if activity started today or yesterday
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
        // 1. Fetch Basic Info
        const [userRes, summaryRes] = await Promise.all([
          api.get('/users/me/'),
          api.get('/dashboard/')
        ]);

        if (!mounted) return;

        const userData = userRes.data;
        const dashData = summaryRes.data;
        
        setSummary({ ...dashData, ...userData });

        // 1a. Member Since
        const joinDate = new Date(userData.date_joined || new Date());
        setMemberSince(joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

        // 2. Fetch Detailed Data for Algorithms
        // Using correct attempt-list route
        const [attemptsRes, enrollmentsRes] = await Promise.all([
          api.get('/cbt/attempt-list/', { params: { page_size: 100 } }).catch(() => ({ data: { results: [] } })),
          api.get('/enrollments/', { params: { page_size: 100 } }).catch(() => ({ data: { results: [] } }))
        ]);

        const attempts = attemptsRes.data.results || [];
        const enrollments = enrollmentsRes.data.results || [];

        // --- ALGO 1: STREAK ---
        const activityDates: string[] = [
          ...attempts.map((a: any) => a.started_at),
          ...enrollments.map((e: any) => e.updated_at || e.created_at)
        ].filter(Boolean);
        setStreak(calculateStreak(activityDates));

        // --- ALGO 2: SMART RATING ---
        // Base 3.0 + (0.08 per exam taken), Max 5.0
        const attemptsCount = attempts.length;
        const newRating = Math.min(5.0, 3.0 + (attemptsCount * 0.08));
        setCalculatedRating(parseFloat(newRating.toFixed(2)));

        // --- ALGO 3: REAL STUDY HOURS ---
        // Sum of CBT 'time_taken_seconds' + (Course Progress * estimated duration)
        const examSeconds = attempts.reduce((acc: number, curr: any) => acc + (curr.time_taken_seconds || 0), 0);
        const examHours = examSeconds / 3600;

        const courseHours = enrollments.reduce((acc: number, curr: any) => {
          const progress = parseFloat(curr.progress || 0);
          // If course duration unknown, assume 5 hours avg per course
          const duration = parseFloat(curr.course?.duration || 5); 
          return acc + ((progress / 100) * duration);
        }, 0);

        setRealStudyHours(parseFloat((examHours + courseHours).toFixed(1)));

        // --- ALGO 4: GLOBAL LEADERBOARD & RANK ---
        // Fetch real leaderboard data from backend
        let leaderboardData: LeaderboardUser[] = [];
        try {
          const leaderboardRes = await api.get('/cbt/leaderboard/', { params: { limit: 50 } }).catch(() => null);
          if (leaderboardRes?.data) {
            const data = Array.isArray(leaderboardRes.data) ? leaderboardRes.data : (leaderboardRes.data.results || []);
            leaderboardData = data.map((item: any, idx: number) => ({
              id: item.id || item.user_id || idx,
              name: item.username || item.user?.username || item.name || 'Student',
              score: item.avg_score !== undefined ? item.avg_score : (item.high_score || item.best_score || 0),
              exams_taken: item.attempts_count !== undefined ? item.attempts_count : (item.exams_taken || 0),
              avatar_initial: (item.name || item.username || item.user?.username || 'S').charAt(0).toUpperCase()
            }));
            console.log('Student leaderboard data:', leaderboardData); // Debug log
          }
        } catch (err) {
          console.error('Failed to fetch leaderboard:', err);
        }

        // Current User Best Score
        const myBestScore = attempts.length > 0 
           ? Math.max(...attempts.map((a: any) => parseFloat(a.score || 0))) 
           : 0;

        const currentUserEntry: LeaderboardUser = {
            id: userData.id,
            name: userData.username || 'You',
            score: myBestScore,
            exams_taken: attempts.length,
            avatar_initial: userData.username?.charAt(0).toUpperCase(),
            is_current_user: true
        };

        // Merge real data with current user, Sort, Deduplicate
        const allBoard = [...leaderboardData, currentUserEntry].sort((a, b) => b.score - a.score);
        const uniqueBoard = Array.from(new Map(allBoard.map(item => [item.id, item])).values())
                                .sort((a, b) => b.score - a.score);

        setLeaderboard(uniqueBoard);

        // Find Rank
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

  if (loadingSummary) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading your student portal...</p>
      </div>
    </div>
  );

  const navItems = [
    { path: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
    { path: 'courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
    { path: 'cbt', label: 'CBT & Exams', icon: <FileText className="w-5 h-5" /> },
    { path: 'cart', label: 'Shopping Cart', icon: <ShoppingCart className="w-5 h-5" /> },
    { path: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> }, 
    { path: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
    { path: 'progress', label: 'Progress', icon: <TrendingUp className="w-5 h-5" /> },
    { path: 'certificates', label: 'Certificates', icon: <Award className="w-5 h-5" /> },
    { path: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { path: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }
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

  // --- Sub-Component: Leaderboard Table ---
  const LeaderboardPage = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Global Leaderboard</h2>
          <p className="opacity-90">Top performers across all JAMB CBT Exams</p>
        </div>
        <Trophy className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white opacity-20" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Exams Taken</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">High Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaderboard.map((user, index) => (
              <tr 
                key={user.id} 
                className={`transition-colors ${user.is_current_user ? 'bg-yellow-50 border-l-4 border-yellow-500' : 'hover:bg-gray-50'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {index === 0 && <Crown className="w-5 h-5 text-yellow-500 mr-2" />}
                    {index === 1 && <Crown className="w-5 h-5 text-gray-400 mr-2" />}
                    {index === 2 && <Crown className="w-5 h-5 text-amber-700 mr-2" />}
                    <span className={`font-bold ${index < 3 ? 'text-gray-900' : 'text-gray-500'}`}>#{index + 1}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}>
                      {user.avatar_initial}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name} {user.is_current_user && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-yellow-200 text-yellow-800">You</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {user.exams_taken} Tests
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-yellow-700">
                  {parseFloat(user.score.toFixed(1))} pts
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-yellow-50 overflow-hidden">
      <GospelVideoModal />
      <motion.header 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 mr-3 transition-colors" aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'} aria-expanded={sidebarOpen}>
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
              <Link to={base} className="flex items-center space-x-3 group">
                <img src={labanonLogo} alt="LightHub Academy logo" width={32} height={32} className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
                <div><h1 className="text-lg font-bold text-gray-900">Student Dashboard</h1></div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowMessageModal(true)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Send message">
                <Bell className="w-5 h-5 text-gray-600" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowInbox(true)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Inbox">
                <Mail className="w-5 h-5 text-gray-600" />
              </motion.button>
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">{summary?.username?.charAt(0).toUpperCase()}</div>
                <div><p className="text-sm font-semibold text-gray-900">{summary?.username}</p><p className="text-xs text-gray-500">Student Account</p></div>
              </div>
              <motion.button onClick={() => doLogout('user clicked logout')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all">
                <LogOut className="w-4 h-4" /><span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>
      
      <UserMessages isOpen={showInbox} onClose={() => setShowInbox(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)]">
        <div className="flex h-full gap-6">
          
          <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 h-[calc(100vh-8rem)] flex flex-col border border-gray-100">
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {summary?.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{summary?.username}</h3>
                    <p className="text-sm text-gray-500">Student</p>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className={`w-3 h-3 ${i <= Math.round(calculatedRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                      <span className="ml-1 text-xs font-semibold">{calculatedRating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-semibold">{memberSince || '...'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Learning Streak</span>
                    <span className="font-semibold text-orange-600">{streak} days 🔥</span>
                  </div>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto pr-2 -mr-2">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const active = isActivePath(item.path);
                    return (
                      <motion.div key={item.path} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Link to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-gradient-to-r from-yellow-50 to-yellow-50 text-yellow-700 border-l-4 border-yellow-500 shadow-sm' : 'text-gray-700 hover:bg-gray-50 hover:text-yellow-600'}`}>
                          <div className={`${active ? 'text-yellow-700' : 'text-gray-500 group-hover:text-yellow-500'}`}>{item.icon}</div>
                          <span className="font-medium">{item.label}</span>
                          {active && <ChevronRight className="w-4 h-4 ml-auto text-yellow-600" />}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>

              <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} className="mt-6 w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all shadow-md">
                Upgrade to Pro
              </motion.button>
            </div>
          </motion.aside>

          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 bg-black z-40" onClick={() => setSidebarOpen(false)} />
                <motion.aside initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl p-6">
                  <div className="flex items-center justify-between mb-8"><h2 className="text-lg font-bold text-gray-900">Menu</h2><button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-6 h-6" /></button></div>
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <Link key={item.path} to={item.path} className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-yellow-600" onClick={() => setSidebarOpen(false)}>
                        <div className="text-gray-500">{item.icon}</div><span>{item.label}</span>
                      </Link>
                    ))}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button onClick={() => doLogout('user clicked logout (mobile)')} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium hover:shadow-md">Logout</button>
                    </div>
                  </nav>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <div className="flex-1 min-h-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg h-full flex flex-col overflow-hidden border border-gray-100">
              <div className="flex-1 overflow-y-auto">
                <div className="min-h-full p-6">
                  <Routes>
                    <Route path="overview" element={
                      <div>
                        <div className="mb-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back, <span className="bg-gradient-to-r from-yellow-600 to-yellow-600 bg-clip-text text-transparent">{summary?.username}</span>! 👋</h1>
                              <p className="text-gray-600 mt-2">Track your progress, access courses, and ace your exams</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-lg">
                              <PlayCircle className="w-5 h-5 inline mr-2" />Continue Learning
                            </motion.button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                          {stats.map((stat) => (
                            <div key={stat.title} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                                  <div className="text-white">{stat.icon}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-2">
                            <div className="mb-8">
                              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
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
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center"><Trophy className="w-5 h-5 text-yellow-500 mr-2" /> Top Scorers</h3>
                                <Link to="/student/leaderboard" className="text-sm text-yellow-600 hover:underline">See More</Link>
                              </div>
                              <div className="space-y-4">
                                {leaderboard.slice(0, 3).map((user, idx) => (
                                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center">
                                      <span className={`font-bold mr-3 ${idx===0?'text-yellow-600':idx===1?'text-gray-500':'text-amber-700'}`}>#{idx+1}</span>
                                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 mr-2">{user.avatar_initial}</div>
                                      <div className="text-sm font-semibold">{user.name}</div>
                                    </div>
                                    <div className="text-sm font-bold text-yellow-700">{parseFloat(user.score.toFixed(1))}</div>
                                  </div>
                                ))}
                                {leaderboard.length === 0 && <div className="text-sm text-gray-500 text-center py-4">No data available</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    } />

                    <Route path="courses" element={<div className="h-full"><MyCourses /></div>} />
                    <Route path="courses/:id" element={<div className="w-full"><CoursePlayer /></div>} />
                    <Route path="courses/:id/details" element={<div className="h-full"><CourseDetail /></div>} />
                    <Route path="cbt" element={<div className="h-full overflow-y-auto pr-2 -mr-2"><CBTPage /></div>} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="payments" element={<div className="h-full overflow-y-auto pr-2 -mr-2"><PaymentsPage /></div>} />
                    <Route path="profile" element={<div className="h-full overflow-y-auto pr-2 -mr-2"><Profile /></div>} />
                    <Route path="progress" element={<div className="h-full overflow-y-auto pr-2 -mr-2"><ProgressPage /></div>} />
                    <Route path="leaderboard" element={<LeaderboardPage />} />
                    <Route path="certificates" element={<div className="h-full overflow-y-auto pr-2 -mr-2"><CertificatesPage /></div>} />
                    <Route path="schedule" element={
                        <div className="h-full overflow-y-auto pr-2 -mr-2">
                            <SchedulePage userRole="student" />
                        </div>
                    } />
                    
                    <Route path="" element={<div className="h-full flex items-center justify-center"><p className="text-gray-500">Redirecting...</p></div>} />
                    <Route path="*" element={
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Page Not Found</h3>
                          <button onClick={() => navigate('/student')} className="px-6 py-2 bg-yellow-600 text-white rounded-lg">Go to Dashboard</button>
                        </div>
                      </div>
                    } />
                  </Routes>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30 flex justify-around items-center h-16">
        {navItems.slice(0, 5).map((item) => {
          const active = isActivePath(item.path);
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center p-2 flex-1 ${active ? 'text-yellow-600' : 'text-gray-600'}`}>
              <div className={`${active ? 'text-yellow-600' : 'text-gray-500'} mb-1`}>{React.cloneElement(item.icon, { size: 20 })}</div>
              <span className="text-xs font-medium">{item.label}</span>
              {active && <div className="absolute -top-1 w-12 h-1 bg-yellow-600 rounded-t-lg"></div>}
            </Link>
          );
        })}
      </div>

      <MessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} />
      <UserMessages isOpen={showInbox} onClose={() => setShowInbox(false)} />
    </div>
  );
}