import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import showToast from '../utils/toast';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

// Type definitions
interface Review {
  id: number;
  rating: number;
  message: string;
  role?: string;
  created_at: string;
  name?: string;
  author?: {
    username: string;
  };
  category?: string;
  cbt_exam?: string;
  cbt_subject?: string;
  cbt_score?: number;
}

interface ApiResponse {
  results?: Review[];
  [key: string]: any;
}

export default function ReviewsPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roleParam = params.get('role') || undefined;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await axios.get<ApiResponse>(`${API_BASE}/users/reviews/`);
      // Handle both nested results and direct array responses
      const reviewsData = res.data.results || (Array.isArray(res.data) ? res.data : []);
      setReviews(reviewsData);
    } catch (e) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access');
      const payload: { rating: number; message: string; role?: string } = { rating, message };
      if (roleParam) payload.role = roleParam;

      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.post(`${API_BASE}/users/reviews/`, payload, config);

      setMessage('');
      setRating(5);
      await loadReviews();
      showToast('Thank you — your review was submitted and will appear after moderation.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-yellow-600 transition-colors font-medium text-xs sm:text-base whitespace-nowrap"
              title="Back to Home"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex-1 text-center">Reviews</h1>
            <Link
              to="/marketplace"
              className="text-xs sm:text-sm text-gray-600 hover:text-yellow-600 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Explore Courses</span>
              <span className="sm:hidden">Courses</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Public Reviews</h1>
        <p className="mt-2 text-gray-600">See what others are saying or leave your own feedback.</p>
        {roleParam && (
          <div className="mt-2 text-sm text-gray-500">
            Submitting as <span className="font-semibold capitalize text-yellow-600">{roleParam}</span>.{' '}
            <Link to="/reviews" className="text-yellow-600 hover:underline">(See all reviews)</Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reviews List */}
        <div className="lg:col-span-2">
            {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-pulse text-gray-500">Loading reviews...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-gray-500">No reviews yet. Be the first to leave one!</p>
            </div>
            ) : (
            <div className="space-y-5">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow md:hover:shadow-md transition-shadow duration-200 break-words"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {review.name || review.author?.username || 'Anonymous'}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                        {review.role && (
                          <>
                            <span className="capitalize">{review.role}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          </>
                        )}
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${
                              star <= review.rating ? 'text-yellow-400' : 'text-gray-200'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 ml-1">{review.rating}/5</span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed break-words">{review.message}</p>

                  {review.category === 'cbt' && (
                    <div className="mt-3 text-xs sm:text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      <span className="font-medium">Exam:</span> {review.cbt_exam} •{' '}
                      <span className="font-medium">Subject:</span> {review.cbt_subject} •{' '}
                      <span className="font-medium">Score:</span> {review.cbt_score}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Form */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative sm:sticky sm:top-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Leave a review</h3>
              <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <select
                  id="rating"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white/90"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-vertical"
                  placeholder="Share your experience..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>

            <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              Reviews are moderated by admins before appearing publicly.
            </div>
          </div>
        </aside>
      </div>

      {/* Footer Link */}
      <div className="text-center mt-12 mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-yellow-600 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>

    {/* Footer Component */}
    <Footer />
    </>
  );
}