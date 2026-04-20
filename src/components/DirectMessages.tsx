import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Send, Loader, ArrowLeft } from 'lucide-react'
import UserSearchBox from './UserSearchBox'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Conversation {
  thread_id: string
  other_user_id: number
  other_user_username: string
  other_user_first_name: string
  last_message: string
  last_message_date: string
  unread_count: number
}

interface DirectMessage {
  id: number
  thread_id: string
  sender_id: number
  sender_username: string
  recipient_id: number
  recipient_username: string
  message: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

interface SelectedUser {
  id: number
  username: string
  email: string
  first_name: string
  display_name: string
}

export default function DirectMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null)
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id)
    }
  }, [selectedUser])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/messages/direct/conversations/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversations(response.data.results || response.data || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (userId: number) => {
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/messages/direct/thread/`, {
        params: { user_id: userId },
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(response.data || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError('Failed to load messages')
    }
  }

  const handleSelectUser = (user: any) => {
    setSelectedUser({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      display_name: user.display_name
    })
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedUser({
      id: conversation.other_user_id,
      username: conversation.other_user_username,
      email: '',
      first_name: conversation.other_user_first_name,
      display_name: conversation.other_user_first_name || conversation.other_user_username
    })
  }

  const handleSendMessage = async () => {
    if (!selectedUser || !messageText.trim()) {
      return
    }

    setSendingMessage(true)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.post(
        `${API_BASE}/messages/direct/`,
        {
          recipient_id: selectedUser.id,
          message: messageText
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Add new message to thread
      setMessages([...messages, response.data])
      setMessageText('')

      // Refresh conversations to update last message
      fetchConversations()
      setError(null)
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // View: No user selected - Show conversation list
  if (!selectedUser) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Direct Messages</h3>
          <UserSearchBox onSelectUser={handleSelectUser} placeholder="Search for a user to message..." />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="animate-spin mx-auto mb-2 text-gray-600 dark:text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Search for a user above to start messaging</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {conversations.map((conv) => (
                <button
                  key={conv.thread_id}
                  onClick={() => handleSelectConversation(conv)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition border-l-4 border-transparent hover:border-yellow-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white">{conv.other_user_first_name || conv.other_user_username}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">{conv.last_message}</div>
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
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // View: User selected - Show message thread
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-900">
        <button
          onClick={() => {
            setSelectedUser(null)
            setMessages([])
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white">{selectedUser.display_name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-950">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === parseInt(localStorage.getItem('user_id') || '0') ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender_id === parseInt(localStorage.getItem('user_id') || '0')
                    ? 'bg-yellow-600 text-white dark:bg-yellow-600 dark:text-white'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                }`}
              >
                <p className="text-sm break-words">{msg.message}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === parseInt(localStorage.getItem('user_id') || '0') ? 'text-yellow-100 dark:text-yellow-100' : 'text-gray-600 dark:text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Compose */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            rows={3}
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendingMessage}
            className="flex-shrink-0 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 font-semibold"
          >
            {sendingMessage ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
