import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Loader2, MessageCircle } from 'lucide-react'
import CommentForm from './CommentForm'
import CommentItem from './CommentItem'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000/api'

interface Comment {
  id: number
  author_username: string
  author_id: number
  content: string
  likes_count: number
  user_liked: boolean
  created_at: string
  replies?: Comment[]
}

interface CommentSectionProps {
  blogId: number
  currentUserId?: number
}

export default function CommentSection({ blogId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadComments()
  }, [blogId])

  async function loadComments() {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/blog/comments/?blog_id=${blogId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      const data = response.data.results || response.data
      setComments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load comments:', err)
      setError('Failed to load comments')
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleCommentAdded = () => {
    loadComments()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 pt-8 border-t border-gray-200"
    >
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-green-600" />
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <div className="mb-8">
        <CommentForm
          blogId={blogId}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Comments List */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              blogId={blogId}
              currentUserId={currentUserId}
              onCommentDeleted={handleCommentAdded}
              onCommentUpdated={handleCommentAdded}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
