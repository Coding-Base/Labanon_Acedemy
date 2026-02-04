import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Hls from 'hls.js';
import {
  Play,
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle,
  Clock,
  BookOpen,
  User,
  Settings, // <--- Added Settings Icon
  Check     // <--- Added Check Icon for the menu
} from 'lucide-react';
import { useVideoAccess } from '../hooks/useVideoAccess';
import CourseCompletionModal from '../components/CourseCompletionModal';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api';

/** --- Types --- */
interface Resource {
  title: string;
  url: string;
  type?: string;
}

interface Lesson {
  id: number;
  title: string;
  content?: string;
  video?: string;
  video_s3?: string;
  video_s3_url?: string;
  youtube_url?: string;
  thumbnail?: string;
  description?: string;
  resources?: Resource[];
  [k: string]: any;
}

interface ModuleItem {
  id: number;
  course?: number;
  title: string;
  order?: number;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  creator?: string;
  price?: string | number;
  modules?: ModuleItem[];
  [k: string]: any;
}

// Helper interface for HLS Quality Levels
interface QualityLevel {
  height: number;
  index: number;
  bitrate: number;
}

/** Extract YouTube video ID from various URL formats */
function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1] && match[1].length === 11 ? match[1] : null;
}

/** Generate YouTube embed URL with restricted features */
function generateRestrictedYouTubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '0',
    controls: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    fs: '1',
    playsinline: '1',
    origin: window.location.origin,
    widget_referrer: window.location.href,
    enablejsapi: '0',
    color: 'white',
    host: 'www.youtube-nocookie.com',
    cc_load_policy: '0',
    cc_lang_pref: 'en',
    start: '0',
    end: '0'
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/** Resolve a possibly-relative media url returned by backend into an absolute URL */
function resolveMedia(src?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  const siteBase = API_BASE.replace(/\/api\/?$/, '');
  if (src.startsWith('/')) return `${siteBase}${src}`;
  return `${siteBase}/${src}`;
}

/** Detect likely HLS stream by extension or content */
function looksLikeHls(url?: string | null): boolean {
  if (!url) return false;
  return /\.m3u8(\?.*)?$/.test(url) || url.includes('m3u8');
}

