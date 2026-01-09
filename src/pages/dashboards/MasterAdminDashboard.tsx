import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Building,
  BookOpen,
  FileText,
  Upload,
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Settings,
  BarChart3,
  User,
  Mail,
  GraduationCap,
  Briefcase,
  Building2,
  UserCog,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Globe,
  LogOut,
  Clock,
  Menu,
  X
} from 'lucide-react'
import labanonLogo from '../labanonlogo.png'
import CreateCourse from '../CreateCourse'
import SubAdminForm from '../../components/dashboards/SubAdminForm'
import AdminMessages from '../../components/AdminMessages'
import PaymentHistory from '../../components/PaymentHistory'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface MasterProps {
  summary?: any
}

// Define permission keys strictly to match backend
type PermissionKey = 
  | 'can_manage_users'
  | 'can_manage_institutions'
  | 'can_manage_courses'
  | 'can_manage_cbt'
  | 'can_view_payments'
  | 'can_manage_blog'
  | 'can_view_messages' // Ensure this matches backend serializer
  | 'can_manage_subadmins'; // Implicit permission for Master Admin

export default function MasterAdminDashboard({ summary: propSummary }: MasterProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const navSummary = (location.state as any)?.summary
  const [summary, setSummary] = useState<any | null>(propSummary ?? navSummary ?? null)

  const [tab, setTab] = useState<string>('users')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [pageInfo, setPageInfo] = useState<{count: number; next: string | null; previous: string | null; current: number}>({count:0,next:null,previous:null,current:1})
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [bulkData, setBulkData] = useState('')
  const [exams, setExams] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedExam, setSelectedExam] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [subjects, setSubjects] = useState<any[]>([])
  const [loadingSummary, setLoadingSummary] = useState(!summary)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{open: boolean; userId: number | null; userName: string}>({open: false, userId: null, userName: ''})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [creatingCourse, setCreatingCourse] = useState(false)
  const [showSubAdminForm, setShowSubAdminForm] = useState(false)
  const [institutions, setInstitutions] = useState<any[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<any | null>(null)
  const [institutionLoading, setInstitutionLoading] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [cbtAnalytics, setCbtAnalytics] = useState<any>(null)
  const [cbtLoading, setCbtLoading] = useState(false)
  const [payments, setPayments] = useState<any[]>([])
  const [paymentStats, setPaymentStats] = useState<any>(null)
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [blogs, setBlogs] = useState<any[]>([])
  const [blogsLoading, setBlogsLoading] = useState(false)
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [blogFormData, setBlogFormData] = useState({title: '', content: '', image: '', excerpt: ''})
  const [subadminPermissions, setSubadminPermissions] = useState<Record<string, boolean> | null>(null)
  const [editingBlog, setEditingBlog] = useState<any | null>(null)
  const [settingsData, setSettingsData] = useState({firstName: '', lastName: '', email: ''})
  const [passwordData, setPasswordData] = useState({old_password: '', new_password: '', confirm_password: ''})
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Define tabs
  const allTabs = [
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" />, permission: 'can_manage_users' as PermissionKey },
    { id: 'institutions', label: 'Institutions', icon: <Building className="w-5 h-5" />, permission: 'can_manage_institutions' as PermissionKey },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" />, permission: 'can_manage_courses' as PermissionKey },
    { id: 'cbt', label: 'CBT / Exams', icon: <FileText className="w-5 h-5" />, permission: 'can_manage_cbt' as PermissionKey },
    { id: 'payments', label: 'Payments', icon: <BarChart3 className="w-5 h-5" />, permission: 'can_view_payments' as PermissionKey },
    { id: 'blog', label: 'Blog', icon: <BookOpen className="w-5 h-5" />, permission: 'can_manage_blog' as PermissionKey },
    { id: 'messages', label: 'Messages', icon: <Mail className="w-5 h-5" />, permission: 'can_view_messages' as PermissionKey },
    // Bulk upload tied to course management permission usually
    { id: 'bulk', label: 'Bulk Upload', icon: <Upload className="w-5 h-5" />, permission: 'can_manage_courses' as PermissionKey },
  ]

  // Filter tabs based on permissions
  const tabs = subadminPermissions 
    ? allTabs.filter(tab => {
        // Explicit check: strictly true or undefined (fallback logic if needed, but strictly true is safer)
        return subadminPermissions[tab.permission] === true;
      })
    : allTabs;

  // Load sub-admin permissions from summary
  useEffect(() => {
    if (summary?.subadmin_profile) {
      setSubadminPermissions(summary.subadmin_profile)
    }
  }, [summary])

  // Ensure current tab is accessible
  useEffect(() => {
    // Only redirect if permissions are loaded and tabs are calculated
    if (subadminPermissions && tabs.length > 0) {
      const currentTabAllowed = tabs.some(t => t.id === tab);
      if (!currentTabAllowed) {
        setTab(tabs[0].id); // Default to first allowed tab
      }
    } else if (subadminPermissions && tabs.length === 0) {
        // Edge case: Subadmin exists but has 0 permissions
        // Maybe handle this UI state? currently it just shows empty
    }
  }, [subadminPermissions, tabs, tab])

  // Data Loading Effects
  useEffect(() => {
    // Only load if the tab is actually active/allowed
    if (tab === 'users') loadUsers()
    if (tab === 'bulk') loadExams()
    if (tab === 'institutions') loadInstitutions()
    if (tab === 'courses') loadCourses()
    if (tab === 'cbt') loadCbtAnalytics()
    if (tab === 'payments') loadPayments()
    if (tab === 'blog') loadBlogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // fetch summary if not provided
  useEffect(() => {
    let mounted = true
    async function loadSummary() {
      if (summary) {
        setLoadingSummary(false)
        return
      }
      const token = localStorage.getItem('access')
      if (!token) {
        window.location.href = '/login'
        return
      }
      setLoadingSummary(true)
      try {
        const res = await axios.get(`${API_BASE}/dashboard/`, { headers: { Authorization: `Bearer ${token}` } })
        if (!mounted) return
        setSummary(res.data)
      } catch (err) {
        console.error('Failed to load admin summary:', err)
      } finally {
        if (mounted) setLoadingSummary(false)
      }
    }
    loadSummary()
    return () => { mounted = false }
  }, [propSummary, navSummary, summary])

  // --- API Functions ---

  async function loadUsers(page = 1) {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const params: any = { page }
      if (searchTerm) params.search = searchTerm
      if (roleFilter) params.role = roleFilter
      const res = await axios.get(`${API_BASE}/admin/users/`, { params, headers: { Authorization: `Bearer ${token}` } })
      const data = res.data
      const items = data.results || data
      setUsers(items)
      setPageInfo({ count: data.count || items.length, next: data.next || null, previous: data.previous || null, current: page })
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function loadExams() {
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/cbt/exams/`, { headers: { Authorization: `Bearer ${token}` } })
      setExams(res.data.results || res.data)
    } catch (err) { console.error(err) }
  }

  async function loadInstitutions() {
    setInstitutionLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/institutions/`, { headers: { Authorization: `Bearer ${token}` } })
      const data = res.data.results || res.data
      setInstitutions(Array.isArray(data) ? data : [])
    } catch (err) { 
      console.error(err)
      setInstitutions([])
    } finally {
      setInstitutionLoading(false)
    }
  }

  async function loadCourses() {
    setCoursesLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/courses/`, { headers: { Authorization: `Bearer ${token}` } })
      const data = res.data.results || res.data
      setCourses(Array.isArray(data) ? data : [])
    } catch (err) { 
      console.error(err)
      setCourses([])
    } finally {
      setCoursesLoading(false)
    }
  }

  async function loadCbtAnalytics() {
    setCbtLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/cbt/analytics/`, { headers: { Authorization: `Bearer ${token}` } })
      setCbtAnalytics(res.data)
    } catch (err) { 
      console.error(err)
      setCbtAnalytics({
        total_attempts: 0,
        total_exams: exams.length,
        average_score: 0,
        subjects: []
      })
    } finally {
      setCbtLoading(false)
    }
  }

  async function loadPayments() {
    setPaymentsLoading(true)
    try {
      const token = localStorage.getItem('access')
      const [paymentsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/payments/admin_list/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/payments/stats/`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      const paymentData = paymentsRes.data.results || paymentsRes.data
      setPayments(Array.isArray(paymentData) ? paymentData : [])
      setPaymentStats(statsRes.data)
    } catch (err) { 
      console.error(err)
      setPayments([])
      setPaymentStats({
        total_revenue: 0,
        total_transactions: 0,
        platform_commission: 0,
        pending_payouts: 0
      })
    } finally {
      setPaymentsLoading(false)
    }
  }

  async function loadBlogs() {
    setBlogsLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/blog/`, { headers: { Authorization: `Bearer ${token}` } })
      const data = res.data.results || res.data
      setBlogs(Array.isArray(data) ? data : [])
    } catch (err) { 
      console.error(err)
      setBlogs([])
    } finally {
      setBlogsLoading(false)
    }
  }

  async function saveBlog() {
    if (!blogFormData.title.trim() || !blogFormData.content.trim()) {
      alert('Title and content are required')
      return
    }
    try {
      const token = localStorage.getItem('access')
      const payload = {
        title: blogFormData.title,
        content: blogFormData.content,
        image: blogFormData.image,
        excerpt: blogFormData.excerpt
      }

      if (editingBlog) {
        await axios.patch(`${API_BASE}/blog/${editingBlog.id}/`, payload, { headers: { Authorization: `Bearer ${token}` } })
      } else {
        await axios.post(`${API_BASE}/blog/`, payload, { headers: { Authorization: `Bearer ${token}` } })
      }
      
      setShowBlogForm(false)
      setBlogFormData({title: '', content: '', image: '', excerpt: ''})
      setEditingBlog(null)
      loadBlogs()
    } catch (err) {
      console.error(err)
      alert('Failed to save blog')
    }
  }

  async function publishBlog(blogId: number) {
    try {
      const token = localStorage.getItem('access')
      await axios.post(`${API_BASE}/blog/${blogId}/publish/`, {}, { headers: { Authorization: `Bearer ${token}` } })
      loadBlogs()
    } catch (err) {
      console.error(err)
      alert('Failed to publish blog')
    }
  }

  async function deleteBlog(blogId: number) {
    if (!confirm('Delete this blog post?')) return
    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/blog/${blogId}/`, { headers: { Authorization: `Bearer ${token}` } })
      loadBlogs()
    } catch (err) {
      console.error(err)
      alert('Failed to delete blog')
    }
  }

  async function updateProfile() {
    setSettingsSaving(true)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.put(`${API_BASE}/users/profile-update/`, {
        first_name: settingsData.firstName,
        last_name: settingsData.lastName,
        email: settingsData.email
      }, { headers: { Authorization: `Bearer ${token}` } })
      setSettingsMessage({ type: 'success', text: 'Profile updated successfully' })
      setTimeout(() => setSettingsMessage(null), 3000)
    } catch (err: any) {
      setSettingsMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' })
    } finally {
      setSettingsSaving(false)
    }
  }

  async function changePassword() {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setSettingsMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (passwordData.new_password.length < 8) {
      setSettingsMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }
    setSettingsSaving(true)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.post(`${API_BASE}/users/change-password/`, {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password
      }, { headers: { Authorization: `Bearer ${token}` } })
      setSettingsMessage({ type: 'success', text: 'Password changed successfully' })
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
      setTimeout(() => setSettingsMessage(null), 3000)
    } catch (err: any) {
      setSettingsMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' })
    } finally {
      setSettingsSaving(false)
    }
  }

  async function loadSubjects(examId: string) {
    if (!examId) {
      setSubjects([])
      return
    }
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/cbt/exams/${examId}/subjects/`, { headers: { Authorization: `Bearer ${token}` } })
      setSubjects(res.data || [])
      setSelectedSubject('')
    } catch (err) { console.error(err) }
  }

  async function deleteUser(id: number) {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return
    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/admin/users/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
      setUsers((u) => u.filter((x) => x.id !== id))
      setSelectedUser(null)
      setDeleteConfirmation({open: false, userId: null, userName: ''})
    } catch (err) { 
      console.error(err); 
      alert('Failed to delete user. Please try again.') 
    }
  }

  const confirmDeleteUser = async () => {
    if (!deleteConfirmation.userId) return
    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/admin/users/${deleteConfirmation.userId}/`, { headers: { Authorization: `Bearer ${token}` } })
      setUsers((u) => u.filter((x) => x.id !== deleteConfirmation.userId))
      setSelectedUser(null)
      setDeleteConfirmation({open: false, userId: null, userName: ''})
    } catch (err) { 
      console.error(err); 
      alert('Failed to delete user. Please try again.') 
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/login')
  }

  async function submitBulk() {
    if (!selectedExam) {
      alert('Please select an exam')
      return
    }
    if (!selectedSubject) {
      alert('Please select a subject')
      return
    }
    if (!bulkData.trim()) {
      alert('Please enter questions data')
      return
    }
    
    try {
      let questionsArray = JSON.parse(bulkData)
      if (questionsArray.questions && Array.isArray(questionsArray.questions)) {
        questionsArray = questionsArray.questions
      }
      
      if (!Array.isArray(questionsArray)) {
        alert('JSON must be an array of questions or an object with a "questions" array')
        return
      }
      
      const token = localStorage.getItem('access')
      const payload = {
        exam_id: selectedExam,
        subject: selectedSubject,
        year: new Date().getFullYear(),
        questions: questionsArray
      }
      
      const res = await axios.post(`${API_BASE}/cbt/bulk-upload/`, payload, { headers: { Authorization: `Bearer ${token}` } })
      alert(`✅ Successfully uploaded ${res.data.success || questionsArray.length} questions!`)

      setBulkData('')
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.detail || 'Failed to upload questions. Please check your JSON format and try again.'
      alert('❌ ' + errorMsg)
    }
  }

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'student': return <GraduationCap className="w-4 h-4" />
      case 'tutor': return <UserCog className="w-4 h-4" />
      case 'institution': return <Building2 className="w-4 h-4" />
      case 'researcher': return <Briefcase className="w-4 h-4" />
      case 'admin': return <Shield className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'student': return 'bg-green-100 text-green-800'
      case 'tutor': return 'bg-teal-100 text-teal-800'
      case 'institution': return 'bg-green-100 text-green-800'
      case 'researcher': return 'bg-amber-100 text-amber-800'
      case 'admin': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loadingSummary) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    </div>
  )
   
  if (!summary) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load dashboard</h2>
        <p className="text-gray-600">Please try refreshing the page or contact support</p>
      </div>
    </div>
  )

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
            <div className="flex items-center space-x-3">
              <img src={labanonLogo} alt="Lebanon Academy" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {subadminPermissions ? 'Sub-Admin Dashboard' : 'Master Admin Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {summary.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{summary.username}</p>
                  <p className="text-xs text-gray-500">
                    {subadminPermissions ? 'Restricted Access' : 'Master Administrator'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
                title="Toggle menu"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 relative">
          {/* Sidebar Backdrop for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 lg:hidden z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`${
              sidebarOpen ? 'fixed left-0 top-16 bottom-0 w-64 z-40' : 'hidden'
            } lg:static lg:block lg:w-64 lg:flex-shrink-0 h-fit lg:h-auto`}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 max-h-[calc(100vh-100px)] overflow-y-auto">
              {/* Admin Profile */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {summary.username?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{summary.username}</h3>
                    <p className="text-sm text-gray-500">
                      {subadminPermissions ? 'Sub-Admin' : 'Master Administrator'}
                    </p>
                    <div className="flex items-center mt-1 text-xs">
                      <Database className="w-3 h-3 text-green-500 mr-1" />
                      <span className="font-medium">
                        {subadminPermissions ? 'Limited Access' : 'Full System Access'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {tabs.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 5 }}
                    onClick={() => {
                      setTab(item.id)
                      setSidebarOpen(false)
                    }}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                      tab === item.id
                        ? 'bg-gradient-to-r from-green-50 to-teal-50 text-green-600 border-l-4 border-green-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`${tab === item.id ? 'text-green-600' : 'text-gray-500'}`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </nav>

              {/* System Stats */}
              <div className="mt-8 pt-8 border-t">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">System Overview</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="font-semibold">{pageInfo.count?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <span className="font-semibold">{(summary.active_sessions || 142).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSettings(true)}
                className="mt-6 w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
              >
                <Settings className="w-5 h-5 inline mr-2" />
                System Settings
              </motion.button>
            </div>
          </motion.aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Welcome Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome back, <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">{summary.username}</span>
              </h1>
              <p className="text-gray-600 mt-2">
                {subadminPermissions 
                  ? 'Accessing authorized modules and configurations.' 
                  : 'Manage users, courses, exams, and system configurations'}
              </p>
            </motion.div>

            {/* Tab Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={tab}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Tab Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {tabs.find(t => t.id === tab)?.icon}
                    <h2 className="text-xl font-semibold text-gray-900">
                      {tabs.find(t => t.id === tab)?.label}
                    </h2>
                  </div>
                  {tab === 'users' && (
                    <div className="text-sm text-gray-500">
                      Total: <span className="font-semibold">{pageInfo.count?.toLocaleString() || '0'}</span> users
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Content */}
              <div className="p-6">
                {tab === 'users' && (
                  // ... (User management JSX content) ...
                  <div>
                    {/* Search and Filter */}
                    <div className="mb-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search users by name or email"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        >
                          <option value="">All Roles</option>
                          <option value="student">Student</option>
                          <option value="tutor">Tutor</option>
                          <option value="institution">Institution</option>
                          <option value="researcher">Researcher</option>
                          <option value="admin">Admin</option>
                        </select>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => loadUsers(1)}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg"
                        >
                          <Filter className="w-5 h-5 inline mr-2" />
                          Apply Filters
                        </motion.button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
                        <span className="text-gray-600">Loading users...</span>
                      </div>
                    ) : (
                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* User List */}
                        <div>
                          {users.length === 0 ? (
                            <div className="text-center py-12">
                              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">No users found</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {users.map((user) => (
                                <motion.div
                                  key={user.id}
                                  whileHover={{ x: 5 }}
                                  onClick={() => setSelectedUser(user)}
                                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    selectedUser?.id === user.id
                                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-teal-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        {user.username?.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900">{user.username}</h4>
                                        <div className="flex items-center mt-1 space-x-3">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                            {getRoleIcon(user.role)}
                                            <span className="ml-1">{user.role}</span>
                                          </span>
                                          <span className="text-sm text-gray-500">{user.email}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedUser(user)
                                        }}
                                        className="p-2 text-gray-500 hover:text-green-600"
                                      >
                                        <Eye className="w-5 h-5" />
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setDeleteConfirmation({open: true, userId: user.id, userName: user.username})
                                        }}
                                        className="p-2 text-gray-500 hover:text-red-600"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </motion.button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}

                          {/* Pagination */}
                          {users.length > 0 && (
                            <div className="mt-6 flex items-center justify-between">
                              <div className="text-sm text-gray-600">
                                Showing page {pageInfo.current} of {Math.ceil(pageInfo.count / 10)}
                              </div>
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => loadUsers(Math.max(1, pageInfo.current - 1))}
                                  disabled={!pageInfo.previous}
                                  className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                                    pageInfo.previous
                                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  <ChevronLeft className="w-4 h-4 mr-1" />
                                  Previous
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => loadUsers(pageInfo.current + 1)}
                                  disabled={!pageInfo.next}
                                  className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                                    pageInfo.next
                                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  Next
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* User Details */}
                        <div className="lg:border-l lg:pl-6">
                          {selectedUser ? (
                            <div>
                              <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Details</h3>
                                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6">
                                  <div className="flex items-center space-x-4 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                                      {selectedUser.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <h4 className="text-xl font-bold text-gray-900">{selectedUser.username}</h4>
                                      <div className="flex items-center mt-2">
                                        <span className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${getRoleColor(selectedUser.role)}`}>
                                          {getRoleIcon(selectedUser.role)}
                                          <span className="ml-2">{selectedUser.role}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                      <div className="flex items-center p-3 bg-white rounded-lg">
                                        <Mail className="w-5 h-5 text-gray-400 mr-3" />
                                        <span className="text-gray-900">{selectedUser.email}</span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <div className="p-3 bg-white rounded-lg">
                                          <span className="text-gray-900">{selectedUser.first_name || 'Not provided'}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <div className="p-3 bg-white rounded-lg">
                                          <span className="text-gray-900">{selectedUser.last_name || 'Not provided'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">Select a user to view details</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'institutions' && (
                  <div>
                    {institutionLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
                        <span className="text-gray-600">Loading institutions...</span>
                      </div>
                    ) : (
                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* Institutions List */}
                        <div>
                          {institutions.length === 0 ? (
                            <div className="text-center py-12">
                              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">No institutions found</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {institutions.map((institution) => (
                                <motion.div
                                  key={institution.id}
                                  whileHover={{ x: 5 }}
                                  onClick={() => setSelectedInstitution(institution)}
                                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    selectedInstitution?.id === institution.id
                                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-teal-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        {institution.name?.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900">{institution.name}</h4>
                                        <div className="flex items-center mt-1 space-x-3">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${institution.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {institution.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                            {institution.is_active ? 'Active' : 'Inactive'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Institution Details */}
                        <div className="lg:border-l lg:pl-6">
                          {selectedInstitution ? (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Institution Details</h3>
                              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6">
                                <div className="flex items-center space-x-4 mb-6">
                                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                                    {selectedInstitution.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className="text-xl font-bold text-gray-900">{selectedInstitution.name}</h4>
                                    <div className="flex items-center mt-2">
                                      <span className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${selectedInstitution.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {selectedInstitution.is_active ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <div className="p-3 bg-white rounded-lg">
                                      <p className="text-gray-900">{selectedInstitution.description || 'No description provided'}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                                    <div className="p-3 bg-white rounded-lg">
                                      <span className="text-gray-900">{selectedInstitution.owner_username || 'N/A'}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Courses</label>
                                    <div className="p-3 bg-white rounded-lg">
                                      <span className="text-gray-900 font-semibold">{selectedInstitution.courses_count || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">Select an institution to view details</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'courses' && (
                  <div>
                    {creatingCourse ? (
                      <div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCreatingCourse(false)}
                          className="mb-6 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          ← Back to Courses
                        </motion.button>
                        <CreateCourse />
                      </div>
                    ) : coursesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
                        <span className="text-gray-600">Loading courses...</span>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-6 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">All Courses</h3>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCreatingCourse(true)}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg"
                          >
                            <BookOpen className="w-5 h-5 inline mr-2" />
                            Create Course
                          </motion.button>
                        </div>
                        
                        {courses.length === 0 ? (
                          <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No courses found</p>
                          </div>
                        ) : (
                          <div className="grid lg:grid-cols-2 gap-6">
                            {courses.map((course) => (
                              <motion.div
                                key={course.id}
                                whileHover={{ y: -5 }}
                                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                              >
                                <div className="aspect-video bg-gradient-to-br from-green-500 to-teal-500 relative">
                                  {course.image && (
                                    <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                                  )}
                                  <div className="absolute top-4 right-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.published ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                                      {course.published ? 'Published' : 'Draft'}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-6">
                                  <h4 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h4>
                                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                                  
                                  <div className="space-y-3 mb-4">
                                    <div className="flex items-center text-sm text-gray-700">
                                      <User className="w-4 h-4 mr-2 text-gray-500" />
                                      <span><strong>Creator:</strong> {course.creator_username || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-700">
                                      <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                                      <span><strong>Institution:</strong> {course.institution_name || 'Self'}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-700">
                                      <span className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full mr-2">
                                        {new Date(course.created_at).toLocaleDateString()}
                                      </span>
                                      <span><strong>Price:</strong> ${parseFloat(course.price || 0).toFixed(2)}</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-3">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200"
                                    >
                                      View
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                                    >
                                      Edit
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'cbt' && (
                  <div>
                    {cbtLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
                        <span className="text-gray-600">Loading analytics...</span>
                      </div>
                    ) : (
                      <div>
                        {/* Analytics Cards */}
                        <div className="grid md:grid-cols-4 gap-4 mb-8">
                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Total Exams</h3>
                            <p className="text-3xl font-bold text-green-900">{exams.length}</p>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Total Attempts</h3>
                            <p className="text-3xl font-bold text-green-900">{cbtAnalytics?.total_attempts || 0}</p>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Avg Score</h3>
                            <p className="text-3xl font-bold text-teal-900">{cbtAnalytics?.average_score?.toFixed(1) || '0'}%</p>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Subjects</h3>
                            <p className="text-3xl font-bold text-orange-900">{cbtAnalytics?.subjects?.length || 0}</p>
                          </motion.div>
                        </div>

                        {/* Exams List */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Exams</h3>
                          {exams.length === 0 ? (
                            <div className="text-center py-12">
                              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">No exams found</p>
                            </div>
                          ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {exams.map((exam) => (
                                <motion.div
                                  key={exam.id}
                                  whileHover={{ y: -5 }}
                                  className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-white" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">{exam.title}</h4>
                                        <div className="text-xs text-gray-500 mt-1">ID: {exam.id}</div>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">{exam.description || 'No description available'}</p>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600">Questions:</span>
                                      <span className="font-semibold text-gray-900">{exam.question_count || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600">Type:</span>
                                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                        {exam.exam_type || 'Standard'}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'payments' && (
                  <div>
                    {paymentsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
                        <span className="text-gray-600">Loading payment data...</span>
                      </div>
                    ) : (
                      <div>
                        {/* Payment Stats Cards */}
                        <div className="grid md:grid-cols-4 gap-4 mb-8">
                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Total Revenue</h3>
                            <p className="text-3xl font-bold text-green-900">${(paymentStats?.total_revenue || 0).toFixed(2)}</p>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Transactions</h3>
                            <p className="text-3xl font-bold text-green-900">{paymentStats?.total_transactions || 0}</p>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Platform Commission</h3>
                            <p className="text-3xl font-bold text-teal-900">${(paymentStats?.platform_commission || 0).toFixed(2)}</p>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                <Clock className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Pending Payouts</h3>
                            <p className="text-3xl font-bold text-orange-900">${(paymentStats?.pending_payouts || 0).toFixed(2)}</p>
                          </motion.div>
                        </div>

                        {/* Transaction History */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Transactions</h3>
                          {payments.length === 0 ? (
                            <div className="text-center py-12">
                              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500">No transactions found</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">ID</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Course</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Amount</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payments.slice(0, 10).map((payment) => (
                                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-900">#{payment.id}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{payment.course_title || 'N/A'}</td>
                                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">${parseFloat(payment.amount || 0).toFixed(2)}</td>
                                      <td className="px-4 py-3 text-sm">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                          payment.status === 'success' ? 'bg-green-100 text-green-800' :
                                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {payment.status === 'success' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                          {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(payment.created_at).toLocaleDateString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'blog' && (
                  <div>
                    {blogsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
                        <span className="text-gray-600">Loading blogs...</span>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-6 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Blog Posts</h3>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowBlogForm(true)
                              setEditingBlog(null)
                              setBlogFormData({title: '', content: '', image: '', excerpt: ''})
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg"
                          >
                            + New Blog Post
                          </motion.button>
                        </div>

                        {blogs.length === 0 ? (
                          <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No blog posts yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {blogs.map((blog) => (
                              <motion.div
                                key={blog.id}
                                whileHover={{ y: -3 }}
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900">{blog.title}</h4>
                                    <p className="text-sm text-gray-500 mt-1">By {blog.author_username} • {new Date(blog.created_at).toLocaleDateString()}</p>
                                  </div>
                                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold ${
                                    blog.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {blog.is_published ? 'Published' : 'Draft'}
                                  </span>
                                </div>
                                
                                {blog.image && (
                                  <img src={blog.image} alt={blog.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                                )}
                                
                                <p className="text-gray-600 mb-4 line-clamp-2">{blog.excerpt || blog.content}</p>
                                
                                <div className="flex gap-3">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setEditingBlog(blog)
                                      setBlogFormData({
                                        title: blog.title,
                                        content: blog.content,
                                        image: blog.image,
                                        excerpt: blog.excerpt
                                      })
                                      setShowBlogForm(true)
                                    }}
                                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200"
                                  >
                                    Edit
                                  </motion.button>
                                  {!blog.is_published && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => publishBlog(blog.id)}
                                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200"
                                    >
                                      Publish
                                    </motion.button>
                                  )}
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => deleteBlog(blog.id)}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
                                  >
                                    Delete
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'bulk' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Question Upload</h3>
                      <p className="text-gray-600">
                        Upload questions in bulk using JSON format. Select an exam and subject first.
                      </p>
                    </div>
                    
                    {/* Exam and Subject Selection */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Exam <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedExamId}
                          onChange={(e) => {
                            const examId = e.target.value
                            setSelectedExamId(examId)
                            // Find the exam object to get the slug for submitBulk
                            const exam = exams.find(ex => String(ex.id) === examId)
                            setSelectedExam(exam?.slug || exam?.id || '')
                            loadSubjects(examId)
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                        >
                          <option value="">Choose an exam...</option>
                          {exams.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                              {exam.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Subject <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          disabled={!selectedExamId}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Choose a subject...</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.name}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 mb-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <Database className="w-6 h-6 text-green-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">JSON Format Example</h4>
                          <p className="text-xs text-gray-600 mb-3">Paste just the questions array below:</p>
                          <pre className="text-xs bg-white p-3 rounded-lg overflow-x-auto">
{`[
  {
    "question_text": "What is the molar volume...",
    "options": {
      "A": "0.89 mol",
      "B": "1.90 mol",
      "C": "3.80 mol",
      "D": "5.70 mol"
    },
    "correct_answer": "A",
    "explanation": "Convert to Kelvin...",
    "subject": "Chemistry"
  }
]`}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paste your JSON data here
                        </label>
                        <textarea
                          value={bulkData}
                          onChange={(e) => setBulkData(e.target.value)}
                          placeholder="Paste your JSON data here..."
                          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {bulkData.length > 0 && (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500 inline mr-1" />
                              {Math.ceil(bulkData.length / 1024)} KB of data
                            </>
                          )}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={submitBulk}
                          disabled={!bulkData.trim()}
                          className={`px-6 py-3 rounded-xl font-semibold flex items-center ${
                            bulkData.trim()
                              ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:shadow-lg'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Upload Questions
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'messages' && (
                  <AdminMessages />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Blog Form Modal */}
      {showBlogForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8"
          onClick={() => setShowBlogForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4"
          >
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{editingBlog ? 'Edit Blog Post' : 'Create Blog Post'}</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowBlogForm(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </motion.button>
            </div>

            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={blogFormData.title}
                    onChange={(e) => setBlogFormData({...blogFormData, title: e.target.value})}
                    placeholder="Blog post title"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                  <textarea
                    value={blogFormData.excerpt}
                    onChange={(e) => setBlogFormData({...blogFormData, excerpt: e.target.value})}
                    placeholder="Brief summary of the post (max 500 characters)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={blogFormData.content}
                    onChange={(e) => setBlogFormData({...blogFormData, content: e.target.value})}
                    placeholder="Write your blog content here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-48 resize-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="text"
                    value={blogFormData.image}
                    onChange={(e) => setBlogFormData({...blogFormData, image: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t p-6 flex gap-4 justify-end bg-gray-50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowBlogForm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveBlog}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
              >
                {editingBlog ? 'Update' : 'Create'} Post
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteConfirmation({open: false, userId: null, userName: ''})}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete User</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to permanently delete <strong>{deleteConfirmation.userName}</strong>? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDeleteConfirmation({open: false, userId: null, userName: ''})}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmDeleteUser}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* System Settings Modal */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4"
          >
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">System Settings</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </motion.button>
            </div>

            <div className="p-8 max-h-[80vh] overflow-y-auto">
              {/* Status Messages */}
              {settingsMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                    settingsMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {settingsMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className={settingsMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {settingsMessage.text}
                  </span>
                </motion.div>
              )}

              {/* Admin Profile Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input type="text" value={summary?.username || ''} disabled className="w-full px-4 py-2 bg-gray-100 rounded-lg text-gray-700" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input 
                        type="email" 
                        value={settingsData.email}
                        onChange={(e) => setSettingsData({...settingsData, email: e.target.value})}
                        placeholder="admin@example.com" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={`${settingsData.firstName} ${settingsData.lastName}`.trim()}
                        onChange={(e) => {
                          const parts = e.target.value.split(' ')
                          setSettingsData({
                            ...settingsData, 
                            firstName: parts[0] || '',
                            lastName: parts.slice(1).join(' ') || ''
                          })
                        }}
                        placeholder="Admin Name" 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={updateProfile}
                    disabled={settingsSaving}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
                  >
                    {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : ''}
                    Update Profile
                  </motion.button>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="border-t pt-8 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input 
                      type="password" 
                      value={passwordData.old_password}
                      onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input 
                        type="password" 
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <input 
                        type="password" 
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={changePassword}
                    disabled={settingsSaving}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
                  >
                    {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : ''}
                    Change Password
                  </motion.button>
                </div>
              </div>

              {/* Sub-Admin Management Section - Only for Master Admins */}
              {!subadminPermissions && (
              <div className="border-t pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Sub-Admin Management</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSubAdminForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold"
                  >
                    + Create Sub-Admin
                  </motion.button>
                </div>
                <p className="text-gray-600 text-sm mb-4">Manage sub-admin accounts and their permissions</p>
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No sub-admin accounts yet</p>
                  <p className="text-sm text-gray-400">Create one to delegate specific dashboard features</p>
                </div>
              </div>
              )}
            </div>

            <div className="border-t p-6 flex gap-4 justify-end bg-gray-50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSettings(false)}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Sub-Admin Form Modal */}
      <SubAdminForm
        isOpen={showSubAdminForm}
        onClose={() => setShowSubAdminForm(false)}
        onSuccess={() => {
          setShowSubAdminForm(false)
        }}
      />
    </div>
  )
}