import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import showToast from './toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Message {
  id: number
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

/**
 * Hook to detect new messages and show notifications
 * Polls the inbox every 10 seconds for new unread messages
 * Shows toast notification when new documents are sent
 * Triggers notification after a delay on initial load (when dashboard/compliance page opens)
 */
export function useNotifications(showInitialDelay: boolean = true) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const lastMessageIdsRef = useRef<Set<number>>(new Set())
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>()
  const initialDelayRef = useRef<ReturnType<typeof setTimeout> | undefined>()

  const loadMessages = async (isInitial: boolean = false) => {
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      const res = await axios.get(`${API_BASE}/messages/inbox/`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const items = res.data.results || res.data || []
      setMessages(items)

      // Count unread messages
      const unread = items.filter((m: Message) => !m.is_read).length
      setUnreadCount(unread)

      // Detect new document assignments (newer messages with "New Document" or "assigned" subject)
      items.forEach((msg: Message) => {
        if (!lastMessageIdsRef.current.has(msg.id)) {
          // This is a new message
          if (
            msg.subject.includes('New Document') ||
            msg.subject.includes('assigned') ||
            msg.message.includes('assigned')
          ) {
            // Show toast for new document notification with 8 second timeout
            showToast(
              `📄 ${msg.subject}`,
              'success',
              8000
            )
          }
          lastMessageIdsRef.current.add(msg.id)
        }
      })
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  useEffect(() => {
    if (showInitialDelay) {
      // Delay initial load by 2 seconds to let dashboard fully load
      initialDelayRef.current = setTimeout(() => {
        loadMessages(true)
      }, 2000)
    } else {
      // Load immediately if not showing initial delay
      loadMessages(false)
    }

    // Set up polling interval (every 10 seconds)
    pollingIntervalRef.current = setInterval(() => {
      loadMessages(false)
    }, 10000)

    // Cleanup
    return () => {
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current)
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [showInitialDelay])

  return {
    unreadCount,
    messages,
    loadMessages, // Allow manual refresh
  }
}

export default useNotifications