export default function CoursePlayer(): JSX.Element {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { getSignedVideoUrl } = useVideoAccess();
  
  // Data State
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lessonIndex, setLessonIndex] = useState<number>(0);
  const [enrolled, setEnrolled] = useState<boolean>(false);
  const [checkingEnroll, setCheckingEnroll] = useState<boolean>(true);
  
  // Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionCourseData, setCompletionCourseData] = useState<{ courseName: string; username: string; courseId: number } | null>(null);
  
  // Video State
  const [videoLoadError, setVideoLoadError] = useState<boolean>(false);
  const [signedVideoData, setSignedVideoData] = useState<any>(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState<boolean>(false);
  
  // Quality Selector State
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Load course details
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    async function load(): Promise<void> {
      setLoading(true);
      try {
        const res = await axios.get<Course>(`${API_BASE}/courses/${id}/`);
        if (!mounted) return;
        setCourse(res.data);
        setLessonIndex(0);

        // Get current user info for certificate modal
        try {
          const userRes = await axios.get(`${API_BASE}/users/me/`);
          if (userRes.data?.username) {
            localStorage.setItem('username', userRes.data.username);
          }
        } catch (err) {
          console.error('Failed to fetch user info:', err);
        }
      } catch (err) {
        console.error('Failed to load course', err);
        setCourse(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Check enrollment status
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    async function check(): Promise<void> {
      setCheckingEnroll(true);
      try {
        const token = localStorage.getItem('access');
        if (!token) {
          if (mounted) setEnrolled(false);
          return;
        }
        const res = await axios.get(`${API_BASE}/enrollments/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page_size: 1000 }
        });
        if (!mounted) return;
        const items: any[] = res.data.results || res.data || [];
        const found = items.find((it: any) => String(it.course?.id) === String(id));
        setEnrolled(Boolean(found && (found.purchased === true || found.purchased)));
      } catch (err) {
        console.error('Failed to check enrollment', err);
        if (mounted) setEnrolled(false);
      } finally {
        if (mounted) setCheckingEnroll(false);
      }
    }
    check();
    return () => { mounted = false; };
  }, [id]);

  // Flatten modules -> lessons array
  const lessons: Lesson[] = useMemo(() => {
    if (!course) return [];
    const arr: Lesson[] = [];
    const modules: ModuleItem[] = Array.isArray(course.modules) ? course.modules : [];
    modules.forEach((m: ModuleItem) => {
      const ls: Lesson[] = Array.isArray(m.lessons) ? m.lessons : [];
      ls.forEach((lesson: Lesson) => {
        arr.push({
          ...lesson,
          moduleTitle: m.title,
          moduleId: m.id
        } as any);
      });
    });
    return arr;
  }, [course]);

  // Group modules with lessons for sidebar rendering
  const modulesWithLessons: ModuleItem[] = useMemo(() => {
    if (!course) return [];
    const modules: ModuleItem[] = Array.isArray(course.modules) ? course.modules : [];
    return modules.map((mod: ModuleItem) => ({
      ...mod,
      lessons: Array.isArray(mod.lessons) ? mod.lessons : []
    }));
  }, [course]);

  // Clamp lessonIndex
  useEffect(() => {
    if (lessons.length === 0) {
      setLessonIndex(0);
      return;
    }
    setLessonIndex((idx) => {
      if (idx < 0) return 0;
      if (idx >= lessons.length) return lessons.length - 1;
      return idx;
    });
  }, [lessons.length]);

  const currentLesson: Lesson | undefined = lessons[lessonIndex];

  function goNext(): void {
    setLessonIndex((s) => Math.min(s + 1, Math.max(0, lessons.length - 1)));
  }

  function goPrev(): void {
    setLessonIndex((s) => Math.max(0, s - 1));
  }

  // Reset video error and quality state on lesson change
  useEffect(() => {
    setVideoLoadError(false);
    setSignedVideoData(null);
    setQualities([]); // Reset available qualities
    setCurrentQuality(-1); // Reset to Auto
    setShowQualityMenu(false);
  }, [currentLesson?.video, currentLesson?.video_s3_url, currentLesson?.youtube_url]);

  // Fetch signed URL for S3 videos
  useEffect(() => {
    let isMounted = true;

    const fetchSignedUrl = async () => {
      if (!currentLesson?.video_s3_url || currentLesson?.youtube_url) {
        return;
      }

      setLoadingSignedUrl(true);
      try {
        let videoIdToRequest: string | null = null;
        if (currentLesson.video_s3) {
          videoIdToRequest = String(currentLesson.video_s3);
        } else if (currentLesson.video_s3_url) {
          try {
            const m = String(currentLesson.video_s3_url).match(/\/videos\/([^\/]+)/);
            if (m && m[1]) videoIdToRequest = m[1];
          } catch (e) {
            // ignore
          }
        }

        if (!videoIdToRequest) {
          throw new Error('No video id available for signed URL request');
        }

        const data = await getSignedVideoUrl(videoIdToRequest);
        if (isMounted) {
          setSignedVideoData(data);
        }
      } catch (err: any) {
        console.error('Failed to get signed URL:', err);
        if (isMounted) {
          setVideoLoadError(true);
        }
      } finally {
        if (isMounted) {
          setLoadingSignedUrl(false);
        }
      }
    };

    fetchSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [currentLesson?.id, currentLesson?.video_s3_url, currentLesson?.youtube_url, getSignedVideoUrl]);

  // Setup HLS or native playback
  useEffect(() => {
    const videoEl = videoRef.current;
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch (err) { /* ignore */ }
      hlsRef.current = null;
    }

    if (!videoEl) return;

    let rawUrl: string | null = null;
    
    // Use signed URL if available
    if (signedVideoData?.url && currentLesson?.video_s3_url) {
      rawUrl = signedVideoData.url;
    } else if (currentLesson?.video_s3_url) {
      rawUrl = currentLesson.video_s3_url;
    } else if (currentLesson?.youtube_url) {
      rawUrl = currentLesson.youtube_url;
    } else if (currentLesson?.video) {
      rawUrl = String(currentLesson.video);
    }

    if (!rawUrl) {
      videoEl.removeAttribute('src');
      videoEl.load();
      return;
    }

    const resolved = resolveMedia(rawUrl) || rawUrl;
    const youtubeId = extractYouTubeVideoId(rawUrl);
    
    if (youtubeId) {
      videoEl.pause();
      videoEl.removeAttribute('src');
      try { videoEl.load(); } catch { /* ignore */ }
      return;
    }

    if (looksLikeHls(resolved)) {
      const isSafari = !!(navigator.vendor && navigator.vendor.includes('Apple')) || /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      if (isSafari && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        videoEl.src = resolved;
        videoEl.crossOrigin = 'anonymous';
        videoEl.preload = 'metadata';
        videoEl.load();
        // Safari handles adaptive bitrate internally, difficult to expose manual controls
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          enableWorker: true,
          lowLatencyMode: false,
          xhrSetup: (xhr, url) => {
             // No custom headers needed for signed URLs
          }
        });
        hlsRef.current = hls;
        
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(resolved);
        });

        // Listen for parsed manifest to get quality levels
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            const availableQualities: QualityLevel[] = data.levels.map((level, index) => ({
                height: level.height,
                bitrate: level.bitrate,
                index: index
            }));
            
            // Sort by height (resolution) descending
            availableQualities.sort((a, b) => b.height - a.height);
            
            setQualities(availableQualities);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('hls.js error', event, data);
          if (data.fatal) {
             setVideoLoadError(true);
          }
        });
      } else {
        setVideoLoadError(true);
      }
      return;
    }

    // Direct File Fallback
    const isDirect = /\.(mp4|webm|ogg|mov|m4v)$/i.test(resolved) || resolved.startsWith('blob:') || resolved.includes('/media/');
    if (isDirect) {
      videoEl.src = resolved;
      videoEl.crossOrigin = 'anonymous';
      videoEl.preload = 'metadata';
      videoEl.load();
      return;
    }

    setVideoLoadError(true);
  }, [currentLesson?.video, signedVideoData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch { /* ignore */ }
        hlsRef.current = null;
      }
    };
  }, []);

  // --- Handlers ---
  
  const handleQualityChange = (index: number) => {
      if (hlsRef.current) {
          hlsRef.current.currentLevel = index; // -1 is Auto
          setCurrentQuality(index);
          setShowQualityMenu(false);
      }
  };

  const renderMediaPlayer = () => {
    const hasVideo = currentLesson?.video_s3_url || currentLesson?.youtube_url || currentLesson?.video;
    
    if (!hasVideo) {
      return (
        <div className="p-8 min-h-[400px] flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600">No video content available for this lesson</p>
          </div>
        </div>
      );
    }

    let videoUrl: string | null = null;
    if (currentLesson?.video_s3_url) videoUrl = currentLesson.video_s3_url;
    else if (currentLesson?.youtube_url) videoUrl = currentLesson.youtube_url;
    else if (currentLesson?.video) videoUrl = String(currentLesson.video);
    
    if (!videoUrl) {
      return (
        <div className="relative pt-[56.25%] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
            <p className="text-gray-600">No video content available for this lesson</p>
          </div>
        </div>
      );
    }
    
    const youtubeVideoId = extractYouTubeVideoId(videoUrl);

    if (youtubeVideoId) {
      // YouTube Embed
      return (
        <div className="relative pt-[56.25%] overflow-hidden youtube-iframe-container">
          <iframe
            title={currentLesson.title}
            className="absolute top-0 left-0 w-full h-full"
            src={generateRestrictedYouTubeEmbedUrl(youtubeVideoId)}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
            onError={() => setVideoLoadError(true)}
          />
        </div>
      );
    }

    const resolved = resolveMedia(videoUrl) || videoUrl;

    if (videoLoadError) {
      return (
        <div className="p-8 min-h-[360px] flex flex-col items-center justify-center bg-black text-center">
          <div className="text-white text-lg mb-2">Unable to play this video</div>
          <div className="flex gap-3">
            <a href={resolved} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-800 text-white rounded">Open in new tab</a>
            <button onClick={() => setVideoLoadError(false)} className="px-4 py-2 bg-yellow-600 text-white rounded">Retry</button>
          </div>
        </div>
      );
    }

    // --- MAIN VIDEO PLAYER RENDER ---
    return (
      <div className="w-full bg-black flex justify-center relative group">
        <video
          ref={videoRef}
          className="w-full h-auto max-h-[70vh]"
          controls
          poster={resolveMedia(currentLesson.thumbnail) || undefined}
          preload="metadata"
          playsInline
          controlsList="nodownload nofullscreen noremoteplayback"
        >
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>

        {/* --- QUALITY SELECTOR OVERLAY --- */}
        {qualities.length > 0 && (
          <div className="absolute top-4 right-4 z-20">
            <div className="relative">
              {/* Gear Icon Button */}
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors"
                title="Video Quality"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              {showQualityMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden py-1 z-30">
                  <div className="px-3 py-2 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Quality
                  </div>
                  
                  {/* Auto Option */}
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 flex items-center justify-between"
                  >
                    <span>Auto</span>
                    {currentQuality === -1 && <Check className="w-4 h-4 text-green-500" />}
                  </button>

                  {/* Specific Quality Levels */}
                  {qualities.map((q) => (
                    <button
                      key={q.index}
                      onClick={() => handleQualityChange(q.index)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 flex items-center justify-between"
                    >
                      <span>{q.height}p</span>
                      {currentQuality === q.index && <Check className="w-4 h-4 text-green-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-200 border-t-green-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Course not found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="inline-flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  {course.creator}
                </span>
                <span className="text-sm text-gray-600">
                  {modulesWithLessons.reduce((total, module) => total + (module.lessons?.length || 0), 0)} lessons
                </span>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-lg">
              <div className="text-sm text-gray-500">Course Price</div>
              <div className="text-2xl font-bold text-gray-900">₦{course.price}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden sticky top-8">
              <div className="p-5 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Course Content</h3>
                  <div className="flex items-center text-green-600 bg-yellow-50 px-3 py-1 rounded-full">
                    <Play className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Playing</span>
                  </div>
                </div>

                {enrolled && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-green-600">
                        {lessons.length > 0 ? `${Math.round(((lessonIndex + 1) / lessons.length) * 100)}%` : '0%'}
                      </span>
                    </div>
                    <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-600 rounded-full transition-all duration-300"
                        style={{ width: `${(lessonIndex + 1) / Math.max(1, lessons.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                {modulesWithLessons.length === 0 ? (
                  <div className="p-5 text-center text-gray-500">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No modules available
                  </div>
                ) : (
                  modulesWithLessons.map((module: ModuleItem, moduleIndex: number) => (
                    <div key={module.id} className="border-b last:border-b-0">
                      <div className="px-5 py-3 bg-gray-50 border-b">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            Module {moduleIndex + 1}: {module.title}
                          </h4>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            {module.lessons.length} lessons
                          </span>
                        </div>
                      </div>

                      <div className="divide-y">
                        {module.lessons.map((lesson: Lesson, lessonIdx: number) => {
                          const globalIndex = lessons.findIndex((l) => l.id === lesson.id);
                          const isActive = globalIndex === lessonIndex;
                          const isLocked = !enrolled && globalIndex > 0;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => !isLocked && setLessonIndex(globalIndex)}
                              disabled={isLocked}
                              className={`w-full text-left p-4 flex items-start gap-3 transition-all ${
                                isActive ? 'bg-yellow-50 border-l-4 border-l-green-600' : 'hover:bg-gray-50'
                              } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className="flex-shrink-0">
                                {isActive ? (
                                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <Play className="w-4 h-4 text-green-600" />
                                  </div>
                                ) : isLocked ? (
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-gray-400" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center">
                                    <span className="text-sm text-gray-600">{globalIndex + 1}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className={`font-medium text-sm truncate ${isActive ? 'text-green-900' : 'text-gray-900'}`}>
                                  {lesson.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">15 min</span>
                                </div>
                              </div>

                              {globalIndex < lessonIndex && enrolled && (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Enrollment Banner */}
            {checkingEnroll ? (
              <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="flex items-center">
                  <div className="w-8 h-8 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin" />
                  <span className="ml-3 text-yellow-700">Checking access permissions...</span>
                </div>
              </div>
            ) : !enrolled ? (
              <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-gray-900">Access Restricted</h3>
                    </div>
                    <p className="text-gray-600 mb-2">Enroll in this course to unlock all lessons, track your progress, and earn a certificate.</p>
                    <p className="text-sm text-gray-500">Currently viewing limited preview content only.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate(`/student/courses/${course.id}/details`)}
                      className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                    >
                      Enroll Now - ₦{course.price}
                    </button>
                    <button
                      onClick={() => navigate(`/student/courses/${course.id}/details`)}
                      className="px-6 py-3 bg-white text-gray-700 rounded-lg border hover:bg-gray-50 transition font-medium"
                    >
                      Course Details
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Lesson Video / Content */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
              <div className="p-6 border-b">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-green-800 text-sm font-medium mb-3">
                      {((currentLesson as any)?.moduleTitle) || 'Introduction'}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentLesson?.title || 'Course Introduction'}</h2>
                    {currentLesson?.description && <p className="mt-2 text-gray-600">{currentLesson.description}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Current Lesson</div>
                      <div className="font-bold text-gray-900">{lessons.length > 0 ? `${lessonIndex + 1}/${lessons.length}` : '0/0'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Player Container */}
              <div className="bg-black">
                {renderMediaPlayer()}
              </div>

              {/* Lesson Content */}
              <div className="p-6">
                <div className="prose prose-lg max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Content</h3>
                  <div
                    className="text-gray-700 max-h-[600px] overflow-y-auto pr-4"
                    dangerouslySetInnerHTML={{
                      __html: currentLesson?.content || '<p class="text-gray-500 italic">No detailed content available for this lesson.</p>'
                    }}
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="p-6 border-t bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    {lessons.length > 0 ? `Lesson ${lessonIndex + 1} of ${lessons.length}` : 'Start learning to see lessons'}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={goPrev}
                      disabled={lessonIndex === 0}
                      className="px-6 py-3 bg-white text-gray-700 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium inline-flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <button
                      onClick={() => {
                        if (!enrolled) {
                          navigate(`/student/courses/${course.id}/details`);
                          return;
                        }
                        if (lessonIndex >= lessons.length - 1) {
                          // Show completion modal
                          setCompletionCourseData({
                            courseName: course.title,
                            username: '', // Will be filled in modal
                            courseId: course.id
                          });
                          setShowCompletionModal(true);
                        } else {
                          goNext();
                        }
                      }}
                      className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium inline-flex items-center gap-2"
                    >
                      {lessonIndex >= lessons.length - 1 ? 'Complete Course' : 'Next Lesson'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Resources */}
            {currentLesson?.resources && currentLesson.resources.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentLesson.resources.map((resource: Resource, idx: number) => (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition"
                    >
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{resource.title}</div>
                        <div className="text-sm text-gray-500">{resource.type || 'Resource'}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Course Completion Modal */}
      {completionCourseData && (
        <CourseCompletionModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            setCompletionCourseData(null);
          }}
          courseName={completionCourseData.courseName}
          username={localStorage.getItem('username') || 'Student'}
          courseId={completionCourseData.courseId}
          onCertificateDownloaded={() => {
            // Redirect to certificates page after successful download
            navigate('/student/certificates');
          }}
        />
      )}
    </div>
  );
}