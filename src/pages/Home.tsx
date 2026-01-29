// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, Variants, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Search,
  PlayCircle,
  Award,
  Users,
  ChevronRight,
  Star,
  CheckCircle,
  TrendingUp,
  Clock,
  Shield,
  GraduationCap,
  Sparkles,
  Menu,
  X,
  Globe,
  Brain,
  ArrowRight,
  ChevronDown,
  Youtube,
  Facebook
} from 'lucide-react';

import ContactForm from '../components/ContactForm';

import labanonLogo from './labanonlogo.png';
import learningImage from './learningup.jpeg'; 
import flyerImage from './lebanonflyer.jpg'; // Imported the flyer image

const PRIMARY_HERO_IMAGE = learningImage; 
const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api';

const IMAGES = {
  hero: PRIMARY_HERO_IMAGE, 
  fallbackHero: learningImage, 
  webDev: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2072&q=80',
  math: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=2070&q=80',
  dataScience: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2070&q=80',
  student1: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHVuaXZlcnNpdHklMjBzdHVkZW50fGVufDB8fDB8fHww',
  student2: 'https://images.unsplash.com/photo-1612214495858-4f32b96155a7?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YmxhY2slMjBzdHVkZW50fGVufDB8fDB8fHww',
  student3: 'https://img.freepik.com/free-photo/graduation-concept-with-portrait-happy-man_23-2148201881.jpg?semt=ais_hybrid&w=740&q=80',
  tutor: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=2070&q=80'
};

// --- DATA: Explore Menu Categories ---
const EXPLORE_CATEGORIES = [
  {
    id: 'roles',
    label: 'Explore roles',
    subcategories: [
      'Data Analyst', 'Project Manager', 'Cyber Security Analyst', 'Data Scientist',
      'Business Intelligence Analyst', 'Digital Marketing Specialist', 
      'UI / UX Designer', 'Machine Learning Engineer', 'Social Media Specialist'
    ]
  },
  {
    id: 'categories',
    label: 'Explore categories',
    subcategories: [
      'Artificial Intelligence', 'Business', 'Data Science', 'Information Technology',
      'Computer Science', 'Healthcare', 'Physical Science and Engineering',
      'Personal Development', 'Social Sciences', 'Language Learning', 'Arts and Humanities'
    ]
  },
  {
    id: 'trending',
    label: 'Trending skills',
    subcategories: [
      'Python', 'Artificial Intelligence', 'Excel', 'Machine Learning', 
      'SQL', 'Project Management', 'Power BI', 'Marketing'
    ]
  },
  {
    id: 'certificate',
    label: 'Earn a professional certificate',
    subcategories: [
      'Business', 'Computer Science', 'Data Science', 'Information Technology'
    ]
  },
  {
    id: 'degree',
    label: 'Earn an online degree',
    subcategories: [
      "Bachelor's Degrees", "Master's Degrees", "Postgraduate Programs"
    ]
  },
  {
    id: 'exam',
    label: 'Prepare for a certification exam',
    subcategories: [
       'IELTS', 'TOEFL', 'PMP', 'CompTIA', 'AWS Certified', 'Cisco CCNA'
    ]
  }
];

// --- Animations ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } }
};

const pulseAnimation: Variants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
};

