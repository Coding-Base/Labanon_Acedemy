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

export default function StudentDashboard(props: { summary?: DashboardSummary }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  const initialFromState = (location.state as any)?.summary;
  const [summary, setSummary] = useState<DashboardSummary | null>(props.summary ?? initialFromState ?? null);
  const [loadingSummary, setLoadingSummary] = useState(!summary);

  const base = '/student';
  const loggedOutRef = useRef(false);

  const doLogout = useCallback((reason?: string) => {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    console.warn('Logging out:', reason || 'user initiated');
    navigate('/login', { replace: true });
  }, [navigate]);

  // Define ExclamationCircle component at the top
  const ExclamationCircle = (props: any) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        const status = error?.response?.status;
        if (status === 401) {
          // Token expired — clear it but don't force logout
          // Let components handle their own auth errors
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          console.warn('[StudentDashboard] 401 error - token cleared, components should handle UI');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [doLogout]);

  useEffect(() => {
    let mounted = true;
    async function loadSummary() {
      if (summary) { setLoadingSummary(false); return; }
      const token = localStorage.getItem('access');
      if (!token) { doLogout('no token found'); return; }
      setLoadingSummary(true);
      try {
        const res = await axios.get(`${API_BASE}/dashboard/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted) return;
        setSummary(res.data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard summary:', err);
        if (err?.response?.status === 401) doLogout('fetch summary 401');
        else doLogout('failed to fetch summary');
      } finally { if (mounted) setLoadingSummary(false); }
    }
    loadSummary();
    return () => { mounted = false; };
  }, [props.summary, location.state, doLogout, summary]);

  if (loadingSummary) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
  
  if (!summary) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to load dashboard</h3>
        <p className="text-gray-600 mb-4">Please try again or contact support</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const navItems = [
    { path: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
    { path: 'courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
    { path: 'cbt', label: 'CBT & Exams', icon: <FileText className="w-5 h-5" /> },
    { path: 'cart', label: 'Shopping Cart', icon: <ShoppingCart className="w-5 h-5" /> },
    { path: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
    { path: 'progress', label: 'Progress', icon: <TrendingUp className="w-5 h-5" /> },
    { path: 'certificates', label: 'Certificates', icon: <Award className="w-5 h-5" /> },
    { path: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
    { path: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }
  ];

  const stats = [
    { title: 'Enrollments', value: summary.enrollments_count, icon: <BookOpen className="w-6 h-6" />, color: 'from-green-600 to-teal-500', change: '+2 this week', trend: 'up' },
    { title: 'Exam Attempts', value: summary.attempts_count, icon: <FileCheck className="w-6 h-6" />, color: 'from-teal-500 to-green-400', change: '+5 this month', trend: 'up' },
    { title: 'Average Score', value: summary.avg_score ? `${summary.avg_score}%` : '—', icon: <Target className="w-6 h-6" />, color: 'from-green-500 to-emerald-400', change: '↑ 8% from last month', trend: 'up' },
    { title: 'Completed Courses', value: summary.completed_courses || 0, icon: <CheckCircle className="w-6 h-6" />, color: 'from-orange-500 to-amber-400', change: '1 in progress', trend: 'neutral' },
    { title: 'Study Time', value: `${summary.total_study_time || 0}h`, icon: <Clock className="w-6 h-6" />, color: 'from-green-500 to-teal-400', change: '12h this week', trend: 'up' },
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
    { title: 'Take Practice Test', icon: <FileText className="w-5 h-5" />, color: 'bg-green-100 text-green-600', path: 'cbt' },
    { title: 'Join Live Class', icon: <Users className="w-5 h-5" />, color: 'bg-teal-100 text-teal-600', path: 'courses' },
    { title: 'Download Materials', icon: <Download className="w-5 h-5" />, color: 'bg-green-100 text-green-600', path: 'courses' },
    { title: 'View Leaderboard', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-amber-100 text-amber-600', path: 'progress' }
  ];

  const isActivePath = (p: string) => {
    const normalized = location.pathname.replace(/\/+$/, '');
    if (p === 'overview') return normalized === base || normalized === `${base}/overview`;
    return normalized === `${base}/${p}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 overflow-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 mr-3 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link to={base} className="flex items-center space-x-3 group">
                <img src={labanonLogo} alt="Lebanon Academy" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Student Dashboard</h1>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={() => setShowMessageModal(true)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Send message"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={() => setShowInbox(true)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Inbox"
              >
                <Mail className="w-5 h-5 text-gray-600" />
              </motion.button>

              <div className="hidden md:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
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
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>
      <UserMessages isOpen={showInbox} onClose={() => setShowInbox(false)} />

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)]">
        <div className="flex h-full gap-6">
          {/* Desktop Sidebar - Sticky and Fixed */}
          <motion.aside 
            initial={{ x: -20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            className="hidden lg:block w-64 flex-shrink-0"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 h-[calc(100vh-8rem)] flex flex-col border border-gray-100">
              {/* User Profile Card */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {summary.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
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
                    <span className="font-semibold text-orange-600">14 days 🔥</span>
                  </div>
                </div>
              </div>

              {/* Navigation - Scrollable */}
              <nav className="flex-1 overflow-y-auto pr-2 -mr-2">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const active = isActivePath(item.path);
                    return (
                      <motion.div 
                        key={item.path} 
                        whileHover={{ x: 5 }} 
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Link
                          to={item.path}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${active 
                            ? 'bg-gradient-to-r from-green-50 to-teal-50 text-green-700 border-l-4 border-green-500 shadow-sm' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'}`}
                        >
                          <div className={`${active ? 'text-green-600' : 'text-gray-500 group-hover:text-green-500'}`}>
                            {item.icon}
                          </div>
                          <span className="font-medium">{item.label}</span>
                          {active && <ChevronRight className="w-4 h-4 ml-auto text-green-500" />}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>

              {/* Upgrade Button */}
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }} 
                whileTap={{ scale: 0.98 }} 
                className="mt-6 w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all shadow-md"
              >
                Upgrade to Pro
              </motion.button>
            </div>
          </motion.aside>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="lg:hidden fixed inset-0 bg-black z-40"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.aside 
                  initial={{ x: -300, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  exit={{ x: -300, opacity: 0 }} 
                  transition={{ type: "spring", damping: 25 }}
                  className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                    <button 
                      onClick={() => setSidebarOpen(false)} 
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <Link 
                        key={item.path} 
                        to={item.path} 
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-green-600"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="text-gray-500">{item.icon}</div>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button 
                        onClick={() => doLogout('user clicked logout (mobile)')} 
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium hover:shadow-md"
                      >
                        Logout
                      </button>
                    </div>
                  </nav>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main Content Area - SCROLL FIX APPLIED HERE */}
          <div className="flex-1 min-h-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="bg-white rounded-2xl shadow-lg h-full flex flex-col overflow-hidden border border-gray-100"
            >
              {/* CHANGED FROM overflow-hidden TO overflow-y-auto */}
              <div className="flex-1 overflow-y-auto">
                {/* CHANGED FROM h-full TO min-h-full */}
                <div className="min-h-full p-6">
                  <Routes>
                    {/* Overview */}
                    <Route path="overview" element={
                      <div>
                        {/* Original overview content */}
                        <div className="mb-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Welcome back, <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">{summary.username}</span>! 👋
                              </h1>
                              <p className="text-gray-600 mt-2">Track your progress, access courses, and ace your exams</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg">
                              <PlayCircle className="w-5 h-5 inline mr-2" />
                              Continue Learning
                            </motion.button>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                          {stats.map((stat, index) => (
                            <div key={stat.title} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                                  {stat.icon}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="mb-8">
                          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quickActions.map((action) => (
                              <motion.button
                                key={action.title}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(action.path)}
                                className={`${action.color} p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all border border-transparent hover:border-gray-200`}
                              >
                                {action.icon}
                                <span className="text-sm font-semibold text-center">{action.title}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Recent Activities */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                              View All
                            </button>
                          </div>
                          <div className="space-y-4">
                            {recentActivities.map((activity) => (
                              <div key={activity.id} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    activity.type === 'exam' ? 'bg-green-100' :
                                    activity.type === 'enrollment' ? 'bg-blue-100' :
                                    activity.type === 'assignment' ? 'bg-purple-100' :
                                    activity.type === 'live' ? 'bg-orange-100' :
                                    'bg-yellow-100'
                                  }`}>
                                    {activity.type === 'exam' && <FileText className="w-6 h-6 text-green-600" />}
                                    {activity.type === 'enrollment' && <BookOpen className="w-6 h-6 text-blue-600" />}
                                    {activity.type === 'assignment' && <FileCheck className="w-6 h-6 text-purple-600" />}
                                    {activity.type === 'live' && <Users className="w-6 h-6 text-orange-600" />}
                                    {activity.type === 'certificate' && <Award className="w-6 h-6 text-yellow-600" />}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{activity.title}</p>
                                    <p className="text-sm text-gray-600">{activity.course}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">{activity.time}</p>
                                  {activity.score && (
                                    <p className="text-sm font-bold text-green-600">{activity.score}%</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    } />

                    {/* My Courses Route */}
                    <Route path="courses" element={
                      <div className="h-full">
                        <MyCourses />
                      </div>
                    } />
                    
                    {/* Course Player Route - Removed h-full constraint */}
                    <Route path="courses/:id" element={
                      <div className="w-full">
                        <CoursePlayer />
                      </div>
                    } />
                    
                    {/* Course Detail Route */}
                    <Route path="courses/:id/details" element={
                      <div className="h-full">
                        <CourseDetail />
                      </div>
                    } />

                    {/* Other Routes */}
                    <Route path="cbt" element={
                      <div className="h-full overflow-y-auto pr-2 -mr-2">
                        <CBTPage />
                      </div>
                    } />

                    <Route path="cart" element={
                      <Cart />
                    } />
                    
                    <Route path="payments" element={
                      <div className="h-full overflow-y-auto pr-2 -mr-2">
                        <PaymentsPage />
                      </div>
                    } />
                    
                    <Route path="profile" element={
                      <div className="h-full overflow-y-auto pr-2 -mr-2">
                        <Profile />
                      </div>
                    } />
                    
                    <Route path="progress" element={
                      <div className="h-full overflow-y-auto pr-2 -mr-2">
                        <ProgressPage />
                      </div>
                    } />

                    {/* Certificates Route */}
                    <Route path="certificates" element={
                      <div className="h-full overflow-y-auto pr-2 -mr-2">
                        <div className="text-center py-12">
                          <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Award className="w-10 h-10 text-yellow-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">Your Certificates</h3>
                          <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            View and download your earned certificates. Certificates will appear here after course completion.
                          </p>
                        </div>
                      </div>
                    } />

                    {/* Schedule Route */}
                    <Route path="schedule" element={
                      <div className="h-full overflow-y-auto pr-2 -mr-2">
                        <div className="text-center py-12">
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-10 h-10 text-purple-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">Learning Schedule</h3>
                          <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Plan and track your study schedule. Set reminders and manage your learning timeline.
                          </p>
                        </div>
                      </div>
                    } />

                    {/* Default Dashboard Route */}
                    <Route path="" element={
                      <div className="h-full overflow-y-auto pr-2 -mr-2">
                        <div className="mb-8">
                          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome to Your Dashboard</h2>
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                            <div className="max-w-2xl">
                              <h3 className="text-xl font-bold text-gray-900 mb-4">Start Your Learning Journey</h3>
                              <p className="text-gray-700 mb-6">
                                Welcome to your personalized student dashboard! Here you can track your progress, 
                                access courses, take practice exams, and monitor your performance. Get started by 
                                exploring the different sections from the sidebar.
                              </p>
                              <div className="flex flex-wrap gap-4">
                                <motion.button 
                                  whileHover={{ scale: 1.05 }} 
                                  whileTap={{ scale: 0.95 }} 
                                  onClick={() => navigate('courses')}
                                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg"
                                >
                                  Browse Courses
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.05 }} 
                                  whileTap={{ scale: 0.95 }} 
                                  onClick={() => navigate('cbt')}
                                  className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl font-semibold hover:border-blue-500 hover:shadow-md"
                                >
                                  Take a Practice Test
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    } />

                    {/* 404 Route */}
                    <Route path="*" element={
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Page Not Found</h3>
                          <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                          <button 
                            onClick={() => navigate('/student')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                          >
                            Go to Dashboard
                          </button>
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

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => {
            const active = isActivePath(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex flex-col items-center p-2 flex-1 ${active ? 'text-blue-600' : 'text-gray-600'}`}
              >
                <div className={`${active ? 'text-blue-600' : 'text-gray-500'} mb-1`}>
                  {React.cloneElement(item.icon, { size: 20 })}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
                {active && (
                  <div className="absolute -top-1 w-12 h-1 bg-blue-600 rounded-t-lg"></div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Message Modal */}
      <MessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} />
    </div>
  );
}