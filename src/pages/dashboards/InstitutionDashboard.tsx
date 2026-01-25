import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// 1. IMPORT SECURE API INSTANCE
import api from '../../utils/axiosInterceptor'; 
import useTokenRefresher from '../../utils/useTokenRefresher';
import {
  Home,
  BookOpen,
  Users,
  DollarSign,
  Bell,
  ChevronRight,
  PlusCircle,
  Briefcase,
  GraduationCap,
  Menu,
  X,
  LogOut,
  Mail,
  Building2,
  MapPin,
  Globe,
  Save,
  Upload,
  Loader2,
  CheckCircle,
  CreditCard,
  Calendar,
  Activity,
  TrendingUp,
  PenTool
} from 'lucide-react';

import labanonLogo from '../labanonlogo.png';
import ManageCourses from '../ManageCourses';
import CreateCourse from '../CreateCourse';
import InstitutionDiplomas from '../../components/InstitutionDiplomas';
import InstitutionPortfolio from '../../components/InstitutionPortfolio';
import InstitutionPayments from '../../components/InstitutionPayments';
import PayoutScheduleInfo from '../../components/PayoutScheduleInfo';
import ContactAdminForm from '../../components/ContactAdminForm';
import UserMessages from '../../components/UserMessages';
import SchedulePage from '../../components/SchedulePage';
import InstitutionSignature from '../../components/InstitutionSignature';
import GospelVideoModal from '../../components/GospelVideoModal';

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area
} from 'recharts';

// --- Types ---
interface DashboardSummary {
  username?: string;
  courses_count?: number;
  total_students?: number;
  total_earnings?: number;
  role?: string;
  [k: string]: any;
}

interface FlutterwaveSubAccount {
    id: number;
    bank_code: string;
    account_number: string;
    account_name: string;
    subaccount_id: string;
    is_active: boolean;
}

