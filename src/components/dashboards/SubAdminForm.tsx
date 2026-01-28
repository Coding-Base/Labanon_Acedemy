import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { X, AlertCircle, CheckCircle, Trash2, Loader2, UserCog } from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface SubAdmin {
  id: number
  user: {
    id: number
    username: string
    email: string
  }
  can_manage_users: boolean
  can_manage_institutions: boolean
  can_manage_courses: boolean
  can_manage_cbt: boolean
  can_view_payments: boolean
  can_manage_blog: boolean
  can_view_messages: boolean
  can_manage_subadmins: boolean
  is_active: boolean
  created_at: string
}

interface SubAdminFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function SubAdminForm({ isOpen, onClose, onSuccess }: SubAdminFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    can_manage_users: false,
    can_manage_institutions: false,
    can_manage_courses: false,
    can_manage_cbt: false,
    can_view_payments: false,
    can_manage_blog: false,
    can_view_messages: false,
    can_manage_subadmins: false,
  })

  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
  const [showForm, setShowForm] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchSubAdmins()
    }
  }, [isOpen])

  const fetchSubAdmins = async () => {
    try {
      setListLoading(true)
      const token = localStorage.getItem('access')
      console.debug('SubAdminForm: fetchSubAdmins token present?', !!token)
      const response = await axios.get(
        `${API_BASE}/subadmin/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setSubAdmins(response.data)
    } catch (err: any) {
      console.error('Failed to fetch sub-admins:', err)
    } finally {
      setListLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    // Basic validation
    if (!formData.username.trim()) {
      setError('Username is required')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    // Only require password when creating a new sub-admin
    if (!editingId) {
      if (!formData.password) {
        setError('Password is required')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('access')

      // Prepare permissions payload
      const permsPayload = {
        can_manage_users: formData.can_manage_users,
        can_manage_institutions: formData.can_manage_institutions,
        can_manage_courses: formData.can_manage_courses,
        can_manage_cbt: formData.can_manage_cbt,
        can_view_payments: formData.can_view_payments,
        can_manage_blog: formData.can_manage_blog,
        can_view_messages: formData.can_view_messages,
        can_manage_subadmins: formData.can_manage_subadmins,
      }

      if (editingId) {
        // Update permissions for existing sub-admin (do not require password)
        await axios.patch(`${API_BASE}/subadmin/${editingId}/`, permsPayload, { headers: { Authorization: `Bearer ${token}` } })
        setSuccess('Sub-admin updated successfully')
        setEditingId(null)
      } else {
        // Create new sub-admin
        const payload = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          ...permsPayload
        }

        await axios.post(`${API_BASE}/subadmin/create_subadmin/`, payload, { headers: { Authorization: `Bearer ${token}` } })
        setSuccess('Sub-admin created successfully!')
      }

      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        can_manage_users: false,
        can_manage_institutions: false,
        can_manage_courses: false,
        can_manage_cbt: false,
        can_view_payments: false,
        can_manage_blog: false,
        can_view_messages: false,
        can_manage_subadmins: false,
      })

      // Refresh list
      await fetchSubAdmins()
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to save sub-admin')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (sub: SubAdmin) => {
    setShowForm(true)
    setEditingId(sub.id)
    setFormData({
      username: sub.user.username,
      email: sub.user.email,
      password: '',
      confirmPassword: '',
      can_manage_users: !!sub.can_manage_users,
      can_manage_institutions: !!sub.can_manage_institutions,
      can_manage_courses: !!sub.can_manage_courses,
      can_manage_cbt: !!sub.can_manage_cbt,
      can_view_payments: !!sub.can_view_payments,
      can_manage_blog: !!sub.can_manage_blog,
      can_view_messages: !!sub.can_view_messages,
      can_manage_subadmins: !!sub.can_manage_subadmins,
    })
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sub-admin?')) return

    try {
      const token = localStorage.getItem('access')
      console.debug('SubAdminForm: delete token present?', !!token)
      await axios.delete(
        `${API_BASE}/subadmin/${id}/`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setSuccess('Sub-admin deleted successfully')
      await fetchSubAdmins()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete sub-admin')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-50 to-yellow-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Sub-Admin Management</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => {
                setShowForm(true)
                if (!editingId) setError('')
              }}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                showForm
                  ? 'border-yellow-500 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {editingId ? '🔐 Update Permissions' : '➕ Create New Sub-Admin'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                !showForm
                  ? 'border-yellow-500 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All Sub-Admins ({subAdmins.length})
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {showForm ? (
            /* Create Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {editingId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-700 text-sm">You are updating permissions for an existing sub-admin. Username and email cannot be changed.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    required
                    disabled={!!editingId}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    required
                    disabled={!!editingId}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {!editingId && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        required={!editingId}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                        required={!editingId}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Permissions</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'can_manage_users', label: 'Manage Users' },
                    { key: 'can_manage_institutions', label: 'Manage Institutions' },
                    { key: 'can_manage_courses', label: 'Manage Courses' },
                    { key: 'can_manage_cbt', label: 'Manage CBT/Exams' },
                    { key: 'can_view_payments', label: 'View Payments' },
                    { key: 'can_manage_blog', label: 'Manage Blog' },
                    { key: 'can_view_messages', label: 'View Messages' },
                    { key: 'can_manage_subadmins', label: 'Manage Sub-Admins' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name={perm.key}
                        checked={(formData as any)[perm.key]}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-yellow-500"
                      />
                      <span className="text-sm text-gray-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-yellow-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Update Permissions' : 'Create Sub-Admin'}
                </button>
              </div>
            </form>
          ) : (
            /* Sub-Admins List */
            <div>
              {listLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
                  <span className="text-gray-600">Loading sub-admins...</span>
                </div>
              ) : subAdmins.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No sub-admins created yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subAdmins.map((subadmin) => (
                    <div
                      key={subadmin.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{subadmin.user.username}</h4>
                          <p className="text-sm text-gray-600">{subadmin.user.email}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            subadmin.is_active
                              ? 'bg-yellow-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subadmin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Permissions */}
                      <div className="mb-3 text-sm">
                        <p className="text-gray-700 font-medium mb-2">Permissions:</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'can_manage_users', label: 'Users' },
                            { key: 'can_manage_institutions', label: 'Institutions' },
                            { key: 'can_manage_courses', label: 'Courses' },
                            { key: 'can_manage_cbt', label: 'CBT' },
                            { key: 'can_view_payments', label: 'Payments' },
                            { key: 'can_manage_blog', label: 'Blog' },
                            { key: 'can_view_messages', label: 'Messages' },
                            { key: 'can_manage_subadmins', label: 'Sub-Admins' },
                          ]
                            .filter((perm) => (subadmin as any)[perm.key])
                            .map((perm) => (
                              <span
                                key={perm.key}
                                className="px-2 py-1 bg-yellow-100 text-green-700 rounded-full text-xs"
                              >
                                {perm.label}
                              </span>
                            ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Created: {new Date(subadmin.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEdit(subadmin)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Edit sub-admin"
                          >
                            <UserCog className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(subadmin.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete sub-admin"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
