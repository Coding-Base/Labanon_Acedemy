// src/pages/dashboards/InstitutionDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// 1. IMPORT SECURE API INSTANCE
import api from '../../utils/axiosInterceptor'; 
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
  Calendar // Added Calendar Icon
} from 'lucide-react';

import labanonLogo from '../labanonlogo.png';
import ManageCourses from '../ManageCourses';
import CreateCourse from '../CreateCourse';
import InstitutionDiplomas from '../../components/InstitutionDiplomas';
import InstitutionPortfolio from '../../components/InstitutionPortfolio';
import InstitutionPayments from '../../components/InstitutionPayments';
import ContactAdminForm from '../../components/ContactAdminForm';
import UserMessages from '../../components/UserMessages';
import SchedulePage from '../../components/SchedulePage'; // Added SchedulePage

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

// Added Interface for Flutterwave
interface FlutterwaveSubAccount {
    id: number;
    bank_code: string;
    account_number: string;
    account_name: string;
    subaccount_id: string;
    is_active: boolean;
}

// --- Sub-Component: Portfolio Editor ---
function PortfolioEditor() {
  const [data, setData] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    images: [] as string[]
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Portfolio saved locally! (Backend integration required)');
  };

  const handlePublish = () => {
    alert(`Portfolio Published! Accessible at /${data.name.replace(/\s+/g, '-').toLowerCase()}/portfolio`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Edit Institution Portfolio</h2>
        <button
          onClick={handlePublish}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          Publish Portfolio
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. Lebanon Tech Institute"
                  value={data.name}
                  onChange={e => setData({ ...data, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="https://..."
                  value={data.website}
                  onChange={e => setData({ ...data, website: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About Us</label>
            <textarea
              rows={4}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Tell students about your institution's history and values..."
              value={data.description}
              onChange={e => setData({ ...data, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-medium text-gray-700">Click to upload images</p>
                <p className="text-sm text-gray-500">JPG, PNG (Max 5MB)</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Sub-Component: Diploma Creator ---
function DiplomaCreator() {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    startDate: '',
    duration: '',
    contact: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Diploma Created! Receipt generation logic initialized.');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create New Diploma Program</h2>
      <p className="text-gray-600">Create an onsite learning program. Students will receive a receipt upon purchase to present at the venue.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diploma Title</label>
            <input
              required
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="e.g. Advanced Industrial Chemistry"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
              <input
                required
                type="number"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="50000"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                required
                type="tel"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="+234..."
                value={formData.contact}
                onChange={e => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Physical Location (Venue)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                required
                type="text"
                className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="e.g. Hall C, Lebanon Main Campus, Owerri"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commencement Date</label>
              <input
                required
                type="date"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                required
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="e.g. 6 Months, 4 Weeks"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details / Curriculum Overview</label>
            <textarea
              required
              rows={4}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Describe what students will learn..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Create Diploma & Enable Sales
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
  
  // Real Analytics States
  const [diplomaCount, setDiplomaCount] = useState(0);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // New States for Calculated Totals
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

  // Helper: Process payments for chart
  // NOTE: Now uses 'creator_amount' for calculation
  const processRevenueData = (payments: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const groupedData: Record<string, number> = {};

    payments.forEach(payment => {
      const dateStr = payment.created_at || payment.date;
      if (!dateStr) return;
      
      const date = new Date(dateStr); 
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      if (payment.status === 'success' || payment.verified === true) {
        // USE CREATOR AMOUNT
        const val = parseFloat(payment.creator_amount || payment.amount || '0');
        groupedData[monthKey] = (groupedData[monthKey] || 0) + val;
      }
    });

    return Object.keys(groupedData).map(key => ({
      name: key,
      revenue: groupedData[key]
    })).slice(-6); 
  };

  // Fetch Summary & Analytics
  useEffect(() => {
    let mounted = true;
    async function loadDashboardData() {
      const token = localStorage.getItem('access');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      
      if (!summary) setLoadingSummary(true);
      setLoadingAnalytics(true);

      try {
        // 1. Fetch Main Summary & Flutterwave Account
        const summaryReq = api.get('/dashboard/');
        const fwReq = api.get('/flutterwave-subaccounts/').catch(() => ({ data: null }));
        
        // 2. Fetch Diplomas (to get count)
        const diplomaReq = api.get('/diploma-enrollments/');
        
        // 3. GET INSTITUTION ID FIRST
        const instReq = await api.get('/institutions/my_institution/');
        const institutionId = instReq.data?.id;

        // 4. Fetch Payments using the Institution ID
        // Using page_size=100 to gather enough data for accurate calculations
        const paymentsReq = api.get('/payments/', { 
          params: { 
            diploma__institution: institutionId, 
            page: 1, 
            page_size: 100 
          } 
        });

        // Resolve remaining promises
        const [summaryRes, diplomaRes, paymentsRes, fwRes] = await Promise.all([
          summaryReq,
          diplomaReq.catch(() => ({ data: [] })), 
          paymentsReq.catch(() => ({ data: [] })),
          fwReq
        ]);

        if (!mounted) return;

        setSummary(summaryRes.data);

        // Parse Flutterwave Data
        if (fwRes.data) {
            const accData = Array.isArray(fwRes.data) ? fwRes.data[0] : fwRes.data;
            if (accData && accData.account_number) {
                setFwAccount(accData);
            }
        }

        // Process Diploma Count 
        if (diplomaRes.data) {
          const count = Array.isArray(diplomaRes.data) 
            ? diplomaRes.data.length 
            : (diplomaRes.data.count || 0);
          setDiplomaCount(count);
        }

        // Process Revenue Data (Chart + Totals)
        if (paymentsRes.data) {
          const paymentList = Array.isArray(paymentsRes.data) 
            ? paymentsRes.data 
            : (paymentsRes.data.results || []);
          
          // 1. Update Chart Data (now uses creator_amount)
          setRevenueData(processRevenueData(paymentList));

          // 2. Calculate Totals directly from response
          let totalRev = 0;
          const uniqueStudents = new Set();

          paymentList.forEach((p: any) => {
            if (p.status === 'success' || p.verified === true) {
              // USE CREATOR AMOUNT
              totalRev += parseFloat(p.creator_amount || '0');
              if (p.user) uniqueStudents.add(p.user);
            }
          });

          setCalculatedRevenue(totalRev);
          setCalculatedStudents(uniqueStudents.size);
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
  }, [props.summary, location.state]);

  if (loadingSummary) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;
  if (!summary) return <div className="min-h-screen flex items-center justify-center">Unable to load dashboard.</div>;

  // Navigation Items
  const navItems = [
    { path: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
    { path: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
    { path: 'diploma', label: 'Diploma', icon: <GraduationCap className="w-5 h-5" /> },
    { path: 'portfolio', label: 'Portfolio', icon: <Briefcase className="w-5 h-5" /> },
    { path: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> }, // Added Schedule
    { path: 'payments', label: 'Payments', icon: <DollarSign className="w-5 h-5" /> },
  ];

  const isActivePath = (p: string) => {
    const normalized = location.pathname.replace(/\/+$/, '');
    if (p === 'overview') return normalized === base || normalized === `${base}/overview`;
    return normalized === `${base}/${p}` || normalized.includes(`/${p}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3">
                {sidebarOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
              </button>
              <Link to={base} className="flex items-center space-x-3">
                <img src={labanonLogo} alt="Lebanon Academy" className="w-8 h-8 object-contain" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Institution Portal</h1>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {summary?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{summary?.username}</p>
                  <p className="text-xs text-gray-500">Institution Admin</p>
                </div>
              </div>
              <button
                onClick={() => setContactAdminOpen(true)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Contact Admin"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowInbox(true)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Inbox"
              >
                <Mail className="w-5 h-5" />
              </button>
              <button
                onClick={doLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Sidebar - Desktop */}
          <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const active = isActivePath(item.path);
                  return (
                    <motion.div key={item.path} whileHover={{ x: 5 }}>
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                          active
                            ? 'bg-gradient-to-r from-green-50 to-teal-50 text-green-600 border-l-4 border-green-500'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`${active ? 'text-green-600' : 'text-gray-500'}`}>{item.icon}</div>
                        <span className="font-medium">{item.label}</span>
                        {active && <ChevronRight className="w-4 h-4 ml-auto text-green-500" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-semibold text-green-800 mb-1">Need Support?</h4>
                  <p className="text-xs text-green-600 mb-3">Contact the admin team for help with your institution account.</p>
                  <button className="text-xs bg-white text-green-700 px-3 py-1.5 rounded-lg border border-green-200 font-medium">Contact Admin</button>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Sidebar - Mobile */}
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

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg min-h-[600px]">
              <div className="p-6">
                <Routes>
                  {/* Overview Tab */}
                  <Route path="overview" element={
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                          <p className="text-gray-600">Welcome back, {summary.username}</p>
                        </div>
                        <div className="hidden sm:block">
                          <span className="bg-green-100 text-green-800 text-sm font-medium px-4 py-2 rounded-full">
                            Verified Institution
                          </span>
                        </div>
                      </div>

                      {/* Stats Grid - Mobile Responsive */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                        {[
                          { 
                            title: 'Total Students', 
                            value: calculatedStudents, 
                            icon: <Users className="w-6 h-6" />, 
                            color: 'bg-blue-500' 
                          },
                          { 
                            title: 'Online Courses', 
                            value: summary.courses_count || 0, 
                            icon: <BookOpen className="w-6 h-6" />, 
                            color: 'bg-green-500' 
                          },
                          { 
                            title: 'Diplomas Sold', 
                            value: diplomaCount, 
                            icon: <GraduationCap className="w-6 h-6" />, 
                            color: 'bg-purple-500' 
                          }, 
                          { 
                            title: 'Total Revenue', 
                            value: `₦${calculatedRevenue.toLocaleString()}`, 
                            icon: <DollarSign className="w-6 h-6" />, 
                            color: 'bg-teal-500' 
                          }
                        ].map((stat, index) => (
                          <div key={index} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                              <div className={`${stat.color} bg-opacity-10 p-3 rounded-xl`}>
                                <div className={`text-${stat.color.replace('bg-', '')}-600`}>{stat.icon}</div>
                              </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Revenue Chart - WIRED UP & Responsive */}
                      <div className="bg-white rounded-xl border border-gray-100 p-6 min-w-0">
                        <h3 className="text-lg font-bold mb-4">Revenue Overview</h3>
                        <div className="h-72 w-full min-w-0">
                           {loadingAnalytics ? (
                             <div className="h-full flex items-center justify-center text-gray-400">Loading chart data...</div>
                           ) : revenueData.length > 0 ? (
                             <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={revenueData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                 <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₦${val}`} tick={{fontSize: 12}} />
                                 <Tooltip formatter={(val: number) => `₦${val.toLocaleString()}`} cursor={{fill: '#f0fdf4'}} />
                                 <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                               </BarChart>
                             </ResponsiveContainer>
                           ) : (
                             <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-400">No payment data available for the chart yet.</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  } />

                  {/* Courses Management - Reusing existing components */}
                  <Route path="courses" element={
                    <div>
                      {creatingCourse ? (
                        <div className="space-y-4">
                          <button
                            onClick={() => setCreatingCourse(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
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
                              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
                  <Route path="portfolio" element={<InstitutionPortfolio />} />

                  {/* Schedule Page */}
                  <Route path="schedule" element={<div className="p-4"><SchedulePage userRole="institution" /></div>} />

                  {/* Payments - UPDATED MOVED FLUTTERWAVE DETAILS TO BOTTOM */}
                  <Route path="payments" element={
                    <div>
                        <InstitutionPayments />
                        {/* Moved Flutterwave Section Below Payments */}
                        {fwAccount && (
                            <div className="mt-8 mb-6 bg-white rounded-lg shadow p-5 border border-green-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <CreditCard className="w-5 h-5 text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Flutterwave Subaccount</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Account Name</span>
                                        <span className="font-semibold text-lg">{fwAccount.account_name}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Account Number</span>
                                        <span className="font-semibold text-lg">{fwAccount.account_number}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500">Bank Code</span>
                                        <span className="font-semibold text-lg">{fwAccount.bank_code}</span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-green-600 text-xs font-bold">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Active for Payouts
                                </div>
                            </div>
                        )}
                    </div>
                  } />

                  {/* Default redirect to overview */}
                  <Route path="" element={
                    <div className="p-8 text-center">
                        <h2 className="text-2xl font-bold mb-4">Welcome to the Institution Portal</h2>
                        <p className="text-gray-600 mb-8">Manage your digital presence, onsite diplomas, and online courses all in one place.</p>
                        <button onClick={() => navigate('overview')} className="px-6 py-3 bg-green-600 text-white rounded-lg">Go to Overview</button>
                    </div>
                  } />

                </Routes>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <ContactAdminForm isOpen={contactAdminOpen} onClose={() => setContactAdminOpen(false)} />
      <UserMessages isOpen={showInbox} onClose={() => setShowInbox(false)} />
    </div>
  );
}