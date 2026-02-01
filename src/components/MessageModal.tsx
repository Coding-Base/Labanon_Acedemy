import React, { useState } from 'react'
// Use Secure API
import api from '../utils/axiosInterceptor'
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  recipientId?: number
  onSuccess?: () => void
}

export default function MessageModal({ isOpen, onClose, recipientId, onSuccess }: MessageModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    message_type: 'contact',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/messages/', {
        subject: formData.subject || 'Message from user',
        message: formData.message,
        message_type: formData.message_type,
        recipient: recipientId 
      })

      setSuccess(true)
      setFormData({ subject: '', message: '', message_type: 'contact' })
      
      setTimeout(() => {
        onClose()
        setSuccess(false)
        if (onSuccess) onSuccess()
      }, 2000)
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to send message'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        // CHANGED: items-end -> items-center for better mobile visibility
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Send Message</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close message dialog"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-yellow-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Message Sent!</h3>
                  <p className="text-gray-500 mt-2">We've received your message and will get back to you shortly.</p>
                </div>
              ) : (
                <form id="msg-form" onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Brief topic..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <div className="relative">
                      <select
                        name="message_type"
                        value={formData.message_type}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 appearance-none bg-white transition-all"
                      >
                        <option value="contact">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="report">Report an Issue</option>
                        <option value="feedback">Feedback / Suggestion</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      rows={5}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 resize-none transition-all"
                    />
                  </div>
                </form>
              )}
            </div>

            {!success && (
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  form="msg-form"
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-yellow-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}