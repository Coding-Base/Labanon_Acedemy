import React, { useEffect, useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import axios from 'axios'
import useTokenRefresher from '../../utils/useTokenRefresher'
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
// If PaymentHistory is needed, import it, otherwise referencing internal table
// import PaymentHistory from '../../components/PaymentHistory'

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
  | 'can_view_messages'
  | 'can_manage_subadmins';

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
  const [paymentPage, setPaymentPage] = useState(1)
  const [paymentPageInfo, setPaymentPageInfo] = useState<{count: number; next: string | null; previous: string | null}>({count: 0, next: null, previous: null})
  const [activationFees, setActivationFees] = useState<any[]>([])
  const [activationLoading, setActivationLoading] = useState(false)
  const [showActivationForm, setShowActivationForm] = useState(false)
  const [activationForm, setActivationForm] = useState({ id: null as number | null, type: 'exam', exam_identifier: '', subject_id: '', currency: 'NGN', amount: '' })
  const [activationMessage, setActivationMessage] = useState<{type: 'success'|'error', text: string} | null>(null)
  const [splitConfig, setSplitConfig] = useState<{tutor_share: string; institution_share: string} | null>(null)
  const [splitLoading, setSplitLoading] = useState(false)
  const [splitMessage, setSplitMessage] = useState<{type: 'success'|'error', text: string} | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [blogs, setBlogs] = useState<any[]>([])
  const [blogsLoading, setBlogsLoading] = useState(false)
  const [showBlogForm, setShowBlogForm] = useState(false)
  const [blogMessage, setBlogMessage] = useState<{type: 'success'|'error', text: string} | null>(null)
  const [blogFormData, setBlogFormData] = useState<{title: string; content: string; image: File | string | null; excerpt: string; meta_title?: string; meta_description?: string; meta_keywords?: string}>({title: '', content: '', image: null, excerpt: '', meta_title: '', meta_description: '', meta_keywords: ''})
  const [savingBlog, setSavingBlog] = useState(false)
  const [subadminPermissions, setSubadminPermissions] = useState<Record<string, boolean> | null>(null)
  const [editingBlog, setEditingBlog] = useState<any | null>(null)
  const [settingsData, setSettingsData] = useState({firstName: '', lastName: '', email: ''})
  const [passwordData, setPasswordData] = useState({old_password: '', new_password: '', confirm_password: ''})
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
   
  // Helper function to construct absolute image URLs for media files
  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return ''
    // If already absolute URL, return as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    // If relative path starting with /, prepend API base URL (without /api path)
    if (imageUrl.startsWith('/')) {
      const apiBaseWithoutPath = API_BASE.replace(/\/api\/?$/, '')
      return apiBaseWithoutPath + imageUrl
    }
    return imageUrl
  }

  // Manual Question Upload State
  const [manualQuestion, setManualQuestion] = useState({
    text: '',
    optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: 'A',
    explanation: '',
    year: '',
    image: null as File | null
  })
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [manualLoading, setManualLoading] = useState(false)
  const [manualMessage, setManualMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [bulkMessage, setBulkMessage] = useState<{type: 'success'|'error', text: string} | null>(null)
  const [usersMessage, setUsersMessage] = useState<{type: 'success'|'error', text: string} | null>(null)
  const [uploadMode, setUploadMode] = useState<'json' | 'file' | 'manual'>('json')

  // User Profile - Courses & Modules State
  const [userCourses, setUserCourses] = useState<any[]>([])
  const [selectedUserCourse, setSelectedUserCourse] = useState<any | null>(null)
  const [userCourseModules, setUserCourseModules] = useState<any[]>([])
  const [loadingUserCourses, setLoadingUserCourses] = useState(false)
  const [loadingModules, setLoadingModules] = useState(false)

  // Exam & Subject Management State
  const [examsManagement, setExamsManagement] = useState<any[]>([])
  const [showExamForm, setShowExamForm] = useState(false)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [examFormData, setExamFormData] = useState({title: '', description: '', time_limit_minutes: 120, slug: ''})
  const [subjectFormData, setSubjectFormData] = useState({exam: '', name: '', description: ''})
  const [selectedExamForSubjects, setSelectedExamForSubjects] = useState<any | null>(null)
  const [subjectList, setSubjectList] = useState<any[]>([])
  const [examManagementLoading, setExamManagementLoading] = useState(false)
  const [savingExam, setSavingExam] = useState(false)
  const [savingSubject, setSavingSubject] = useState(false)
  const [examMessage, setExamMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [editingExam, setEditingExam] = useState<any | null>(null)
  const [editingSubject, setEditingSubject] = useState<any | null>(null)

  // Gospel Video State
  const [gospelVideos, setGospelVideos] = useState<any[]>([])
  const [gospelLoading, setGospelLoading] = useState(false)
  const [showGospelForm, setShowGospelForm] = useState(false)
  const [gospelFormData, setGospelFormData] = useState({ youtube_url: '', scheduled_time: '09:00', title: 'Gospel Message', description: '', is_active: true })
  const [editingGospel, setEditingGospel] = useState<any | null>(null)
  const [gospelMessage, setGospelMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Define tabs
  const allTabs = [
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" />, permission: 'can_manage_users' as PermissionKey },
    { id: 'institutions', label: 'Institutions', icon: <Building className="w-5 h-5" />, permission: 'can_manage_institutions' as PermissionKey },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" />, permission: 'can_manage_courses' as PermissionKey },
    { id: 'cbt', label: 'CBT / Exams', icon: <FileText className="w-5 h-5" />, permission: 'can_manage_cbt' as PermissionKey },
    { id: 'payments', label: 'Payments', icon: <BarChart3 className="w-5 h-5" />, permission: 'can_view_payments' as PermissionKey },
    { id: 'blog', label: 'Blog', icon: <BookOpen className="w-5 h-5" />, permission: 'can_manage_blog' as PermissionKey },
    { id: 'gospel', label: 'Gospel', icon: <Mail className="w-5 h-5" />, permission: 'can_manage_blog' as PermissionKey },
    { id: 'messages', label: 'Messages', icon: <Mail className="w-5 h-5" />, permission: 'can_view_messages' as PermissionKey },
    { id: 'exams', label: 'Exams & Subjects', icon: <GraduationCap className="w-5 h-5" />, permission: 'can_manage_cbt' as PermissionKey },
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

  // Ensure current tab is accessible and handle zero-permission subadmins
  useEffect(() => {
    if (subadminPermissions) {
      // Check if subadmin has NO permissions at all
      const hasAnyPermission = Object.values(subadminPermissions).some(v => v === true);
      if (!hasAnyPermission && tabs.length === 0) {
        // No permissions and no accessible tabs - show error or redirect
        console.warn('Subadmin has no permissions assigned');
        setTab(''); // Clear tab - will show "no access" message
        return;
      }
      
      const currentTabAllowed = tabs.some(t => t.id === tab);
      if (!currentTabAllowed) {
        setTab(tabs.length > 0 ? tabs[0].id : ''); // Default to first allowed tab or empty
      }
    }
  }, [subadminPermissions, tabs, tab])

  // Data Loading Effects
  useEffect(() => {
    if (tab === 'users') loadUsers()
    if (tab === 'bulk') loadExams()
    if (tab === 'institutions') loadInstitutions()
    if (tab === 'courses') loadCourses()
    if (tab === 'cbt') loadCbtAnalytics()
    if (tab === 'payments') loadPayments(paymentPage)
    if (tab === 'blog') loadBlogs()
    if (tab === 'gospel') loadGospels()
    if (tab === 'exams') {
      loadExamsManagement()
      try { loadActivationFees(); loadSplitConfig() } catch (e) { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useTokenRefresher(50)

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
        // Also populate profile form
        setSettingsData({
            firstName: res.data.first_name || '',
            lastName: res.data.last_name || '',
            email: res.data.email || ''
        })
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

  // Helper for Bulk Upload to load subjects
  async function loadSubjects(examId: string) {
      try {
          const token = localStorage.getItem('access')
          const res = await axios.get(`${API_BASE}/cbt/exams/${examId}/subjects/`, { headers: { Authorization: `Bearer ${token}` } })
          setSubjects(res.data.results || res.data || [])
      } catch (err) {
          console.error('Failed to load subjects', err)
          setSubjects([])
      }
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

  async function loadPayments(page: number = 1) {
    setPaymentsLoading(true)
    try {
      const token = localStorage.getItem('access')
      const [paymentsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/payments/admin_list/`, { params: { page }, headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/payments/stats/`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      const paymentData = paymentsRes.data.results || paymentsRes.data
      setPayments(Array.isArray(paymentData) ? paymentData : [])
      setPaymentPageInfo({
        count: paymentsRes.data.count || 0,
        next: paymentsRes.data.next,
        previous: paymentsRes.data.previous
      })
      setPaymentStats(statsRes.data)
      setPaymentPage(page)
    } catch (err) { 
      console.error(err)
      setPayments([])
      setPaymentPageInfo({count: 0, next: null, previous: null})
      setPaymentStats({
        total_revenue: 0,
        total_transactions: 0,
        platform_commission: 0,
        pending_payouts: 0
      })
    } finally {
      setPaymentsLoading(false)
      try { loadActivationFees() } catch (e) { /* ignore */ }
    }
  }

  async function loadActivationFees() {
    setActivationLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/payments/admin/activation-fees/`, { headers: { Authorization: `Bearer ${token}` } })
      const data = res.data?.results || res.data || []
      setActivationFees(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load activation fees', err)
      setActivationFees([])
    } finally {
      setActivationLoading(false)
    }
  }

  async function loadSplitConfig() {
    setSplitLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/payments/admin/split-config/`, { headers: { Authorization: `Bearer ${token}` } })
      setSplitConfig({ tutor_share: String(res.data.tutor_share), institution_share: String(res.data.institution_share) })
    } catch (err) {
      console.error('Failed to load split config', err)
      setSplitConfig(null)
    } finally {
      setSplitLoading(false)
    }
  }

  async function saveSplitConfig() {
    if (!splitConfig) return
    try {
      setSplitLoading(true)
      const token = localStorage.getItem('access')
      const payload = { tutor_share: Number(splitConfig.tutor_share), institution_share: Number(splitConfig.institution_share) }
      await axios.post(`${API_BASE}/payments/admin/split-config/`, payload, { headers: { Authorization: `Bearer ${token}` } })
      setSplitMessage({ type: 'success', text: 'Split configuration updated' })
      loadSplitConfig()
      setTimeout(() => setSplitMessage(null), 3000)
    } catch (err: any) {
      console.error('Failed to save split config', err)
      setSplitMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save split config' })
    } finally {
      setSplitLoading(false)
    }
  }

  async function saveActivationFee() {
    if (!activationForm.amount || Number(activationForm.amount) <= 0) {
      setActivationMessage({ type: 'error', text: 'Amount must be greater than 0' })
      return
    }
    try {
      const token = localStorage.getItem('access')
      const payload: any = {
        type: activationForm.type,
        exam_identifier: activationForm.exam_identifier || null,
        subject_id: activationForm.subject_id || null,
        currency: activationForm.currency,
        amount: Number(activationForm.amount)
      }
      if (activationForm.id) payload.id = activationForm.id
      await axios.post(`${API_BASE}/payments/admin/activation-fees/`, payload, { headers: { Authorization: `Bearer ${token}` } })
      setActivationMessage({ type: 'success', text: activationForm.id ? 'Activation fee updated' : 'Activation fee created' })
      setShowActivationForm(false)
      setActivationForm({ id: null, type: 'exam', exam_identifier: '', subject_id: '', currency: 'NGN', amount: '' })
      loadActivationFees()
      setTimeout(() => setActivationMessage(null), 3000)
    } catch (err: any) {
      console.error('Failed to save activation fee', err)
      setActivationMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save activation fee' })
    }
  }

  async function deleteActivationFee(id: number) {
    if (!confirm('Delete this activation fee?')) return
    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/payments/admin/activation-fees/${id}/`, { headers: { Authorization: `Bearer ${token}` } })
      setActivationMessage({ type: 'success', text: 'Activation fee deleted' })
      loadActivationFees()
      setTimeout(() => setActivationMessage(null), 3000)
    } catch (err) {
      console.error('Failed to delete activation fee', err)
      setActivationMessage({ type: 'error', text: 'Failed to delete activation fee' })
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
      setBlogMessage({ type: 'error', text: 'Title and content are required' })
      return
    }
    setSavingBlog(true)
    try {
      const token = localStorage.getItem('access')
      let headers: any = { Authorization: `Bearer ${token}` }
      let res
      if (blogFormData.image instanceof File) {
        const fd = new FormData()
        fd.append('title', blogFormData.title)
        fd.append('content', blogFormData.content)
        fd.append('excerpt', blogFormData.excerpt)
        fd.append('meta_title', blogFormData.meta_title || '')
        fd.append('meta_description', blogFormData.meta_description || '')
        fd.append('meta_keywords', blogFormData.meta_keywords || '')
        fd.append('image_file', blogFormData.image)
        // Do NOT set Content-Type manually; let the browser/axios set the correct
        // multipart boundary so the server can parse files correctly.
        if (editingBlog) {
          res = await axios.patch(`${API_BASE}/blog/${editingBlog.id}/`, fd, { headers })
        } else {
          res = await axios.post(`${API_BASE}/blog/`, fd, { headers })
        }
      } else {
        const payload = {
          title: blogFormData.title,
          content: blogFormData.content,
          image: typeof blogFormData.image === 'string' ? blogFormData.image : undefined,
          excerpt: blogFormData.excerpt,
          meta_title: blogFormData.meta_title || '',
          meta_description: blogFormData.meta_description || '',
          meta_keywords: blogFormData.meta_keywords || ''
        }
        if (editingBlog) {
          res = await axios.patch(`${API_BASE}/blog/${editingBlog.id}/`, payload, { headers })
        } else {
          res = await axios.post(`${API_BASE}/blog/`, payload, { headers })
        }
      }

      // Success: close modal, reset form and reload list
      setShowBlogForm(false)
      setBlogFormData({title: '', content: '', image: null, excerpt: '', meta_title: '', meta_description: '', meta_keywords: ''})
      setEditingBlog(null)
      loadBlogs()
      setBlogMessage({ type: 'success', text: editingBlog ? 'Blog updated' : 'Blog created' })
      setTimeout(() => setBlogMessage(null), 3000)
    } catch (err) {
      console.error(err)
      setBlogMessage({ type: 'error', text: 'Failed to save blog' })
      setTimeout(() => setBlogMessage(null), 4000)
    } finally {
      setSavingBlog(false)
    }
  }

  async function publishBlog(blogId: number) {
    try {
      const token = localStorage.getItem('access')
      await axios.post(`${API_BASE}/blog/${blogId}/publish/`, {}, { headers: { Authorization: `Bearer ${token}` } })
      loadBlogs()
    } catch (err) {
      console.error(err)
      setBlogMessage({ type: 'error', text: 'Failed to publish blog' })
      setTimeout(() => setBlogMessage(null), 4000)
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
      setBlogMessage({ type: 'error', text: 'Failed to delete blog' })
      setTimeout(() => setBlogMessage(null), 4000)
    }
  }

  // User Profile - Courses & Modules Functions
  async function loadUserCourses(userId: number, userRole: string) {
    // Only load courses for tutors or institutions
    if (!['tutor', 'institution'].includes(userRole)) {
      setUserCourses([])
      setSelectedUserCourse(null)
      return
    }
    
    setLoadingUserCourses(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/courses/?author=${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      const courses = res.data.results || res.data || []
      setUserCourses(Array.isArray(courses) ? courses : [])
      setSelectedUserCourse(null)
      setUserCourseModules([])
    } catch (err) {
      console.error('Failed to load user courses:', err)
      setUserCourses([])
    } finally {
      setLoadingUserCourses(false)
    }
  }

  async function loadCourseModules(courseId: number) {
    setLoadingModules(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/courses/${courseId}/modules/`, { headers: { Authorization: `Bearer ${token}` } })
      const modules = res.data.results || res.data || []
      setUserCourseModules(Array.isArray(modules) ? modules : [])
    } catch (err) {
      console.error('Failed to load course modules:', err)
      setUserCourseModules([])
    } finally {
      setLoadingModules(false)
    }
  }

  // Gospel Video Functions
  async function loadGospels() {
    setGospelLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/gospel-videos/`, { headers: { Authorization: `Bearer ${token}` } })
      const data = res.data.results || res.data
      setGospelVideos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load gospel videos:', err)
      setGospelVideos([])
    } finally {
      setGospelLoading(false)
    }
  }

  async function saveGospel() {
    if (!gospelFormData.youtube_url.trim()) {
      setGospelMessage({ type: 'error', text: 'YouTube URL is required' })
      return
    }

    setGospelLoading(true)
    try {
      const token = localStorage.getItem('access')
      const payload = {
        youtube_url: gospelFormData.youtube_url,
        scheduled_time: gospelFormData.scheduled_time,
        title: gospelFormData.title,
        description: gospelFormData.description,
        is_active: gospelFormData.is_active
      }

      let res
      if (editingGospel) {
        res = await axios.patch(`${API_BASE}/gospel-videos/${editingGospel.id}/`, payload, { headers: { Authorization: `Bearer ${token}` } })
        setGospelMessage({ type: 'success', text: 'Gospel video updated successfully' })
        // Update local list immediately if present
        setGospelVideos(prev => prev.map(g => g.id === res.data.id ? res.data : g))
      } else {
        res = await axios.post(`${API_BASE}/gospel-videos/`, payload, { headers: { Authorization: `Bearer ${token}` } })
        setGospelMessage({ type: 'success', text: 'Gospel video created successfully' })
        // Prepend new gospel to local list
        setGospelVideos(prev => [res.data, ...prev])
      }

      setShowGospelForm(false)
      setGospelFormData({ youtube_url: '', scheduled_time: '09:00', title: 'Gospel Message', description: '', is_active: true })
      setEditingGospel(null)
      // Ensure server list sync as well
      try { await loadGospels() } catch (e) { /* ignore */ }
      setTimeout(() => setGospelMessage(null), 3000)
    } catch (err: any) {
      console.error('Failed to save gospel video:', err)
      const detail = err.response?.data || err.message || 'Failed to save gospel video'
      setGospelMessage({ type: 'error', text: typeof detail === 'string' ? detail : JSON.stringify(detail) })
    } finally {
      setGospelLoading(false)
    }
  }

  async function deleteGospel(gospelId: number) {
    if (!confirm('Delete this gospel video?')) return
    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/gospel-videos/${gospelId}/`, { headers: { Authorization: `Bearer ${token}` } })
      setGospelMessage({ type: 'success', text: 'Gospel video deleted successfully' })
      loadGospels()
      setTimeout(() => setGospelMessage(null), 3000)
    } catch (err: any) {
      console.error('Failed to delete gospel video:', err)
      setGospelMessage({ type: 'error', text: 'Failed to delete gospel video' })
    }
  }

  async function updateProfile() {
    setSettingsSaving(true)
    try {
      const token = localStorage.getItem('access')
      await axios.put(`${API_BASE}/users/profile-update/`, {
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
      await axios.post(`${API_BASE}/users/change-password/`, {
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

  // --- Exam & Subject Management Functions ---

  async function loadExamsManagement() {
    setExamManagementLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/cbt/exams/`, { headers: { Authorization: `Bearer ${token}` } })
      const data = res.data.results || res.data
      setExamsManagement(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load exams:', err)
      setExamsManagement([])
    } finally {
      setExamManagementLoading(false)
    }
  }

  async function createOrUpdateExam() {
    if (!examFormData.title.trim()) {
      setExamMessage({ type: 'error', text: 'Exam title is required' })
      return
    }
    setSavingExam(true)
    try {
      const token = localStorage.getItem('access')
      const payload = {
        title: examFormData.title,
        description: examFormData.description,
        time_limit_minutes: parseInt(examFormData.time_limit_minutes.toString()) || 120,
        slug: examFormData.slug || examFormData.title.toLowerCase().replace(/\s+/g, '-')
      }

      if (editingExam) {
        await axios.put(`${API_BASE}/cbt/exams/${editingExam.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExamMessage({ type: 'success', text: 'Exam updated successfully' })
      } else {
        await axios.post(`${API_BASE}/cbt/exams/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExamMessage({ type: 'success', text: 'Exam created successfully' })
      }

      setExamFormData({ title: '', description: '', time_limit_minutes: 120, slug: '' })
      setEditingExam(null)
      setShowExamForm(false)
      loadExamsManagement()
      setTimeout(() => setExamMessage(null), 3000)
    } catch (err: any) {
      console.error('Failed to save exam:', err)
      setExamMessage({ type: 'error', text: err.response?.data?.title?.[0] || 'Failed to save exam' })
    } finally {
      setSavingExam(false)
    }
  }

  async function deleteExam(examId: number) {
    if (!confirm('Are you sure you want to delete this exam? All subjects and questions will be removed.')) return
    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/cbt/exams/${examId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setExamMessage({ type: 'success', text: 'Exam deleted successfully' })
      loadExamsManagement()
      setTimeout(() => setExamMessage(null), 3000)
    } catch (err) {
      console.error('Failed to delete exam:', err)
      setExamMessage({ type: 'error', text: 'Failed to delete exam' })
    }
  }

  async function loadSubjectsForExam(examId: number) {
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/cbt/exams/${examId}/subjects/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubjectList(Array.isArray(res.data) ? res.data : res.data.results || [])
    } catch (err) {
      console.error('Failed to load subjects:', err)
      setSubjectList([])
    }
  }

  async function createOrUpdateSubject() {
    if (!subjectFormData.exam || !subjectFormData.name.trim()) {
      setExamMessage({ type: 'error', text: 'Exam and subject name are required' })
      return
    }
    setSavingSubject(true)
    try {
      const token = localStorage.getItem('access')
      const payload = {
        exam: parseInt(subjectFormData.exam),
        name: subjectFormData.name,
        description: subjectFormData.description
      }

      if (editingSubject) {
        await axios.put(`${API_BASE}/cbt/subjects/${editingSubject.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExamMessage({ type: 'success', text: 'Subject updated successfully' })
      } else {
        await axios.post(`${API_BASE}/cbt/subjects/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setExamMessage({ type: 'success', text: 'Subject created successfully' })
      }

      setSubjectFormData({ exam: '', name: '', description: '' })
      setEditingSubject(null)
      setShowSubjectForm(false)
      // Reload subjects for the current exam
      if (selectedExamForSubjects) {
          loadSubjectsForExam(selectedExamForSubjects.id)
      }
    } catch (err: any) {
        console.error('Failed to save subject', err)
        setExamMessage({ type: 'error', text: 'Failed to save subject' })
    } finally {
        setSavingSubject(false)
    }
  }

  async function deleteSubject(subjectId: number) {
      if(!confirm("Are you sure you want to delete this subject?")) return
      try {
          const token = localStorage.getItem('access')
          await axios.delete(`${API_BASE}/cbt/subjects/${subjectId}/`, {
              headers: { Authorization: `Bearer ${token}` }
          })
          setExamMessage({ type: 'success', text: 'Subject deleted' })
          if (selectedExamForSubjects) {
              loadSubjectsForExam(selectedExamForSubjects.id)
          }
      } catch (err) {
          console.error("Failed to delete subject", err)
          setExamMessage({ type: 'error', text: 'Failed to delete subject' })
      }
  }

  const handleLogout = () => {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      navigate('/login')
  }

  const confirmDeleteUser = async () => {
      if (!deleteConfirmation.userId) return
      try {
          const token = localStorage.getItem('access')
          await axios.delete(`${API_BASE}/admin/users/${deleteConfirmation.userId}/`, {
              headers: { Authorization: `Bearer ${token}` }
          })
          setUsersMessage({type: 'success', text: 'User deleted successfully'})
          setDeleteConfirmation({open: false, userId: null, userName: ''})
          loadUsers(pageInfo.current)
      } catch (err: any) {
          console.error("Failed to delete user", err)
          setUsersMessage({type: 'error', text: 'Failed to delete user'})
      }
  }

  const submitBulk = async () => {
      if (!bulkData.trim() || !selectedExam || !selectedSubject) {
          setBulkMessage({type: 'error', text: 'Please fill all fields'})
          return
      }
      try {
          const parsed = JSON.parse(bulkData)
          if (!Array.isArray(parsed)) throw new Error("Data is not an array")
          
          const token = localStorage.getItem('access')
          // Using a hypothetical endpoint for JSON array upload or iterating
          // Adapting to single create or batch create if available
          // Assuming backend accepts a list at a bulk endpoint
                const res = await axios.post(`${API_BASE}/cbt/bulk-upload/`, { // backend exposes /api/cbt/bulk-upload/
                  exam_id: selectedExam,
                  subject: selectedSubject,
                  questions: parsed
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                })

                const createdCount = res?.data?.success ?? null
                if (createdCount !== null && !isNaN(createdCount)) {
                setBulkMessage({ type: 'success', text: `Success! Created ${createdCount} questions.` })
                } else {
                setBulkMessage({ type: 'success', text: 'Questions uploaded successfully' })
                }
                setBulkData('')
                setTimeout(() => setBulkMessage(null), 5000)
      } catch (err: any) {
          console.error('Bulk upload failed', err)
                // Try to get server error detail
                const msg = err?.response?.data?.detail || err?.response?.data || 'Invalid JSON or Server Error'
                setBulkMessage({type: 'error', text: typeof msg === 'string' ? msg : 'Invalid JSON or Server Error'})
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
      case 'student': return 'bg-yellow-100 text-yellow-800'
      case 'tutor': return 'bg-yellow-100 text-yellow-800'
      case 'institution': return 'bg-yellow-100 text-yellow-800'
      case 'researcher': return 'bg-amber-100 text-amber-800'
      case 'admin': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loadingSummary) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    </div>
  )
    
  if (!summary) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load dashboard</h2>
        <p className="text-gray-600">Please try refreshing the page or contact support</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-yellow-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src={labanonLogo} alt="LightHub Academy logo" width={32} height={32} className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {subadminPermissions ? 'Sub-Admin Dashboard' : 'Master Admin Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">
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
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                      {summary.username?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{summary.username}</h3>
                    <p className="text-sm text-gray-500">
                      {subadminPermissions ? 'Sub-Admin' : 'Master Administrator'}
                    </p>
                    <div className="flex items-center mt-1 text-xs">
                      <Database className="w-3 h-3 text-yellow-500 mr-1" />
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
                      className={`flex items-center space-x-3 w-full h-12 px-4 py-3 rounded-xl transition-all duration-300 ${
                      tab === item.id
                        ? 'bg-gradient-to-r from-yellow-50 to-yellow-50 text-yellow-600 border-l-4 border-yellow-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`${tab === item.id ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {item.icon}
                    </div>
                      <span className="font-medium whitespace-nowrap">{item.label}</span>
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
                className="mt-6 w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
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
                Welcome back, <span className="bg-gradient-to-r from-yellow-600 to-yellow-600 bg-clip-text text-transparent">{summary.username}</span>
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
              {/* No Permissions Message */}
              {!tab || tabs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Shield className="w-16 h-16 text-red-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
                  <p className="text-gray-600 max-w-md text-center">
                    You don't have any permissions assigned. Please contact your administrator to grant you access to the dashboard features.
                  </p>
                </div>
              ) : (
                <>
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
                  <div>
                    {usersMessage && (
                      <div className={`p-3 rounded-lg mb-4 ${usersMessage.type === 'success' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
                        {usersMessage.text}
                      </div>
                    )}
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
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
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
                          className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-lg"
                        >
                          <Filter className="w-5 h-5 inline mr-2" />
                          Apply Filters
                        </motion.button>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mr-3" />
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
                                  onClick={() => {
                                    setSelectedUser(user)
                                    loadUserCourses(user.id, user.role)
                                  }}
                                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    selectedUser?.id === user.id
                                      ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                  }`}
                                >
                                    <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="flex items-center space-x-4 min-w-0">
                                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                        {user.username?.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">{user.username}</h4>
                                        <div className="flex items-center mt-1 space-x-3">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                            {getRoleIcon(user.role)}
                                            <span className="ml-1">{user.role}</span>
                                          </span>
                                          <span className="text-sm text-gray-500 truncate">{user.email}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 justify-end">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedUser(user)
                                        }}
                                        className="p-1 text-gray-500 hover:text-yellow-600 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded"
                                        title="View"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setDeleteConfirmation({open: true, userId: user.id, userName: user.username})
                                        }}
                                        className="p-1 text-gray-500 hover:text-red-600 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
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
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-50 rounded-2xl p-6">
                                  <div className="flex items-center space-x-4 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
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

                              {/* Courses Section - Only for Tutors/Institutions */}
                              {['tutor', 'institution'].includes(selectedUser.role) && (
                                <div className="mb-6">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Courses Created</h3>
                                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                                    {loadingUserCourses ? (
                                      <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 text-yellow-600 animate-spin mr-2" />
                                        <span className="text-gray-600">Loading courses...</span>
                                      </div>
                                    ) : userCourses.length === 0 ? (
                                      <p className="text-gray-500 text-center py-4">No courses created yet</p>
                                    ) : (
                                      <div className="space-y-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-2">Select a Course</label>
                                          <select
                                            value={selectedUserCourse?.id || ''}
                                            onChange={(e) => {
                                              const courseId = parseInt(e.target.value);
                                              const course = userCourses.find(c => c.id === courseId);
                                              setSelectedUserCourse(course || null);
                                              if (course) {
                                                loadCourseModules(courseId);
                                              }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                                          >
                                            <option value="">Choose a course...</option>
                                            {userCourses.map(course => (
                                              <option key={course.id} value={course.id}>
                                                {course.title}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Course Details */}
                                        {selectedUserCourse && (
                                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-50 rounded-lg p-4 border border-yellow-200">
                                            <h4 className="font-semibold text-gray-900 mb-2">{selectedUserCourse.title}</h4>
                                            <p className="text-sm text-gray-600 mb-3">{selectedUserCourse.description}</p>
                                            
                                            {/* Modules */}
                                            {loadingModules ? (
                                              <div className="flex items-center justify-center py-6">
                                                <Loader2 className="w-5 h-5 text-yellow-600 animate-spin mr-2" />
                                                <span className="text-sm text-gray-600">Loading modules...</span>
                                              </div>
                                            ) : userCourseModules.length === 0 ? (
                                              <p className="text-sm text-gray-500 py-3">No modules in this course</p>
                                            ) : (
                                              <div>
                                                <h5 className="text-sm font-semibold text-gray-700 mb-3">Modules ({userCourseModules.length})</h5>
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                  {userCourseModules.map(module => (
                                                    <div key={module.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                                      <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                          <h6 className="font-medium text-gray-900 text-sm">{module.title}</h6>
                                                          {module.description && (
                                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{module.description}</p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
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
                        <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mr-3" />
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
                                      ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        {institution.name?.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900">{institution.name}</h4>
                                        <div className="flex items-center mt-1 space-x-3">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${institution.is_active ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
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
                              <div className="bg-gradient-to-br from-yellow-50 to-yellow-50 rounded-2xl p-6">
                                <div className="flex items-center space-x-4 mb-6">
                                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                                    {selectedInstitution.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className="text-xl font-bold text-gray-900">{selectedInstitution.name}</h4>
                                    <div className="flex items-center mt-2">
                                      <span className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${selectedInstitution.is_active ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
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
                        <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mr-3" />
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
                            className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-lg"
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
                                <div className="aspect-video bg-gradient-to-br from-yellow-500 to-yellow-500 relative">
                                  {course.image && (
                                    <img src={course.image} alt={course.title} className="w-full h-full object-cover" width={384} height={192} loading="lazy" decoding="async" />
                                  )}
                                  <div className="absolute top-4 right-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.published ? 'bg-yellow-500 text-white' : 'bg-yellow-500 text-white'}`}>
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
                                      <span className="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full mr-2">
                                        {new Date(course.created_at).toLocaleDateString()}
                                      </span>
                                      <span><strong>Price:</strong> ${parseFloat(course.price || 0).toFixed(2)}</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-3">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200"
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
                        <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mr-3" />
                        <span className="text-gray-600">Loading analytics...</span>
                      </div>
                    ) : (
                      <div>
                        {/* Analytics Cards */}
                        <div className="grid md:grid-cols-4 gap-4 mb-8">
                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Total Exams</h3>
                            <p className="text-3xl font-bold text-yellow-900">{exams.length}</p>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Total Attempts</h3>
                            <p className="text-3xl font-bold text-yellow-900">{cbtAnalytics?.total_attempts || 0}</p>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <GraduationCap className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Avg Score</h3>
                            <p className="text-3xl font-bold text-yellow-900">{cbtAnalytics?.average_score?.toFixed(1) || '0'}%</p>
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
                                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center">
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
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
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

                {tab === 'exams' && (
                  <div>
                    {examMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-4 p-4 rounded-lg ${examMessage.type === 'success' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
                      >
                        {examMessage.text}
                      </motion.div>
                    )}

                    {examManagementLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mr-3" />
                        <span className="text-gray-600">Loading exams...</span>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Exam Management Section */}
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Manage Exams</h2>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setShowExamForm(!showExamForm)
                                setEditingExam(null)
                                setExamFormData({ title: '', description: '', time_limit_minutes: 120, slug: '' })
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                            >
                              + Add New Exam
                            </motion.button>
                          </div>

                          {showExamForm && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white border-2 border-yellow-200 rounded-xl p-6 mb-6"
                            >
                              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                {editingExam ? 'Edit Exam' : 'Create New Exam'}
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title *</label>
                                  <input
                                    type="text"
                                    value={examFormData.title}
                                    onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
                                    placeholder="e.g., JAMB CBT, NECO, WAEC"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                                  <input
                                    type="text"
                                    value={examFormData.slug}
                                    onChange={(e) => setExamFormData({ ...examFormData, slug: e.target.value })}
                                    placeholder="Auto-generated if empty"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                  <textarea
                                    value={examFormData.description}
                                    onChange={(e) => setExamFormData({ ...examFormData, description: e.target.value })}
                                    placeholder="Exam description"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
                                  <input
                                    type="number"
                                    value={examFormData.time_limit_minutes}
                                    onChange={(e) => setExamFormData({ ...examFormData, time_limit_minutes: parseInt(e.target.value) || 120 })}
                                    min="1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-3 mt-6">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={createOrUpdateExam}
                                  disabled={savingExam}
                                  className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                  {savingExam ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
                                </motion.button>
                                <button
                                  onClick={() => {
                                    setShowExamForm(false)
                                    setEditingExam(null)
                                    setExamFormData({ title: '', description: '', time_limit_minutes: 120, slug: '' })
                                  }}
                                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {examsManagement.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <p className="text-gray-500 text-lg">No exams found. Create your first exam!</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {examsManagement.map((exam) => (
                                <motion.div
                                  key={exam.id}
                                  whileHover={{ y: -5 }}
                                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 text-lg">{exam.title}</h4>
                                      <p className="text-xs text-gray-500 mt-1">{exam.slug}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                          setEditingExam(exam)
                                          setExamFormData({
                                            title: exam.title,
                                            description: exam.description || '',
                                            time_limit_minutes: exam.time_limit_minutes || 120,
                                            slug: exam.slug
                                          })
                                          setShowExamForm(true)
                                        }}
                                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                                        title="Edit"
                                      >
                                        <FileText className="w-4 h-4" />
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => deleteExam(exam.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </motion.button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{exam.description || 'No description'}</p>
                                  <div className="space-y-1 mb-4">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600">Subjects:</span>
                                      <span className="font-semibold text-gray-900">{exam.subjects?.length || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-600">Time Limit:</span>
                                      <span className="font-semibold text-gray-900">{exam.time_limit_minutes} mins</span>
                                    </div>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setSelectedExamForSubjects(exam)
                                      setShowSubjectForm(false)
                                      loadSubjectsForExam(exam.id)
                                    }}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-yellow-50 to-yellow-50 text-yellow-700 rounded-lg font-medium hover:from-yellow-100 hover:to-yellow-100 transition-all border border-yellow-200"
                                  >
                                    Manage Subjects
                                  </motion.button>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Subject Management Section */}
                        {selectedExamForSubjects && (
                          <div>
                            <div className="flex items-center justify-between mb-6 pb-4 border-t-2 border-gray-200 pt-8">
                              <div>
                                <button
                                  onClick={() => {
                                    setSelectedExamForSubjects(null)
                                    setShowSubjectForm(false)
                                    setEditingSubject(null)
                                  }}
                                  className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2 text-sm"
                                >
                                  <ChevronLeft className="w-4 h-4" /> Back to Exams
                                </button>
                                <h2 className="text-2xl font-bold text-gray-900">
                                  Subjects: {selectedExamForSubjects.title}
                                </h2>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setShowSubjectForm(!showSubjectForm)
                                  setEditingSubject(null)
                                  setSubjectFormData({ exam: selectedExamForSubjects.id.toString(), name: '', description: '' })
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                              >
                                + Add Subject
                              </motion.button>
                            </div>

                            {showSubjectForm && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border-2 border-yellow-200 rounded-xl p-6 mb-6"
                              >
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                  {editingSubject ? 'Edit Subject' : 'Create New Subject'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
                                    <input
                                      type="text"
                                      value={subjectFormData.name}
                                      onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                                      placeholder="e.g., Mathematics, Chemistry, Physics"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                      value={subjectFormData.description}
                                      onChange={(e) => setSubjectFormData({ ...subjectFormData, description: e.target.value })}
                                      placeholder="Subject description"
                                      rows={3}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={createOrUpdateSubject}
                                    disabled={savingSubject}
                                    className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                                  >
                                    {savingSubject ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                                  </motion.button>
                                  <button
                                    onClick={() => {
                                      setShowSubjectForm(false)
                                      setEditingSubject(null)
                                      setSubjectFormData({ exam: selectedExamForSubjects.id.toString(), name: '', description: '' })
                                    }}
                                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {subjectList.length === 0 ? (
                              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No subjects found for this exam</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {subjectList.map((subject) => (
                                  <motion.div
                                    key={subject.id}
                                    whileHover={{ y: -5 }}
                                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
                                  >
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 text-lg">{subject.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">ID: {subject.id}</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => {
                                            setEditingSubject(subject)
                                            setSubjectFormData({
                                              exam: selectedExamForSubjects.id.toString(),
                                              name: subject.name,
                                              description: subject.description || ''
                                            })
                                            setShowSubjectForm(true)
                                          }}
                                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                                          title="Edit"
                                        >
                                          <FileText className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => deleteSubject(subject.id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </motion.button>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">{subject.description || 'No description'}</p>
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <p className="text-xs text-gray-500">
                                        Questions: <span className="font-semibold text-gray-900">{subject.question_count ?? 0}</span>
                                      </p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Activation Fees Management included here for context */}
                        <div className="mt-8">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Payment Split Configuration</h3>
                            <div>
                              <p className="text-xs text-gray-600">Configure creator share percentages (platform receives the remainder).</p>
                            </div>
                          </div>

                          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
                            {splitMessage && (
                              <div className={`p-3 rounded-md mb-3 ${splitMessage.type === 'success' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
                                {splitMessage.text}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 items-end">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Tutor Share (%)</label>
                                <input type="number" value={splitConfig?.tutor_share || ''} onChange={(e) => setSplitConfig({ ...(splitConfig || { tutor_share: '', institution_share: '' }), tutor_share: e.target.value })} className="w-full mt-1 p-2 border rounded-lg" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Institution Share (%)</label>
                                <input type="number" value={splitConfig?.institution_share || ''} onChange={(e) => setSplitConfig({ ...(splitConfig || { tutor_share: '', institution_share: '' }), institution_share: e.target.value })} className="w-full mt-1 p-2 border rounded-lg" />
                              </div>
                              <div className="col-span-2 flex justify-end">
                                <button onClick={() => loadSplitConfig()} className="px-4 py-2 bg-gray-100 rounded-lg mr-2">Reload</button>
                                <button onClick={() => saveSplitConfig()} className={`px-4 py-2 rounded-lg ${splitLoading ? 'bg-gray-400 text-gray-100' : 'bg-yellow-600 text-white'}`}>{splitLoading ? 'Saving...' : 'Save'}</button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Activation Fees</h3>
                            <div className="flex items-center space-x-3">
                              <button onClick={() => { setShowActivationForm(true); setActivationForm({ id: null, type: 'exam', exam_identifier: '', subject_id: '', currency: 'NGN', amount: '' }); if (examsManagement.length === 0) loadExamsManagement() }} className="px-4 py-2 bg-yellow-600 text-white rounded-xl font-semibold hover:shadow-lg">+ New Fee</button>
                            </div>
                          </div>

                          {activationMessage && (
                            <div className={`p-3 rounded-lg mb-4 ${activationMessage.type === 'success' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
                              {activationMessage.text}
                            </div>
                          )}

                          {showActivationForm && (
                            <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                  <select value={activationForm.type} onChange={(e) => setActivationForm({ ...activationForm, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                    <option value="exam">Exam</option>
                                    <option value="interview_subject">Interview Subject</option>
                                    <option value="account">Tutor/Institution Account</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                  <input value={activationForm.currency} onChange={(e) => setActivationForm({ ...activationForm, currency: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                                </div>

                                {(activationForm.type === 'exam' || activationForm.type === 'interview_subject') && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
                                    <select value={activationForm.exam_identifier} onChange={(e) => { setActivationForm({ ...activationForm, exam_identifier: e.target.value }); if (activationForm.type === 'interview_subject') loadSubjectsForExam(Number(e.target.value)) }} className="w-full px-3 py-2 border rounded-lg">
                                      <option value="">Choose an exam...</option>
                                      {examsManagement.map((ex) => (
                                        <option key={ex.id} value={ex.id}>{ex.title}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {activationForm.type === 'interview_subject' && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
                                    <select value={activationForm.subject_id} onChange={(e) => setActivationForm({ ...activationForm, subject_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                                      <option value="">Choose a subject...</option>
                                      {subjectList.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                  <input value={activationForm.amount} onChange={(e) => setActivationForm({ ...activationForm, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                                </div>

                                <div className="flex items-end justify-end">
                                  <div className="flex space-x-2">
                                    <button onClick={() => { setShowActivationForm(false); setActivationForm({ id: null, type: 'exam', exam_identifier: '', subject_id: '', currency: 'NGN', amount: '' }) }} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={() => saveActivationFee()} className="px-4 py-2 bg-yellow-600 text-white rounded-lg">Save</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h4 className="text-md font-semibold text-gray-900 mb-4">Configured Activation Fees</h4>
                            {activationLoading ? (
                              <div className="py-8 text-center text-gray-500">Loading activation fees...</div>
                            ) : activationFees.length === 0 ? (
                              <div className="py-8 text-center text-gray-500">No activation fees configured</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left px-4 py-2 text-sm font-semibold">ID</th>
                                      <th className="text-left px-4 py-2 text-sm font-semibold">Type</th>
                                      <th className="text-left px-4 py-2 text-sm font-semibold">Exam / Subject</th>
                                      <th className="text-left px-4 py-2 text-sm font-semibold">Currency</th>
                                      <th className="text-left px-4 py-2 text-sm font-semibold">Amount</th>
                                      <th className="text-left px-4 py-2 text-sm font-semibold">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activationFees.map((f: any) => (
                                      <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">#{f.id}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{f.type}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{f.exam_identifier || f.subject_id || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{f.currency}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{parseFloat(f.amount).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm">
                                          <div className="flex items-center space-x-2">
                                            <button onClick={() => { setActivationForm({ id: f.id, type: f.type, exam_identifier: f.exam_identifier || '', subject_id: f.subject_id || '', currency: f.currency || 'NGN', amount: String(f.amount) }); setShowActivationForm(true); if (examsManagement.length === 0) loadExamsManagement(); if (f.type === 'interview_subject' && f.exam_identifier) loadSubjectsForExam(Number(f.exam_identifier)) }} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg">Edit</button>
                                            <button onClick={() => deleteActivationFee(f.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg">Delete</button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'payments' && (
                  <div>
                    {paymentsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mr-3" />
                        <span className="text-gray-600">Loading payment data...</span>
                      </div>
                    ) : (
                      <div>
                        {/* Payment Stats Cards */}
                        <div className="grid md:grid-cols-4 gap-4 mb-8">
                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Total Revenue</h3>
                            <p className="text-2xl font-bold text-yellow-900 break-words">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(paymentStats?.total_revenue || 0)}</p>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Transactions</h3>
                            <p className="text-3xl font-bold text-yellow-900">{paymentStats?.total_transactions || 0}</p>
                          </motion.div>

                          <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h3 className="text-gray-700 text-sm font-medium mb-1">Platform Commission</h3>
                            <p className="text-2xl font-bold text-yellow-900 break-words">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(paymentStats?.platform_commission || 0)}</p>
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
                            <p className="text-2xl font-bold text-orange-900 break-words">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(paymentStats?.pending_payouts || 0)}</p>
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
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Gateway</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Reference</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Gateway Fee</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Platform Fee</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-900">#{payment.id}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        {payment.course_title || (payment.kind === 'unlock' ? 'Account Activation' : payment.diploma_title || 'Payment')}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">₦{parseFloat(payment.amount || 0).toLocaleString()}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{payment.gateway || '—'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{payment.reference ? payment.reference.substring(0, 12) + '...' : '—'}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">₦{parseFloat(payment.gateway_fee || 0).toLocaleString()}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">₦{parseFloat(payment.merchant_fee || 0).toLocaleString()}</td>
                                      <td className="px-4 py-3 text-sm">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                          payment.status === 'success' ? 'bg-yellow-100 text-yellow-800' :
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

                          {/* Pagination */}
                          {payments.length > 0 && (
                            <div className="mt-6 flex items-center justify-between px-6 py-4 border-t border-gray-200">
                              <div className="text-sm text-gray-600">
                                Showing {(paymentPage - 1) * 10 + 1} to {Math.min(paymentPage * 10, paymentPageInfo.count)} of {paymentPageInfo.count?.toLocaleString() || '0'} transactions
                              </div>
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => loadPayments(paymentPage - 1)}
                                  disabled={!paymentPageInfo.previous}
                                  className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                                    paymentPageInfo.previous
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
                                  onClick={() => loadPayments(paymentPage + 1)}
                                  disabled={!paymentPageInfo.next}
                                  className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                                    paymentPageInfo.next
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
                      </div>
                    )}
                  </div>
                )}

                {tab === 'blog' && (
                  <div>
                    {blogMessage && (
                      <div className={`p-3 rounded-lg mb-4 ${blogMessage.type === 'success' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
                        {blogMessage.text}
                      </div>
                    )}
                    {blogsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mr-3" />
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
                              setBlogFormData({title: '', content: '', image: '', excerpt: '', meta_title: '', meta_description: '', meta_keywords: ''})
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-lg"
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
                                    blog.is_published ? 'bg-yellow-100 text-yellow-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {blog.is_published ? 'Published' : 'Draft'}
                                  </span>
                                </div>
                                 
                                {blog.image && (
                                  <img src={getImageUrl(blog.image)} alt={blog.title} className="w-full h-48 object-cover rounded-lg mb-4" width={768} height={192} loading="lazy" decoding="async" />
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
                                        excerpt: blog.excerpt,
                                        meta_title: blog.meta_title || '',
                                        meta_description: blog.meta_description || '',
                                        meta_keywords: blog.meta_keywords || ''
                                      })
                                      setShowBlogForm(true)
                                    }}
                                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200"
                                  >
                                    Edit
                                  </motion.button>
                                  {!blog.is_published && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => publishBlog(blog.id)}
                                      className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200"
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

                {tab === 'gospel' && (
                  <div>
                    {gospelMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-4 p-4 rounded-lg ${gospelMessage.type === 'success' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
                      >
                        {gospelMessage.text}
                      </motion.div>
                    )}

                    {gospelLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mr-3" />
                        <span className="text-gray-600">Loading gospel videos...</span>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-6 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Gospel Videos</h3>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowGospelForm(true)
                              setEditingGospel(null)
                              setGospelFormData({ youtube_url: '', scheduled_time: '09:00', title: 'Gospel Message', description: '', is_active: true })
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-lg"
                          >
                            + Add Gospel Video
                          </motion.button>
                        </div>

                        {showGospelForm && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border-2 border-yellow-200 rounded-xl p-6 mb-6"
                          >
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">
                              {editingGospel ? 'Edit Gospel Video' : 'Add New Gospel Video'}
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL *</label>
                                <input
                                  type="text"
                                  value={gospelFormData.youtube_url}
                                  onChange={(e) => setGospelFormData({ ...gospelFormData, youtube_url: e.target.value })}
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Time (HH:MM) *</label>
                                  <input
                                    type="time"
                                    value={gospelFormData.scheduled_time}
                                    onChange={(e) => setGospelFormData({ ...gospelFormData, scheduled_time: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                  <input
                                    type="text"
                                    value={gospelFormData.title}
                                    onChange={(e) => setGospelFormData({ ...gospelFormData, title: e.target.value })}
                                    placeholder="Gospel Message"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                  value={gospelFormData.description}
                                  onChange={(e) => setGospelFormData({ ...gospelFormData, description: e.target.value })}
                                  placeholder="Optional description for the video"
                                  rows={3}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                />
                              </div>

                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={gospelFormData.is_active}
                                  onChange={(e) => setGospelFormData({ ...gospelFormData, is_active: e.target.checked })}
                                  className="w-4 h-4 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
                                />
                                <label className="ml-2 text-sm font-medium text-gray-700">Active (will display to users at scheduled time)</label>
                              </div>

                              <div className="flex gap-3">
                                <motion.button
                                  whileHover={gospelLoading ? undefined : { scale: 1.05 }}
                                  whileTap={gospelLoading ? undefined : { scale: 0.95 }}
                                  onClick={saveGospel}
                                  disabled={gospelLoading}
                                  aria-disabled={gospelLoading}
                                  className={`px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-lg font-medium transition-all ${gospelLoading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'}`}
                                >
                                  {editingGospel ? 'Update Video' : 'Add Video'}
                                </motion.button>
                                <button
                                  onClick={() => {
                                    setShowGospelForm(false)
                                    setEditingGospel(null)
                                    setGospelFormData({ youtube_url: '', scheduled_time: '09:00', title: 'Gospel Message', description: '', is_active: true })
                                  }}
                                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {gospelVideos.length === 0 ? (
                          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No gospel videos configured yet</p>
                            <p className="text-gray-400 text-sm mt-2">Create your first gospel video to start broadcasting to your community</p>
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {gospelVideos.map((gospel) => (
                              <motion.div
                                key={gospel.id}
                                whileHover={{ y: -5 }}
                                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                              >
                                <div className="aspect-video bg-black flex items-center justify-center relative">
                                  <Globe className="w-12 h-12 text-gray-600" />
                                  <div className="absolute top-2 right-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                      gospel.is_active ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {gospel.is_active ? '🟢 Active' : '⚫ Inactive'}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-4">
                                  <h4 className="font-semibold text-gray-900 mb-1">{gospel.title}</h4>
                                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{gospel.description || 'No description'}</p>

                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm">
                                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                                      <span className="text-gray-600">Scheduled: {gospel.scheduled_time}</span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500">
                                      <span>Created: {new Date(gospel.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        setEditingGospel(gospel)
                                        setGospelFormData({
                                          youtube_url: gospel.youtube_url,
                                          scheduled_time: gospel.scheduled_time,
                                          title: gospel.title,
                                          description: gospel.description,
                                          is_active: gospel.is_active
                                        })
                                        setShowGospelForm(true)
                                      }}
                                      className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition-all text-sm"
                                    >
                                      Edit
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => deleteGospel(gospel.id)}
                                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all text-sm"
                                    >
                                      Delete
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

                {tab === 'bulk' && (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Question Management</h3>
                      <p className="text-gray-600">
                        Upload questions via JSON, CSV, or manually.
                      </p>
                    </div>

                    {/* Upload Mode Selection */}
                    <div className="flex space-x-4 mb-6">
                      <button onClick={() => setUploadMode('json')} className={`px-4 py-2 rounded-lg font-medium ${uploadMode === 'json' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        JSON Paste
                      </button>
                      <button onClick={() => setUploadMode('file')} className={`px-4 py-2 rounded-lg font-medium ${uploadMode === 'file' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        CSV/Excel File
                      </button>
                      <button onClick={() => setUploadMode('manual')} className={`px-4 py-2 rounded-lg font-medium ${uploadMode === 'manual' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        Manual Entry
                      </button>
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                     
                    {uploadMode === 'json' && (
                    <>
                    {bulkMessage && (
                      <div className={`p-3 rounded-lg mb-4 ${bulkMessage.type === 'success' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
                        {bulkMessage.text}
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-50 rounded-2xl p-6 mb-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <Database className="w-6 h-6 text-yellow-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">JSON Format Example</h4>
                          <p className="text-xs text-gray-600 mb-3">Paste just the questions array below. Include an optional <strong>"year"</strong> field in each question object (e.g., "year": "2014").</p>
                          <pre className="text-xs bg-white p-3 rounded-lg overflow-x-auto">
{`[
  {
    "id": "chem_1",
    "question_text": "What is the molar volume...",
    "options": {
      "A": "0.89 mol",
      "B": "1.90 mol",
      "C": "3.80 mol",
      "D": "5.70 mol"
    },
    "correct_answer": "A",
    "explanation": "Convert to Kelvin...",
    "subject": "Chemistry",
    "year": "2014"
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
                          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none font-mono text-sm"
                        />
                      </div>
                       
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {bulkData.length > 0 && (
                            <>
                              <CheckCircle className="w-4 h-4 text-yellow-500 inline mr-1" />
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
                              ? 'bg-gradient-to-r from-yellow-600 to-yellow-600 text-white hover:shadow-lg'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Upload Questions
                        </motion.button>
                      </div>
                    </div>
                    </>
                    )}

                    {uploadMode === 'file' && (
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        {bulkMessage && (
                          <div className={`p-3 rounded-lg mb-4 ${bulkMessage.type === 'success' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
                            {bulkMessage.text}
                          </div>
                        )}
                        <h4 className="font-semibold mb-4">Upload CSV or Excel File</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          File should have columns: question_text, option_a, option_b, option_c, option_d, correct_answer, explanation.
                        </p>
                        <input 
                          type="file" 
                          accept=".csv, .xlsx, .xls"
                          onChange={(e) => setBulkFile(e.target.files ? e.target.files[0] : null)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                            if (!bulkFile || !selectedExam || !selectedSubject) {
                              setBulkMessage({ type: 'error', text: 'Please select exam, subject and file' })
                              setTimeout(() => setBulkMessage(null), 4000)
                              return
                            }
                            const formData = new FormData()
                            formData.append('file', bulkFile)
                            formData.append('exam_id', selectedExam)
                            formData.append('subject', selectedSubject)
                            formData.append('year', new Date().getFullYear().toString())
                             
                            try {
                              const token = localStorage.getItem('access')
                              const res = await axios.post(`${API_BASE}/cbt/bulk-upload/`, formData, {
                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                              })
                              setBulkMessage({ type: 'success', text: `Success! Created ${res.data.success} questions.` })
                              setTimeout(() => setBulkMessage(null), 5000)
                            } catch (err: any) {
                              console.error('Bulk file upload error:', err)
                              let msg = 'Upload failed: '
                              if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                                msg += err.response.data.errors.join('; ')
                              } else if (err.response?.data?.detail) {
                                msg += err.response.data.detail
                              } else if (err.response?.data?.error) {
                                msg += err.response.data.error
                              } else if (err.message) {
                                msg += err.message
                              } else {
                                msg += 'Unknown error'
                              }
                              setBulkMessage({ type: 'error', text: msg })
                              setTimeout(() => setBulkMessage(null), 6000)
                            }
                          }}
                          className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg font-semibold"
                        >
                          Upload File
                        </motion.button>
                      </div>
                    )}

                    {uploadMode === 'manual' && (
                      <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
                        <h4 className="font-semibold">Add Single Question</h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Question Text</label>
                          <textarea 
                            value={manualQuestion.text}
                            onChange={e => setManualQuestion({...manualQuestion, text: e.target.value})}
                            className="w-full mt-1 p-2 border rounded-lg"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Image (Optional)</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={e => setManualQuestion({...manualQuestion, image: e.target.files ? e.target.files[0] : null})}
                            className="mt-1 block w-full text-sm text-gray-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Option A</label>
                            <input type="text" value={manualQuestion.optionA} onChange={e => setManualQuestion({...manualQuestion, optionA: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Option B</label>
                            <input type="text" value={manualQuestion.optionB} onChange={e => setManualQuestion({...manualQuestion, optionB: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Option C</label>
                            <input type="text" value={manualQuestion.optionC} onChange={e => setManualQuestion({...manualQuestion, optionC: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Option D</label>
                            <input type="text" value={manualQuestion.optionD} onChange={e => setManualQuestion({...manualQuestion, optionD: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                            <select value={manualQuestion.correctAnswer} onChange={e => setManualQuestion({...manualQuestion, correctAnswer: e.target.value})} className="w-full mt-1 p-2 border rounded-lg">
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Year (Optional)</label>
                            <input type="text" placeholder="e.g., 2014" value={manualQuestion.year} onChange={e => setManualQuestion({...manualQuestion, year: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Explanation</label>
                          <input type="text" value={manualQuestion.explanation} onChange={e => setManualQuestion({...manualQuestion, explanation: e.target.value})} className="w-full mt-1 p-2 border rounded-lg" />
                        </div>

                        {manualMessage && (
                          <div className={`p-4 rounded-lg flex items-center ${manualMessage.type === 'success' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                            {manualMessage.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                            {manualMessage.text}
                          </div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={async () => {
                            if (!selectedExam || !selectedSubject || !manualQuestion.text) {
                              setManualMessage({type: 'error', text: 'Please fill in all required fields (Exam, Subject, Question Text)'})
                              return
                            }
                            const subj = subjects.find(s => s.name === selectedSubject)
                            if (!subj) return setManualMessage({type: 'error', text: 'Invalid subject selected'})

                            setManualLoading(true)
                            setManualMessage(null)
                            const formData = new FormData()
                            formData.append('subject', subj.id)
                            formData.append('text', manualQuestion.text)
                            if (manualQuestion.image) formData.append('image', manualQuestion.image)
                            if (manualQuestion.year) formData.append('year', manualQuestion.year)
                             
                            const opts = [
                              { text: manualQuestion.optionA, key: 'A' },
                              { text: manualQuestion.optionB, key: 'B' },
                              { text: manualQuestion.optionC, key: 'C' },
                              { text: manualQuestion.optionD, key: 'D' }
                            ]
                            const choices = opts.map(opt => ({
                              text: opt.text,
                              is_correct: opt.key === manualQuestion.correctAnswer
                            }))
                            formData.append('choices_json', JSON.stringify(choices))

                            try {
                              const token = localStorage.getItem('access')
                              await axios.post(`${API_BASE}/cbt/questions/`, formData, {
                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                              })
                              setManualMessage({type: 'success', text: 'Question created successfully!'})
                              setManualQuestion({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', explanation: '', year: '', image: null })
                            } catch (err: any) {
                              setManualMessage({type: 'error', text: 'Failed: ' + (err.response?.data?.detail || err.message)})
                            } finally {
                              setManualLoading(false)
                            }
                          }}
                          disabled={manualLoading}
                          className={`px-6 py-2 rounded-lg font-semibold flex items-center justify-center ${manualLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-600 text-white'}`}
                        >
                          {manualLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Question'}
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'messages' && (
                  <AdminMessages />
                )}
              </div>
              </>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <>
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
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-600 p-6 rounded-t-2xl flex items-center justify-between">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                  <textarea
                    value={blogFormData.excerpt}
                    onChange={(e) => setBlogFormData({...blogFormData, excerpt: e.target.value})}
                    placeholder="Brief summary of the post (max 500 characters)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none h-24 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <div className="w-full">
                    <ReactQuill
                      theme="snow"
                      value={blogFormData.content}
                      onChange={(val) => setBlogFormData({...blogFormData, content: val})}
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          ['blockquote', 'code-block'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link', 'image'],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                </div>

                {/* SEO Fields */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">SEO / Metadata (optional)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                      <input
                        type="text"
                        value={blogFormData.meta_title}
                        onChange={(e) => setBlogFormData({...blogFormData, meta_title: e.target.value})}
                        placeholder="Optional: title for search engines"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                      <input
                        type="text"
                        value={blogFormData.meta_description}
                        onChange={(e) => setBlogFormData({...blogFormData, meta_description: e.target.value})}
                        placeholder="Optional: short description for search engines (150-320 chars)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keywords</label>
                      <input
                        type="text"
                        value={blogFormData.meta_keywords}
                        onChange={(e) => setBlogFormData({...blogFormData, meta_keywords: e.target.value})}
                        placeholder="Optional: comma-separated keywords"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image (upload)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBlogFormData({...blogFormData, image: e.target.files?.[0] ?? null})}
                    className="w-full"
                  />
                  {typeof blogFormData.image === 'string' && blogFormData.image && (
                    <img src={getImageUrl(blogFormData.image)} alt={blogFormData.title || 'Blog preview image'} className="mt-2 w-32 h-20 object-cover rounded" width={128} height={80} loading="lazy" decoding="async" />
                  )}
                  {blogFormData.image instanceof File && (
                    <p className="mt-2 text-sm text-gray-600">Selected file: {blogFormData.image.name}</p>
                  )}
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
                disabled={savingBlog}
                className={`px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow ${savingBlog ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {savingBlog ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingBlog ? 'Update Post' : 'Create Post')}
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
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-600 p-6 rounded-t-2xl flex items-center justify-between">
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
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {settingsMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className={settingsMessage.type === 'success' ? 'text-yellow-800' : 'text-red-800'}>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" 
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" 
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={updateProfile}
                    disabled={settingsSaving}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" 
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input 
                        type="password" 
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <input 
                        type="password" 
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" 
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={changePassword}
                    disabled={settingsSaving}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
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
                    className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-lg font-semibold"
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

      </>
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