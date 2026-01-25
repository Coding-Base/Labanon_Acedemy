import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Loader2, Heart, MessageCircle, Share2 } from 'lucide-react'
import CommentSection from '../components/blog/CommentSection'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000/api'

interface BlogPost {
  id: number
  title: string
  excerpt: string
  content: string
  image?: string
  slug: string
  author_username: string
  published_at: string
  created_at: string
  likes_count: number
  comments_count: number
  shares_count: number
  user_liked: boolean
}

export default function BlogDetailPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const [blog, setBlog] = useState<BlogPost | null>(location.state?.blog || null)
  const [loading, setLoading] = useState(!blog)
  const [liked, setLiked] = useState(blog?.user_liked || false)
  const [likesCount, setLikesCount] = useState(blog?.likes_count || 0)
  const [commentsCount, setCommentsCount] = useState(blog?.comments_count || 0)
  const [sharesCount, setSharesCount] = useState(blog?.shares_count || 0)
  const [liking, setLiking] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | undefined>()

  useEffect(() => {
    if (!blog && slug) {
      loadBlog()
    }
  }, [slug, blog])

  useEffect(() => {
    // Get current user ID from token
    async function getCurrentUser() {
      try {
        const token = localStorage.getItem('access')
        if (!token) return

        const response = await axios.get(`${API_BASE}/users/profile/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setCurrentUserId(response.data.id)
      } catch (err) {
        console.error('Failed to get user profile:', err)
      }
    }
    getCurrentUser()
  }, [])

  async function loadBlog() {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const response = await axios.get(`${API_BASE}/blog/?slug=${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const blogs = response.data.results || response.data
      if (Array.isArray(blogs) && blogs.length > 0) {
        const blogData = blogs[0]
        setBlog(blogData)
        setLiked(blogData.user_liked)
        setLikesCount(blogData.likes_count)
        setCommentsCount(blogData.comments_count)
        setSharesCount(blogData.shares_count)
      }
    } catch (err) {
      console.error('Failed to load blog:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleLike() {
    if (!blog) return

    setLiking(true)
    try {
      const token = localStorage.getItem('access')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await axios.post(
        `${API_BASE}/blog/${blog.id}/like/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setLiked(response.data.liked)
      setLikesCount(response.data.likes_count)
    } catch (err) {
      console.error('Failed to like blog:', err)
    } finally {
      setLiking(false)
    }
  }

  async function handleShare() {
    if (!blog) return

    try {
      const token = localStorage.getItem('access')
      if (token) {
        await axios.post(
          `${API_BASE}/blog/${blog.id}/share/`,
          { platform: 'web' },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      // Copy link to clipboard
      const url = window.location.href
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!')
      })

      // Increment shares count locally
      setSharesCount((prev) => prev + 1)
    } catch (err) {
      console.error('Failed to share blog:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2 text-green-600 hover:text-yellow-700 mb-8 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blog
          </button>
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
            <p className="text-gray-600">The blog post you're looking for doesn't exist or has been deleted.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-green-600 to-blue-600 py-8 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/blog')}
            className="flex items-center gap-2 text-green-50 hover:text-white mb-6 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blog
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl overflow-hidden shadow-lg"
        >
          {/* Featured Image */}
          {blog.image && (
            <div className="w-full h-96 overflow-hidden bg-gradient-to-br from-green-400 to-blue-500">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {blog.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(blog.published_at || blog.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-5 h-5" />
                <span>By {blog.author_username}</span>
              </div>
            </div>

            {/* Excerpt */}
            {blog.excerpt && (
              <p className="text-xl text-gray-600 mb-8 italic border-l-4 border-yellow-500 pl-6">
                {blog.excerpt}
              </p>
            )}

            {/* Body */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {blog.content}
              </div>
            </div>

            {/* Engagement Stats & Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12 pt-8 border-t border-gray-200"
            >
              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Likes */}
                <div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLike}
                    disabled={liking}
                    className={`flex flex-col items-center gap-2 w-full p-4 rounded-xl transition-all ${
                      liked
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <Heart
                      className={`w-6 h-6 ${liked ? 'fill-current' : ''}`}
                    />
                    <span className="font-semibold">{likesCount}</span>
                    <span className="text-xs">Likes</span>
                  </motion.button>
                </div>

                {/* Comments */}
                <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl text-gray-600">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-semibold">{commentsCount}</span>
                  <span className="text-xs">Comments</span>
                </div>

                {/* Shares */}
                <div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="flex flex-col items-center gap-2 w-full p-4 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition-all"
                  >
                    <Share2 className="w-6 h-6" />
                    <span className="font-semibold">{sharesCount}</span>
                    <span className="text-xs">Shares</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.article>

        {/* Comments Section */}
        <CommentSection blogId={blog.id} currentUserId={currentUserId} />

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() => navigate('/blog')}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
          >
            Back to All Articles
          </button>
        </motion.div>
      </div>
    </div>
  )
}
