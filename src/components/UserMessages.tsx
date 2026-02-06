import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Loader2, AlertCircle, Mail, CheckCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Msg {
  id: number
  sender?: number
  sender_username?: string
  sender_email?: string
  subject: string
  message: string
  message_type: string
  is_read: boolean
  is_replied: boolean
  reply_message?: string
  replied_at?: string
  created_at: string
}

export default function UserMessages({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) loadInbox()
  }, [isOpen])

  async function loadInbox() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access')
      const res = await axios.get(`${API_BASE}/messages/inbox/`, { headers: { Authorization: `Bearer ${token}` } })
      // backend returns list or paginated results
      const items = res.data.results || res.data || []
      // Debug logs removed for production
      setMessages(items)
    } catch (err: any) {
      console.error('Failed to load inbox', err)
      console.error('[UserMessages] Error details:', err.response?.data || err.message)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: number) {
    try {
      const token = localStorage.getItem('access')
      await axios.post(`${API_BASE}/messages/${id}/mark_as_read/`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m))
    } catch (err) {
      console.error('mark read failed', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Inbox</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 transition">Close</button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No messages yet</p>
            <p className="text-xs mt-1">Messages from admins will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {messages.map(m => (
              <div key={m.id} className="border border-gray-200 rounded p-3 sm:p-4 bg-white hover:shadow-sm transition">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 break-words">{m.subject}</div>
                    <div className="text-xs text-gray-500">From: {m.sender_username || m.sender_email || 'User'}</div>
                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap break-words">{m.message}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-400 whitespace-nowrap">{new Date(m.created_at).toLocaleString()}</div>
                    <div className="mt-2">
                      {!m.is_read && <button onClick={() => markAsRead(m.id)} className="text-xs px-2 py-1 bg-yellow-50 text-green-700 rounded hover:bg-yellow-100 transition">Mark read</button>}
                    </div>
                  </div>
                </div>
                {m.is_replied && m.reply_message && (
                  <div className="mt-3 p-3 border-l-4 border-yellow-200 bg-yellow-50 rounded">
                    <div className="text-xs font-semibold text-gray-700">✓ Admin reply</div>
                    <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap break-words">{m.reply_message}</div>
                    {m.replied_at && <div className="text-xs text-gray-500 mt-1">{new Date(m.replied_at).toLocaleString()}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
