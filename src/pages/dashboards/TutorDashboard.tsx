// src/pages/dashboards/TutorDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Home,
  BookOpen,
  Users,
  BarChart3,
  DollarSign,
  Calendar,
  Bell,
  ChevronRight,
  PlusCircle,
  Sparkles,
  Star,
  Menu,
  X,
  Video,
  Settings
} from 'lucide-react';
import labanonLogo from '../labanonlogo.png';
import ManageCourses from '../ManageCourses';
import ManageCourseDetail from '../ManageCourseDetail';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api';

interface DashboardSummary {
  username?: string;
  courses_count?: number;
  total_students?: number;
  total_earnings?: number;
  avg_rating?: number;
  role?: string;
  [k: string]: any;
}

interface TutorDashboardProps {
  summary?: DashboardSummary;
}

export default function TutorDashboard(props: TutorDashboardProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // attempt to get summary from props or location.state
  const initialFromState = (location.state as any)?.summary;
  const [summary, setSummary] = useState<DashboardSummary | null>(props.summary ?? initialFromState ?? null);
  const [loadingSummary, setLoadingSummary] = useState(!summary);

  // base path for this page (top-level is /tutor)
  const base = '/tutor';

  useEffect(() => {
    let mounted = true;
    async function loadSummary() {
      if (summary) {
        setLoadingSummary(false);
        return;
      }
      const token = localStorage.getItem('access');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      setLoadingSummary(true);
      try {
        const res = await axios.get(`${API_BASE}/dashboard/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard summary:', err);
      } finally {
        if (mounted) setLoadingSummary(false);
      }
    }
    loadSummary();
    return () => {
      mounted = false;
    };
  }, [props.summary, location.state, summary]);

  if (loadingSummary) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  if (!summary) return <div className="min-h-screen flex items-center justify-center">Unable to load dashboard.</div>;

  const navItems = [
    { path: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
    { path: 'manage', label: 'Manage Courses', icon: <BookOpen className="w-5 h-5" /> },
    { path: 'students', label: 'Students', icon: <Users className="w-5 h-5" /> },
    { path: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { path: 'earnings', label: 'Earnings', icon: <DollarSign className="w-5 h-5" /> },
    { path: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
  ];

  const stats = [
    {
      title: 'Total Courses',
      value: summary?.courses_count || 0,
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-400',
      change: '+2 this month',
      trend: 'up'
    },
    {
      title: 'Total Students',
      value: summary?.total_students || 0,
      icon: <Users className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-400',
      change: '+45 this month',
      trend: 'up'
    },
    {
      title: 'Total Earnings',
      value: `₦${(summary?.total_earnings || 0).toLocaleString()}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-400',
      change: '↑ 15% from last month',
      trend: 'up'
    },
    {
      title: 'Average Rating',
      value: summary?.avg_rating ? summary.avg_rating.toFixed(1) : '4.8',
      icon: <Star className="w-6 h-6" />,
      color: 'from-amber-500 to-yellow-400',
      change: '124 reviews',
      trend: 'neutral'
    },
  ];

  const quickActions = [
    { title: 'Create New Course', icon: <PlusCircle className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600', path: 'manage' },
    { title: 'Schedule Live Class', icon: <Calendar className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600', path: 'schedule' },
    { title: 'Go Live', icon: <Sparkles className="w-5 h-5" />, color: 'bg-green-100 text-green-600', path: 'overview' }
  ];

  // helper: isActivePath under /tutor
  const isActivePath = (p: string) => {
    const normalized = location.pathname.replace(/\/+$/, '');
    if (p === 'overview') return normalized === base || normalized === `${base}/overview`;
    return normalized === `${base}/${p}` || normalized.includes(`/${p}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top Header */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3">
                {sidebarOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
              </button>
              <Link to={base} className="flex items-center space-x-3">
                <img src={labanonLogo} alt="Lebanon Academy" className="w-8 h-8 object-contain" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Tutor Dashboard</h1>
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
                  {summary?.username?.charAt(0).toUpperCase() || 'T'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{summary?.username || 'Tutor'} — Tutor</p>
                  <p className="text-xs text-gray-500">Certified Tutor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Desktop */}
          <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {summary?.username?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{summary?.username || 'Tutor'}</h3>
                    <p className="text-sm text-gray-500">Certified Tutor</p>
                    <div className="flex items-center mt-1">
                      {[1,2,3,4,5].map((i) => (<Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />))}
                      <span className="ml-1 text-xs font-semibold">{summary?.avg_rating ?? 4.8}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const active = isActivePath(item.path);
                  return (
                    <motion.div key={item.path} whileHover={{ x: 5 }}>
                      <Link to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${ active ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-l-4 border-blue-500' : 'text-gray-700 hover:bg-gray-50' }`}>
                        <div className={`${active ? 'text-blue-600' : 'text-gray-500'}`}>{item.icon}</div>
                        <span className="font-medium">{item.label}</span>
                        {active && <ChevronRight className="w-4 h-4 ml-auto text-blue-500" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow">
                <PlusCircle className="w-5 h-5 inline mr-2" />
                Create New Course
              </motion.button>
            </div>
          </motion.aside>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
              <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold">Menu</h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-2"><X className="w-6 h-6" /></button>
                </div>
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Link key={item.path} to={item.path} className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50" onClick={() => setSidebarOpen(false)}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </motion.aside>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Content Header (tab links) */}
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
                </div>
              </div>
            </motion.div>

            {/* Dynamic Content (nested routes under /tutor) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <Routes>
                  {/* Overview now contains welcome, quick actions, stats */}
                  <Route path="overview" element={
                    <div>
                      <div className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{summary?.username}</span>! 🎓</h1>
                            <p className="text-gray-600 mt-2">Manage your courses, track earnings, and grow your teaching impact</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg">
                              <Sparkles className="w-5 h-5 inline mr-2" />
                              Go Live
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {quickActions.map((action, index) => (
                          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow">
                            <Link to={action.path}>
                              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3`}>{action.icon}</div>
                              <h3 className="font-semibold text-gray-900">{action.title}</h3>
                            </Link>
                          </motion.div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {stats.map((stat, index) => (
                          <motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.08 }} whileHover={{ y: -5 }} className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}><div className="text-white">{stat.icon}</div></div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                <div className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-gray-500'}`}>{stat.change}</div>
                              </div>
                            </div>
                            <h3 className="font-semibold text-gray-900">{stat.title}</h3>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  } />

                  <Route path="manage" element={<ManageCourses />} />
                  <Route path="manage/:id" element={<ManageCourseDetail />} />

                  <Route path="students" element={
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Student Management</h3>
                      <p className="text-gray-600">View and manage all your students</p>
                    </div>
                  } />

                  <Route path="analytics" element={
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                      <p className="text-gray-600">Detailed analytics and insights</p>
                    </div>
                  } />

                  <Route path="earnings" element={
                    <div className="text-center py-12">
                      <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Earnings Dashboard</h3>
                      <p className="text-gray-600">Track your earnings and withdrawals</p>
                    </div>
                  } />

                  <Route path="schedule" element={
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Schedule Management</h3>
                      <p className="text-gray-600">Manage your teaching schedule</p>
                    </div>
                  } />

                  {/* default landing for /tutor */}
                  <Route path="" element={
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome to Your Tutor Dashboard</h2>
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                        <div className="max-w-2xl">
                          <p className="text-gray-700 mb-6">Start by creating your first course or exploring the different sections from the sidebar.</p>
                          <div className="flex flex-wrap gap-4">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold"><PlusCircle className="w-5 h-5 inline mr-2" />Create New Course</motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl font-semibold"><Video className="w-5 h-5 inline mr-2" />Schedule Live Session</motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  } />
                </Routes>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 4).map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center p-2 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                <div className={`${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{item.icon}</div>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
