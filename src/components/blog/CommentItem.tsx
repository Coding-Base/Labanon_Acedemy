import React, { useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Trash2, Loader2 } from 'lucide-react'
import CommentForm from './CommentForm'

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

interface CommentItemProps {
  comment: Comment
  blogId: number
  currentUserId?: number
  onCommentDeleted?: () => void
  onCommentUpdated?: () => void
  isReply?: boolean
}

export default function CommentItem({
  comment,
  blogId,
  currentUserId,
  onCommentDeleted,
  onCommentUpdated,
  isReply = false
}: CommentItemProps) {
  const [likes, setLikes] = useState(comment.likes_count)
  const [liked, setLiked] = useState(comment.user_liked)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [liking, setLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  async function handleLike() {
    setLiking(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      const response = await axios.post(
        `${API_BASE}/blog/comments/${comment.id}/like/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setLiked(response.data.liked)
      setLikes(response.data.likes_count)
    } catch (err) {
      console.error('Failed to like comment:', err)
    } finally {
      setLiking(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return

    setDeleting(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      await axios.delete(`${API_BASE}/blog/comments/${comment.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      onCommentDeleted?.()
    } catch (err) {
      console.error('Failed to delete comment:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'ml-6' : ''}`}
    >
      <div className="bg-white rounded-xl p-4 mb-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {comment.author_username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{comment.author_username || comment.author_name || 'Guest'}</p>
              <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
            </div>
          </div>

          {currentUserId === comment.author_id && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              disabled={deleting}
              className="text-gray-400 hover:text-red-600 transition-colors p-2"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </motion.button>
          )}
        </div>

        {/* Content */}
        <p className="text-gray-700 mb-4 leading-relaxed">{comment.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-6 text-sm">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-2 transition-colors ${
              liked
                ? 'text-red-600'
                : 'text-gray-600 hover:text-red-600'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${liked ? 'fill-current' : ''}`}
            />
            {likes > 0 && <span>{likes}</span>}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Reply
          </motion.button>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <CommentForm
            blogId={blogId}
            parentCommentId={comment.id}
            onCommentAdded={() => {
              setShowReplyForm(false)
              onCommentUpdated?.()
            }}
            isReply
            onCancel={() => setShowReplyForm(false)}
          />
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                blogId={blogId}
                currentUserId={currentUserId}
                onCommentDeleted={onCommentUpdated}
                onCommentUpdated={onCommentUpdated}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
