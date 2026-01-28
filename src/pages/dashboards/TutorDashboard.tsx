// src/pages/dashboards/TutorDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// 1. USE SECURE API INSTANCE
import api from '../../utils/axiosInterceptor';
import useTokenRefresher from '../../utils/useTokenRefresher';
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
  LogOut,
  Mail,
  Upload,
  Loader2,
  Trophy,
  Crown,
  Medal,
  Award,
  CheckCircle,
  CreditCard,
  Edit3
} from 'lucide-react';
import labanonLogo from '../labanonlogo.png';
import ManageCourses from '../ManageCourses';
import ManageCourseDetail from '../ManageCourseDetail';
import CreateCourse from '../CreateCourse';
import PaymentHistory from '../../components/PaymentHistory';
import PayoutScheduleInfo from '../../components/PayoutScheduleInfo';
import PaystackSubAccountForm from '../../components/PaystackSubAccountForm';
import FlutterwaveSubAccountSetup from '../../components/FlutterwaveSubAccountSetup';
import MessageModal from '../../components/MessageModal';
import UserMessages from '../../components/UserMessages';
import SchedulePage from '../../components/SchedulePage';
import GospelVideoModal from '../../components/GospelVideoModal';

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

interface DashboardSummary {
  username?: string;
  courses_count?: number;
  total_students?: number;
  total_earnings?: number;
  avg_rating?: number;
  role?: string;
  id?: number;
  [k: string]: any;
}

