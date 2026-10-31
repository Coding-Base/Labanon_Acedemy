import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  Camera,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
  UserCheck
} from 'lucide-react'
import { resolveImageUrl } from '../../utils/imageUtils'
import showToast from '../../utils/toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface AdminProfileManagementProps {
  darkMode: boolean
  summary: any
  onProfileUpdated: (updatedUser: any) => void
}

export default function AdminProfileManagement({
  darkMode,
  summary,
  onProfileUpdated
}: AdminProfileManagementProps) {
  // Form states
  const [username, setUsername] = useState(summary?.username || '')
  const [firstName, setFirstName] = useState(summary?.first_name || '')
  const [lastName, setLastName] = useState(summary?.last_name || '')
  const [email, setEmail] = useState(summary?.email || '')

  // Password fields
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  // Image states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI status
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Sync initial values when summary changes
  useEffect(() => {
    if (summary) {
      setUsername(summary.username || '')
      setFirstName(summary.first_name || '')
      setLastName(summary.last_name || '')
      setEmail(summary.email || '')
    }
  }, [summary])

  // Handle image selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image must be less than 5MB')
      return
    }

    // Validate format
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP)')
      return
    }

    setError(null)
    setSelectedFile(file)
    setRemoveImage(false)
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setRemoveImage(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle Save Profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!username.trim()) {
      setError('Username cannot be empty')
      return
    }

    // Validate password if user entered a new password
    if (newPassword) {
      if (!oldPassword) {
        setError('Current password is required to set a new password')
        return
      }
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match')
        return
      }
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('access')
      const formData = new FormData()

      formData.append('username', username.trim())
      formData.append('first_name', firstName.trim())
      formData.append('last_name', lastName.trim())
      if (email.trim()) {
        formData.append('email', email.trim())
      }

      if (selectedFile) {
        formData.append('profile_image', selectedFile)
      } else if (removeImage) {
        formData.append('remove_profile_image', 'true')
      }

      if (newPassword) {
        formData.append('old_password', oldPassword)
        formData.append('new_password', newPassword)
        formData.append('confirm_password', confirmPassword)
      }

      const res = await axios.patch(`${API_BASE}/users/profile-update/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      const updatedUser = res.data?.user || {}

      // Reset password fields
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSelectedFile(null)

      setSuccess('Profile updated successfully!')
      showToast('Profile updated successfully!', 'success')

      // Notify parent to update summary and local state
      onProfileUpdated({
        ...summary,
        username: updatedUser.username || username.trim(),
        first_name: updatedUser.first_name || firstName.trim(),
        last_name: updatedUser.last_name || lastName.trim(),
        email: updatedUser.email || email.trim(),
        profile_image: updatedUser.profile_image !== undefined ? updatedUser.profile_image : summary?.profile_image
      })
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to update profile. Please try again.'
      setError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Current display image
  const currentAvatarUrl = previewUrl
    ? previewUrl
    : !removeImage && summary?.profile_image
    ? resolveImageUrl(summary.profile_image)
    : null

  const isSubAdmin = Boolean(summary?.subadmin_profile)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
            Admin Profile & Account Settings
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Manage your administrator credentials, photo, username, and password
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            isSubAdmin
              ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
              : 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50'
          }`}>
            <Shield className="w-3.5 h-3.5" />
            {isSubAdmin ? 'Sub-Administrator' : 'Master Administrator'}
          </span>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-900/30 border border-red-700/50 text-red-300 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <div className="text-sm font-medium">{error}</div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-700/50 text-emerald-300 flex items-start gap-3"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
          <div className="text-sm font-medium">{success}</div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Card & Avatar Upload */}
        <div className={`p-6 rounded-2xl border shadow-sm ${
          darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-yellow-500" />
            Profile Photo
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar Display */}
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-yellow-500 shadow-md bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white text-3xl font-extrabold">
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={username || 'Admin avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (username?.charAt(0) || 'A').toUpperCase()
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            {/* Upload / Remove Actions */}
            <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
              <div>
                <h4 className="font-semibold text-base">
                  {summary?.first_name || summary?.last_name
                    ? `${summary.first_name || ''} ${summary.last_name || ''}`.trim()
                    : username}
                </h4>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  This image will be displayed on your master admin dashboard header and sidebar.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Choose Photo
                </button>

                {(currentAvatarUrl || selectedFile) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl border transition flex items-center gap-2 ${
                      darkMode
                        ? 'border-red-800/80 bg-red-950/40 text-red-300 hover:bg-red-900/40'
                        : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>

              <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                JPG, PNG, WEBP or GIF. Max file size: 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Credentials & Details Card */}
        <div className={`p-6 rounded-2xl border shadow-sm ${
          darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-yellow-500" />
            Account Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                darkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-yellow-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-yellow-500'
                  }`}
                />
              </div>
              <p className={`text-xs mt-1.5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                You use this username to sign in to the platform.
              </p>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                darkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lighthubacademy.org"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-yellow-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-yellow-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                darkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-yellow-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-yellow-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                darkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-yellow-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-yellow-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className={`p-6 rounded-2xl border shadow-sm ${
          darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-yellow-500" />
            Security & Password
          </h3>
          <p className={`text-xs mb-5 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Leave password fields empty if you do not wish to change your password.
          </p>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                darkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  className={`w-full pl-4 pr-11 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg ${
                    darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className={`w-full pl-4 pr-11 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-slate-100'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg ${
                      darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    className={`w-full pl-4 pr-11 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-slate-100'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg ${
                      darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-600 hover:from-yellow-700 hover:to-yellow-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Save Profile Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
