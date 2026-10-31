import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Search,
  Settings,
  Trash2,
  ExternalLink,
  Filter,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  Trophy,
  X,
  Clock,
  FileText,
  CheckCircle,
  GraduationCap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Student {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_joined: string
  is_active: boolean
  last_login?: string
  courses_enrolled: number
  total_spending: number
  certificates_earned: number
}

interface StudentLeaderboardItem {
  rank: number
  user_id: number
  username: string
  full_name: string
  exams_taken: number
  exams_passed: number
  pass_rate: number
  average_score: number
  highest_score: number
}

interface StudentAttemptDetail {
  id: number
  exam_title: string
  subject_name: string
  score: number
  num_questions: number
  percentage: number
  is_passed: boolean
  time_taken_seconds: number
  submitted_at: string
}

interface StudentDrilldownData {
  student_id: number
  username: string
  full_name: string
  email: string
  rank: number | null
  total_ranked_students: number
  metrics: {
    exams_taken: number
    exams_passed: number
    pass_rate: number
    average_score: number
    highest_score: number
    total_points: number
  }
  recent_attempts: StudentAttemptDetail[]
}

export default function StudentsManagement() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteStudentId, setDeleteStudentId] = useState<number | null>(null)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [studentStatus, setStudentStatus] = useState<'active' | 'inactive'>('active')
  const [toast, setToast] = useState<{type: 'success' | 'error'; message: string} | null>(null)

  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [studentLeaderboard, setStudentLeaderboard] = useState<StudentLeaderboardItem[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [selectedDrilldown, setSelectedDrilldown] = useState<StudentDrilldownData | null>(null)
  const [drilldownLoading, setDrilldownLoading] = useState(false)
  const [showDrilldownModal, setShowDrilldownModal] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    filterStudents()
  }, [searchTerm, activeFilter, students])

  async function loadStudents() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/users/?role=student`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const payload = res.data
      const items = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : [])
      setStudents(items)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load students')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadGlobalLeaderboard() {
    setLeaderboardLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/cbt/leaderboard/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const items = Array.isArray(res.data) ? res.data : (res.data?.leaderboard || [])
      setStudentLeaderboard(items)
      setShowLeaderboardModal(true)
    } catch (err: any) {
      console.error('Failed to load student leaderboard:', err)
      setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to load student leaderboard' })
    } finally {
      setLeaderboardLoading(false)
    }
  }

  async function openStudentDrilldown(studentId: number) {
    setDrilldownLoading(true)
    setShowDrilldownModal(true)
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/cbt/leaderboard/?user_id=${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSelectedDrilldown(res.data)
    } catch (err: any) {
      console.error('Failed to load student drill-down:', err)
      setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to load student performance' })
      setShowDrilldownModal(false)
    } finally {
      setDrilldownLoading(false)
    }
  }

  function filterStudents() {
    let filtered = students.filter(student => {
      const matchesSearch =
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        activeFilter === 'all' ||
        (activeFilter === 'active' && student.is_active) ||
        (activeFilter === 'inactive' && !student.is_active)

      return matchesSearch && matchesStatus
    })

    setFilteredStudents(filtered)
  }

  async function openSettings(student: Student) {
    setSelectedStudent(student)
    setStudentStatus(student.is_active ? 'active' : 'inactive')
    setSettingsError('')
    setShowSettings(true)
  }

  async function saveSettings() {
    if (!selectedStudent) return

    setSettingsSaving(true)
    setSettingsError('')

    try {
      const token = localStorage.getItem('access')
      await axios.patch(
        `${API_BASE}/users/${selectedStudent.id}/`,
        { is_active: studentStatus === 'active' },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setStudents(
        students.map(s =>
          s.id === selectedStudent.id
            ? { ...s, is_active: studentStatus === 'active' }
            : s
        )
      )

      setShowSettings(false)
      setToast({type: 'success', message: 'Student settings updated successfully!'})
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setSettingsError(err.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  async function deleteStudent() {
    if (!deleteStudentId) return

    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/users/${deleteStudentId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setStudents(students.filter(s => s.id !== deleteStudentId))
      setShowDeleteConfirm(false)
      setToast({type: 'success', message: 'Student deleted successfully!'})
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({type: 'error', message: err.response?.data?.detail || 'Failed to delete student'})
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students Management</h1>
            <p className="text-gray-600 mt-1">Manage student accounts and view their activities</p>
          </div>
          <button
            onClick={loadGlobalLeaderboard}
            disabled={leaderboardLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Trophy className="w-5 h-5" />
            {leaderboardLoading ? 'Loading Leaderboard...' : 'Student Leaderboard'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Students</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Total Students</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{students.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {students.filter(s => s.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Total Spending</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              ₦{students.reduce((sum, s) => sum + (s.total_spending || 0), 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Avg Courses</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {(students.length > 0
                ? (students.reduce((sum, s) => sum + (s.courses_enrolled || 0), 0) / students.length).toFixed(1)
                : 0)}
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">
                      Student
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">
                      Courses
                    </th>
                    <th className="text-right py-3 px-6 text-sm font-semibold text-gray-900">
                      Spending
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">
                      Certificates
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined {new Date(student.date_joined).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{student.email}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900">{student.courses_enrolled}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        ₦{(student.total_spending || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Award className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-gray-900">{student.certificates_earned}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openStudentDrilldown(student.id)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded transition"
                            title="Leaderboard Performance"
                          >
                            <Trophy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/students/${student.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openSettings(student)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                            title="Settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteStudentId(student.id)
                              setShowDeleteConfirm(true)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Settings Modal */}
      {showSettings && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Student Settings: {selectedStudent.first_name} {selectedStudent.last_name}
              </h2>

              {settingsError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {settingsError}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Account Status
                </label>
                <select
                  value={studentStatus}
                  onChange={(e) => setStudentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={settingsSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {settingsSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Student?</h2>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. The student account and all associated data will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteStudent}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Student Leaderboard Modal */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Student CBT Leaderboard</h2>
                  <p className="text-sm text-gray-500">Rankings based on exam percentage scores and pass rates</p>
                </div>
              </div>
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {studentLeaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No student rankings available yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4 text-center">Rank</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4 text-center">Avg Score</th>
                        <th className="py-3 px-4 text-center">Highest</th>
                        <th className="py-3 px-4 text-center">Exams Taken</th>
                        <th className="py-3 px-4 text-center">Pass Rate</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {studentLeaderboard.map((item) => (
                        <tr key={item.user_id} className="hover:bg-amber-50/40 transition">
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              item.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-sm' :
                              item.rank === 2 ? 'bg-slate-300 text-slate-800' :
                              item.rank === 3 ? 'bg-amber-700/20 text-amber-900' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              #{item.rank}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">{item.full_name || item.username}</p>
                              <p className="text-xs text-gray-500">@{item.username}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-900">{item.average_score}%</td>
                          <td className="py-3 px-4 text-center font-medium text-amber-700">{item.highest_score}%</td>
                          <td className="py-3 px-4 text-center font-medium text-gray-700">{item.exams_taken}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              item.pass_rate >= 70 ? 'bg-green-100 text-green-700' :
                              item.pass_rate >= 50 ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {item.pass_rate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setShowLeaderboardModal(false)
                                openStudentDrilldown(item.user_id)
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition"
                            >
                              Drill Down
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Performance Drill-Down Modal */}
      {showDrilldownModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{selectedDrilldown?.full_name || selectedDrilldown?.username || 'Student Drilldown'}</h2>
                    {selectedDrilldown?.rank ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-amber-700 shadow-sm">
                        Rank #{selectedDrilldown.rank} of {selectedDrilldown.total_ranked_students || (selectedDrilldown as any).total_students_ranked || 0}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                        Not Ranked Yet
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-100">{selectedDrilldown?.email} • @{selectedDrilldown?.username}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDrilldownModal(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {drilldownLoading ? (
                <div className="text-center py-16 text-gray-500">
                  <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-500" />
                  Loading student exam performance...
                </div>
              ) : selectedDrilldown ? (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Global Rank</p>
                      <p className="text-2xl font-bold text-amber-900 mt-1">
                        {selectedDrilldown.rank ? `#${selectedDrilldown.rank}` : '—'}
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">Across all students</p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Avg Score</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        {selectedDrilldown.metrics?.average_score ?? (selectedDrilldown as any).avg_score_percentage ?? 0}%
                      </p>
                      <p className="text-xs text-blue-600 mt-0.5">High: {selectedDrilldown.metrics?.highest_score ?? (selectedDrilldown as any).high_score_percentage ?? 0}%</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Pass Rate</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        {selectedDrilldown.metrics?.pass_rate ?? (selectedDrilldown as any).pass_rate ?? 0}%
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {selectedDrilldown.metrics?.exams_passed ?? (selectedDrilldown as any).total_passed ?? 0} of {selectedDrilldown.metrics?.exams_taken ?? (selectedDrilldown as any).total_exams_taken ?? 0} passed
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-xs font-medium text-purple-700 uppercase tracking-wider">Exams Taken</p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        {selectedDrilldown.metrics?.exams_taken ?? (selectedDrilldown as any).total_exams_taken ?? 0}
                      </p>
                      <p className="text-xs text-purple-600 mt-0.5">Total attempts completed</p>
                    </div>
                  </div>

                  {/* Recent Attempts Breakdown */}
                  {(() => {
                    const attemptsList = selectedDrilldown.recent_attempts || (selectedDrilldown as any).attempts || []
                    return (
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-amber-600" />
                          Exam Attempts History ({attemptsList.length})
                        </h3>

                        {attemptsList.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
                            No completed exam attempts found for this student.
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                                  <th className="py-3 px-4">Exam Title</th>
                                  <th className="py-3 px-4">Subject</th>
                                  <th className="py-3 px-4 text-center">Score</th>
                                  <th className="py-3 px-4 text-center">Percentage</th>
                                  <th className="py-3 px-4 text-center">Result</th>
                                  <th className="py-3 px-4 text-center">Time</th>
                                  <th className="py-3 px-4 text-right">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-sm">
                                {attemptsList.map((attempt: any) => (
                                  <tr key={attempt.id} className="hover:bg-gray-50/70 transition">
                                    <td className="py-3 px-4 font-medium text-gray-900">{attempt.exam_title || 'General Exam'}</td>
                                    <td className="py-3 px-4 text-gray-600">{attempt.subject_name || 'General'}</td>
                                    <td className="py-3 px-4 text-center font-semibold text-gray-900">
                                      {attempt.score} / {attempt.num_questions}
                                    </td>
                                    <td className="py-3 px-4 text-center font-bold text-gray-900">
                                      {attempt.percentage ?? attempt.percentage_score ?? 0}%
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        attempt.is_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                      }`}>
                                        {attempt.is_passed ? 'Passed' : 'Failed'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center text-xs text-gray-500">
                                      {attempt.time_taken_seconds ? `${Math.round(attempt.time_taken_seconds / 60)} mins` : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-right text-xs text-gray-500">
                                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDrilldownModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