// --- Main Component ---
export default function InstitutionDashboard(props: { summary?: DashboardSummary }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [contactAdminOpen, setContactAdminOpen] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  // --- Data States ---
  const initialFromState = (location.state as any)?.summary;
  const [summary, setSummary] = useState<DashboardSummary | null>(props.summary ?? initialFromState ?? null);
  const [loadingSummary, setLoadingSummary] = useState(!summary);
  const [accountLocked, setAccountLocked] = useState(false);
  
  // Institution Identity
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [institutionName, setInstitutionName] = useState<string>('');

  // Analytics States
  const [diplomaCount, setDiplomaCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0); 
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // Calculated Totals
  const [calculatedRevenue, setCalculatedRevenue] = useState(0);
  const [calculatedStudents, setCalculatedStudents] = useState(0);

  // Flutterwave State
  const [fwAccount, setFwAccount] = useState<FlutterwaveSubAccount | null>(null);

  const base = '/institution';

  // Logout Function
  const doLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login', { replace: true });
  };

  // keep token refreshed while on institution dashboard
  useTokenRefresher(50)

  // Helper: Process payments for chart
  const processRevenueData = (payments: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const groupedData: Record<string, number> = {};

    payments.forEach(payment => {
      const dateStr = payment.created_at || payment.date;
      if (!dateStr) return;
      
      const date = new Date(dateStr); 
      const monthKey = `${months[date.getMonth()]}`; 
      
      if (payment.status === 'success' || payment.verified === true) {
        const val = parseFloat(payment.creator_amount || payment.amount || '0');
        groupedData[monthKey] = (groupedData[monthKey] || 0) + val;
      }
    });

    return Object.keys(groupedData).map(key => ({
      name: key,
      revenue: groupedData[key]
    })); 
  };

  // Fetch Summary & Analytics
  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      const token = localStorage.getItem('access');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }
      
      if (!summary) setLoadingSummary(true);
      setLoadingAnalytics(true);

      try {
        // 1. Fetch User Data first to get ID for filtering
        const userRes = await api.get('/users/me/');
        const userId = userRes.data.id;

        // 2. Fetch Basic Dashboard Summary
        const summaryRes = await api.get('/dashboard/');
        if (mounted) setSummary(summaryRes.data);
        // account unlocked check
        try {
          const isUnlocked = userRes.data?.is_unlocked === true || userRes.data?.is_unlocked === 'true';
          setAccountLocked(!isUnlocked);
        } catch (e) {
          setAccountLocked(false);
        }

        // 3. Fetch Institution Profile
        let currentInstId = null;
        try {
            const instRes = await api.get('/institutions/my_institution/');
            if (mounted) {
                setInstitutionId(instRes.data.id);
                setInstitutionName(instRes.data.name);
                currentInstId = instRes.data.id;
            }
        } catch (instErr: any) {
            console.warn("Institution profile not found or error:", instErr);
        }

        // 4. Parallel Fetch
        const [diplomaRes, paymentsRes, fwRes, coursesRes] = await Promise.all([
            api.get('/diploma-enrollments/'), 
            api.get('/payments/', { 
                params: { 
                    page: 1, 
                    page_size: 100,
                    course__institution: currentInstId 
                } 
            }).catch(() => ({ data: { results: [] } })), 
            api.get('/flutterwave-subaccounts/'),
            api.get('/courses/', { params: { creator: userId, page_size: 1 } })
        ]);

        if (mounted) {
            // Handle Flutterwave Account
            if (fwRes.data) {
                if (Array.isArray(fwRes.data)) {
                    setFwAccount(fwRes.data.length > 0 ? fwRes.data[0] : null);
                } else if (typeof fwRes.data === 'object' && fwRes.data !== null) {
                    setFwAccount(fwRes.data);
                }
            }

            // Handle Diploma Count
            if (diplomaRes.data) {
                const count = Array.isArray(diplomaRes.data) 
                    ? diplomaRes.data.length 
                    : (diplomaRes.data.count || 0);
                setDiplomaCount(count);
            }

            // Handle Course Count
            if (coursesRes.data) {
                const count = coursesRes.data.count !== undefined 
                    ? coursesRes.data.count 
                    : (Array.isArray(coursesRes.data) ? coursesRes.data.length : 0);
                setCourseCount(count);
            }

            // Handle Payments & Revenue Calculation
            if (paymentsRes.data) {
                const paymentList = Array.isArray(paymentsRes.data) 
                    ? paymentsRes.data 
                    : (paymentsRes.data.results || []);
                
                setRevenueData(processRevenueData(paymentList));
                setRecentActivity(paymentList.slice(0, 5));

                let totalRev = 0;
                const uniqueStudents = new Set();

                paymentList.forEach((p: any) => {
                    if (p.status === 'success' || p.verified === true) {
                        totalRev += parseFloat(p.creator_amount || '0');
                        if (p.user) uniqueStudents.add(p.user);
                    }
                });

                setCalculatedRevenue(totalRev);
                const backendStudents = summaryRes.data.students_count || 0;
                setCalculatedStudents(Math.max(uniqueStudents.size, backendStudents));
            }
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        if (mounted) {
          setLoadingSummary(false);
          setLoadingAnalytics(false);
        }
      }
    }
    
    loadDashboardData();
    return () => { mounted = false; };
  }, [navigate, props.summary]);

  if (loadingSummary) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-600" />
        <span className="ml-3 text-gray-600">Loading Dashboard...</span>
    </div>
  );

  const navItems = [
    { path: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
    { path: 'courses', label: 'Online Courses', icon: <BookOpen className="w-5 h-5" /> },
    { path: 'diploma', label: 'Onsite Diplomas', icon: <GraduationCap className="w-5 h-5" /> },
    { path: 'portfolio', label: 'My Portfolio', icon: <Briefcase className="w-5 h-5" /> },
    { path: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
    { path: 'signature', label: 'Signature', icon: <PenTool className="w-5 h-5" /> },
    { path: 'payments', label: 'Payments & Payouts', icon: <DollarSign className="w-5 h-5" /> },
  ];

  const isActivePath = (p: string) => {
    const normalized = location.pathname.replace(/\/+$/, '');
    if (p === 'overview') return normalized === base || normalized === `${base}/overview`;
    return normalized === `${base}/${p}` || normalized.includes(`/${p}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <GospelVideoModal />
      {accountLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="bg-white rounded-lg shadow-lg p-6 z-50 max-w-md mx-4">
            <h3 className="text-lg font-bold mb-2">Account Locked</h3>
            <p className="text-sm text-gray-600 mb-4">Your institution account is locked. Please activate your account to access the dashboard.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => navigate(`/activate?type=account&return_to=${encodeURIComponent('/institution/overview')}`)} className="px-4 py-2 bg-yellow-600 text-white rounded">Unlock Account</button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3 transition-colors">
                {sidebarOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
              </button>
              <Link to={base} className="flex items-center space-x-3 group">
                <div className="bg-yellow-50 p-1.5 rounded-lg group-hover:bg-yellow-100 transition-colors">
                    <img src={labanonLogo} alt="Lebanon Academy" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">Institution Portal</h1>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {summary?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="pr-2">
                  <p className="text-sm font-semibold text-gray-900 leading-none">{institutionName || summary?.username}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">Admin</p>
                </div>
              </div>
              <button onClick={() => setContactAdminOpen(true)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative" title="Contact Admin">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <button onClick={() => setShowInbox(true)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Inbox">
                <Mail className="w-5 h-5" />
              </button>
              <div className="h-6 w-px bg-gray-300 mx-1"></div>
              <button onClick={doLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={accountLocked ? { filter: 'blur(4px)', pointerEvents: 'none' } : {}}>
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar - Desktop */}
          <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sticky top-24">
              <div className="mb-6 px-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Main Menu</h3>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = isActivePath(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        active
                          ? 'bg-yellow-50 text-yellow-700 font-medium shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className={`${active ? 'text-yellow-600' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`}>{item.icon}</div>
                      <span>{item.label}</span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-500"></div>}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-100 px-2">
                <div className="bg-gradient-to-br from-yellow-50 to-blue-50 rounded-xl p-4 border border-yellow-100">
                  <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Need Help?</h4>
                  <p className="text-xs text-yellow-600 mb-3 leading-relaxed">Contact our support team for assistance with your account.</p>
                  <button onClick={() => setContactAdminOpen(true)} className="w-full text-xs bg-white text-yellow-700 px-3 py-2 rounded-lg border border-yellow-200 font-medium hover:shadow-sm transition-shadow">Contact Support</button>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
                <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-50 bg-black" onClick={() => setSidebarOpen(false)} />
                <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6 text-gray-500" /></button>
                    </div>
                    <nav className="space-y-2 flex-1">
                    {navItems.map((item) => (
                        <Link key={item.path} to={item.path} className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700" onClick={() => setSidebarOpen(false)}>
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                    </nav>
                </motion.aside>
                </>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
                <Routes>
                  {/* Overview Tab */}
                  <Route path="overview" element={
                    <div className="space-y-6">
                      {/* Welcome Banner */}
                      <div className="bg-gradient-to-r from-yellow-700 to-blue-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
                            <p className="text-yellow-100 text-lg">Welcome back, {institutionName || summary?.username}!</p>
                            <div className="mt-6 flex items-center gap-3">
                                <span className="bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full flex items-center border border-white/30">
                                    <CheckCircle className="w-4 h-4 mr-2" /> Verified Institution
                                </span>
                                <span className="bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full flex items-center border border-white/30">
                                    <Activity className="w-4 h-4 mr-2" /> System Active
                                </span>
                            </div>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12"></div>
                        <Globe className="absolute -right-6 -bottom-10 w-64 h-64 text-white opacity-10" />
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { 
                            title: 'Total Students', 
                            value: calculatedStudents, 
                            icon: <Users className="w-6 h-6 text-white" />, 
                            bg: 'bg-blue-500',
                            trend: '+12% this month' 
                          },
                          { 
                            title: 'Online Courses', 
                            value: courseCount, 
                            icon: <BookOpen className="w-6 h-6 text-white" />, 
                            bg: 'bg-yellow-500',
                            trend: 'Active Catalog' 
                          },
                          { 
                            title: 'Diplomas Sold', 
                            value: diplomaCount, 
                            icon: <GraduationCap className="w-6 h-6 text-white" />, 
                            bg: 'bg-purple-500',
                            trend: 'Lifetime Sales' 
                          }, 
                          { 
                            title: 'Total Revenue', 
                            value: `₦${calculatedRevenue.toLocaleString()}`, 
                            icon: <DollarSign className="w-6 h-6 text-white" />, 
                            bg: 'bg-blue-600',
                            trend: 'Net Earnings' 
                          }
                        ].map((stat, index) => (
                          <motion.div 
                            key={index}
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group"
                          >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-1 group-hover:text-yellow-700 transition-colors">{stat.value}</h3>
                                </div>
                                <div className={`${stat.bg} p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <div className="flex items-center text-xs text-gray-400 font-medium">
                                <TrendingUp className="w-3 h-3 mr-1 text-yellow-500" />
                                {stat.trend}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Revenue Chart */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Revenue Analytics</h3>
                                <select className="text-sm border-gray-200 border rounded-lg px-2 py-1 text-gray-600 outline-none focus:border-yellow-500">
                                    <option>Last 6 Months</option>
                                    <option>This Year</option>
                                </select>
                            </div>
                            <div className="h-80 w-full">
                            {loadingAnalytics ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-yellow-600" />
                                    <span>Gathering financial data...</span>
                                </div>
                            ) : revenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₦${val/1000}k`} tick={{fontSize: 12, fill: '#9ca3af'}} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                                        formatter={(val: number) => [`₦${val.toLocaleString()}`, 'Revenue']} 
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <DollarSign className="w-10 h-10 text-gray-300 mb-2" />
                                    <p className="text-gray-500 font-medium">No revenue data available yet.</p>
                                    <p className="text-sm text-gray-400">Start selling courses to see analytics.</p>
                                </div>
                            )}
                            </div>
                        </div>

                        {/* Recent Activity / Quick Actions */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                                
                                <div className="space-y-3">
                                   <Link to="/institution/courses" className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                                    <button onClick={() => setCreatingCourse(true)} className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-yellow-200 hover:bg-yellow-50 transition-all group">
                                        <div className="flex items-center">
                                            <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600 mr-3 group-hover:bg-yellow-200">
                                                <PlusCircle className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium text-gray-700 group-hover:text-yellow-800">Create New Course</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-600" />
                                    </button>
                                    </Link>
                                    <Link to="/institution/diploma" className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                                        <div className="flex items-center">
                                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3 group-hover:bg-blue-200">
                                                <GraduationCap className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium text-gray-700 group-hover:text-blue-800">Manage Diplomas</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                    </Link>
                                    <Link to="/institution/portfolio" className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group">
                                        <div className="flex items-center">
                                            <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mr-3 group-hover:bg-purple-200">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium text-gray-700 group-hover:text-purple-800">Update Portfolio</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                                    </Link>
                                </div>
                            </div>

                            {/* Recent Activity Feed */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Sales</h3>
                                <div className="space-y-4">
                                    {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                                                    {activity.user?.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 truncate w-32">{activity.course_title || activity.diploma_title || 'Item'}</p>
                                                    <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-yellow-600">+₦{Number(activity.creator_amount).toLocaleString()}</span>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-500 text-center py-4">No recent activity.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  } />

                  {/* Courses Management */}
                  <Route path="courses" element={
                    <div>
                      {creatingCourse ? (
                        <div className="space-y-4">
                          <button
                            onClick={() => setCreatingCourse(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold flex items-center gap-2"
                          >
                            ← Back to Courses
                          </button>
                          <CreateCourse />
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Online Courses</h2>
                            <button
                              onClick={() => setCreatingCourse(true)}
                              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 shadow-md transition-all"
                            >
                              <PlusCircle className="w-4 h-4 mr-2" /> New Course
                            </button>
                          </div>
                          <ManageCourses 
                            uploadCourseImageHandler={async () => { alert("Image upload handled in detail view"); }}
                            uploadLessonMediaHandler={async () => {}}
                            isInstitution={true}
                          />
                        </div>
                      )}
                    </div>
                  } />
                  <Route path="courses/create" element={<CreateCourse />} />
                  <Route path="courses/manage" element={<CreateCourse />} />

                  {/* Diploma Management */}
                  <Route path="diploma" element={<InstitutionDiplomas />} />

                  {/* Portfolio Management */}
                  <Route path="portfolio" element={
                    institutionId ? (
                      <InstitutionPortfolio institutionId={institutionId} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p>Loading Institution Profile...</p>
                      </div>
                    )
                  } />

                  {/* Schedule Page */}
                  <Route path="schedule" element={<div className="p-4"><SchedulePage userRole="institution" /></div>} />

                  {/* Signature Page */}
                  <Route path="signature" element={<InstitutionSignature />} />

                  {/* Payments & Flutterwave */}
                  <Route path="payments" element={
                    <div>
                        <PayoutScheduleInfo variant="banner" userRole="institution" />
                        
                        <div className="mt-6">
                            <InstitutionPayments />
                        </div>
                        
                        {/* Flutterwave Section */}
                        {fwAccount ? (
                            <div className="mt-8 mb-6 bg-white rounded-lg shadow p-5 border border-yellow-200 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-yellow-100 rounded-full">
                                        <CreditCard className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Flutterwave Subaccount</h3>
                                        <p className="text-xs text-yellow-600 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Active & Connected</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm bg-gray-50 p-4 rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs uppercase tracking-wide">Account Name</span>
                                        <span className="font-semibold text-gray-900 text-lg truncate" title={fwAccount.account_name}>{fwAccount.account_name}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs uppercase tracking-wide">Account Number</span>
                                        <span className="font-semibold text-gray-900 text-lg font-mono">{fwAccount.account_number}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs uppercase tracking-wide">Bank Code</span>
                                        <span className="font-semibold text-gray-900 text-lg font-mono">{fwAccount.bank_code}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8 mb-6 bg-orange-50 rounded-lg p-5 border border-orange-200">
                                <h3 className="font-bold text-orange-800">Payment Setup Required</h3>
                                <p className="text-sm text-orange-700 mt-1">
                                    You haven't set up a payout account yet. Please create a Flutterwave subaccount in the Payments tab to receive earnings.
                                </p>
                            </div>
                        )}
                    </div>
                  } />

                  {/* Default */}
                  <Route path="" element={
                    <div className="p-12 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Building2 className="w-10 h-10 text-yellow-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Portal</h2>
                        <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">Manage your digital presence, onsite diplomas, and online courses all in one place. Get started by viewing your overview.</p>
                        <button onClick={() => navigate('overview')} className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-lg">Go to Dashboard Overview</button>
                    </div>
                  } />

                </Routes>
              </motion.div>
          </div>
        </div>
      </div>

      <ContactAdminForm isOpen={contactAdminOpen} onClose={() => setContactAdminOpen(false)} />
      <UserMessages isOpen={showInbox} onClose={() => setShowInbox(false)} />
    </div>
  );
}