import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  Globe
} from 'lucide-react'
import labanonLogo from '../labanonlogo.png'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface MasterProps {
  summary?: any
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export default function MasterAdminDashboard({ summary: propSummary }: MasterProps) {
  const location = useLocation()
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

  useEffect(() => {
    if (tab === 'users') loadUsers()
    if (tab === 'bulk') loadExams()
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
      // Show success feedback
    } catch (err) { 
      console.error(err); 
      alert('Failed to delete user. Please try again.') 
    }
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
      // Parse the JSON array from textarea
      let questionsArray = JSON.parse(bulkData)
      
      // If the user pasted the full object with exam_id and year, extract just the questions array
      if (questionsArray.questions && Array.isArray(questionsArray.questions)) {
        questionsArray = questionsArray.questions
      }
      
      // Ensure it's an array
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
      case 'student': return 'bg-blue-100 text-blue-800'
      case 'tutor': return 'bg-purple-100 text-purple-800'
      case 'institution': return 'bg-green-100 text-green-800'
      case 'researcher': return 'bg-amber-100 text-amber-800'
      case 'admin': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'institutions', label: 'Institutions', icon: <Building className="w-5 h-5" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'cbt', label: 'CBT / Exams', icon: <FileText className="w-5 h-5" /> },
    { id: 'bulk', label: 'Bulk Upload', icon: <Upload className="w-5 h-5" /> },
  ]

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
                  Master Admin Dashboard
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {summary.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{summary.username}</p>
                  <p className="text-xs text-gray-500">Master Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
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
                    <p className="text-sm text-gray-500">Master Administrator</p>
                    <div className="flex items-center mt-1 text-xs">
                      <Database className="w-3 h-3 text-blue-500 mr-1" />
                      <span className="font-medium">Full System Access</span>
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
                    onClick={() => setTab(item.id)}
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
              <p className="text-gray-600 mt-2">Manage users, courses, exams, and system configurations</p>
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
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
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
                                        className="p-2 text-gray-500 hover:text-blue-600"
                                      >
                                        <Eye className="w-5 h-5" />
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteUser(user.id)
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
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                                  <div className="flex items-center space-x-4 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
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
                  <div className="text-center py-12">
                    <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Institutions Management</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      Manage educational institutions, view registrations, and handle institution-specific configurations.
                    </p>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 max-w-md mx-auto">
                      <div className="flex items-center justify-center space-x-3 mb-4">
                        <Globe className="w-8 h-8 text-blue-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Feature Coming Soon</h4>
                          <p className="text-sm text-gray-600">Advanced institution management tools are in development</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'courses' && (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Course Management</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      Oversee all courses on the platform, manage content, and handle course-related configurations.
                    </p>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 max-w-md mx-auto">
                      <div className="flex items-center justify-center space-x-3 mb-4">
                        <BarChart3 className="w-8 h-8 text-purple-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Course Analytics</h4>
                          <p className="text-sm text-gray-600">Access course performance metrics and analytics</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'cbt' && (
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Exam Management</h3>
                      <div className="text-sm text-gray-500">
                        Total: <span className="font-semibold">{exams.length}</span> exams
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exams.map((exam) => (
                        <motion.div
                          key={exam.id}
                          whileHover={{ y: -5 }}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{exam.title}</h4>
                                <div className="text-xs text-gray-500 mt-1">ID: {exam.id}</div>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{exam.description || 'No description available'}</p>
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-gray-500">Questions: {exam.question_count || 'N/A'}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {exam.exam_type || 'Standard'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {exams.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No exams found</p>
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <Database className="w-6 h-6 text-blue-600 mt-1" />
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
]`}</pre>
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
                          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
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
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
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
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}