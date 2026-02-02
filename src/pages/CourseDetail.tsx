// src/pages/CourseDetails.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  PlayCircle,
  Clock,
  Users,
  Star,
  BookOpen,
  CheckCircle,
  BarChart3,
  FileText,
  Award,
  ChevronRight,
  Calendar,
  Target,
  ArrowLeft,
  Loader2,
  Video
} from 'lucide-react';
import PaymentCheckout from '../components/PaymentCheckout';

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api';

// Professional fallback images for course details
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', // Books on table
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', // Graduation cap
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', // Graduation group
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', // Notebook and pen
  'https://images.unsplash.com/photo-1456513080510-3449c76e8b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', // Study space
];

// Get consistent fallback image for each course
function getFallbackImage(courseId: number) {
  const index = courseId % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/courses/${id}/`);
        setCourse(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleEnroll() {
    if (!course) return;
    const token = localStorage.getItem('access');
    if (!token) {
      window.location.href = `/login?next=/marketplace/${id}`;
      return;
    }
    // Check if free course
    if (course.price === 0) {
      try {
        await axios.post(
          `${API_BASE}/enrollments/`,
          { course_id: course.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Enrollment completed — you have access to this course');
        
        // Redirect based on type
        if (course.meeting_link) {
            navigate('/student/schedule');
        } else {
            navigate(`/student/courses/${course.id}`);
        }
      } catch (err: any) {
        alert(err?.response?.data?.detail || 'Enrollment failed');
      }
    } else {
      // Show payment checkout for paid courses
      setShowPayment(true);
    }
  }

  // Get course image URL with fallback
  const getCourseImage = () => {
    if (!course?.image || imageError) {
      return getFallbackImage(course?.id || parseInt(id || '0'));
    }
    if (/^https?:\/\//.test(course.image)) return course.image;
    
    const siteBase = API_BASE.replace(/\/api\/?$/, '');
    let full = siteBase + (course.image.startsWith('/') ? course.image : `/${course.image}`);
    full = full.replace(/(\/media){2,}/, '/media');
    return full;
  };

  // Use real stats from backend (or fallback to 0 if new course)
  const stats = {
    rating: course?.stats?.rating || 0,
    ratingsCount: course?.stats?.ratings_count || 0,
    students: course?.stats?.students || 0,
    duration: course?.stats?.duration || '0h 0m',
    // Dynamic module/lesson counts from nested data
    modules: course?.modules?.length || 0,
    lessons: course?.modules?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0
  };

  const isScheduled = !!course?.meeting_link;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const courseImage = getCourseImage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-yellow-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Courses</span>
          </button>
        </div>
      </div>

      {/* Course Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Course Info */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              {/* Course Category */}
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${isScheduled ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-100 text-green-700'}`}>
                  {isScheduled ? 'Live Scheduled Course' : (course.category || 'Professional Development')}
                </span>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  Bestseller
                </span>
              </div>

              {/* Course Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {course.title}
              </h1>

              {/* Course Description */}
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                {course.description}
              </p>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <Star className={`w-5 h-5 ${stats.rating > 0 ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                  <span className="font-bold text-gray-900">{stats.rating > 0 ? stats.rating : 'New'}</span>
                  {stats.ratingsCount > 0 && (
                    <span className="text-gray-600">({stats.ratingsCount} ratings)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">
                     {stats.students === 0 
                        ? 'Be the first to join!' 
                        : `${stats.students.toLocaleString()} students`}
                  </span>
                </div>
                {!isScheduled && (
                    <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{stats.duration}</span>
                    </div>
                )}
                {isScheduled && (
                    <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    <span className="text-gray-700">Starts: {new Date(course.start_date).toLocaleDateString()}</span>
                    </div>
                )}
              </div>

              {/* Instructor Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {course.creator?.charAt(0)?.toUpperCase() || 'I'}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Created by</p>
                  <p className="font-bold text-gray-900">{course.creator || 'Instructor'}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Course Image (Top on mobile) */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-video lg:aspect-auto lg:h-full">
                <img
                  src={courseImage}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <div className="bg-white/90 backdrop-blur-md text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Course Preview
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Scheduled Course Details (If applicable) */}
            {isScheduled && (
                <div className="bg-yellow-50 rounded-2xl shadow-sm p-6 border border-yellow-100">
                    <h2 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5"/> Live Class Schedule
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-yellow-800">
                        <div className="bg-white p-3 rounded-lg border border-yellow-100">
                            <div className="text-xs text-yellow-500 uppercase font-bold">Time</div>
                            <div className="font-medium">{course.meeting_time?.slice(0,5)} (Recurring)</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-yellow-100">
                            <div className="text-xs text-yellow-500 uppercase font-bold">Platform</div>
                            <div className="font-medium capitalize">{course.meeting_place || 'Online'}</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-yellow-100">
                            <div className="text-xs text-yellow-500 uppercase font-bold">Start Date</div>
                            <div className="font-medium">{course.start_date}</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-yellow-100">
                            <div className="text-xs text-yellow-500 uppercase font-bold">End Date</div>
                            <div className="font-medium">{course.end_date}</div>
                        </div>
                    </div>
                    <p className="text-sm text-yellow-600 mt-4">
                        * Enroll to get access to the live meeting link via your schedule dashboard.
                    </p>
                </div>
            )}

            {/* What You'll Learn */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
              {course.outcome ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{course.outcome}</p>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      'Master the fundamental concepts of the subject',
                      'Build practical projects to apply your knowledge',
                      'Develop problem-solving skills with real-world examples',
                      'Prepare for certification exams and interviews',
                      'Join a community of learners and get support',
                      'Access additional resources and materials',
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
              )}
            </div>

            {/* Course Content Modules (Only for Normal) */}
            {!isScheduled && (
                <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">Course Content</h2>
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full inline-block">
                    {stats.modules} modules • {stats.lessons} lessons • {stats.duration}
                    </div>
                </div>

                {course.modules?.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No modules available yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                    {course.modules?.map((module: any, moduleIndex: number) => (
                        <div key={module.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-yellow-300 transition-colors">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between cursor-pointer">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">
                                Module {moduleIndex + 1}: {module.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                                {module.lessons?.length || 0} lessons
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        
                        <div className="divide-y divide-gray-100">
                            {module.lessons?.map((lesson: any, lessonIndex: number) => (
                            <div key={lesson.id} className="px-6 py-4 hover:bg-yellow-50/50 transition-colors flex items-start gap-4">
                                <div className="mt-1">
                                <PlayCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-sm">
                                    {lessonIndex + 1}. {lesson.title}
                                </h4>
                                </div>
                                <div className="text-xs text-gray-400 font-mono">
                                {lesson.duration_minutes ? `${lesson.duration_minutes}m` : '15:00'}
                                </div>
                            </div>
                            ))}
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            )}

            {/* Requirements */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
              {course.required_tools ? (
                  <p className="text-gray-700">{course.required_tools}</p>
              ) : (
                  <ul className="space-y-3 text-gray-700">
                    {[
                      'Basic computer literacy and willingness to learn',
                      'No prior experience needed - we start from scratch',
                      'Access to a computer with internet connection',
                      'Dedication and commitment to complete the course'
                    ].map((req, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
              )}
            </div>
          </div>

          {/* Right Column - Pricing & Actions (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Pricing Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-extrabold text-gray-900">₦{course.price}</div>
                    <div className="text-gray-500 mt-1 text-sm">One-time payment</div>
                    <div className="inline-flex items-center gap-1.5 bg-yellow-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold mt-3 uppercase tracking-wide">
                      <Award className="w-3 h-3" />
                      Certificate Included
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {showPayment && course.price > 0 ? (
                      <PaymentCheckout
                        itemId={course.id}
                        itemType="course"
                        amount={course.price}
                        itemTitle={course.title}
                        isScheduled={isScheduled} // Pass flag to payment component
                        onSuccess={() => {
                          alert('Payment successful! You now have access to this course.');
                          if(isScheduled) navigate('/student/schedule');
                          else navigate(`/student/courses/${course.id}`);
                        }}
                      />
                    ) : (
                      <button
                        onClick={handleEnroll}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-yellow-600 text-white font-bold rounded-xl hover:shadow-lg hover:from-green-700 hover:to-yellow-700 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="w-5 h-5" />
                        {course.price === 0 ? 'Enroll Free' : 'Enroll Now'}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        // Check user role from localStorage
                        const role = localStorage.getItem('role');
                        const token = localStorage.getItem('access');
                        
                        if (!token) {
                          navigate(`/login?next=/marketplace/${id}`);
                          return;
                        }

                        // Scheduled Logic
                        if (isScheduled && role === 'student') {
                            navigate('/student/schedule');
                            return;
                        }

                        // Map role to appropriate dashboard
                        const dashboardMap: { [key: string]: string } = {
                          student: `/student/courses/${course.id}`,
                          tutor: `/tutor/courses/${course.id}`,
                          institution: `/institution/courses/${course.id}`,
                          master_admin: `/admin/courses/${course.id}`,
                        };

                        const targetRoute = dashboardMap[role || 'student'] || `/student/courses/${course.id}`;
                        navigate(targetRoute);
                      }}
                      className="w-full py-3.5 bg-white border-2 border-yellow-600 text-green-700 font-bold rounded-xl hover:bg-yellow-50 transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                      {isScheduled ? <Calendar className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                      {isScheduled ? 'Open Schedule' : 'Open Course Player'}
                    </button>
                  </div>
                </div>

                {/* Course Includes */}
                <div className="border-t border-gray-200 p-6 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">This course includes:</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { 
                        icon: isScheduled ? <Video className="w-4 h-4 text-green-600"/> : <Clock className="w-4 h-4 text-green-600" />, 
                        text: isScheduled ? 'Live interactive sessions' : `${stats.duration} on-demand video` 
                      },
                      { icon: <FileText className="w-4 h-4 text-green-600" />, text: 'Downloadable resources' },
                      { icon: <Award className="w-4 h-4 text-green-600" />, text: 'Certificate of completion' },
                      { icon: <Target className="w-4 h-4 text-green-600" />, text: 'Assignments and quizzes' },
                      { icon: <Calendar className="w-4 h-4 text-green-600" />, text: 'Full lifetime access' },
                      { icon: <BarChart3 className="w-4 h-4 text-green-600" />, text: 'Progress tracking' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-gray-700">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Need Help */}
              <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-2xl border border-yellow-100 p-6">
                <h3 className="font-bold text-gray-900 mb-2">Need help deciding?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Contact our learning advisors for personalized guidance.
                </p>
                <button className="w-full py-2.5 bg-white text-green-700 font-semibold rounded-lg border border-yellow-200 hover:bg-yellow-50 transition-colors text-sm">
                  Talk to an Advisor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}