interface LeaderboardTutor {
  id: number;
  name: string;
  sales: number;
  courses_created: number;
  avatar_initial: string;
  is_current_user?: boolean;
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

interface TutorDashboardProps {
  summary?: DashboardSummary;
}

export default function TutorDashboard(props: TutorDashboardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // --- 1. STATE & DATA ---
  const initialFromState = (location.state as any)?.summary;
  const [summary, setSummary] = useState<DashboardSummary | null>(props.summary ?? initialFromState ?? null);
  const [loadingSummary, setLoadingSummary] = useState(!summary);
  const [accountLocked, setAccountLocked] = useState(false);

  // Calculated Real-Time Stats
  const [calculatedEarnings, setCalculatedEarnings] = useState(0);
  const [calculatedStudents, setCalculatedStudents] = useState(0);
  const [calculatedCourses, setCalculatedCourses] = useState(0);
  const [calculatedRating, setCalculatedRating] = useState(4.0);

  // Flutterwave State
  const [fwAccount, setFwAccount] = useState<FlutterwaveSubAccount | null>(null);
  const [showFwUpdateForm, setShowFwUpdateForm] = useState(false); // State to toggle update form

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardTutor[]>([]);

  // Module States
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentPurchases, setStudentPurchases] = useState<any[]>([]);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsPageCount, setStudentsPageCount] = useState(1);
   
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [salesByMonth, setSalesByMonth] = useState<any[]>([]);

  const [earningsLoading, setEarningsLoading] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [paystackCreds, setPaystackCreds] = useState({
    business_name: '', paystack_public_key: '', paystack_secret_key: '', paystack_email: ''
  });

  // Upload States
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courseFile, setCourseFile] = useState<File | null>(null);
  const [selectedLessonCourseId, setSelectedLessonCourseId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [useYouTubeEmbed, setUseYouTubeEmbed] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const base = '/tutor';
  const STUDENTS_PAGE_SIZE = 10;

  // --- 2. EFFECTS & ALGORITHMS ---
  // Start token refresher to extend access token while user is active on this dashboard
  useTokenRefresher(50) // refresh every 50 minutes

  useEffect(() => {
    let mounted = true;
    async function loadDashboardData() {
      if (summary && calculatedEarnings > 0 && fwAccount) {
        setLoadingSummary(false);
        return;
      }
       
      const token = localStorage.getItem('access');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      if(!summary) setLoadingSummary(true);
       
      try {
        // 1. Fetch User & Summary & Flutterwave Account
        const [summaryRes, userRes, fwRes] = await Promise.all([
           api.get('/dashboard/'),
           api.get('/users/me/'),
           api.get('/flutterwave-subaccounts/').catch(() => ({ data: null }))
        ]);
        
        if (!mounted) return;
        const currentSummary = summaryRes.data;
        const userId = userRes.data.id;
        
        setSummary({ ...currentSummary, id: userId });
        // account unlocked check
        try {
          const isUnlocked = userRes.data?.is_unlocked === true || userRes.data?.is_unlocked === 'true';
          setAccountLocked(!isUnlocked);
        } catch (e) {
          setAccountLocked(false);
        }

        // Parse Flutterwave Data
        if (fwRes.data) {
            // Handle if it returns an array (list) or single object
            const accData = Array.isArray(fwRes.data) ? fwRes.data[0] : fwRes.data;
            // Check if object is not empty
            if (accData && accData.account_number) {
                setFwAccount(accData);
            }
        }

        // 2. Fetch Detailed Data for Algorithms
        const [paymentsRes, enrollmentsRes, coursesRes] = await Promise.all([
             api.get('/payments/', { params: { tutor: userId, status: 'success', page_size: 1000 } }).catch(()=>({data:[]})),
             // Fetch purchased enrollments for student count
             api.get('/enrollments/', { params: { course__creator: userId, purchased: true, page_size: 1000 } }).catch(()=>({data:[]})),
             api.get('/courses/', { params: { creator: userId, page_size: 1000 } }).catch(()=>({data:[]}))
        ]);

        const paymentsList = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data.results || []);
        const enrollmentsList = Array.isArray(enrollmentsRes.data) ? enrollmentsRes.data : (enrollmentsRes.data.results || []);
        const coursesList = Array.isArray(coursesRes.data) ? coursesRes.data : (coursesRes.data.results || []);

        // 1. Total Earnings (Net)
        const totalNet = paymentsList.reduce((sum: number, p: any) => {
            return sum + parseFloat(p.creator_amount || '0');
        }, 0);
        setCalculatedEarnings(totalNet);
        setTotalEarnings(totalNet); // Sync for earnings tab

        // 2. Unique Students Logic (Fixing the Zero issue)
        const uniqueStudentIds = new Set();
        enrollmentsList.forEach((e: any) => {
              // Response has 'user' or sometimes 'student' depending on serializer
            const u = e.user || e.student || e.buyer; 
            // If user is object, get id, else use value
            const sId = (typeof u === 'object' && u !== null) ? u.id : u;
            if (sId) uniqueStudentIds.add(sId);
        });
        setCalculatedStudents(uniqueStudentIds.size);

        // 3. Courses Count
        const courseCount = coursesList.length;
        setCalculatedCourses(courseCount);

        // 4. Smart Rating Algo
        // Base 4.0 + (0.05 * courses) + (0.001 * sales) -> Max 5.0
        const totalSales = enrollmentsList.length;
        let rating = 4.0 + (courseCount * 0.05) + (totalSales * 0.001);
        rating = Math.min(5.0, rating);
        setCalculatedRating(parseFloat(rating.toFixed(1)));

        // 5. Tutor Leaderboard (Real data from backend)
        let tutorLeaderboardData: LeaderboardTutor[] = [];
        try {
          const leaderboardRes = await api.get('/tutors/leaderboard/', { params: { limit: 50 } }).catch(() => null);
          if (leaderboardRes?.data) {
            const data = Array.isArray(leaderboardRes.data) ? leaderboardRes.data : (leaderboardRes.data.results || []);
            tutorLeaderboardData = data.map((item: any, idx: number) => ({
              id: item.id || item.user_id || idx,
              name: item.name || item.username || item.user?.username || item.first_name || 'Tutor',
              sales: item.sales !== undefined ? parseInt(item.sales) : (item.total_enrollments || 0),
              courses_created: item.courses_created !== undefined ? item.courses_created : (item.courses_count || 0),
              avatar_initial: (item.name || item.username || item.user?.username || 'T').charAt(0).toUpperCase()
            }));
            console.log('Tutor leaderboard data:', tutorLeaderboardData); // Debug log
          }
        } catch (err) {
          console.error('Failed to fetch tutors leaderboard:', err);
        }

        const currentUserEntry: LeaderboardTutor = {
          id: userId,
          name: userRes.data.username || 'You',
          sales: totalSales,
          courses_created: courseCount,
          avatar_initial: userRes.data.username?.charAt(0).toUpperCase() || 'U',
          is_current_user: true
        };

        // Prefer server-provided leaderboard entries. Only add the current user
        // if they are not already present in `tutorLeaderboardData` to avoid
        // overwriting authoritative `sales` values from the backend.
        const existing = tutorLeaderboardData.find(t => t.id === currentUserEntry.id);
        let uniqueBoard = [] as LeaderboardTutor[];
        if (!existing) {
          uniqueBoard = [...tutorLeaderboardData, currentUserEntry];
        } else {
          uniqueBoard = [...tutorLeaderboardData];
        }

        uniqueBoard = Array.from(new Map(uniqueBoard.map(item => [item.id, item])).values())
                        .sort((a, b) => b.sales - a.sales);

        setLeaderboard(uniqueBoard);

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        if (mounted) setLoadingSummary(false);
      }
    }
    loadDashboardData();
    return () => { mounted = false; };
  }, [props.summary, location.state]);

  useEffect(() => { if (isActivePath('students')) loadStudentPurchases(studentsPage); }, [studentsPage, location.pathname]);
  useEffect(() => { if (isActivePath('analytics')) loadAnalytics(); }, [location.pathname]);
  useEffect(() => {
    const saved = localStorage.getItem('tutor_paystack_creds');
    if (saved) { try { setPaystackCreds(JSON.parse(saved)); } catch { /* ignore */ } }
  }, []);

  // --- 3. HELPER FUNCTIONS ---

  const isActivePath = (p: string) => {
    const normalized = location.pathname.replace(/\/+$/, '');
    if (p === 'overview') return normalized === base || normalized === `${base}/overview`;
    return normalized === `${base}/${p}` || normalized.includes(`/${p}`);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200 flex items-center gap-1"><Trophy className="w-3 h-3" /> Best Seller</span>;
    if (rank === 2) return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full border border-gray-300 flex items-center gap-1"><Medal className="w-3 h-3" /> Second Best Seller</span>;
    if (rank === 3) return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full border border-orange-200 flex items-center gap-1"><Medal className="w-3 h-3" /> Third Best Seller</span>;
    if (rank <= 5) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200 flex items-center gap-1"><Award className="w-3 h-3" /> Top Seller</span>;
    return null;
  };

  async function loadStudentPurchases(page = 1) {
    setStudentsLoading(true);
    try {
      let uid = summary?.id;
      if (!uid) { const me = await api.get('/users/me/'); uid = me.data.id; }

      const res = await api.get('/enrollments/', {
        params: { course__creator: uid, purchased: true, page: page, page_size: STUDENTS_PAGE_SIZE }
      });

      const items = res.data.results || res.data || [];
      setStudentPurchases(items);
      if (res.data.count) setStudentsPageCount(Math.ceil(res.data.count / STUDENTS_PAGE_SIZE));
      else setStudentsPageCount(Math.max(1, Math.ceil((items.length || 0) / STUDENTS_PAGE_SIZE)));
    } catch (err) {
       setStudentPurchases([]);
    } finally {
      setStudentsLoading(false);
    }
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      let uid = summary?.id;
      if (!uid) { const me = await api.get('/users/me/'); uid = me.data.id; }
      const tryAnalytics = await api.get('/sales/analytics/', { params: { tutor: uid, months: 6 } }).catch(() => null);

      if (tryAnalytics && tryAnalytics.status === 200 && tryAnalytics.data) {
        const data = tryAnalytics.data.data || tryAnalytics.data;
        const normalized = Array.isArray(data) ? data.map((r: any) => ({
          month: r.month || r.label || r.name,
          sales: Number(r.sales || r.count || 0),
          revenue: Number(r.revenue || r.amount || r.total || 0)
        })) : [];
        setSalesByMonth(normalized);
      } else {
        const res = await api.get('/enrollments/', { params: { course__creator: uid, page_size: 1000 } });
        const items = res.data.results || res.data || [];
        const map = new Map<string, { month: string; sales: number; revenue: number }>();
        items.forEach((it: any) => {
          const dateStr = it.purchased_at || it.created_at || it.date || it.timestamp;
          if (!dateStr) return;
          const d = new Date(dateStr);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
          const cur = map.get(key) || { month: label, sales: 0, revenue: 0 };
          cur.sales += 1;
          cur.revenue += Number(it.amount ?? it.price ?? it.course?.price ?? 0);
          map.set(key, cur);
        });
        const arr = Array.from(map.values()).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
        setSalesByMonth(arr.slice(-6));
      }
    } catch (err) { setSalesByMonth([]); } finally { setAnalyticsLoading(false); }
  }

  function savePaystackCredsToLocal() {
    localStorage.setItem('tutor_paystack_creds', JSON.stringify(paystackCreds));
    alert('Paystack credentials saved locally.');
    setShowPaystackModal(false);
  }

  // Upload Helpers
  async function postFileToEndpoint(formFile: File, endpoint: string) {
    const fd = new FormData();
    fd.append('file', formFile);
    const res = await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  }

  async function handleUploadCourseImage() {
    if (!selectedCourseId || !courseFile) return;
    try {
      const uploaded = await postFileToEndpoint(courseFile, '/uploads/courses/image/');
      const savedName = uploaded?.name || uploaded?.url || '';
      await api.patch(`/courses/${selectedCourseId}/`, { image: savedName });
      window.location.reload();
    } catch (err: any) { alert('Upload failed'); }
  }

  async function handleUploadLessonMedia() {
    if (!selectedLessonId) return;
    if (useYouTubeEmbed) {
      if (!youtubeUrl) return;
      try { await api.patch(`/lessons/${selectedLessonId}/`, { video: youtubeUrl }); window.location.reload(); } catch { alert('Failed'); }
      return;
    }
    if (!lessonFile) return;
    try {
      const presignRes = await api.post('/aws/presign/', {
        filename: lessonFile.name, content_type: lessonFile.type, lesson_id: selectedLessonId, course_id: selectedLessonCourseId
      });
      const putRes = await fetch(presignRes.data.url, {
        method: 'PUT', headers: { 'Content-Type': lessonFile.type }, body: lessonFile
      });
      if (!putRes.ok) throw new Error('S3 failed');
      await api.patch(`/lessons/${selectedLessonId}/`, { video: presignRes.data.key });
      window.location.reload();
    } catch { alert('Upload failed'); }
  }

  // --- 4. RENDER PREP ---
  const chartData = useMemo(() => {
    return salesByMonth.map(s => ({ name: s.month, Sales: s.sales, Revenue: s.revenue }));
  }, [salesByMonth]);

  const platformFee = +(calculatedEarnings * 0.05).toFixed(2);
  const tutorShare = +(calculatedEarnings - platformFee).toFixed(2);

  const navItems = [
    { path: 'overview', label: 'Overview', icon: <Home className="w-5 h-5" /> },
    { path: 'manage', label: 'Manage Courses', icon: <BookOpen className="w-5 h-5" /> },
    { path: 'students', label: 'Students', icon: <Users className="w-5 h-5" /> },
    { path: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { path: 'earnings', label: 'Earnings', icon: <DollarSign className="w-5 h-5" /> },
    { path: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { path: 'schedule', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
  ];

  const stats = [
    {
      title: 'Total Courses',
      value: calculatedCourses,
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-yellow-600 to-yellow-500',
      change: 'Active courses',
      trend: 'up'
    },
    {
      title: 'Total Students',
      value: calculatedStudents,
      icon: <Users className="w-6 h-6" />,
      color: 'from-yellow--500 to-pink-400',
      change: 'Unique enrolled',
      trend: 'up'
    },
    {
      title: 'Total Earnings',
      value: `₦${calculatedEarnings.toLocaleString()}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-yellow-500 to-yellow-400',
      change: 'Net income',
      trend: 'up'
    },
    {
      title: 'Average Rating',
      value: calculatedRating,
      icon: <Star className="w-6 h-6" />,
      color: 'from-amber-500 to-yellow-400',
      change: 'Performance score',
      trend: 'neutral'
    },
  ];

  // Updated paths to absolute URLs to fix routing issues
  const quickActions = [
    { title: 'Create New Course', icon: <PlusCircle className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-600', path: '/tutor/manage/create' },
    { title: 'Schedule Live Class', icon: <Calendar className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-600', path: '/tutor/schedule' },
    { title: 'Go Live', icon: <Sparkles className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-600', path: '/tutor/schedule' }
  ];

  const LeaderboardPage = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Tutor Leaderboard</h2>
          <p className="opacity-90">Top performing instructors by sales volume</p>
        </div>
        <Trophy className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white opacity-20" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Instructor</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Courses</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Sales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaderboard.map((tutor, index) => (
              <tr 
                key={tutor.id} 
                className={`transition-colors ${tutor.is_current_user ? 'bg-yellow-50 border-l-4 border-yellow-500' : 'hover:bg-gray-50'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {index === 0 && <Crown className="w-5 h-5 text-yellow-500 mr-2" />}
                    {index === 1 && <Medal className="w-5 h-5 text-gray-400 mr-2" />}
                    {index === 2 && <Medal className="w-5 h-5 text-amber-700 mr-2" />}
                    <span className={`font-bold ${index < 3 ? 'text-gray-900' : 'text-gray-500'}`}>#{index + 1}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold mr-3 bg-gradient-to-br from-yellow-500 to-yellow-500`}>
                      {tutor.avatar_initial}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {tutor.name} {tutor.is_current_user && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-yellow-200 text-yellow-800">You</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {getRankBadge(index + 1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                  {tutor.courses_created}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-yellow-600">
                  {tutor.sales}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loadingSummary) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-yellow-600" /></div>;
  if (!summary) return <div className="min-h-screen flex items-center justify-center">Unable to load dashboard.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-yellow-50 relative">
      <GospelVideoModal />
      {accountLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="bg-white rounded-lg shadow-lg p-6 z-50 max-w-md mx-4">
            <h3 className="text-lg font-bold mb-2">Account Locked</h3>
            <p className="text-sm text-gray-600 mb-4">Your tutor account is currently locked. Please activate your account to access all features.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => navigate(`/activate?type=account&return_to=${encodeURIComponent('/tutor/overview')}`)} className="px-4 py-2 bg-yellow-600 text-white rounded">Unlock Account</button>
            </div>
          </div>
        </div>
      )}
      {/* Top Header */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3">
                {sidebarOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
              </button>
              <Link to={base} className="flex items-center space-x-3">
                <img src={labanonLogo} alt="LightHub Academy" className="w-8 h-8 object-contain" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Tutor Dashboard</h1>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowMessageModal(true)} className="relative p-2 rounded-lg hover:bg-gray-100"><Bell className="w-5 h-5 text-gray-600" /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span></motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowInbox(true)} className="relative p-2 rounded-lg hover:bg-gray-100"><Mail className="w-5 h-5 text-gray-600" /></motion.button>
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">{summary?.username?.charAt(0).toUpperCase() || 'T'}</div>
                <div><p className="text-sm font-semibold text-gray-900">{summary?.username || 'Tutor'}</p><p className="text-xs text-gray-500">Certified Tutor</p></div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={accountLocked ? { filter: 'blur(4px)', pointerEvents: 'none' } : {}}>
        <div className="flex flex-col lg:flex-row gap-6">
          <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">{summary?.username?.charAt(0).toUpperCase() || 'T'}</div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{summary?.username || 'Tutor'}</h3>
                    <p className="text-sm text-gray-500">Certified Tutor</p>
                    <div className="flex items-center mt-1">{[1,2,3,4,5].map((i) => (<Star key={i} className={`w-3 h-3 ${i<=Math.round(calculatedRating)?'text-yellow-400 fill-current':'text-gray-300'}`} />))}<span className="ml-1 text-xs font-semibold">{calculatedRating}</span></div>
                  </div>
                </div>
              </div>
              <nav className="space-y-2">{navItems.map(item => (<Link key={item.path} to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActivePath(item.path) ? 'bg-gradient-to-r from-yellow-50 to-yellow-50 text-yellow-600 border-l-4 border-yellow-500' : 'text-gray-700 hover:bg-gray-50'}`}>{item.icon}<span className="font-medium">{item.label}</span></Link>))}</nav>
              <Link to="/tutor/manage/create" className="mt-6 w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow inline-flex items-center justify-center"><PlusCircle className="w-5 h-5 inline mr-2" />Create New Course</Link>
              <button onClick={handleLogout} className="mt-3 w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-2 border border-red-200"><LogOut className="w-5 h-5" />Logout</button>
            </div>
          </motion.aside>

          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
              <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8"><h2 className="text-lg font-bold text-gray-900">Menu</h2><button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-6 h-6" /></button></div>
                <nav className="space-y-2">{navItems.map((item) => (<Link key={item.path} to={item.path} className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50" onClick={() => setSidebarOpen(false)}>{item.icon}<span>{item.label}</span></Link>))}</nav>
                <button onClick={() => { handleLogout(); setSidebarOpen(false); }} className="mt-4 w-full py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 flex items-center justify-center gap-2 border border-red-200"><LogOut className="w-4 h-4" />Logout</button>
              </motion.aside>
            </div>
          )}

          <div className="flex-1">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <Routes>
                  <Route path="overview" element={
                    <div>
                      <div className="mb-6"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {summary?.username}! 🎓</h1></div><motion.button whileHover={{ scale: 1.05 }} className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-semibold"><Sparkles className="w-5 h-5 inline mr-2" />Go Live</motion.button></div></div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">{quickActions.map((a, i) => (<motion.div key={i} whileHover={{ y: -5 }} className="bg-white rounded-xl shadow-lg p-4"><Link to={a.path}><div className={`w-12 h-12 ${a.color} rounded-xl flex items-center justify-center mb-3`}>{a.icon}</div><h3 className="font-semibold text-gray-900">{a.title}</h3></Link></motion.div>))}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">{stats.map((s, i) => (<motion.div key={i} whileHover={{ y: -5 }} className="bg-white rounded-2xl shadow-lg p-6"><div className="flex justify-between items-center"><div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white`}>{s.icon}</div><div className="text-right"><div className="text-2xl font-bold text-gray-900">{s.value}</div><div className="text-sm text-gray-500">{s.change}</div></div></div><h3 className="font-semibold text-gray-900 mt-4">{s.title}</h3></motion.div>))}</div>
                      <div className="grid grid-cols-1 gap-8">
                        {/* Leaderboard Widget */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                          <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-900 flex items-center"><Trophy className="w-5 h-5 text-yellow-500 mr-2" /> Top Instructors</h3><Link to="/tutor/leaderboard" className="text-sm text-yellow-600 hover:underline">View Full Leaderboard</Link></div>
                          <div className="space-y-4">
                            {leaderboard.slice(0, 3).map((t, idx) => (
                              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center">
                                  <span className={`font-bold mr-3 ${idx===0?'text-yellow-600':idx===1?'text-gray-500':'text-amber-700'}`}>#{idx+1}</span>
                                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold text-yellow-700 mr-2">{t.avatar_initial}</div>
                                  <div className="text-sm font-semibold">{t.name}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                   {getRankBadge(idx+1)}
                                   <div className="text-sm font-bold text-yellow-600">{t.sales} Sales</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  } />
                  <Route path="manage" element={<ManageCourses uploadCourseImageHandler={handleUploadCourseImage} uploadLessonMediaHandler={handleUploadLessonMedia} />} />
                  <Route path="manage/create" element={<CreateCourse />} />
                  <Route path="manage/:id" element={<ManageCourseDetail uploadCourseImageHandler={handleUploadCourseImage} uploadLessonMediaHandler={handleUploadLessonMedia} />} />
                  <Route path="students" element={<div><h2 className="text-xl font-semibold mb-4">Students</h2>{studentsLoading ? <div>Loading...</div> : (<div className="space-y-3">{studentPurchases.length === 0 && <div>No students found.</div>}{studentPurchases.map((p: any, idx) => (<div key={idx} className="p-3 border rounded flex justify-between"><div><div className="font-bold">{p.buyer?.name || p.user?.name || 'Student'}</div><div className="text-sm">{p.course?.title || 'Course'}</div></div><div className="font-bold">₦{Number(p.amount || 0).toLocaleString()}</div></div>))}</div>)}</div>} />
                  <Route path="analytics" element={<div className="grid md:grid-cols-2 gap-6"><div className="h-64"><ResponsiveContainer><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="Sales" fill="#10B981"/><Bar dataKey="Revenue" fill="#06b6d4"/></BarChart></ResponsiveContainer></div><div className="h-64"><ResponsiveContainer><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Line type="monotone" dataKey="Revenue" stroke="#0ea5a4"/><Line type="monotone" dataKey="Sales" stroke="#059669"/></LineChart></ResponsiveContainer></div></div>} />
                   
                  {/* Earnings Tab - UPDATED to show both Active details AND update form */}
                  <Route path="earnings" element={
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Earnings</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow border border-yellow-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm text-yellow-700 font-medium">Net Earnings</div>
                              <div className="text-3xl font-bold mt-2 text-yellow-900">₦{(tutorShare || 0).toLocaleString()}</div>
                              <div className="text-xs text-yellow-600 mt-1">After platform fee (5%) and gateway fees</div>
                            </div>
                            <div className="text-4xl text-yellow-600 font-bold">₦</div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow border border-yellow-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm text-yellow-700 font-medium">Total Revenue</div>
                              <div className="text-3xl font-bold mt-2 text-yellow-900">₦{(calculatedEarnings || 0).toLocaleString()}</div>
                              <div className="text-xs text-yellow-600 mt-1">Gross amount from all course sales</div>
                            </div>
                            <div className="text-4xl text-yellow-600 font-bold">₦</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-semibold">Payouts & Payment Method</h3>
                          <p className="text-sm text-gray-500">Connect your Paystack/Flutterwave account to receive payouts.</p>
                        </div>
                      </div>

                      {/* Payout Schedule Information Banner */}
                      <div className="mb-6">
                        <PayoutScheduleInfo variant="banner" userRole="tutor" />
                      </div>

                      <div className="grid md:grid-cols-3 gap-6 mt-6">
                        <div className="md:col-span-2">
                          <PaymentHistory userRole="tutor" />
                        </div>
                        <div className="space-y-6">
                          {/* Paystack Section */}
                          <PaystackSubAccountForm />
                          
                          {/* Flutterwave Section */}
                          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                            <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">Flutterwave</h3>
                            
                            {/* 1. Show Existing Account Details if available */}
                            {fwAccount && (
                              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                                  <div className="flex items-center gap-2 mb-3">
                                      <div className="p-1.5 bg-yellow-200 rounded-full">
                                          <CreditCard className="w-4 h-4 text-yellow-700" />
                                      </div>
                                      <h4 className="font-bold text-yellow-800 text-sm">Active Account</h4>
                                  </div>
                                  <div className="space-y-1.5 text-sm">
                                      <div className="flex justify-between">
                                          <span className="text-gray-500">Name:</span>
                                          <span className="font-semibold text-gray-800">{fwAccount.account_name}</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-gray-500">Account:</span>
                                          <span className="font-semibold text-gray-800">{fwAccount.account_number}</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-gray-500">Bank Code:</span>
                                          <span className="font-semibold text-gray-800">{fwAccount.bank_code}</span>
                                      </div>
                                      <div className="pt-2 mt-2 border-t border-yellow-100 flex items-center text-yellow-700 text-xs font-bold">
                                          <CheckCircle className="w-3 h-3 mr-1" /> Verified & Active
                                      </div>
                                  </div>
                              </div>
                            )}

                            {/* 2. Show Form for Updates/Creation */}
                            <div className="pt-2">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
                                  <Edit3 className="w-3 h-3" />
                                  {fwAccount ? 'Update Bank Details' : 'Add Bank Account'}
                                </div>
                                {/* Add the FlutterwaveSubAccountSetup component here */}
                                <FlutterwaveSubAccountSetup />
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  } />
                   
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                  <Route path="schedule" element={<div className="p-4"><SchedulePage userRole="tutor" /></div>} />
                  <Route path="" element={<div><h2 className="text-2xl font-bold mb-4">Welcome</h2><div className="bg-yellow-50 p-8 rounded-xl"><Link to="/tutor/manage/create" className="px-6 py-3 bg-yellow-600 text-white rounded-lg">Create Course</Link></div></div>} />
                </Routes>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 flex justify-around items-center h-16">{navItems.slice(0,4).map(item => (<Link key={item.path} to={item.path} className={`flex flex-col items-center ${isActivePath(item.path)?'text-yellow-600':'text-gray-600'}`}>{item.icon}<span className="text-xs">{item.label}</span></Link>))}</div>
      <MessageModal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} />
      <UserMessages isOpen={showInbox} onClose={() => setShowInbox(false)} />
    </div>
  );
}