interface DisplayCourse {
    id: number | string;
    title: string;
    category: string;
    rating: number;
    students: number;
    price: number;
    duration: string;
    image: string;
    imageKey?: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Mobile & Explore Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);
  const [activeExploreCategory, setActiveExploreCategory] = useState<string>(EXPLORE_CATEGORIES[0].id);

  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);
  const [displayCourses, setDisplayCourses] = useState<DisplayCourse[]>([]);
  
  const heroSectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"]
  });

  // Handle outside click to close Explore menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.explore-menu-container') && !target.closest('.explore-btn')) {
        setExploreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real courses on load (Keep existing logic)
  useEffect(() => {
    const fetchCourses = async () => {
      const dummyCourses: DisplayCourse[] = [
        { id: 101, title: 'JAMB CBT Masterclass 2024', category: 'Exam Prep', rating: 4.9, students: 2500, price: 15000, duration: '45h', image: IMAGES.webDev, imageKey: 'webDev' },
        { id: 102, title: 'Full Stack Web Development', category: 'Technology', rating: 4.8, students: 1800, price: 45000, duration: '120h', image: IMAGES.webDev, imageKey: 'webDev' },
        { id: 103, title: 'WAEC Mathematics Excellence', category: 'Exam Prep', rating: 4.7, students: 3200, price: 12000, duration: '60h', image: IMAGES.math, imageKey: 'math' },
        { id: 104, title: 'Data Science Fundamentals', category: 'Professional', rating: 4.9, students: 1500, price: 35000, duration: '80h', image: IMAGES.dataScience, imageKey: 'dataScience' }
      ];

      try {
        // Use a local axios instance without the global interceptors
        // to avoid sending an expired/invalid Authorization header
        // for public homepage requests.
        const publicApi = axios.create({ baseURL: API_BASE });
        const res = await publicApi.get(`/courses/?page_size=4`);
        const realCourses = res.data.results || res.data || [];
        
        const formattedRealCourses: DisplayCourse[] = realCourses.map((c: any) => ({
            id: c.id,
            title: c.title,
            category: c.category || 'General', 
            rating: c.stats?.rating || 5.0,
            students: c.stats?.students || 0,
            price: Number(c.price),
            duration: c.stats?.duration || '0h',
            image: c.image || IMAGES.webDev, 
            imageKey: 'custom' 
        }));

        const combined = [...formattedRealCourses];
        if (combined.length < 4) {
            combined.push(...dummyCourses.slice(0, 4 - combined.length));
        }
        
        setDisplayCourses(combined);

      } catch (err) {
        // If fetching real courses fails (e.g., 401 due to expired token),
        // fallback to dummy courses so the homepage remains public.
        console.error("Failed to fetch courses, using dummy data", err);
        setDisplayCourses(dummyCourses);
      }
    };

    fetchCourses();
  }, []);

  const handleHeroImageLoad = () => setHeroImageLoaded(true);
  const handleHeroImageError = () => setHeroImageError(true);

  // Navigation Logic
  const handleSearchSubmit = () => {
    if(searchQuery.trim()) {
        navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSubCategoryClick = (subCategory: string) => {
    setExploreMenuOpen(false);
    navigate(`/marketplace?search=${encodeURIComponent(subCategory)}`);
  };

  // --- UPDATED NAVIGATION ITEMS ---
  const navItems = [
    { label: 'Courses', path: '/marketplace' },
    { label: 'CBT Practice', path: '/register' },
    { label: 'Interview Questions', path: '/register' },
    { label: 'Blog', path: '/blog' },
    { label: 'Documentation', path: '/documentation' },
    { label: 'About', path: '/about' },
    { label: 'Find a Tutor', path: '/tutor-application' }, 
  ];

  // Static content arrays
  const features = [
    { icon: <PlayCircle className="w-8 h-8" />, title: 'Video Lessons', desc: 'HD quality with interactive transcripts' },
    { icon: <Award className="w-8 h-8" />, title: 'Certifications', desc: 'Recognized certificates upon completion' },
    { icon: <Users className="w-8 h-8" />, title: 'Live Classes', desc: 'Interactive sessions with expert tutors' },
    { icon: <Shield className="w-8 h-8" />, title: 'Secure CBT', desc: 'Advanced proctored exam system' },
    { icon: <TrendingUp className="w-8 h-8" />, title: 'Progress Tracking', desc: 'Detailed analytics & performance insights' },
    { icon: <Clock className="w-8 h-8" />, title: 'Flexible Learning', desc: 'Learn at your own pace, anytime' }
  ];

  const testimonials = [
    { text: "The JAMB CBT practice platform helped me score 325! The questions were exactly like the real exam.", name: "Chioma Adeyemi", role: "Student", avatar: IMAGES.student1 },
    { text: "As an institution, LightHub Academy gave us tools to digitally transform our teaching methods.", name: "Dr. Tunde Ojo", role: "School Administrator", avatar: IMAGES.student2 },
    { text: "The course marketplace allowed me to monetize my expertise with full control over pricing.", name: "Sarah Johnson", role: "Instructor", avatar: IMAGES.student3 }
  ];

  const stats = [
    { value: '50K+', label: 'Active Students' },
    { value: '500+', label: 'Expert Tutors' },
    { value: '1K+', label: 'Courses Available' },
    { value: '98%', label: 'Success Rate' }
  ];

  // --- HERO SLIDER CONFIGURATION ---
  const slides = [
    { src: IMAGES.hero, caption: 'Students learning together — LightHub Academy' },
    { src: IMAGES.student1, caption: 'Focused students collaborating on coursework' },
    { src: IMAGES.student2, caption: 'Interactive classroom discussion and debate' },
    { src: IMAGES.student3, caption: 'Peer study group improving skills together' },
    { src: IMAGES.tutor, caption: 'Experienced tutors guiding hands-on practice' },
    { src: IMAGES.webDev, caption: 'Project-based practical learning sessions' },
    { src: IMAGES.math, caption: 'Exam practice and concept mastery' },
    { src: IMAGES.dataScience, caption: 'Applied data projects and real-world problems' },
    { src: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=2000&q=80', caption: 'Students collaborating on campus projects' },
    { src: flyerImage, caption: 'LightHub Academy — community, campus, and success' }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  // autoplay
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setCurrentSlide(s => (s + 1) % slides.length);
    }, 5500);
    return () => clearInterval(t);
  }, [paused]);

  const nextSlide = () => setCurrentSlide(s => (s + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(s => (s - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-brand-50 overflow-x-hidden">
      
      {/* --- HEADER WITH EXPLORE MENU --- */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            
            {/* Left: Logo & Explore Button */}
            <div className="flex items-center gap-2 md:gap-6">
              <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
                <img src={labanonLogo} alt="LightHub Academy" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                <div className="ml-2 mr-2 sm:mr-0">
                  <h1 className="text-sm sm:text-base md:text-xl font-serif font-semibold text-brand-700 leading-none">LightHub Academy</h1>
                </div>
              </Link>

              {/* Desktop Explore Button (Coursera Style) */}
              <div className="hidden md:block relative">
                <button 
                  onClick={() => setExploreMenuOpen(!exploreMenuOpen)}
                  className={`explore-btn flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${exploreMenuOpen ? 'bg-brand-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                >
                  <Menu className="w-5 h-5" />
                  <span>Explore</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${exploreMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Explore Mega Menu Dropdown */}
                <AnimatePresence>
                  {exploreMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="explore-menu-container absolute top-full left-0 mt-2 w-[800px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="grid grid-cols-12 h-[500px]">
                        {/* Left Column: Categories */}
                        <div className="col-span-4 bg-gray-50 border-r border-gray-100 py-2 overflow-y-auto">
                           {EXPLORE_CATEGORIES.map(cat => (
                             <div 
                               key={cat.id}
                               onMouseEnter={() => setActiveExploreCategory(cat.id)}
                               className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors text-sm font-medium ${activeExploreCategory === cat.id ? 'bg-white text-brand-700 border-l-4 border-brand-600' : 'text-gray-700 hover:bg-gray-100'}`}
                             >
                               {cat.label}
                               {activeExploreCategory === cat.id && <ChevronRight className="w-4 h-4" />}
                             </div>
                           ))}
                        </div>
                        {/* Right Column: Subcategories */}
                        <div className="col-span-8 p-6 overflow-y-auto">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                                {EXPLORE_CATEGORIES.find(c => c.id === activeExploreCategory)?.label}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {EXPLORE_CATEGORIES.find(c => c.id === activeExploreCategory)?.subcategories.map(sub => (
                                    <div 
                                        key={sub}
                                        onClick={() => handleSubCategoryClick(sub)}
                                        className="text-sm text-gray-600 hover:text-brand-600 cursor-pointer p-2 hover:bg-brand-50 rounded transition-colors"
                                    >
                                        {sub}
                                    </div>
                                ))}
                            </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Center: Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
               <div className="relative w-full">
                  <input 
                    type="text" 
                    placeholder="What do you want to learn?" 
                    className="w-full pl-10 pr-12 py-2.5 rounded-full border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  />
                  <Search className="absolute left-3.5 top-2.5 w-5 h-5 text-gray-400" />
                  <button 
                    onClick={handleSearchSubmit}
                    className="absolute right-1 top-1 p-1.5 bg-brand-600 rounded-full text-white hover:bg-brand-700 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {/* Right: Actions & Nav Links */}
            <div className="flex items-center gap-3">
              {/* Added Nav Items for Large Screens */}
              <div className="hidden xl:flex items-center gap-4 mr-2">
                  {navItems.slice(0, 3).map(item => (
                         <Link key={item.label} to={item.path} className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                           {item.label}
                       </Link>
                  ))}
              </div>
              
              <div className="h-6 w-px bg-gray-300 hidden xl:block mx-1"></div>
              
              <Link to="/login" className="hidden md:inline px-4 py-2 text-gray-700 hover:text-brand-600 font-medium text-sm">Log In</Link>
              <Link to="/register" className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20">Join for Free</Link>
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden p-2 text-gray-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }} className="relative">
                   <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                   <input 
                     type="text" 
                     placeholder="Search..." 
                     className="w-full pl-10 py-2.5 bg-gray-100 rounded-lg outline-none text-sm"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </form>

                <div className="space-y-1">
                  <div className="font-semibold text-gray-900 px-2 py-2">Explore</div>
                  {EXPLORE_CATEGORIES.map(cat => (
                    <div key={cat.id} className="border-l-2 border-gray-200 ml-2 pl-4 py-1">
                        <div className="font-medium text-gray-700 text-sm mb-1">{cat.label}</div>
                        <div className="grid grid-cols-2 gap-2">
                             {cat.subcategories.slice(0, 4).map(sub => (
                                 <div key={sub} onClick={() => { setMobileMenuOpen(false); handleSubCategoryClick(sub); }} className="text-xs text-gray-500 truncate cursor-pointer">
                                    {sub}
                                 </div>
                             ))}
                        </div>
                        <div onClick={() => { setMobileMenuOpen(false); navigate('/marketplace'); }} className="text-xs text-brand-700 mt-1 cursor-pointer">View all...</div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 space-y-3">
                   {navItems.map(item => (
                        <Link key={item.label} to={item.path} className="block text-gray-700 font-medium hover:text-brand-600" onClick={() => setMobileMenuOpen(false)}>
                            {item.label}
                        </Link>
                   ))}
                   <Link to="/login" className="block text-brand-700 font-medium" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroSectionRef} className="relative pt-24 pb-16 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-500/5" />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content - Updated for Mobile Centering */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8 text-center md:text-left order-2 lg:order-1">
              <motion.div variants={fadeInUp} className="flex justify-center md:justify-start">
                  <motion.div className="hidden md:inline-flex items-center space-x-2 px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-medium" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles className="w-4 h-4" /><span>Your #1 Digital Learning Platform</span>
                </motion.div>
              </motion.div>
              <motion.div variants={fadeInLeft}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                  <span className="block text-gray-900">Master Skills,</span>
                  <span className="block bg-gradient-to-r from-brand-600 to-brand-600 bg-clip-text text-transparent">Ace Exams</span>
                </h1>
              </motion.div>
              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto md:mx-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                Transform your learning experience with premium courses, interactive CBT practice, and live tutoring from top instructors across Africa.
              </motion.p>
              
              {/* Desktop CTA Buttons (Search is now in header) - Updated for Mobile Centering */}
                <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                     <Link to="/register" className="px-8 py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 hover:shadow-lg transition-all">Join for Free</Link>
                     <Link to="/marketplace" className="px-8 py-4 bg-white text-gray-800 border-2 border-gray-200 rounded-xl font-bold text-lg hover:border-brand-600 hover:text-brand-600 transition-all">Explore Courses</Link>
              </motion.div>

              {/* Quick Stats */}
              <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-gray-200/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                {stats.map((stat, index) => (
                  <div key={index} className="text-center md:text-left">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Image - Updated margin top for mobile spacing; placed before text on small screens */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative mt-8 md:mt-0 order-1 lg:order-2">
                <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-brand-600/20 backdrop-blur-sm " />
                <div className="relative w-full h-full hero-image-container">
                  {/* Slider: animated, fullscreen-cover images with caption, dots, and controls */}
                  <div
                    className="absolute inset-0"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                  >
                    {slides.map((slide, idx) => (
                      <AnimatePresence key={slide.src}>
                        {currentSlide === idx && (
                          <motion.img
                            key={slide.src}
                            src={slide.src}
                            alt={slide.caption}
                            initial={{ opacity: 0, scale: 1.03 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                            className="w-full h-full object-cover absolute inset-0"
                            loading="eager"
                          />
                        )}
                      </AnimatePresence>
                    ))}

                    {/* Mobile-only badge overlay */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="absolute top-4 left-4 z-30 md:hidden">
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 text-brand-700 rounded-full text-sm font-medium backdrop-blur">
                        <Sparkles className="w-4 h-4" />
                        <span>Your #1 Digital Learning Platform</span>
                      </div>
                    </motion.div>

                    {/* Dark gradient overlay for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                    {/* No captions: clean visual hero */}

                    {/* Controls: Prev / Next */}
                    <button aria-label="Previous" onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full shadow backdrop-blur">
                      <ChevronRight className="w-5 h-5 transform rotate-180" />
                    </button>
                    <button aria-label="Next" onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full shadow backdrop-blur">
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Dots */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex gap-2">
                      {slides.map((_, i) => (
                        <button key={i} onClick={() => setCurrentSlide(i)} className={`w-3 h-3 rounded-full ${i === currentSlide ? 'bg-white' : 'bg-white/50'}`} aria-label={`Go to slide ${i+1}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {/* Floating Badge 1 */}
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="absolute bottom-6 left-6 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center"><Award className="w-6 h-6 text-brand-600" /></div>
                  <div><div className="font-bold text-gray-900">Certified</div><div className="text-xs text-gray-600">World-class education</div></div>
                </motion.div>
                
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <motion.div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why learn with <span className="text-yellow-700">LightHub Academy?</span></h2>
            <p className="text-xl text-gray-600">A complete ecosystem for your academic and professional growth</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} whileHover={{ y: -5 }} className="p-6 border border-gray-100 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* --- NEW SECTION: EXAM SUCCESS / FLYER --- */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 space-y-6"
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-full text-sm font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Exam Success Guaranteed</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Prepare for <span className="text-brand-600">JAMB & WAEC</span> <br/>
                the Smart Way
              </h2>
              <p className="text-lg text-gray-600">
                Master your exams with our comprehensive CBT platform. Practice with over 5,000+ past questions and predicted questions designed to match the real exam format.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Real CBT Practice Interface',
                  'Instant Scoring & Corrections',
                  'Performance Tracking',
                  '5000+ Past Questions',
                  'Study Anytime, Anywhere',
                  'Improve Speed & Accuracy'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-brand-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link 
                  to="/register" 
                  className="inline-flex items-center px-8 py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/30 transition-all transform hover:-translate-y-1"
                >
                  Start Practicing Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <p className="mt-4 text-sm text-gray-500">Perfect for Candidates, Schools & Lesson Centres</p>
              </div>
            </motion.div>

            {/* Flyer Image */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
                 <img 
                   src={flyerImage} 
                   alt="LightHub Academy JAMB & WAEC Flyer" 
                   className="w-full h-auto object-cover"
                 />
                 {/* Overlay gradient for depth */}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
              
              {/* Decor elements */}
              <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-brand-100 rounded-full blur-3xl opacity-50" />
              <div className="absolute -z-10 -top-10 -left-10 w-64 h-64 bg-brand-100 rounded-full blur-3xl opacity-50" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Featured Courses</h2>
              <p className="text-gray-600 mt-2">Explore our most popular learning paths</p>
            </div>
            <Link to="/marketplace" className="hidden md:flex items-center text-yellow-700 font-semibold hover:gap-2 transition-all">View All <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayCourses.map((course, index) => (
              <motion.div key={course.id} whileHover={{ y: -10 }} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                <div className="h-48 relative">
                   <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                   <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-800">{course.category}</div>
                </div>
                <div className="p-6">
                   <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-bold text-sm">{course.rating}</span>
                      <span className="text-gray-400 text-sm">({course.students})</span>
                   </div>
                   <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                   <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="font-bold text-xl text-yellow-700">₦{course.price.toLocaleString()}</span>
                      <button className="text-sm font-semibold text-gray-600 hover:text-yellow-600">Details</button>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
             <Link to="/marketplace" className="inline-block px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700">View All Courses</Link>
          </div>
        </div>
      </motion.section>

      {/* --- NEW SECTION: FIND A TUTOR --- */}
      <section className="py-20 bg-yellow-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-yellow-700 font-semibold text-sm mb-6 shadow-sm">
                <Globe className="w-4 h-4" /><span>Global Learning Access</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">Need a Personal <br/><span className="text-yellow-700">Home or Online Tutor?</span></h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">Whether you are in Nigeria or in the diaspora, finding the perfect tutor for your child shouldn't be a hassle. We connect you with vetted, expert tutors for personalized one-on-one learning in any subject.</p>
              <ul className="space-y-4 mb-10">
                {['Expert tutors for primary, secondary & exam prep', 'Flexible schedules (Online or Physical)', 'Tailored curriculum for specific learning goals', 'Trusted by parents worldwide'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-yellow-700" /></div><span className="text-gray-700 font-medium">{item}</span></li>
                ))}
              </ul>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/tutor-application" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-600 to-yellow-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-yellow-600/30 transition-all">Request a Tutor Now <ArrowRight className="ml-2 w-5 h-5" /></Link>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-yellow-500/20 to-yellow-500/20 rounded-full blur-3xl" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img src={IMAGES.tutor} alt="Professional Tutor teaching online" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                  <div className="text-white"><p className="font-bold text-xl">100% Verified Tutors</p><p className="text-gray-200 text-sm">Quality education, guaranteed.</p></div>
                </div>
              </div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 max-w-[200px]">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center"><Brain className="w-6 h-6 text-yellow-600" /></div>
                <div><p className="text-xs text-gray-500 font-bold uppercase">Subject Mastery</p><p className="text-sm font-bold text-gray-900">Any Topic</p></div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="py-16 md:py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by <span className="text-yellow-600">Thousands</span></h2>
            <p className="text-gray-400 text-lg">Join our community of successful learners and educators</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur border border-white/10 p-8 rounded-2xl">
                 <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 text-yellow-400 fill-current"/>)}</div>
                 <p className="text-gray-200 italic mb-6">"{testimonial.text}"</p>
                 <div className="flex items-center gap-4">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                       <div className="font-bold">{testimonial.name}</div>
                       <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      {/* Contact form section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm />
        </div>
      </section>

      <footer className="bg-black text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <img src={labanonLogo} className="w-8 h-8" alt="Logo"/>
                <span className="text-xl font-bold">LightHub Academy</span>
              </Link>
              <p className="text-gray-400 max-w-sm">Africa's premier digital learning ecosystem, transforming education through technology.</p>
              <div className="flex items-center gap-4 mt-6">
                <a href="https://www.youtube.com/channel/UCtBGZVHuNLRl-nPLVvzxFnQ" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Follow us on YouTube">
                  <Youtube className="w-6 h-6" />
                </a>
                <a href="https://www.facebook.com/profile.php?id=61587344120717" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-500 transition-colors" aria-label="Follow us on Facebook">
                  <Facebook className="w-6 h-6" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                {navItems.map(item => (
                  <li key={item.label}>
                    <Link to={item.path} className="hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/documentation" className="hover:text-white">Documentation</Link></li>
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@lighthubacademy.org</li>
                <li>07063899747</li>
                <li>Lagos, Nigeria</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} LightHub Academy Limited. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}