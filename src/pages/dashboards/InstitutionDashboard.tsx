// src/pages/dashboards/InstitutionDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Briefcase,
  GraduationCap,
  Menu,
  X,
  LogOut,
  Building2,
  MapPin,
  Globe,
  Save,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

import labanonLogo from '../labanonlogo.png'; // Ensure this path is correct
// Reusing your existing Course Management components
import ManageCourses from '../ManageCourses';
import ManageCourseDetail from '../ManageCourseDetail';
import CreateCourse from '../CreateCourse';

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api';

// --- Types ---
interface DashboardSummary {
  username?: string;
  courses_count?: number;
  total_students?: number;
  total_earnings?: number;
  role?: string;
  [k: string]: any;
}

// --- Sub-Component: Portfolio Editor ---
function PortfolioEditor() {
  const [data, setData] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    images: [] as string[] // Mock images for now
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Backend Endpoint /api/institution/portfolio/
    alert('Portfolio saved locally! (Backend integration required)');
  };

  const handlePublish = () => {
    // TODO: Connect to Backend Publish Logic
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
    // TODO: Connect to Backend Endpoint /api/diplomas/
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

  const initialFromState = (location.state as any)?.summary;
  const [summary, setSummary] = useState<DashboardSummary | null>(props.summary ?? initialFromState ?? null);
  const [loadingSummary, setLoadingSummary] = useState(!summary);
  const base = '/institution';

  // Logout Function
  const doLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login', { replace: true });
  };

  // Fetch Summary
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
    return () => { mounted = false; };
  }, [props.summary, location.state, summary]);

  if (loadingSummary) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  if (!summary) return <div className="min-h-screen flex items-center justify-center">Unable to load dashboard.</div>;

  // Navigation Items
  const navItems = [
    { path: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
    { path: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
    { path: 'diploma', label: 'Diploma', icon: <GraduationCap className="w-5 h-5" /> },
    { path: 'portfolio', label: 'Portfolio', icon: <Briefcase className="w-5 h-5" /> },
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
          <div className="flex-1">
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

                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                          { title: 'Total Students', value: summary.total_students || 0, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500' },
                          { title: 'Online Courses', value: summary.courses_count || 0, icon: <BookOpen className="w-6 h-6" />, color: 'bg-green-500' },
                          { title: 'Diplomas Sold', value: 0, icon: <GraduationCap className="w-6 h-6" />, color: 'bg-purple-500' }, // Mock data
                          { title: 'Total Revenue', value: `₦${(summary.total_earnings || 0).toLocaleString()}`, icon: <DollarSign className="w-6 h-6" />, color: 'bg-teal-500' },
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

                      {/* Simple Chart Placeholder (Can be connected to actual data later) */}
                      <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-4">Revenue Overview</h3>
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                           <p className="text-gray-400">Chart data will appear here once sales begin.</p>
                        </div>
                      </div>
                    </div>
                  } />

                  {/* Courses Management - Reusing existing components */}
                  <Route path="courses" element={
                    <div>
                      <div className="flex justify-between items-center mb-6">
                         <h2 className="text-xl font-bold">Online Courses</h2>
                         <Link to="create" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                           <PlusCircle className="w-4 h-4 mr-2" /> New Course
                         </Link>
                      </div>
                      <ManageCourses 
                        uploadCourseImageHandler={async () => { alert("Image upload handled in detail view"); }} 
                        uploadLessonMediaHandler={async () => {}} 
                      />
                    </div>
                  } />
                  <Route path="courses/create" element={<CreateCourse />} />
                  <Route path="courses/:id" element={
                    <ManageCourseDetail 
                      uploadCourseImageHandler={async () => { alert("Implement institution image upload logic here similar to Tutor"); }} 
                      uploadLessonMediaHandler={async () => { alert("Implement institution media upload logic here"); }} 
                    />
                  } />

                  {/* Diploma Management */}
                  <Route path="diploma" element={<DiplomaCreator />} />

                  {/* Portfolio Management */}
                  <Route path="portfolio" element={<PortfolioEditor />} />

                  {/* Payments */}
                  <Route path="payments" element={
                    <div>
                      <h2 className="text-2xl font-bold mb-6">Financials</h2>
                      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white mb-8">
                        <p className="text-gray-400 mb-2">Total Earnings Available</p>
                        <h1 className="text-4xl font-bold mb-4">₦{(summary.total_earnings || 0).toLocaleString()}</h1>
                        <div className="flex gap-4">
                          <button className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600">Withdraw Funds</button>
                          <button className="px-6 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20">View History</button>
                        </div>
                      </div>
                      
                      <div className="bg-white border rounded-xl p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Recent Transactions</h3>
                        <div className="text-center py-8 text-gray-500">No transactions found for this period.</div>
                      </div>
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
    </div>
  );
}