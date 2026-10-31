import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { X, AlertCircle, CheckCircle, Trash2, Loader2, UserCog, Plus, Search, CheckSquare, Square, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface SubAdmin {
  id: number
  user: {
    id: number
    username: string
    email: string
  }
  permissions?: Record<string, boolean>
  can_manage_users?: boolean
  can_manage_institutions?: boolean
  can_manage_courses?: boolean
  can_manage_cbt?: boolean
  can_view_payments?: boolean
  can_manage_blog?: boolean
  can_view_messages?: boolean
  can_manage_subadmins?: boolean
  is_active: boolean
  created_at: string
}

interface AvailablePermission {
  label: string
  category: string
  icon?: string
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
  })
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, AvailablePermission>>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchSubAdmins()
      fetchAvailablePermissions()
    }
  }, [isOpen])

  const fetchAvailablePermissions = async () => {
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/subadmin/available_permissions/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data && typeof res.data === 'object') {
        setAvailablePermissions(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch available permissions:', err)
    }
  }

  const fetchSubAdmins = async () => {
    try {
      setListLoading(true)
      const token = localStorage.getItem('access')
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
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePermissionToggle = (key: string) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSelectAll = (select: boolean) => {
    const updated: Record<string, boolean> = {}
    Object.keys(availablePermissions).forEach(key => {
      updated[key] = select
    })
    setPermissions(updated)
  }

  const categories = useMemo(() => {
    const cats = new Set<string>()
    Object.values(availablePermissions).forEach(p => {
      if (p.category) cats.add(p.category)
    })
    return ['all', ...Array.from(cats)]
  }, [availablePermissions])

  const filteredPermissions = useMemo(() => {
    return Object.entries(availablePermissions).filter(([key, perm]) => {
      const matchesCategory = selectedCategory === 'all' || perm.category === selectedCategory
      const matchesSearch =
        searchQuery === '' ||
        perm.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        perm.category.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [availablePermissions, selectedCategory, searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.username.trim()) {
      setError('Username is required')
      return
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

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

      // Legacy fallback mapping
      const legacyPayload: Record<string, boolean> = {
        can_manage_users: !!permissions.can_manage_users,
        can_manage_institutions: !!permissions.can_manage_institutions,
        can_manage_courses: !!permissions.can_manage_courses,
        can_manage_cbt: !!permissions.can_manage_cbt,
        can_view_payments: !!permissions.can_view_payments,
        can_manage_blog: !!permissions.can_manage_blog,
        can_view_messages: !!permissions.can_view_messages,
        can_manage_subadmins: !!permissions.can_manage_subadmins,
      }

      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        permissions,
        ...legacyPayload,
      }

      if (editingId) {
        // Update permissions for existing sub-admin
        await axios.patch(
          `${API_BASE}/subadmin/${editingId}/`,
          { permissions, ...legacyPayload },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setSuccess('Sub-admin permissions updated successfully')
        setEditingId(null)
      } else {
        // Create new sub-admin
        await axios.post(
          `${API_BASE}/subadmin/create_subadmin/`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setSuccess('Sub-admin created successfully!')
      }

      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
      setPermissions({})
      setShowForm(false)

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
    })

    const initialPerms: Record<string, boolean> = { ...(sub.permissions || {}) }
    const legacyKeys = [
      'can_manage_users', 'can_manage_institutions', 'can_manage_courses',
      'can_manage_cbt', 'can_view_payments', 'can_manage_blog',
      'can_view_messages', 'can_manage_subadmins'
    ]
    legacyKeys.forEach(k => {
      if ((sub as any)[k] !== undefined && initialPerms[k] === undefined) {
        initialPerms[k] = !!(sub as any)[k]
      }
    })
    setPermissions(initialPerms)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sub-admin?')) return

    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/subadmin/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess('Sub-admin deleted successfully')
      await fetchSubAdmins()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete sub-admin')
    }
  }

  if (!isOpen) return null

  const activePermsCount = Object.values(permissions).filter(Boolean).length

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UserCog className="w-6 h-6 text-yellow-600" />
              Sub-Admin Management
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Assign dynamic access permissions to platform modules and features
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50 px-6 flex-shrink-0">
          <button
            onClick={() => {
              setShowForm(false)
              setEditingId(null)
              setError('')
              setSuccess('')
            }}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
              !showForm
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Sub-Admins ({subAdmins.length})
          </button>
          <button
            onClick={() => {
              setShowForm(true)
              if (editingId) {
                setEditingId(null)
                setFormData({ username: '', email: '', password: '', confirmPassword: '' })
                setPermissions({})
              }
              setError('')
              setSuccess('')
            }}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
              showForm
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {editingId ? 'Edit Sub-Admin' : 'Create New Sub-Admin'}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {showForm ? (
            /* Sub-Admin Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="e.g. exams_officer"
                    disabled={!!editingId}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. officer@lighthubacademy.org"
                    disabled={!!editingId}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {!editingId && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 6 characters"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Dynamic Permissions Section */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-gray-900">Dynamic Feature Permissions</label>
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                        {activePermsCount} Active
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      New features added to the platform appear here automatically.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(true)}
                      className="px-2.5 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-300 rounded flex items-center gap-1 transition-colors"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(false)}
                      className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 rounded flex items-center gap-1 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" /> Clear All
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  {categories.length > 1 && (
                    <div className="flex items-center gap-1">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="py-1.5 px-3 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-700"
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>
                            {c === 'all' ? 'All Categories' : c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Permissions Grid */}
                {filteredPermissions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-500">
                    No permissions match your search or filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {filteredPermissions.map(([key, perm]) => {
                      const isChecked = !!permissions[key]
                      return (
                        <label
                          key={key}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-yellow-50/60 border-yellow-400 text-gray-900 shadow-xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePermissionToggle(key)}
                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">{perm.label}</div>
                            <div className="text-[10px] text-gray-400 truncate">{perm.category}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-semibold rounded-lg hover:from-yellow-700 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Save Permissions' : 'Create Sub-Admin'}
                </button>
              </div>
            </form>
          ) : (
            /* Sub-Admins List */
            <div>
              {listLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mr-3" />
                  <span className="text-gray-600 text-sm">Loading sub-admins...</span>
                </div>
              ) : subAdmins.length === 0 ? (
                <div className="text-center py-12">
                  <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-700 font-semibold mb-1">No sub-admin accounts yet</p>
                  <p className="text-gray-500 text-xs mb-4">Create one to delegate specific modules and features</p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowForm(true)
                      setEditingId(null)
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg font-semibold hover:bg-yellow-700 transition-colors inline-flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Create Sub-Admin
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subAdmins.map((subadmin) => {
                    const assignedKeys = Object.entries(subadmin.permissions || {})
                      .filter(([_, val]) => !!val)
                      .map(([k]) => k)

                    // Fallback to legacy if no permissions dict was present
                    const legacyKeys = [
                      'can_manage_users', 'can_manage_institutions', 'can_manage_courses',
                      'can_manage_cbt', 'can_view_payments', 'can_manage_blog',
                      'can_view_messages', 'can_manage_subadmins'
                    ].filter(k => (subadmin as any)[k])

                    const displayKeys = assignedKeys.length > 0 ? assignedKeys : legacyKeys

                    return (
                      <div
                        key={subadmin.id}
                        className="bg-white rounded-xl p-4 border border-gray-200 hover:border-yellow-300 transition-all shadow-xs"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{subadmin.user.username}</h4>
                            <p className="text-xs text-gray-500">{subadmin.user.email}</p>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              subadmin.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {subadmin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Permissions Badges */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-1.5">
                            Assigned Features ({displayKeys.length}):
                          </p>
                          {displayKeys.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {displayKeys.map((key) => {
                                const permInfo = availablePermissions[key]
                                const label = permInfo?.label || key.replace(/^can_/, '').replace(/_/g, ' ')
                                return (
                                  <span
                                    key={key}
                                    className="px-2 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md text-[11px] font-medium"
                                  >
                                    {label}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <p className="text-[11px] text-gray-400">
                            Created: {new Date(subadmin.created_at).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEdit(subadmin)}
                              className="p-1.5 text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Edit Permissions"
                            >
                              <UserCog className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(subadmin.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Sub-Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
