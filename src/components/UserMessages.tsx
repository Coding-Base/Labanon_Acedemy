import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Loader2, Mail } from 'lucide-react'

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

export default function UserMessages({ isOpen, onClose, darkMode }: { isOpen: boolean; onClose: () => void; darkMode?: boolean }) {
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
      const items = res.data.results || res.data || []
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

  const inferredDark = typeof darkMode === 'boolean' ? darkMode : (localStorage.getItem('studentDashboardDarkMode') === 'true' || localStorage.getItem('institutionDashboardDarkMode') === 'true')

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div className={`${inferredDark ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-white'} rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Inbox</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className={`${inferredDark ? 'px-3 py-1 text-sm bg-slate-700 rounded hover:bg-slate-700/90' : 'px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200'} transition`}>Close</button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>
        ) : messages.length === 0 ? (
          <div className={`${inferredDark ? 'p-8 text-center text-slate-300' : 'p-8 text-center text-gray-500'}`}>
            <Mail className={`${inferredDark ? 'w-12 h-12 text-slate-600 mx-auto mb-2' : 'w-12 h-12 text-gray-300 mx-auto mb-2'}`} />
            <p>No messages yet</p>
            <p className="text-xs mt-1">Messages from admins will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {messages.map(m => (
              <div key={m.id} className={`${inferredDark ? 'border border-slate-700 rounded p-3 sm:p-4 bg-slate-800 hover:bg-slate-700/50' : 'border border-gray-200 rounded p-3 sm:p-4 bg-white hover:shadow-sm'} transition`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className={`${inferredDark ? 'font-semibold text-slate-100' : 'font-semibold text-gray-900'} break-words`}>{m.subject}</div>
                    <div className={`${inferredDark ? 'text-xs text-slate-400' : 'text-xs text-gray-500'}`}>From: {m.sender_username || m.sender_email || 'User'}</div>
                    <div className={`${inferredDark ? 'mt-2 text-sm text-slate-200' : 'mt-2 text-sm text-gray-700'} whitespace-pre-wrap break-words`}>{m.message}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className={`${inferredDark ? 'text-xs text-slate-400' : 'text-xs text-gray-400'} whitespace-nowrap`}>{new Date(m.created_at).toLocaleString()}</div>
                    <div className="mt-2">
                      {!m.is_read && <button onClick={() => markAsRead(m.id)} className="text-xs px-2 py-1 bg-yellow-50 text-green-700 rounded hover:bg-yellow-100 transition">Mark read</button>}
                    </div>
                  </div>
                </div>
                {m.is_replied && m.reply_message && (
                  <div className={`${inferredDark ? 'mt-3 p-3 border-l-4 border-yellow-800 bg-yellow-900/10 rounded' : 'mt-3 p-3 border-l-4 border-yellow-200 bg-yellow-50 rounded'}`}>
                    <div className={`${inferredDark ? 'text-xs font-semibold text-yellow-300' : 'text-xs font-semibold text-gray-700'}`}>✓ Admin reply</div>
                    <div className={`${inferredDark ? 'mt-1 text-sm text-slate-200' : 'mt-1 text-sm text-gray-800'} whitespace-pre-wrap break-words`}>{m.reply_message}</div>
                    {m.replied_at && <div className={`${inferredDark ? 'text-xs text-slate-400 mt-1' : 'text-xs text-gray-500 mt-1'}`}>{new Date(m.replied_at).toLocaleString()}</div>}
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
