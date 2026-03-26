import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Search,
  Settings,
  Trash2,
  ExternalLink,
  Filter,
  AlertCircle,
  CheckCircle,
  Plus,
  Shield,
  User,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Admin {
  id: number
  first_name: string
  last_name: string
  email: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login?: string
}

export default function AdminsManagement() {
  const navigate = useNavigate()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteAdminId, setDeleteAdminId] = useState<number | null>(null)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminFirstName, setNewAdminFirstName] = useState('')
  const [newAdminLastName, setNewAdminLastName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState('')

  const [adminStatus, setAdminStatus] = useState<'active' | 'inactive'>('active')
  const [adminRole, setAdminRole] = useState<'staff' | 'superuser'>('staff')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [toast, setToast] = useState<{type: 'success' | 'error'; message: string} | null>(null)

  useEffect(() => {
    loadAdmins()
  }, [])

  useEffect(() => {
    filterAdmins()
  }, [searchTerm, activeFilter, admins])

  async function loadAdmins() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/users/?role=admin`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const payload = res.data
      const items = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : [])
      setAdmins(items)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load admins')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function filterAdmins() {
    let filtered = admins.filter(admin => {
      const matchesSearch =
        `${admin.first_name} ${admin.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        activeFilter === 'all' ||
        (activeFilter === 'active' && admin.is_active) ||
        (activeFilter === 'inactive' && !admin.is_active)

      return matchesSearch && matchesStatus
    })

    setFilteredAdmins(filtered)
  }

  async function createNewAdmin() {
    if (!newAdminEmail || !newAdminFirstName || !newAdminLastName) {
      setCreationError('Please fill in all fields')
      return
    }

    setIsCreating(true)
    setCreationError('')

    try {
      const token = localStorage.getItem('access')
      const res = await axios.post(
        `${API_BASE}/users/create-admin/`,
        {
          email: newAdminEmail,
          first_name: newAdminFirstName,
          last_name: newAdminLastName,
          is_staff: adminRole === 'staff' || adminRole === 'superuser',
          is_superuser: adminRole === 'superuser',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setAdmins([...admins, res.data])
      setShowAddAdmin(false)
      setNewAdminEmail('')
      setNewAdminFirstName('')
      setNewAdminLastName('')
      setToast({type: 'success', message: 'Admin created successfully! Welcome email has been sent.'})
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setCreationError(err.response?.data?.detail || 'Failed to create admin')
    } finally {
      setIsCreating(false)
    }
  }

  async function openSettings(admin: Admin) {
    setSelectedAdmin(admin)
    setAdminStatus(admin.is_active ? 'active' : 'inactive')
    setAdminRole(admin.is_superuser ? 'superuser' : 'staff')
    setSettingsError('')
    setShowSettings(true)
  }

  async function saveSettings() {
    if (!selectedAdmin) return

    setSettingsSaving(true)
    setSettingsError('')

    try {
      const token = localStorage.getItem('access')
      await axios.patch(
        `${API_BASE}/users/${selectedAdmin.id}/`,
        {
          is_active: adminStatus === 'active',
          is_staff: adminRole === 'staff' || adminRole === 'superuser',
          is_superuser: adminRole === 'superuser',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setAdmins(
        admins.map(a =>
          a.id === selectedAdmin.id
            ? {
                ...a,
                is_active: adminStatus === 'active',
                is_staff: adminRole === 'staff' || adminRole === 'superuser',
                is_superuser: adminRole === 'superuser',
              }
            : a
        )
      )

      setShowSettings(false)
      setToast({type: 'success', message: 'Admin settings updated successfully!'})
      setTimeout(() => setToast(null), 3000)
      
      // Reload admins data from server to ensure settings persist
      loadAdmins()
    } catch (err: any) {
      setSettingsError(err.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  async function deleteAdmin() {
    if (!deleteAdminId) return

    try {
      const token = localStorage.getItem('access')
      await axios.delete(`${API_BASE}/users/${deleteAdminId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setAdmins(admins.filter(a => a.id !== deleteAdminId))
      setShowDeleteConfirm(false)
      setToast({type: 'success', message: 'Admin deleted successfully!'})
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({type: 'error', message: err.response?.data?.detail || 'Failed to delete admin'})
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading admins...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admins Management</h1>
            <p className="text-gray-600 mt-1">Manage admin accounts and permissions</p>
          </div>
          <button
            onClick={() => setShowAddAdmin(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Admin
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
              placeholder="Search by admin name or email..."
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
              <option value="all">All Admins</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Total Admins</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{admins.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {admins.filter(a => a.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Superusers</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {admins.filter(a => a.is_superuser).length}
            </div>
          </div>
        </div>

        {/* Admins Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredAdmins.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No admins found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">
                      Admin
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="text-center py-3 px-6 text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-900">
                      Joined
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
                  {filteredAdmins.map(admin => (
                    <tr key={admin.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {admin.first_name} {admin.last_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{admin.email}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center">
                          {admin.is_superuser ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              <Shield className="w-3 h-3" />
                              Superuser
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              <Shield className="w-3 h-3" />
                              Staff
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(admin.date_joined).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          admin.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openSettings(admin)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                            title="Settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteAdminId(admin.id)
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

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Admin</h2>

              {creationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {creationError}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newAdminFirstName}
                    onChange={(e) => setNewAdminFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newAdminLastName}
                    onChange={(e) => setNewAdminLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Role
                  </label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="staff">Staff Admin</option>
                    <option value="superuser">Superuser</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddAdmin(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewAdmin}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Edit Admin: {selectedAdmin.first_name} {selectedAdmin.last_name}
              </h2>

              {settingsError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {settingsError}
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Role
                  </label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="staff">Staff Admin</option>
                    <option value="superuser">Superuser</option>
                  </select>
                </div>
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
              <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Admin?</h2>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. The admin account will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAdmin}
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
