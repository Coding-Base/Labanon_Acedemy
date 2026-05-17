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
  Settings,
  Check,
  HelpCircle,
  Award,
  Maximize2,
  Minimize2,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Trophy
} from 'lucide-react';
import { useVideoAccess } from '../hooks/useVideoAccess';
import CourseCompletionModal from '../components/CourseCompletionModal';
import QuizTaker from '../components/QuizTaker';

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
  quiz?: {
    id: number;
    title: string;
    description?: string;
    passing_score: number;
    is_required: boolean;
    questions?: any[];
  };
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

  // Quiz State
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<{ [quizId: number]: any }>({});

  // New UI State
  const [cinemaMode, setCinemaMode] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSheetTab, setMobileSheetTab] = useState<'contents' | 'progress' | 'quiz' | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

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
    // Filter out obvious test/demo modules or lessons (case-insensitive) to avoid showing dev/test content
    const isTestish = (s?: string) => typeof s === 'string' && /\b(test|demo|sample)\b/i.test(s);
    return modules
      .filter((mod: ModuleItem) => !isTestish(mod.title))
      .map((mod: ModuleItem) => ({
        ...mod,
        lessons: (Array.isArray(mod.lessons) ? mod.lessons : []).filter((l: Lesson) => !isTestish(l.title)),
        quiz: mod.quiz || undefined
      }));
  }, [course]);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedModuleMobile, setSelectedModuleMobile] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (modulesWithLessons && modulesWithLessons.length > 0) {
      setSelectedModuleMobile((prev) => prev ?? modulesWithLessons[0].id);
    }
  }, [modulesWithLessons]);

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
    if (currentLesson) {
      setCompletedLessons((prev) => new Set(prev).add(currentLesson.id));
    }
    setLessonIndex((s) => Math.min(s + 1, Math.max(0, lessons.length - 1)));
  }

  function goPrev(): void {
    setLessonIndex((s) => Math.max(0, s - 1));
  }

  function toggleModule(moduleId: number): void {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function isLessonLastInModule(idx: number): boolean {
    const lesson = lessons[idx];
    if (!lesson) return false;
    const moduleId = (lesson as any).moduleId;
    const module = modulesWithLessons.find((m) => m.id === moduleId);
    if (!module || !module.lessons || module.lessons.length === 0) return false;
    const lastLessonId = module.lessons[module.lessons.length - 1].id;
    const lastGlobalIndex = lessons.findIndex((l) => l.id === lastLessonId);
    return idx === lastGlobalIndex;
  }

  function getModuleByQuizId(quizId: number | null | undefined) {
    if (!quizId) return undefined;
    return modulesWithLessons.find((m) => m.quiz && m.quiz.id === quizId);
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
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-5 text-slate-400 text-sm tracking-wide">Loading course content…</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Course not found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  // Navigation / Quiz gating helpers (computed before render)
  const atModuleEnd = isLessonLastInModule(lessonIndex);
  const currentModule = modulesWithLessons.find((m) => m.id === (currentLesson as any)?.moduleId);
  const currentModuleQuiz = currentModule?.quiz;
  const currentModuleQuizUnpassed = currentModuleQuiz && !quizAttempts[currentModuleQuiz.id]?.passed;
  const firstUnpassedRequiredModule = modulesWithLessons.find((m) => m.quiz?.is_required && !quizAttempts[m.quiz.id]?.passed);
  const progressPercent = lessons.length > 0 ? Math.round((completedLessons.size / lessons.length) * 100) : 0;

  // Sidebar content renderer (dark themed with checklist)
  const renderSidebarContent = (
    <div className="bg-[#1a1d27] rounded-xl overflow-hidden border border-slate-700/50">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">Course Content</h3>
          <button onClick={() => setSidebarCollapsed(true)} className="lg:hidden p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {enrolled && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400">{completedLessons.size} of {lessons.length} complete</span>
              <span className="font-semibold text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modules List */}
      <div className="overflow-y-auto max-h-[calc(100vh-220px)] course-scrollbar">
        {modulesWithLessons.length === 0 ? (
          <div className="p-5 text-center text-slate-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            No modules available
          </div>
        ) : (
          modulesWithLessons.map((module: ModuleItem, moduleIndex: number) => {
            const isExpanded = expandedModules.has(module.id) || module.lessons.some((l) => {
              const gi = lessons.findIndex((fl) => fl.id === l.id);
              return gi === lessonIndex;
            });

            return (
              <div key={module.id} className="border-b border-slate-700/40 last:border-b-0">
                {/* Module header (accordion toggle) */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {moduleIndex + 1}. {module.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                      {module.lessons.length}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Lessons (checklist) */}
                {isExpanded && (
                  <div className="pb-1">
                    {module.lessons.map((lesson: Lesson) => {
                      const globalIndex = lessons.findIndex((l) => l.id === lesson.id);
                      const isActive = globalIndex === lessonIndex;
                      const isLocked = !enrolled && globalIndex > 0;
                      const isDone = completedLessons.has(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => !isLocked && setLessonIndex(globalIndex)}
                          disabled={isLocked}
                          className={`w-full text-left pl-8 pr-4 py-2.5 flex items-center gap-3 transition-all text-sm ${
                            isActive
                              ? 'bg-amber-500/10 border-l-2 border-l-amber-500'
                              : 'hover:bg-slate-800/40 border-l-2 border-l-transparent'
                          } ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {/* Checklist icon */}
                          <div className="flex-shrink-0">
                            {isLocked ? (
                              <Lock className="w-4 h-4 text-slate-600" />
                            ) : isActive ? (
                              <div className="w-4 h-4 rounded-full bg-amber-500 animate-pulse-dot" />
                            ) : isDone ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                            )}
                          </div>

                          <span className={`truncate ${
                            isActive ? 'text-amber-400 font-medium' : isDone ? 'text-slate-400' : 'text-slate-300'
                          }`}>
                            {lesson.title}
                          </span>
                        </button>
                      );
                    })}

                    {/* Module Quiz */}
                    {module.quiz && (
                      <div className="mx-4 my-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-semibold text-slate-200">{module.quiz.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-2">
                          Pass ≥{module.quiz.passing_score}% {module.quiz.is_required ? '(required)' : '(optional)'}
                        </p>

                        {quizAttempts[module.quiz.id] ? (
                          <div className="space-y-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              quizAttempts[module.quiz.id].passed
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              <Check className="w-3 h-3 inline mr-1" />
                              {quizAttempts[module.quiz.id].score.toFixed(1)}%
                            </div>
                            <button
                              onClick={() => setSelectedQuizId(module.quiz.id)}
                              className="w-full px-2 py-1.5 bg-slate-700 text-slate-200 text-xs rounded hover:bg-slate-600 transition"
                            >
                              Retake
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedQuizId(module.quiz.id)}
                            className="w-full px-2 py-1.5 bg-amber-500 text-black text-xs font-semibold rounded hover:bg-amber-400 transition flex items-center justify-center gap-1"
                          >
                            <Award className="w-3 h-3" />
                            Start Quiz
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#0f1117] pb-20 lg:pb-0">
      {/* Dark Header */}
      <div className="bg-[#161922] border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center text-slate-400 hover:text-white transition flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline text-sm">Back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-white truncate">{course.title}</h1>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="inline-flex items-center text-xs text-slate-400">
                    <User className="w-3 h-3 mr-1" />
                    {course.creator}
                  </span>
                  <span className="text-xs text-slate-500">
                    {modulesWithLessons.reduce((total, module) => total + (module.lessons?.length || 0), 0)} lessons
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Cinema Mode Toggle */}
              <button
                onClick={() => { setCinemaMode(!cinemaMode); if (!cinemaMode) setSidebarCollapsed(true); else setSidebarCollapsed(false); }}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                title={cinemaMode ? 'Exit Cinema Mode' : 'Cinema Mode'}
              >
                {cinemaMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                {cinemaMode ? 'Exit' : 'Cinema'}
              </button>
              {enrolled && (
                <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg">
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className="text-xs font-medium text-emerald-400">{progressPercent}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`grid grid-cols-1 gap-6 ${cinemaMode ? '' : 'lg:grid-cols-4'}`}>


          {/* Main Content - Show Quiz or Lesson */}
          {selectedQuizId ? (
            <main className={cinemaMode ? '' : 'lg:col-span-3'}>
              <div className="p-6 bg-[#1a1d27] rounded-xl border border-slate-700/50">
                <button
                  onClick={() => setSelectedQuizId(null)}
                  className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Course</span>
                </button>
                <QuizTaker
                  key={`quiz-${selectedQuizId}`}
                  quizId={selectedQuizId}
                  onComplete={(attempt) => {
                    const qid = selectedQuizId as number | null;
                    setQuizAttempts((prev) => ({
                      ...prev,
                      [qid as any]: attempt
                    }));

                    const moduleForQuiz = getModuleByQuizId(qid);
                    if (!attempt.passed && moduleForQuiz?.quiz?.is_required) {
                      setTimeout(() => setSelectedQuizId(qid), 250);
                    } else {
                      setSelectedQuizId(null);
                    }
                  }}
                  onClose={() => setSelectedQuizId(null)}
                />
              </div>
            </main>
          ) : (
            <main className={cinemaMode ? '' : 'lg:col-span-3'}>
            {/* Enrollment Banner */}
            {checkingEnroll ? (
              <div className="mb-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-center">
                  <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  <span className="ml-3 text-amber-500 text-sm">Checking access permissions...</span>
                </div>
              </div>
            ) : !enrolled ? (
              <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="w-5 h-5 text-amber-500" />
                      <h3 className="font-semibold text-white">Access Restricted</h3>
                    </div>
                    <p className="text-slate-300 text-sm mb-1">Enroll in this course to unlock all lessons, track your progress, and earn a certificate.</p>
                    <p className="text-xs text-slate-500">Currently viewing limited preview content only.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate(`/student/courses/${course.id}/details`)}
                      className="px-6 py-2.5 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition font-semibold text-sm"
                    >
                      Enroll Now - ₦{course.price}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Lesson Video / Content */}
            <div className="bg-[#1a1d27] rounded-xl border border-slate-700/50 overflow-hidden mb-6">
              
              {/* Media Player Container */}
              <div className={`bg-black w-full ${cinemaMode ? 'cinema-transition' : ''}`}>
                {renderMediaPlayer()}
              </div>

              {/* Lesson Info Header */}
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="inline-flex items-center px-2.5 py-1 rounded bg-slate-800 text-amber-500 text-xs font-semibold mb-3 tracking-wide uppercase">
                      {((currentLesson as any)?.moduleTitle) || 'Introduction'}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{currentLesson?.title || 'Course Introduction'}</h2>
                    {currentLesson?.description && <p className="mt-2 text-slate-400 text-sm">{currentLesson.description}</p>}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 hidden sm:flex">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Current Lesson</div>
                      <div className="font-semibold text-slate-300">{lessons.length > 0 ? `${lessonIndex + 1} / ${lessons.length}` : '0 / 0'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lesson Content */}
              <div className="p-6">
                <div className="prose prose-invert prose-slate max-w-none">
                  <div
                    className="text-slate-300 text-sm sm:text-base leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: currentLesson?.content || '<p class="text-slate-500 italic">No detailed content available for this lesson.</p>'
                    }}
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="p-4 sm:p-6 border-t border-slate-700/50 bg-[#161922]">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={goPrev}
                    disabled={lessonIndex === 0}
                    className="px-4 py-2.5 sm:px-6 bg-transparent text-slate-300 rounded-lg border border-slate-600 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition font-medium text-sm inline-flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="text-xs text-slate-500 sm:hidden">
                    {lessonIndex + 1} / {lessons.length}
                  </div>

                  <button
                    onClick={() => {
                      if (!enrolled) {
                        navigate(`/student/courses/${course.id}/details`);
                        return;
                      }

                      if (atModuleEnd && currentModuleQuiz && !quizAttempts[currentModuleQuiz.id]?.passed) {
                        setSelectedQuizId(currentModuleQuiz.id);
                        return;
                      }

                      if (lessonIndex >= lessons.length - 1) {
                        if (firstUnpassedRequiredModule) {
                          setSelectedQuizId(firstUnpassedRequiredModule.quiz.id);
                          return;
                        }
                        setCompletionCourseData({
                          courseName: course.title,
                          username: '',
                          courseId: course.id
                        });
                        setShowCompletionModal(true);
                        return;
                      }

                      goNext();
                    }}
                    className="px-4 py-2.5 sm:px-6 bg-gradient-to-r from-amber-500 to-amber-400 text-black rounded-lg hover:from-amber-400 hover:to-amber-300 transition font-semibold text-sm inline-flex items-center gap-2"
                  >
                    {(atModuleEnd && currentModuleQuiz && !quizAttempts[currentModuleQuiz.id]?.passed)
                      ? 'Take Module Quiz'
                      : (lessonIndex >= lessons.length - 1 ? 'Complete Course' : 'Next Lesson')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Resources */}
            {currentLesson?.resources && currentLesson.resources.length > 0 && (
              <div className="bg-[#1a1d27] rounded-xl border border-slate-700/50 p-6 mb-6">
                <h3 className="text-base font-semibold text-white mb-4">Additional Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentLesson.resources.map((resource: Resource, idx: number) => (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border border-slate-700 rounded-lg hover:border-amber-500/50 hover:bg-slate-800 transition group"
                    >
                      <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center group-hover:bg-amber-500/10 transition">
                        <BookOpen className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-200 text-sm truncate">{resource.title}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{resource.type || 'Resource'}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </main>
          )}

          {/* Right Sidebar (Desktop only) */}
          {!cinemaMode && (
            <aside className={`hidden lg:block lg:col-span-1 sidebar-transition ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden hidden' : 'opacity-100'}`}>
              <div className="sticky top-6">
                {renderSidebarContent}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation + Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161922] border-t border-slate-800 pb-safe flex items-center justify-around">
        <button
          onClick={() => setMobileSheetTab('contents')}
          className={`flex flex-col items-center justify-center py-3 w-full border-t-2 ${mobileSheetTab === 'contents' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400'}`}
        >
          <Layers className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-wide">Contents</span>
        </button>
        <button
          onClick={() => setMobileSheetTab('progress')}
          className={`flex flex-col items-center justify-center py-3 w-full border-t-2 ${mobileSheetTab === 'progress' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400'}`}
        >
          <CheckCircle className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-wide">Progress</span>
        </button>
      </div>

      {/* Mobile Bottom Sheet Overlay */}
      {mobileSheetTab && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSheetTab(null)} />
          <div className="relative bg-[#1a1d27] rounded-t-2xl w-full h-[80vh] flex flex-col animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-center pt-3 pb-2" onClick={() => setMobileSheetTab(null)}>
              <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
            </div>
            <div className="px-5 pb-3 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="font-semibold text-white">
                {mobileSheetTab === 'contents' ? 'Course Contents' : 'Your Progress'}
              </h3>
              <button onClick={() => setMobileSheetTab(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {mobileSheetTab === 'contents' || mobileSheetTab === 'progress' ? renderSidebarContent : null}
            </div>
          </div>
        </div>
      )}

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
            navigate('/student/certificates');
          }}
        />
      )}
    </div>
  );
}