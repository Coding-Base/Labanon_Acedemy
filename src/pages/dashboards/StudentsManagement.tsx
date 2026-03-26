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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-600 mt-1">Manage student accounts and view their activities</p>
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

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
