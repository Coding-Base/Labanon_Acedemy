// src/pages/dashboards/StudentDashboard.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
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
  Settings,
  LogOut,
  PlayCircle,
  CheckCircle,
  Users,
  Star,
  Target,
  FileCheck,
  Download,
  Eye,
  MoreVertical
} from 'lucide-react';
import labanonLogo from '../labanonlogo.png';
import MyCourses from '../MyCourses';
import CBTPage from '../CBT';
import PaymentsPage from '../Payments';
import Profile from '../Profile';
import ProgressPage from '../../components/cbt/ProgressPage';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api';

interface DashboardSummary {
  username: string;
  enrollments_count: number;
  attempts_count: number;
  avg_score: number | null;
  completed_courses: number;
  total_study_time: number;
  rank: number;
  role?: string;
  [k: string]: any;
}

interface StudentDashboardProps {
  summary?: DashboardSummary;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

export default function StudentDashboard(props: StudentDashboardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Try to consume summary from props -> location.state -> fetch
  const initialFromState = (location.state as any)?.summary;
  const [summary, setSummary] = useState<DashboardSummary | null>(props.summary ?? initialFromState ?? null);
  const [loadingSummary, setLoadingSummary] = useState(!summary);

  // base path for this page (top-level is /student)
  const base = '/student';

  // prevent multiple logout redirects
  const loggedOutRef = useRef(false);

  const doLogout = useCallback((reason?: string) => {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;
    // clear tokens & any stored user data
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    // optionally clear other app-specific keys here
    console.warn('Logging out:', reason || 'user initiated');
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    // setup an axios response interceptor to catch 401 globally while this dashboard is mounted
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        const status = error?.response?.status;
        if (status === 401) {
          // token expired or invalid: logout
          doLogout('token expired/unauthorized');
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [doLogout]);

  useEffect(() => {
    let mounted = true;
    async function loadSummary() {
      if (summary) {
        setLoadingSummary(false);
        return;
      }
      const token = localStorage.getItem('access');
      if (!token) {
        // if not logged in, redirect to login
        doLogout('no token found');
        return;
      }
      setLoadingSummary(true);
      try {
        const res = await axios.get(`${API_BASE}/dashboard/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        setSummary(res.data);
      } catch (err: any) {
        // if 401, interceptor will log out; otherwise show console error and navigate to login
        console.error('Failed to fetch dashboard summary:', err);
        if (err?.response?.status === 401) {
          // handled by interceptor, but ensure logout
          doLogout('fetch summary 401');
        } else {
          // optional: show a friendly message, but for now, send user to login as safe fallback
          doLogout('failed to fetch summary');
        }
      } finally {
        if (mounted) setLoadingSummary(false);
      }
    }
    loadSummary();
    return () => { mounted = false; };
  }, [props.summary, location.state, doLogout, summary]);

  if (loadingSummary) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  if (!summary) return <div className="min-h-screen flex items-center justify-center">Unable to load dashboard.</div>;

  const navItems = [
    { path: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
    { path: 'courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
    { path: 'cbt', label: 'CBT & Exams', icon: <FileText className="w-5 h-5" /> },
    { path: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
    { path: 'progress', label: 'Progress', icon: <TrendingUp className="w-5 h-5" /> },
    { path: 'certificates', label: 'Certificates', icon: <Award className="w-5 h-5" /> },
    { path: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
    { path: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }
  ];

  const stats = [
    { title: 'Enrollments', value: summary.enrollments_count, icon: <BookOpen className="w-6 h-6" />, color: 'from-blue-500 to-cyan-400', change: '+2 this week', trend: 'up' },
    { title: 'Exam Attempts', value: summary.attempts_count, icon: <FileCheck className="w-6 h-6" />, color: 'from-purple-500 to-pink-400', change: '+5 this month', trend: 'up' },
    { title: 'Average Score', value: summary.avg_score ? `${summary.avg_score}%` : '—', icon: <Target className="w-6 h-6" />, color: 'from-green-500 to-emerald-400', change: '↑ 8% from last month', trend: 'up' },
    { title: 'Completed Courses', value: summary.completed_courses || 0, icon: <CheckCircle className="w-6 h-6" />, color: 'from-orange-500 to-amber-400', change: '1 in progress', trend: 'neutral' },
    { title: 'Study Time', value: `${summary.total_study_time || 0}h`, icon: <Clock className="w-6 h-6" />, color: 'from-indigo-500 to-blue-400', change: '12h this week', trend: 'up' },
    { title: 'Global Rank', value: `#${summary.rank || '—'}`, icon: <BarChart3 className="w-6 h-6" />, color: 'from-rose-500 to-pink-400', change: '↑ 15 positions', trend: 'up' }
  ];

  const recentActivities = [
    { id: 1, title: 'Completed JAMB Practice Test', course: 'JAMB CBT Masterclass', time: '2 hours ago', type: 'exam', score: 85 },
    { id: 2, title: 'Enrolled in Web Development', course: 'Full Stack Development', time: '1 day ago', type: 'enrollment', instructor: 'John Doe' },
    { id: 3, title: 'Submitted Assignment', course: 'Mathematics SS3', time: '2 days ago', type: 'assignment', status: 'Graded: A' },
    { id: 4, title: 'Live Class Attended', course: 'Physics Practicals', time: '3 days ago', type: 'live', duration: '1.5 hours' },
    { id: 5, title: 'Certificate Earned', course: 'Python Fundamentals', time: '1 week ago', type: 'certificate', level: 'Advanced' }
  ];

  const quickActions = [
    { title: 'Take Practice Test', icon: <FileText className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600', path: 'cbt' },
    { title: 'Join Live Class', icon: <Users className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600', path: 'courses' },
    { title: 'Download Materials', icon: <Download className="w-5 h-5" />, color: 'bg-green-100 text-green-600', path: 'courses' },
    { title: 'View Leaderboard', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-amber-100 text-amber-600', path: 'progress' }
  ];

  // helper: is active tab under /student
  const isActivePath = (p: string) => {
    const normalized = location.pathname.replace(/\/+$/, '');
    if (p === 'overview') return normalized === base || normalized === `${base}/overview`;
    return normalized === `${base}/${p}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
      {/* Top Header (small sticky bar with avatar/notifications) - kept minimal and always visible */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link to={base} className="flex items-center space-x-3">
                <img src={labanonLogo} alt="Lebanon Academy" className="w-8 h-8 object-contain" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Student Dashboard</h1>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>

              <div className="hidden md:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {summary.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{summary.username}</p>
                  <p className="text-xs text-gray-500">Student Account</p>
                </div>
              </div>

              <motion.button
                onClick={() => doLogout('user clicked logout')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Desktop */}
          <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              {/* User Profile Card */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {summary.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{summary.username}</h3>
                    <p className="text-sm text-gray-500">Student</p>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                      ))}
                      <span className="ml-1 text-xs font-semibold">4.8</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-semibold">Jan 2024</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Learning Streak</span>
                    <span className="font-semibold">14 days 🔥</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const active = isActivePath(item.path);

                  return (
                    <motion.div key={item.path} whileHover={{ x: 5 }}>
                      <Link
                        to={item.path} // relative link -> resolves under /student
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${ active ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-l-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50' }`}
                      >
                        <div className={`${active ? 'text-blue-600' : 'text-gray-500'}`}>{item.icon}</div>
                        <span className="font-medium">{item.label}</span>
                        {active && <ChevronRight className="w-4 h-4 ml-auto text-blue-500" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 pt-8 border-t">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Courses Completed</span>
                    <span className="font-semibold">{summary.completed_courses || 0}/12</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: `${((summary.completed_courses || 0) / 12) * 100}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-600">Hours Studied</span>
                    <span className="font-semibold">{summary.total_study_time || 0}h</span>
                  </div>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow">
                Upgrade to Pro
              </motion.button>
            </div>
          </motion.aside>

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold">Menu</h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Link key={item.path} to={item.path} className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50" onClick={() => setSidebarOpen(false)}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <div className="mt-4 pt-4 border-t">
                    <button onClick={() => doLogout('user clicked logout (mobile)')} className="w-full px-4 py-2 rounded-md bg-red-600 text-white">Logout</button>
                  </div>
                </nav>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1">
            {/* Content Header (tab links) - kept minimal and always visible */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {navItems.map((item) => {
                    const active = isActivePath(item.path);
                    return (
                      <Link key={item.path} to={item.path} className={`px-3 py-2 rounded-md font-medium transition-colors ${active ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-3">
                  <motion.button whileHover={{ scale: 1.05 }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* ROUTED CONTENT */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div key={location.pathname} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>
                    <Routes>
                      {/* Overview now contains the welcome cards, quick actions, stats and bottom stats */}
                      <Route path="overview" element={
                        <div>
                          {/* Welcome Header */}
                          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                  Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{summary.username}</span>! 👋
                                </h1>
                                <p className="text-gray-600 mt-2">Track your progress, access courses, and ace your exams</p>
                              </div>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg">
                                <PlayCircle className="w-5 h-5 inline mr-2" />
                                Continue Learning
                              </motion.button>
                            </div>
                          </motion.div>

                          {/* Quick Actions */}
                          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {quickActions.map((action, index) => (
                              <motion.div key={index} variants={fadeInUp} whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow">
                                <Link to={action.path}>
                                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3`}>{action.icon}</div>
                                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                                </Link>
                              </motion.div>
                            ))}
                          </motion.div>

                          {/* Stats Grid */}
                          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {stats.slice(0, 6).map((stat, index) => (
                              <motion.div key={index} variants={scaleIn} whileHover={{ y: -5 }} className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}><div className="text-white">{stat.icon}</div></div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                    <div className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>{stat.change}</div>
                                  </div>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{stat.title}</h3>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className={`h-2 rounded-full bg-gradient-to-r ${stat.color}`} style={{ width: `${Math.min(100, (index+1)*20)}%` }}></div>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>

                          {/* Main Overview Content: Recent activities & deadlines */}
                          <div className="mb-8">
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center"><Clock className="w-5 h-5 mr-2" />Recent Activities</h3>
                                <div className="space-y-4">
                                  {recentActivities.map((activity) => (
                                    <motion.div key={activity.id} whileHover={{ x: 5 }} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${activity.type === 'exam' ? 'bg-blue-100 text-blue-600' : activity.type === 'enrollment' ? 'bg-green-100 text-green-600' : activity.type === 'assignment' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {activity.type === 'exam' && <FileText className="w-5 h-5" />}
                                        {activity.type === 'enrollment' && <BookOpen className="w-5 h-5" />}
                                        {activity.type === 'assignment' && <FileCheck className="w-5 h-5" />}
                                        {activity.type === 'live' && <Users className="w-5 h-5" />}
                                        {activity.type === 'certificate' && <Award className="w-5 h-5" />}
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                        <p className="text-sm text-gray-600">{activity.course} • {activity.time}</p>
                                        {activity.score && (<span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded-full">Score: {activity.score}%</span>)}
                                      </div>
                                      <Eye className="w-5 h-5 text-gray-400" />
                                    </motion.div>
                                  ))}
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
                                <div className="space-y-4">
                                  <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold">Maths Assignment</h4>
                                      <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-800 rounded-full">Due Tomorrow</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">Algebraic Expressions</p>
                                    <div className="flex items-center text-sm text-gray-500"><Clock className="w-4 h-4 mr-1" /> Due: Oct 28, 2024</div>
                                  </div>

                                  <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold">Physics Test</h4>
                                      <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-800 rounded-full">3 days left</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">Mechanics & Properties of Matter</p>
                                    <div className="flex items-center text-sm text-gray-500"><Clock className="w-4 h-4 mr-1" /> Due: Oct 30, 2024</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Stats */}
                          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl p-6">
                              <h3 className="font-semibold mb-2">Learning Streak</h3>
                              <div className="text-3xl font-bold">14 days 🔥</div>
                              <p className="text-sm opacity-90">Keep going! 7 more days to unlock premium</p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6">
                              <h3 className="font-semibold text-gray-900 mb-2">Next Goal</h3>
                              <div className="text-2xl font-bold text-gray-900">Complete 5 courses</div>
                              <div className="mt-2 flex items-center text-sm text-gray-600">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3"><div className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full" style={{ width: '60%' }}></div></div>
                                3/5 completed
                              </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6">
                              <h3 className="font-semibold text-gray-900 mb-2">Peer Comparison</h3>
                              <div className="text-2xl font-bold text-gray-900">Top 15%</div>
                              <p className="text-sm text-gray-600">You're performing better than 85% of students</p>
                            </div>
                          </motion.div>
                        </div>
                      } />

                      {/* nested student routes (relative to /student) */}
                      <Route path="courses" element={<MyCourses />} />
                      <Route path="cbt" element={<CBTPage />} />
                      <Route path="payments" element={<PaymentsPage />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="progress" element={<ProgressPage />} />
                      <Route path="certificates" element={
                        <div className="text-center py-12">
                          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Certificates</h3>
                          <p className="text-gray-600">View and download your earned certificates</p>
                        </div>
                      } />
                      <Route path="schedule" element={
                        <div className="text-center py-12">
                          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Learning Schedule</h3>
                          <p className="text-gray-600">Plan and track your study schedule</p>
                        </div>
                      } />

                      {/* landing for /student */}
                      <Route path="" element={
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome to Your Dashboard</h2>
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                            <div className="max-w-2xl">
                              <h3 className="text-xl font-bold text-gray-900 mb-4">Start Your Learning Journey</h3>
                              <p className="text-gray-700 mb-6">Welcome to your personalized student dashboard! Here you can track your progress, access courses, take practice exams, and monitor your performance. Get started by exploring the different sections from the sidebar.</p>
                              <div className="flex flex-wrap gap-4">
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold">Browse Courses</motion.button>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl font-semibold">Take a Practice Test</motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      } />

                      <Route path="*" element={<div>Not found</div>} />
                    </Routes>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => {
            const active = isActivePath(item.path);
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center p-2 ${active ? 'text-blue-600' : 'text-gray-600'}`}>
                <div className={`${active ? 'text-blue-600' : 'text-gray-500'}`}>{item.icon}</div>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
