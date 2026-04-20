import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Mail, Send, Loader, ArrowLeft, AlertCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface DirectMessage {
  id: number
  sender_id: number
  sender_username: string
  recipient_id: number
  message: string
  is_read: boolean
  created_at: string
}

interface Conversation {
  thread_id: string
  other_user_id: number
  other_user_username: string
  other_user_first_name: string
  last_message: string
  last_message_date: string
  unread_count: number
}

export default function DirectMessageInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
    fetchUnreadCount()
  }, [])

  // Fetch messages when thread is selected
  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread)
    }
  }, [selectedThread])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/messages/direct/conversations/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Show all conversations - endpoint returns array directly, not paginated
      const convList = Array.isArray(response.data) ? response.data : (response.data.results || [])
      setConversations(convList)
      setError(null)
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (threadId: string) => {
    try {
      const token = localStorage.getItem('access')
      const currConv = conversations.find(c => c.thread_id === threadId)
      if (!currConv) return
      
      const response = await axios.get(`${API_BASE}/messages/direct/thread/`, {
        params: { user_id: currConv.other_user_id },
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(response.data || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError('Failed to load messages')
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/messages/direct/unread_count/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUnreadCount(response.data.unread_count || 0)
    } catch (err) {
      console.warn('Failed to fetch unread count:', err)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return

    setSending(true)
    try {
      const token = localStorage.getItem('access')
      
      // Get the other user's ID from the conversation
      const currConv = conversations.find(c => c.thread_id === selectedThread)
      if (!currConv) return
      
      const response = await axios.post(
        `${API_BASE}/messages/direct/`,
        {
          recipient_id: currConv.other_user_id,
          message: replyText
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Add new message to thread
      setMessages([...messages, response.data])
      setReplyText('')
      setError(null)
    } catch (err: any) {
      console.error('Failed to send reply:', err)
      setError(err.response?.data?.detail || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  // No thread selected - show conversation list
  if (!selectedThread) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Messages from Administrator</h3>
            {unreadCount > 0 && (
              <span className="bg-yellow-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Conversation List */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="animate-spin mx-auto mb-2 text-gray-600 dark:text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p>No messages yet</p>
              <p className="text-sm mt-2">Messages from the administrator will appear here</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.thread_id}
                onClick={() => setSelectedThread(conv.thread_id)}
                className="w-full p-4 text-left hover:bg-yellow-50 dark:hover:bg-gray-800 transition border-l-4 border-transparent hover:border-yellow-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {conv.other_user_first_name || conv.other_user_username}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                      {conv.last_message}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {new Date(conv.last_message_date).toLocaleDateString()}
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="bg-yellow-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {conv.unread_count}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // Thread selected - show message thread
  const sender = conversations.find(c => c.thread_id === selectedThread)
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => {
            setSelectedThread(null)
            setMessages([])
            setReplyText('')
          }}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Message from {sender?.other_user_first_name || sender?.other_user_username || 'Administrator'}
          </h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-950">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No messages</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <p className="text-sm break-words">{msg.message}</p>
                <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Reply Compose */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your reply... (Shift+Enter for new line)"
            rows={2}
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            onClick={handleSendReply}
            disabled={!replyText.trim() || sending}
            className="flex-shrink-0 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 font-semibold"
          >
            {sending ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
