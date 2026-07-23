import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Award, BookOpen, Clock, Heart, Share2, Eye, ShieldAlert, ArrowLeft, CheckCircle2, Bookmark, Check } from 'lucide-react'


const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api'

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [series, setSeries] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [savingAction, setSavingAction] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!id) return;

    // Track views in session storage to prevent infinite loops from React StrictMode
    const sessionKey = 'viewed_courses_session';
    const stored = sessionStorage.getItem(sessionKey);
    let viewedList: string[] = [];
    
    try {
      viewedList = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to parse sessionStorage viewed_courses_session', e);
    }
    
    if (!viewedList.includes(String(id))) {
      // Synchronously mark as viewed first to block concurrent React strict mode mounts
      viewedList.push(String(id));
      sessionStorage.setItem(sessionKey, JSON.stringify(viewedList));
      
      axios.post(`${API_BASE}/courses/${id}/increment_views/`)
        .catch(err => {
          console.warn('Failed to increment views:', err);
        });
    }
  }, [id]);

  useEffect(() => {
    async function loadSeriesData() {
      setLoading(true)
      try {
        const token = localStorage.getItem('access')
        // Load series course data
        const res = await axios.get(`${API_BASE}/courses/${id}/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        setSeries(res.data)

        // Check if enrolled/saved in this series course
        if (token) {
          try {
            const enrollRes = await axios.get(`${API_BASE}/enrollments/`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            const enrolledList = enrollRes.data.results || enrollRes.data || []
            const alreadyEnrolled = enrolledList.some((e: any) => String(e.course?.id || e.course) === String(id))
            setIsSaved(alreadyEnrolled)
          } catch (err) {
            console.error('Failed to load enrollment status', err)
          }
        }
      } catch (err) {
        console.error('Failed to load series details', err)
      } finally {
        setLoading(false)
      }
    }
    loadSeriesData()
  }, [id])

  async function handleSaveToDashboard() {
    const token = localStorage.getItem('access')
    if (!token) {
      navigate(`/login?next=/series/${id}`)
      return
    }

    setSavingAction(true)
    try {
      await axios.post(
        `${API_BASE}/enrollments/`,
        { course_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsSaved(true)
      alert('Series package successfully saved to your dashboard!')
    } catch (err: any) {
      const errorData = err?.response?.data;
      let msg = 'Failed to save series package';
      if (errorData) {
        if (typeof errorData === 'string') {
          msg = errorData;
        } else if (errorData.detail) {
          msg = errorData.detail;
        } else if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
          msg = errorData.non_field_errors[0];
        } else if (Array.isArray(errorData) && errorData.length > 0) {
          msg = errorData[0];
        } else {
          const keys = Object.keys(errorData);
          if (keys.length > 0 && Array.isArray(errorData[keys[0]])) {
            msg = errorData[keys[0]][0];
          }
        }
      }
      alert(msg);
    } finally {
      setSavingAction(false)
    }
  }

  const getSeriesImage = () => {
    if (!series?.image || imageError) {
      return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'
    }
    if (/^https?:\/\//.test(series.image)) return series.image
    const siteBase = API_BASE.replace(/\/api\/?$/, '')
    return siteBase + (series.image.startsWith('/') ? series.image : `/${series.image}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!series || !series.is_series) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Series Not Found</h2>
          <p className="text-gray-600 mb-4">The umbrella series package you are looking for does not exist.</p>
          <Link to="/marketplace" className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700">
            Back to Marketplace
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <Navbar />

      {/* Header / Hero Section */}
      <div className="bg-slate-900 text-white pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              <span className="inline-block bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Specialization Series
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
                {series.title}
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed max-w-3xl whitespace-pre-line">
                {series.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-slate-200">Umbrella Certificate Included</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-slate-200">
                    {(series.series_items || []).length} Courses included
                  </span>
                </div>
                {series.creator && (
                  <span className="text-slate-500">
                    Created by <strong className="text-slate-300">{series.creator}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Right Side - Image preview card */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-video w-full relative">
                  <img
                    src={getSeriesImage()}
                    alt={series.title}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Description and List of Sub-courses */}
          <div className="lg:col-span-2 space-y-8">
            {series.outcome && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">What you will learn in this Specialization</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {series.outcome}
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Courses in this Specialization</h2>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {(series.series_items || []).length} steps to completion
                </span>
              </div>

              <div className="space-y-4">
                {(series.series_items || []).length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-300 text-center text-gray-500 italic">
                    No sub-courses assigned to this series yet.
                  </div>
                ) : (
                  (series.series_items || []).map((item: any, idx: number) => {
                    const sub = item.course_details || {}
                    return (
                      <div
                        key={item.id || idx}
                        className="bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-amber-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 font-extrabold flex items-center justify-center flex-shrink-0 text-lg border border-amber-100">
                            {idx + 1}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-gray-900 text-lg hover:text-yellow-600 transition">
                              <Link to={`/marketplace/${sub.id}`}>{sub.title}</Link>
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{sub.description}</p>
                            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-gray-500">
                              <span className="bg-slate-100 px-2.5 py-1 rounded text-slate-700 capitalize">
                                {sub.level || 'All Levels'}
                              </span>
                              <span className="text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded border border-yellow-100">
                                {Number(sub.price) === 0 ? 'Free' : `₦${Number(sub.price).toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/marketplace/${sub.id}`)}
                          className="w-full md:w-auto px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                        >
                          View Details
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: CTA card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-lg space-y-6 sticky top-28">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Specialization Pricing</span>
                <div className="text-3xl font-extrabold text-slate-900">₦0.00</div>
                <p className="text-xs text-slate-500">
                  You enroll/purchase sub-courses individually. Adding the series to your dashboard is completely free.
                </p>
              </div>

              <div className="pt-2">
                {isSaved ? (
                  <div className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-sm shadow-inner">
                    <Check className="w-5 h-5 text-green-600" />

                    Saved in Dashboard
                  </div>
                ) : (
                  <button
                    onClick={handleSaveToDashboard}
                    disabled={savingAction}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <Bookmark className="w-5 h-5" />
                    {savingAction ? 'Adding...' : 'Save Series to Dashboard'}
                  </button>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="font-bold text-sm text-gray-900">This Specialization includes:</h4>
                <ul className="space-y-3 text-xs text-gray-600 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    {(series.series_items || []).length} premium sub-courses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    Individual certificates for each sub-course
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    Automatic umbrella series certificate
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    Self-paced learning & lifetime access
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  )
}
