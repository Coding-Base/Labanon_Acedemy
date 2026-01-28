import React, { useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000/api'

interface CommentFormProps {
  blogId: number
  parentCommentId?: number
  onCommentAdded?: () => void
  isReply?: boolean
  onCancel?: () => void
}

export default function CommentForm({
  blogId,
  parentCommentId,
  onCommentAdded,
  isReply = false,
  onCancel
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('access')
      if (!token) {
        setError('Please log in to comment')
        return
      }

      await axios.post(
        `${API_BASE}/blog/comments/`,
        {
          blog: blogId,
          content: content.trim(),
          parent_comment: parentCommentId || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setContent('')
      onCommentAdded?.()
    } catch (err) {
      console.error('Failed to post comment:', err)
      setError('Failed to post comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className={`space-y-4 ${isReply ? 'pl-6 border-l-2 border-gray-200 my-4' : ''}`}
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isReply ? 'Write a reply...' : 'Share your thoughts...'}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none"
          rows={isReply ? 2 : 4}
          disabled={loading}
        />
      </div>

      <div className="flex gap-3 justify-end">
        {isReply && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading || !content.trim()}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {isReply ? 'Reply' : 'Comment'}
            </>
          )}
        </motion.button>
      </div>
    </motion.form>
  )
}
