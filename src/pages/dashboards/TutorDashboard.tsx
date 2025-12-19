// src/pages/dashboards/TutorDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
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
  Settings,
  UploadCloud,
  ImageIcon
} from 'lucide-react';
import labanonLogo from '../labanonlogo.png';
import ManageCourses from '../ManageCourses';
import ManageCourseDetail from '../ManageCourseDetail';
import CreateCourse from '../CreateCourse';

// Recharts imports
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

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
      color: 'from-green-600 to-teal-500',
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
    { title: 'Create New Course', icon: <PlusCircle className="w-5 h-5" />, color: 'bg-green-100 text-green-600', path: '/tutor/manage/create' },
    { title: 'Schedule Live Class', icon: <Calendar className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600', path: 'schedule' },
    { title: 'Go Live', icon: <Sparkles className="w-5 h-5" />, color: 'bg-green-100 text-green-600', path: 'overview' }
  ];

  // helper: isActivePath under /tutor
  const isActivePath = (p: string) => {
    const normalized = location.pathname.replace(/\/+$/, '');
    if (p === 'overview') return normalized === base || normalized === `${base}/overview`;
    return normalized === `${base}/${p}` || normalized.includes(`/${p}`);
  };

  /***************************************************************************
   * Students tab and analytics/earnings code omitted here (kept from your file)
   * ... we'll keep them as in your original file for brevity.
   * (They remain unchanged and still present below — preserved behavior.)
   ***************************************************************************/

  // -- STUDENTS (kept unchanged) --
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentPurchases, setStudentPurchases] = useState<any[]>([]);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsPageCount, setStudentsPageCount] = useState(1);
  const STUDENTS_PAGE_SIZE = 10;

  async function loadStudentPurchases(page = 1) {
    setStudentsLoading(true);
    try {
      const token = localStorage.getItem('access');
      const me = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } });
      const uid = me.data.id;

      const res = await axios.get(`${API_BASE}/enrollments/?course__creator=${uid}&page=${page}&page_size=${STUDENTS_PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const items = res.data.results || res.data || [];
      setStudentPurchases(items);
      if (res.data.count) setStudentsPageCount(Math.ceil(res.data.count / STUDENTS_PAGE_SIZE));
      else setStudentsPageCount(Math.max(1, Math.ceil((items.length || 0) / STUDENTS_PAGE_SIZE)));
    } catch (err) {
      console.error('Failed to load student purchases via enrollments:', err);
      try {
        const token = localStorage.getItem('access');
        const me = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } });
        const uid = me.data.id;
        const res2 = await axios.get(`${API_BASE}/payments/?tutor=${uid}&page=${page}&page_size=${STUDENTS_PAGE_SIZE}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const items2 = res2.data.results || res2.data || [];
        setStudentPurchases(items2);
        if (res2.data.count) setStudentsPageCount(Math.ceil(res2.data.count / STUDENTS_PAGE_SIZE));
        else setStudentsPageCount(Math.max(1, Math.ceil((items2.length || 0) / STUDENTS_PAGE_SIZE)));
      } catch (err2) {
        console.error('Fallback payments endpoint failed too:', err2);
        setStudentPurchases([]);
        setStudentsPageCount(1);
      }
    } finally {
      setStudentsLoading(false);
    }
  }

  useEffect(() => {
    if (isActivePath('students')) loadStudentPurchases(studentsPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentsPage, location.pathname]);

  // -- ANALYTICS (kept unchanged) --
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [salesByMonth, setSalesByMonth] = useState<any[]>([]);

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('access');
      const me = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } });
      const uid = me.data.id;

      const tryAnalytics = await axios.get(`${API_BASE}/sales/analytics/?tutor=${uid}&months=6`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (tryAnalytics && tryAnalytics.status === 200 && tryAnalytics.data && Array.isArray(tryAnalytics.data.data || tryAnalytics.data)) {
        const data = tryAnalytics.data.data || tryAnalytics.data;
        const normalized = data.map((r: any) => ({
          month: r.month || r.label || r.name,
          sales: Number(r.sales || r.count || 0),
          revenue: Number(r.revenue || r.amount || r.total || 0)
        }));
        setSalesByMonth(normalized);
      } else {
        const res = await axios.get(`${API_BASE}/enrollments/?course__creator=${uid}&page_size=1000`, { headers: { Authorization: `Bearer ${token}` } });
        const items = res.data.results || res.data || [];
        const map = new Map<string, { month: string; sales: number; revenue: number }>();
        items.forEach((it: any) => {
          const dateStr = it.purchased_at || it.created_at || it.date || it.timestamp;
          const d = dateStr ? new Date(dateStr) : new Date();
          if (isNaN(d.getTime())) return;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
          const cur = map.get(key) || { month: label, sales: 0, revenue: 0 };
          cur.sales += 1;
          const amount = Number(it.amount ?? it.price ?? it.course?.price ?? 0);
          cur.revenue += amount;
          map.set(key, cur);
        });
        const arr = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
        setSalesByMonth(arr.slice(-6));
      }
    } catch (err) {
      console.error('Failed to load analytics, using fallback mock:', err);
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        months.push({ month: label, sales: Math.floor(Math.random() * 30) + 5, revenue: Math.floor(Math.random() * 50000) + 2000 });
      }
      setSalesByMonth(months);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    if (isActivePath('analytics')) loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const chartData = useMemo(() => {
    return salesByMonth.map(s => ({ name: s.month, Sales: s.sales, Revenue: s.revenue }));
  }, [salesByMonth]);

  // -- EARNINGS (kept unchanged) --
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState<number>(summary?.total_earnings || 0);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [paystackCreds, setPaystackCreds] = useState({
    business_name: '',
    paystack_public_key: '',
    paystack_secret_key: '',
    paystack_email: ''
  });

  async function loadEarnings() {
    setEarningsLoading(true);
    try {
      const token = localStorage.getItem('access');
      const me = await axios.get(`${API_BASE}/users/me/`, { headers: { Authorization: `Bearer ${token}` } });
      const uid = me.data.id;

      const paymentsRes = await axios.get(`${API_BASE}/payments/?tutor=${uid}&page_size=1000`, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => null);

      if (paymentsRes && (paymentsRes.data.results || paymentsRes.data)) {
        const items = paymentsRes.data.results || paymentsRes.data || [];
        const total = items.reduce((acc: number, it: any) => acc + Number(it.amount ?? it.value ?? 0), 0);
        setTotalEarnings(total);
      } else {
        const enrollRes = await axios.get(`${API_BASE}/enrollments/?course__creator=${uid}&page_size=1000`, { headers: { Authorization: `Bearer ${token}` } });
        const items = enrollRes.data.results || enrollRes.data || [];
        const total = items.reduce((acc: number, it: any) => acc + Number(it.amount ?? it.price ?? it.course?.price ?? 0), 0);
        setTotalEarnings(total);
      }
    } catch (err) {
      console.error('Failed to load earnings:', err);
      setTotalEarnings(summary?.total_earnings || 0);
    } finally {
      setEarningsLoading(false);
    }
  }

  useEffect(() => {
    if (isActivePath('earnings')) loadEarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const platformFee = +(totalEarnings * 0.05).toFixed(2);
  const tutorShare = +(totalEarnings - platformFee).toFixed(2);

  useEffect(() => {
    const saved = localStorage.getItem('tutor_paystack_creds');
    if (saved) {
      try { setPaystackCreds(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  function savePaystackCredsToLocal() {
    localStorage.setItem('tutor_paystack_creds', JSON.stringify(paystackCreds));
    alert('Paystack credentials saved locally (UI-only). We will wire backend next.');
    setShowPaystackModal(false);
  }

  /***************************************************************************
   * NEW: Upload Media modal + helpers
   *
   * We add a small UI and functions so the tutor can:
   *  - upload a course image (POST /api/uploads/courses/image/ then PATCH /api/courses/{id}/ with image)
   *  - upload lesson media (POST /api/uploads/lessons/media/ then PATCH /api/lessons/{id}/ with video)
   *
   * After a successful edit we reload the page so frontend shows the updated image/video.
   ***************************************************************************/
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTab, setUploadTab] = useState<'course' | 'lesson'>('course');

  // for course-upload tab
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseFile, setCourseFile] = useState<File | null>(null);
  const [uploadingCourseImage, setUploadingCourseImage] = useState(false);

  // for lesson-upload tab
  const [selectedLessonCourseId, setSelectedLessonCourseId] = useState<number | null>(null);
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [uploadingLessonMedia, setUploadingLessonMedia] = useState(false);

  // fetch tutor courses for dropdown
  async function loadMyCourses() {
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_BASE}/courses/?page_size=1000&creator=${''}`, { // we will filter by current user server-side if supported
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      // If API supports filtering by creator it should return only tutor's courses.
      // If not, we fetch all and filter by username in summary (best-effort).
      let items: any[] = [];
      if (res && (res.data.results || res.data)) {
        items = res.data.results || res.data;
      } else {
        // fallback: fetch all courses (page_size=1000) and filter locally by creator username
        const res2 = await axios.get(`${API_BASE}/courses/?page_size=1000`, { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } });
        items = res2.data.results || res2.data || [];
        if (summary?.username) {
          items = items.filter(it => String(it.creator || '').toLowerCase().includes(String(summary.username).toLowerCase()));
        }
      }
      setMyCourses(items || []);
      if (items && items.length > 0 && selectedCourseId === null) {
        setSelectedCourseId(items[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch tutor courses for upload modal:', err);
    }
  }

  // fetch modules+lessons of selected course
  async function loadCourseModules(courseId: number | null) {
    setCourseModules([]);
    setSelectedLessonId(null);
    if (!courseId) return;
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_BASE}/courses/${courseId}/`, { headers: { Authorization: `Bearer ${token}` } });
      const modules = res.data.modules || [];
      setCourseModules(modules);
    } catch (err) {
      console.error('Failed to fetch course modules for lessons selection:', err);
    }
  }

  useEffect(() => {
    if (showUploadModal) {
      loadMyCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUploadModal]);

  useEffect(() => {
    loadCourseModules(selectedLessonCourseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLessonCourseId]);

  // helper to upload file (returns { name, url })
  async function postFileToEndpoint(formFile: File, endpoint: string) {
    const token = localStorage.getItem('access');
    const fd = new FormData();
    fd.append('file', formFile);
    const res = await axios.post(`${API_BASE}${endpoint}`, fd, {
      headers: {
        Authorization: `Bearer ${token}`,
        // axios will set proper multipart boundary
      }
    });
    return res.data;
  }

  // Upload course image flow
  async function handleUploadCourseImage() {
    if (!selectedCourseId) { alert('Select a course first'); return; }
    if (!courseFile) { alert('Choose an image file'); return; }
    setUploadingCourseImage(true);
    try {
      // upload to endpoint
      const uploaded = await postFileToEndpoint(courseFile, '/uploads/courses/image/');
      // backend returns { name: saved_name, url }
      const savedName = uploaded?.name || uploaded?.url || '';
      if (!savedName) throw new Error('Upload did not return file name');

      // PATCH course to set image to savedName (backend serializer will normalize)
      const token = localStorage.getItem('access');
      await axios.patch(`${API_BASE}/courses/${selectedCourseId}/`, { image: savedName }, { headers: { Authorization: `Bearer ${token}` } });

      alert('Course image uploaded successfully. Page will refresh to show changes.');
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to upload course image:', err);
      alert(err?.response?.data?.detail || err?.message || 'Upload failed');
    } finally {
      setUploadingCourseImage(false);
    }
  }

  // Upload lesson media flow
  async function handleUploadLessonMedia() {
    if (!selectedLessonCourseId) { alert('Select a course first'); return; }
    if (!selectedLessonId) { alert('Select a lesson'); return; }
    if (!lessonFile) { alert('Choose a file to upload'); return; }

    setUploadingLessonMedia(true);
    try {
      const uploaded = await postFileToEndpoint(lessonFile, '/uploads/lessons/media/');
      const savedName = uploaded?.name || uploaded?.url || '';
      if (!savedName) throw new Error('Upload did not return file name');

      const token = localStorage.getItem('access');
      // patch lesson endpoint. video field stores lesson media reference
      await axios.patch(`${API_BASE}/lessons/${selectedLessonId}/`, { video: savedName }, { headers: { Authorization: `Bearer ${token}` } });

      alert('Lesson media uploaded and saved. Refreshing page to apply changes.');
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to upload lesson media:', err);
      alert(err?.response?.data?.detail || err?.message || 'Upload failed');
    } finally {
      setUploadingLessonMedia(false);
    }
  }

  /***************************************************************************
   * UI (sidebar is the single nav; top "tab links" removed as requested)
   ***************************************************************************/
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
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
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
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
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
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
                      <Link to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${ active ? 'bg-gradient-to-r from-green-50 to-teal-50 text-green-600 border-l-4 border-green-500' : 'text-gray-700 hover:bg-gray-50' }`}>
                        <div className={`${active ? 'text-green-600' : 'text-gray-500'}`}>{item.icon}</div>
                        <span className="font-medium">{item.label}</span>
                        {active && <ChevronRight className="w-4 h-4 ml-auto text-green-500" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <Link to="/tutor/manage/create" className="mt-6 w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow inline-flex items-center justify-center">
                <PlusCircle className="w-5 h-5 inline mr-2" />
                Create New Course
              </Link>

              {/* Upload media quick action */}
              <button
                className="mt-3 w-full py-2 flex items-center justify-center gap-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                onClick={() => { setShowUploadModal(true); setUploadTab('course'); }}
                title="Upload course image or lesson media"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Media
              </button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <Routes>
                  {/* Overview */}
                  <Route path="overview" element={
                    <div>
                      <div className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">{summary?.username}</span>! 🎓</h1>
                            <p className="text-gray-600 mt-2">Manage your courses, track earnings, and grow your teaching impact</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg">
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

                  {/* Manage courses */}
                  <Route path="manage" element={<ManageCourses uploadCourseImageHandler={handleUploadCourseImage} uploadLessonMediaHandler={handleUploadLessonMedia} />} />
                  <Route path="manage/create" element={<CreateCourse />} />
                  <Route path="manage/:id" element={<ManageCourseDetail uploadCourseImageHandler={handleUploadCourseImage} uploadLessonMediaHandler={handleUploadLessonMedia} />} />

                  {/* Students */}
                  <Route path="students" element={
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Students who bought your courses</h2>
                      <div className="bg-white rounded shadow p-4 mb-4">
                        <p className="text-sm text-gray-600">This list contains purchases (enrollments/payments) for courses you created.</p>
                      </div>

                      {studentsLoading ? (
                        <div>Loading purchases...</div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {studentPurchases.length === 0 && <div className="text-sm text-gray-500">No purchases yet.</div>}
                            {studentPurchases.map((p: any) => (
                              <div key={p.id || `${p.course?.id}-${p.buyer?.id}-${p.created_at}`} className="p-3 border rounded flex justify-between items-center">
                                <div>
                                  <div className="font-semibold">{p.buyer?.name || p.buyer_name || p.student_name || p.user?.name || 'Student'}</div>
                                  <div className="text-sm text-gray-600">{p.course?.title || p.course_title || p.title || 'Course'}</div>
                                  <div className="text-xs text-gray-500 mt-1">Purchased: {new Date(p.purchased_at || p.created_at || p.date || p.timestamp || Date.now()).toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">Amount</div>
                                  <div className="font-bold">₦{Number(p.amount || p.price || p.course?.price || 0).toLocaleString()}</div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-center gap-3 mt-6">
                            <button disabled={studentsPage <= 1} onClick={() => setStudentsPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50">Previous</button>
                            <div className="text-sm text-gray-600">Page {studentsPage} / {studentsPageCount}</div>
                            <button disabled={studentsPage >= studentsPageCount} onClick={() => setStudentsPage((p) => Math.min(studentsPageCount, p + 1))} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50">Next</button>
                          </div>
                        </>
                      )}
                    </div>
                  } />

                  {/* Analytics */}
                  <Route path="analytics" element={
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Sales Analytics</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded shadow p-4">
                          <h3 className="font-semibold mb-2">Sales by month</h3>
                          <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(val: any) => [val, '']} />
                                <Legend />
                                <Bar dataKey="Sales" fill="#10B981" />
                                <Bar dataKey="Revenue" fill="#06b6d4" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-white rounded shadow p-4">
                          <h3 className="font-semibold mb-2">Revenue trend</h3>
                          <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Revenue" stroke="#0ea5a4" strokeWidth={3} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="Sales" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded p-4 shadow">
                          <div className="text-sm text-gray-500">Total months shown</div>
                          <div className="text-2xl font-bold">{salesByMonth.length}</div>
                        </div>
                        <div className="bg-white rounded p-4 shadow">
                          <div className="text-sm text-gray-500">Total sales (shown)</div>
                          <div className="text-2xl font-bold">{salesByMonth.reduce((s, x) => s + (x.sales || 0), 0)}</div>
                        </div>
                        <div className="bg-white rounded p-4 shadow">
                          <div className="text-sm text-gray-500">Total revenue (shown)</div>
                          <div className="text-2xl font-bold">₦{salesByMonth.reduce((s, x) => s + (x.revenue || 0), 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  } />

                  {/* Earnings */}
                  <Route path="earnings" element={
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Earnings</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded p-6 shadow">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm text-gray-500">Total Earnings</div>
                              <div className="text-3xl font-bold mt-2">₦{(totalEarnings || 0).toLocaleString()}</div>
                              <div className="text-xs text-gray-500 mt-1">Gross revenue from course sales</div>
                            </div>
                            <div className="text-4xl text-green-600 font-bold">₦</div>
                          </div>
                        </div>

                        <div className="bg-white rounded p-6 shadow">
                          <div className="text-sm text-gray-500">Platform Fee (5%)</div>
                          <div className="text-2xl font-bold mt-2">₦{platformFee.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 mt-1">This is the platform's share per sale (display only)</div>
                        </div>

                        <div className="bg-white rounded p-6 shadow">
                          <div className="text-sm text-gray-500">Your share</div>
                          <div className="text-2xl font-bold mt-2">₦{tutorShare.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 mt-1">Amount available to you (approx)</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-semibold">Payouts & Payment Method</h3>
                          <p className="text-sm text-gray-500">Connect your Paystack account to receive payouts (UI-only for now).</p>
                        </div>
                        <div>
                          <button onClick={() => setShowPaystackModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg">ADD PAYMENT METHOD</button>
                        </div>
                      </div>

                      <div className="bg-white rounded shadow p-4">
                        <h4 className="font-semibold mb-2">Recent payouts (preview)</h4>
                        <div className="text-sm text-gray-500">We will show recent cashout history here once integrated with payouts.</div>
                        <div className="mt-4 text-sm text-gray-700">For now, connect your Paystack credentials to enable manual withdrawals on the backend later.</div>
                      </div>

                      {showPaystackModal && (
                        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="bg-white rounded-lg w-[90%] md:w-1/2 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold">Add Paystack Payment Method</h3>
                              <button onClick={() => setShowPaystackModal(false)} className="text-gray-500">Close</button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Business / Account Name</label>
                                <input className="mt-2 w-full border rounded p-2" value={paystackCreds.business_name} onChange={(e) => setPaystackCreds(s => ({ ...s, business_name: e.target.value }))} />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Paystack Public Key</label>
                                  <input className="mt-2 w-full border rounded p-2" value={paystackCreds.paystack_public_key} onChange={(e) => setPaystackCreds(s => ({ ...s, paystack_public_key: e.target.value }))} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Paystack Secret Key</label>
                                  <input className="mt-2 w-full border rounded p-2" value={paystackCreds.paystack_secret_key} onChange={(e) => setPaystackCreds(s => ({ ...s, paystack_secret_key: e.target.value }))} />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700">Business Email</label>
                                <input className="mt-2 w-full border rounded p-2" value={paystackCreds.paystack_email} onChange={(e) => setPaystackCreds(s => ({ ...s, paystack_email: e.target.value }))} />
                              </div>

                              <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setShowPaystackModal(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                                <button onClick={savePaystackCredsToLocal} className="px-4 py-2 bg-green-600 text-white rounded">Save & Connect</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
                      <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8">
                        <div className="max-w-2xl">
                          <p className="text-gray-700 mb-6">Start by creating your first course or exploring the different sections from the sidebar.</p>
                          <div className="flex flex-wrap gap-4">
                            <Link to="/tutor/manage/create" className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold inline-flex items-center justify-center"><PlusCircle className="w-5 h-5 inline mr-2" />Create New Course</Link>
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

      {/* Upload Media Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl max-w-3xl w-full overflow-auto max-h-[90vh] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Media (Course image / Lesson media)</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setUploadTab('course')} className={`px-3 py-1 rounded ${uploadTab === 'course' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Course Image</button>
                <button onClick={() => setUploadTab('lesson')} className={`px-3 py-1 rounded ${uploadTab === 'lesson' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Lesson Media</button>
                <button onClick={() => setShowUploadModal(false)} className="ml-2 px-3 py-1 bg-gray-100 rounded">Close</button>
              </div>
            </div>

            {uploadTab === 'course' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Select Course</label>
                  <select value={selectedCourseId ?? ''} onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded p-2">
                    <option value="">-- choose course --</option>
                    {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Choose Image (jpg, png)</label>
                  <input type="file" accept="image/*" onChange={(e) => setCourseFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                </div>

                <div className="flex items-center gap-3">
                  <button disabled={uploadingCourseImage} onClick={handleUploadCourseImage} className={`px-4 py-2 rounded ${uploadingCourseImage ? 'bg-gray-300' : 'bg-green-600 text-white'}`}>
                    {uploadingCourseImage ? 'Uploading...' : 'Upload & Save'}
                  </button>
                  <div className="text-sm text-gray-500">Uploaded images will replace current course image.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Select Course (to pick a lesson)</label>
                  <select value={selectedLessonCourseId ?? ''} onChange={(e) => setSelectedLessonCourseId(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded p-2">
                    <option value="">-- choose course --</option>
                    {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Select Lesson</label>
                  <div className="border rounded p-2 max-h-40 overflow-auto">
                    {courseModules.length === 0 && <div className="text-sm text-gray-500">Choose a course to load modules & lessons.</div>}
                    {courseModules.map((m: any) => (
                      <div key={m.id} className="mb-2">
                        <div className="font-medium text-sm mb-1">{m.title}</div>
                        <div className="space-y-1">
                          {Array.isArray(m.lessons) && m.lessons.map((l: any) => (
                            <label key={l.id} className="flex items-center gap-2 text-sm">
                              <input type="radio" name="selectedLesson" checked={selectedLessonId === l.id} onChange={() => setSelectedLessonId(l.id)} />
                              <span>{l.title}</span>
                            </label>
                          ))}
                          {(!Array.isArray(m.lessons) || m.lessons.length === 0) && <div className="text-xs text-gray-500">No lessons</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Choose Media (mp4, webm, jpg, png)</label>
                  <input type="file" accept="video/*,image/*" onChange={(e) => setLessonFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                </div>

                <div className="flex items-center gap-3">
                  <button disabled={uploadingLessonMedia} onClick={handleUploadLessonMedia} className={`px-4 py-2 rounded ${uploadingLessonMedia ? 'bg-gray-300' : 'bg-green-600 text-white'}`}>
                    {uploadingLessonMedia ? 'Uploading...' : 'Upload & Save to Lesson'}
                  </button>
                  <div className="text-sm text-gray-500">This will set the lesson's `video` field to the uploaded media reference.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

