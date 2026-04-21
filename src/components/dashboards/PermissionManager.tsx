import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface SubAdminForPerm {
  id: number
  user: {
    id: number
    username: string
    email: string
  }
  permissions: Record<string, boolean>
  is_active: boolean
  created_at: string
}

interface AvailablePermission {
  label: string
  category: string
  icon: string
}

interface PermissionManagerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PermissionManager({ isOpen, onClose, onSuccess }: PermissionManagerProps) {
  const [subAdmins, setSubAdmins] = useState<SubAdminForPerm[]>([])
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdminForPerm | null>(null)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, AvailablePermission>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access')
      
      // Fetch sub-admins
      const subAdminsRes = await axios.get(`${API_BASE}/subadmin/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubAdmins(subAdminsRes.data)
      
      // Fetch available permissions
      const permsRes = await axios.get(`${API_BASE}/subadmin/available_permissions/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAvailablePermissions(permsRes.data)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setMessage({ type: 'error', text: 'Failed to load permissions' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSubAdmin = (subAdmin: SubAdminForPerm) => {
    setSelectedSubAdmin(subAdmin)
    setPermissions(subAdmin.permissions || {})
    setMessage(null)
  }

  const handlePermissionToggle = (permKey: string) => {
    setPermissions({
      ...permissions,
      [permKey]: !permissions[permKey]
    })
  }

  const handleQuickAction = (action: 'all-on' | 'all-off' | 'viewer' | 'editor' | 'admin') => {
    const newPermissions: Record<string, boolean> = {}
    
    Object.keys(availablePermissions).forEach(key => {
      switch (action) {
        case 'all-on':
          newPermissions[key] = true
          break
        case 'all-off':
          newPermissions[key] = false
          break
        case 'viewer':
          // Viewer can only view
          newPermissions[key] = key.startsWith('can_view_')
          break
        case 'editor':
          // Editor can view and manage (except admin features)
          newPermissions[key] = !key.includes('subadmin') && !key.includes('permission')
          break
        case 'admin':
          // Admin has all permissions
          newPermissions[key] = true
          break
      }
    })
    
    setPermissions(newPermissions)
  }

  const handleSave = async () => {
    if (!selectedSubAdmin) return

    try {
      setSaving(true)
      const token = localStorage.getItem('access')
      
      await axios.patch(`${API_BASE}/subadmin/${selectedSubAdmin.id}/`, {
        permissions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setMessage({ type: 'success', text: 'Permissions updated successfully!' })
      setTimeout(() => {
        setMessage(null)
        onSuccess()
        fetchData()
      }, 2000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save permissions' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedSubAdmin(null)
    setPermissions({})
    setMessage(null)
  }

  // Group permissions by category
  const categories = Array.from(
    new Set(Object.values(availablePermissions).map(p => p.category))
  ).sort()

  const getPermissionsByCategory = (category: string) => {
    return Object.entries(availablePermissions)
      .filter(([_, perm]) => perm.category === category)
      .sort(([_, a], [__, b]) => a.label.localeCompare(b.label))
  }

  // Filter permissions based on search
  const filteredCategories = categories.filter(category => {
    if (!searchQuery.trim()) return true
    const permsInCategory = getPermissionsByCategory(category)
    return (
      category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permsInCategory.some(([_, perm]) =>
        perm.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Manage Permissions</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sub-Admin List */}
          <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-sm text-gray-900 mb-4">Sub-Admins</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              ) : subAdmins.length === 0 ? (
                <p className="text-sm text-gray-500">No sub-admins</p>
              ) : (
                subAdmins.map(subAdmin => (
                  <button
                    key={subAdmin.id}
                    onClick={() => handleSelectSubAdmin(subAdmin)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSubAdmin?.id === subAdmin.id
                        ? 'bg-blue-100 border-l-4 border-blue-600 text-blue-900'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <p className="font-medium text-sm">{subAdmin.user.username}</p>
                    <p className="text-xs text-gray-600">{subAdmin.user.email}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Permissions Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedSubAdmin ? (
              <div>
                {/* Status Messages */}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                      message.type === 'success'
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                      {message.text}
                    </span>
                  </motion.div>
                )}

                {/* Sub-Admin Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{selectedSubAdmin.user.username}</h3>
                  <p className="text-sm text-gray-600">{selectedSubAdmin.user.email}</p>
                </div>

                {/* Quick Actions */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Quick Actions:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuickAction('all-off')}
                      className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => handleQuickAction('all-on')}
                      className="px-3 py-2 bg-green-200 text-green-800 rounded-lg text-sm font-medium hover:bg-green-300 transition-colors"
                    >
                      Grant All
                    </button>
                    <button
                      onClick={() => handleQuickAction('viewer')}
                      className="px-3 py-2 bg-blue-200 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-300 transition-colors"
                    >
                      Viewer Role
                    </button>
                    <button
                      onClick={() => handleQuickAction('editor')}
                      className="px-3 py-2 bg-indigo-200 text-indigo-800 rounded-lg text-sm font-medium hover:bg-indigo-300 transition-colors"
                    >
                      Editor Role
                    </button>
                    <button
                      onClick={() => handleQuickAction('admin')}
                      className="px-3 py-2 bg-purple-200 text-purple-800 rounded-lg text-sm font-medium hover:bg-purple-300 transition-colors"
                    >
                      Admin Role
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Permissions by Category */}
                <div className="space-y-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  ) : filteredCategories.length === 0 ? (
                    <p className="text-center text-gray-500">No permissions found</p>
                  ) : (
                    filteredCategories.map(category => (
                      <div key={category}>
                        <h4 className="font-bold text-gray-900 mb-3">{category}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {getPermissionsByCategory(category).map(([permKey, permData]) => (
                            <label
                              key={permKey}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={permissions[permKey] ?? false}
                                onChange={() => handlePermissionToggle(permKey)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-900">{permData.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Permissions
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a sub-admin to manage permissions</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
