// src/pages/MyCourses.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Star, BookOpen, ChevronLeft, ChevronRight, PlayCircle, Image } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

// Enhanced fallback course images - professional Unsplash images suitable for courses[citation:1][citation:2]
const FALLBACK_IMAGES = [
  // Professional education/learning themed images
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', // Books on table
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', // Notebook and pen
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', // Graduation cap
  'https://images.unsplash.com/photo-1456513080510-3449c76e8b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', // Study space
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', // Graduation group
];

// Function to get a consistent fallback image for each course
function getFallbackImage(courseId: number) {
  // Use course ID to consistently return the same image for the same course
  const index = courseId % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => { load(); }, [page]);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_BASE}/enrollments/`, { 
        headers: { Authorization: `Bearer ${token}` }, 
        params: { page, page_size: pageSize } 
      });
      setEnrollments(res.data.results || []);
      setCount(res.data.count || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  // Enhanced image resolver with better fallback handling
  function getCourseImage(course: any, enrollmentId: number) {
    if (!course?.image) return getFallbackImage(course?.id || enrollmentId);
    if (imageErrors.has(enrollmentId)) return getFallbackImage(course?.id || enrollmentId);
    
    if (/^https?:\/\//.test(course.image)) return course.image;
    
    const siteBase = API_BASE.replace(/\/api\/?$/, '');
    let full = siteBase + (course.image.startsWith('/') ? course.image : `/${course.image}`);
    full = full.replace(/(\/media){2,}/, '/media');
    return full;
  }

  // Handle image loading errors
  const handleImageError = (enrollmentId: number) => {
    setImageErrors(prev => new Set(prev).add(enrollmentId));
  };

  // Generate random data for demo
  const getRandomRating = () => (4 + Math.random()).toFixed(1);
  const getRandomStudents = () => Math.floor(Math.random() * 5000) + 1000;
  const getRandomDuration = () => `${Math.floor(Math.random() * 6) + 1}h ${Math.floor(Math.random() * 60)}m`;

  // Loading skeleton
  if (loading) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200"></div>
              <div className="p-5">
                <div className="h-5 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Learning</h1>
          <p className="text-gray-600 text-sm">Continue your learning journey with your enrolled courses</p>
        </div>
        <button 
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 text-sm"
          onClick={() => navigate('/marketplace')}
        >
          <BookOpen size={18} />
          Explore Marketplace
        </button>
      </div>

      {/* Course count and pagination info */}
      <div className="flex-shrink-0 mb-6 flex items-center justify-between">
        <p className="text-gray-700 text-sm">
          <span className="font-semibold">{enrollments.length}</span> of <span className="font-semibold">{count}</span> courses
        </p>
        <div className="text-sm text-gray-600">
          Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
        </div>
      </div>

      {/* Scrollable courses container */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {/* Empty State */}
        {enrollments.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen size={32} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't enrolled in any courses yet. Start your learning journey by exploring our marketplace.
            </p>
            <button 
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              onClick={() => navigate('/marketplace')}
            >
              Browse Courses
            </button>
          </div>
        )}

        {/* Courses Grid - Scrollable content */}
        {enrollments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-4">
            {enrollments.map((enrollment) => {
              const course = enrollment.course;
              const rating = getRandomRating();
              const studentCount = getRandomStudents();
              const duration = getRandomDuration();
              const imageUrl = getCourseImage(course, enrollment.id);
              const hasImageError = imageErrors.has(enrollment.id) || !course?.image;
              const fallbackImage = getFallbackImage(course?.id || enrollment.id);

              return (
                <div 
                  key={enrollment.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-100 cursor-pointer group"
                  onClick={() => navigate(`/student/courses/${course?.id}`)}
                >
                  {/* Course Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={hasImageError ? fallbackImage : imageUrl}
                      alt={course?.title || 'Course Image'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={() => handleImageError(enrollment.id)}
                      loading="lazy"
                    />
                    {/* Overlay with "Course" text - subtle and professional */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end">
                      <div className="p-3 w-full">
                        <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1 inline-block">
                          <span className="text-white text-xs font-semibold tracking-wider">COURSE</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-800">
                        Enrolled
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Course Content */}
                  <div className="p-5">
                    {/* Category Badge */}
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {course?.category || 'Professional'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 h-12">
                      {course?.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">
                      {course?.description || 'No description available'}
                    </p>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-current" />
                          <span className="font-semibold">{rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{(studentCount/1000).toFixed(1)}k</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-xl font-bold text-gray-900">₦{course?.price || '0'}</span>
                        <span className="text-gray-500 text-sm ml-2 line-through">₦{(course?.price * 1.5).toFixed(0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-600">Continue</span>
                        <PlayCircle size={18} className="text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Pagination at bottom */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, count)} of {count} courses
          </div>
          <div className="flex items-center gap-2">
            <button 
              className={`px-3 py-2 rounded-lg flex items-center gap-1 font-medium text-sm transition-colors ${page <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Previous</span>
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${page === pageNum ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && page < totalPages - 2 && (
                <>
                  <span className="px-1">...</span>
                  <button
                    className="w-9 h-9 rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 font-medium text-sm"
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button 
              className={`px-3 py-2 rounded-lg flex items-center gap-1 font-medium text-sm transition-colors ${page >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}