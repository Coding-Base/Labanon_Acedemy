import React, { useState } from 'react'
import axios from 'axios'
import { X, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface ContactAdminFormProps {
  isOpen: boolean
  onClose: () => void
  darkMode?: boolean
}

const MESSAGE_TYPES = [
  { value: 'contact', label: 'General Inquiry' },
  { value: 'support', label: 'Support Request' },
  { value: 'report', label: 'Report Issue' },
  { value: 'feedback', label: 'Feedback' },
]

export default function ContactAdminForm({ isOpen, onClose, darkMode = false }: ContactAdminFormProps) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    message_type: 'contact',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('access')

      // Send message without recipient - backend will auto-route to master admin
      await axios.post(
        `${API_BASE}/messages/`,
        {
          subject: formData.subject,
          message: formData.message,
          message_type: formData.message_type,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      setSuccess(true)
      setFormData({ subject: '', message: '', message_type: 'contact' })
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
          className={`${darkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white text-gray-900'} rounded-2xl shadow-lg max-w-md w-full mx-4 p-6`}
      >
        <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Contact Administrator</h2>
          <button
            onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

          {error && (
            <div className={`${darkMode ? 'mb-4 p-3 bg-red-900/20 border border-red-800 text-red-200' : 'mb-4 p-3 bg-red-50 border border-red-200 text-red-600'} rounded-lg flex items-start gap-2`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className={`${darkMode ? 'mb-4 p-3 bg-yellow-900/20 border border-yellow-800 text-yellow-200' : 'mb-4 p-3 bg-yellow-50 border border-yellow-200 text-green-600'} rounded-lg flex items-start gap-2`}>
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">Message sent successfully!</p>
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'} mb-1`}>Message Type</label>
            <select
              name="message_type"
              value={formData.message_type}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'border border-gray-300 bg-white text-gray-900'}`}
            >
              {MESSAGE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'} mb-1`}>Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="What is this about?"
              className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400' : 'border border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
              disabled={loading}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'} mb-1`}>Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Describe your message..."
              rows={4}
              className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400' : 'border border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-green-600 to-yellow-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
