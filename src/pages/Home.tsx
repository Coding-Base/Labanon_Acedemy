import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import axios from 'axios';
import {
  Search,
  PlayCircle,
  Award,
  Users,
  BookOpen,
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
  BarChart3,
  Globe,
  Brain,
  Target,
  ArrowRight
} from 'lucide-react';

// Import logos and images
import labanonLogo from './labanonlogo.png';
import learningImage from './learningup.jpeg'; 

// Primary high-quality image for hero section
const PRIMARY_HERO_IMAGE = learningImage; 
const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api';

const IMAGES = {
  hero: PRIMARY_HERO_IMAGE, 
  fallbackHero: learningImage, 
  webDev: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2072&q=80',
  math: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=2070&q=80',
  dataScience: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2070&q=80',
  student1: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=1974&q=80',
  student2: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=2070&q=80',
  student3: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=2070&q=80',
  tutor: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=2070&q=80'
};

// Animation variants with explicit Typing to fix TS Errors
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const pulseAnimation: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);
  const [displayCourses, setDisplayCourses] = useState<DisplayCourse[]>([]);
  
  const heroSectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"]
  });
  
  // Note: 'y' is defined but unused in current JSX, keeping it if you plan to use it for parallax
  // const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real courses on load
  useEffect(() => {
    const fetchCourses = async () => {
      // Default dummy courses for fallback
      const dummyCourses: DisplayCourse[] = [
        {
          id: 101,
          title: 'JAMB CBT Masterclass 2024',
          category: 'Exam Prep',
          rating: 4.9,
          students: 2500,
          price: 15000,
          duration: '45h',
          image: IMAGES.webDev,
          imageKey: 'webDev'
        },
        {
          id: 102,
          title: 'Full Stack Web Development',
          category: 'Technology',
          rating: 4.8,
          students: 1800,
          price: 45000,
          duration: '120h',
          image: IMAGES.webDev,
          imageKey: 'webDev'
        },
        {
          id: 103,
          title: 'WAEC Mathematics Excellence',
          category: 'Exam Prep',
          rating: 4.7,
          students: 3200,
          price: 12000,
          duration: '60h',
          image: IMAGES.math,
          imageKey: 'math'
        },
        {
          id: 104,
          title: 'Data Science Fundamentals',
          category: 'Professional',
          rating: 4.9,
          students: 1500,
          price: 35000,
          duration: '80h',
          image: IMAGES.dataScience,
          imageKey: 'dataScience'
        }
      ];

      try {
        const res = await axios.get(`${API_BASE}/courses/?page_size=4`);
        const realCourses = res.data.results || res.data || [];
        
        // Map real courses to match UI structure
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

        // Combine: Real courses first, then fill remaining slots with dummy data up to 4
        const combined = [...formattedRealCourses];
        if (combined.length < 4) {
            combined.push(...dummyCourses.slice(0, 4 - combined.length));
        }
        
        setDisplayCourses(combined);

      } catch (err) {
        console.error("Failed to fetch courses, using dummy data", err);
        setDisplayCourses(dummyCourses);
      }
    };

    fetchCourses();
  }, []);

  const handleHeroImageLoad = () => {
    setHeroImageLoaded(true);
  };

  const handleHeroImageError = () => {
    setHeroImageError(true);
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Courses', path: '/marketplace' },
    { label: 'Blog', path: '/blog' },
    { label: 'CBT Practice', path: '/register' },
    { label: 'Find a Tutor', path: '/tutor-application' }, 
  ];

  const features = [
    { icon: <PlayCircle className="w-8 h-8" />, title: 'Video Lessons', desc: 'HD quality with interactive transcripts' },
    { icon: <Award className="w-8 h-8" />, title: 'Certifications', desc: 'Recognized certificates upon completion' },
    { icon: <Users className="w-8 h-8" />, title: 'Live Classes', desc: 'Interactive sessions with expert tutors' },
    { icon: <Shield className="w-8 h-8" />, title: 'Secure CBT', desc: 'Advanced proctored exam system' },
    { icon: <TrendingUp className="w-8 h-8" />, title: 'Progress Tracking', desc: 'Detailed analytics & performance insights' },
    { icon: <Clock className="w-8 h-8" />, title: 'Flexible Learning', desc: 'Learn at your own pace, anytime' }
  ];

  const testimonials = [
    {
      text: "The JAMB CBT practice platform helped me score 325! The questions were exactly like the real exam.",
      name: "Chioma Adeyemi",
      role: "Student",
      avatar: IMAGES.student1
    },
    {
      text: "As an institution, Lebanon Academy gave us tools to digitally transform our teaching methods.",
      name: "Dr. Tunde Ojo",
      role: "School Administrator",
      avatar: IMAGES.student2
    },
    {
      text: "The course marketplace allowed me to monetize my expertise with full control over pricing.",
      name: "Sarah Johnson",
      role: "Instructor",
      avatar: IMAGES.student3
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Students' },
    { value: '500+', label: 'Expert Tutors' },
    { value: '1K+', label: 'Courses Available' },
    { value: '98%', label: 'Success Rate' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 overflow-x-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-20">
            {/* Logo with animation */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/" className="flex items-center space-x-2 md:space-x-3 group">
                <img src={labanonLogo} alt="Lebanon Academy" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-2xl font-bold text-gray-900">Lebanon Academy</h1>
                  <p className="text-xs text-gray-500">Future Ready Learning</p>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <motion.div key={item.label} whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                  <Link to={item.path} className="text-gray-700 hover:text-green-600 font-medium transition-colors relative group">
                    {item.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2 md:gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/login" className="hidden md:inline px-4 py-2 text-gray-700 hover:text-green-600 font-medium transition-colors">Sign In</Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register" className="px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 whitespace-nowrap">
                  Get Started Free
                </Link>
              </motion.div>
            </div>

            {/* Mobile menu button */}
            <motion.button whileTap={{ scale: 0.9 }} className="md:hidden p-2 rounded-lg hover:bg-gray-100 ml-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </motion.button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="md:hidden bg-white border-t mt-2 rounded-xl shadow-xl p-3">
              <nav className="space-y-4">
                {navItems.map((item) => (
                  <motion.div key={item.label} whileHover={{ x: 5 }} whileTap={{ x: 0 }}>
                    <Link to={item.path} className="block px-3 py-2.5 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-3 border-t">
                  <motion.div whileHover={{ x: 5 }}>
                    <Link to="/login" className="block px-3 py-2.5 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors mb-2" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  </motion.div>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link to="/register" className="block px-3 py-2.5 text-sm bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold text-center" onClick={() => setMobileMenuOpen(false)}>Get Started Free</Link>
                  </motion.div>
                </div>
              </nav>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroSectionRef} className="relative pt-28 pb-16 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-teal-500/5" />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8">
              <motion.div variants={fadeInUp}>
                <motion.div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles className="w-4 h-4" /><span>Nigeria's #1 Digital Learning Platform</span>
                </motion.div>
              </motion.div>
              <motion.div variants={fadeInLeft}>
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                  <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="block text-gray-900">Master Skills,</motion.span>
                  <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="block bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Ace Exams</motion.span>
                </h1>
              </motion.div>
              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-600 max-w-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                Transform your learning experience with premium courses, interactive CBT practice, and live tutoring from top instructors across Africa.
              </motion.p>
              {/* Search Bar */}
              <motion.div variants={fadeInUp} className="relative max-w-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-2">
                  <Search className="absolute left-4 w-5 h-5 text-gray-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search courses, tutors, exams..." className="w-full pl-12 pr-2 md:pr-4 py-2.5 md:py-4 text-sm md:text-base text-gray-800 placeholder-gray-500 bg-transparent outline-none rounded-xl" />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="ml-1 md:ml-2 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-lg transition-shadow whitespace-nowrap">Search</motion.button>
                </div>
              </motion.div>
              {/* Quick Stats */}
              <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-2 md:gap-4 pt-6 md:pt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                {stats.map((stat, index) => (
                  <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 + index * 0.1 }} whileHover={{ scale: 1.05, y: -5 }} className="text-center p-3 md:p-4 bg-white/50 rounded-xl md:rounded-2xl backdrop-blur-sm">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4 + index * 0.1, type: "spring", stiffness: 200 }} className="text-xl md:text-3xl font-bold text-gray-900">{stat.value}</motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 + index * 0.1 }} className="text-xs md:text-sm text-gray-600 mt-1">{stat.label}</motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative mt-6 md:mt-0">
              <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-teal-600/20 backdrop-blur-sm " />
                <div className="relative w-full h-full hero-image-container">
                  {heroImageError ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-600 to-teal-600">
                      <div className="text-center p-8">
                        <div className="text-white text-2xl font-bold">Lebanon Academy</div>
                        <div className="text-white/80">Future Ready Learning</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img src={IMAGES.hero} alt="Students learning together" className={`w-full h-full object-cover transition-opacity duration-500`} onLoad={handleHeroImageLoad} onError={handleHeroImageError} loading="eager" />
                      {!heroImageLoaded && !heroImageError && <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-teal-500/20 animate-pulse" />}
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {/* Floating Card 1 */}
                <motion.div initial={{ y: 50, opacity: 0, rotate: -5 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: 0.5, duration: 0.6 }} whileHover={{ y: -10, rotate: 2 }} className="absolute bottom-4 left-4 md:-bottom-6 md:-left-6 bg-white rounded-2xl p-6 shadow-2xl max-w-xs">
                  <div className="flex items-center space-x-3 mb-3">
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-500 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </motion.div>
                    <div><div className="font-semibold">JAMB Excellence</div><div className="text-sm text-gray-600">95% success rate</div></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">{[1, 2, 3, 4, 5].map((i) => (<motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.1 }}><Star className="w-4 h-4 text-yellow-400 fill-current" /></motion.div>))}</div>
                    <span className="text-sm font-semibold">4.9/5</span>
                  </div>
                </motion.div>
                {/* Floating Card 2 */}
                <motion.div initial={{ y: -50, opacity: 0, rotate: 5 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: 0.7, duration: 0.6 }} whileHover={{ y: -10, rotate: -2 }} className="absolute top-4 right-4 md:-top-6 md:-right-6 bg-white rounded-2xl p-6 shadow-2xl max-w-xs">
                  <div className="flex items-center space-x-3">
                    <motion.div variants={pulseAnimation} initial="initial" animate="animate" className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-white" /></motion.div>
                    <div><div className="font-semibold">Live Classes</div><div className="text-sm text-gray-600">Starting in 15min</div></div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12 md:mb-16">
            <motion.h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need to <span className="text-green-600">Succeed</span></motion.h2>
            <motion.p className="text-xl text-gray-600 max-w-2xl mx-auto">A complete learning ecosystem designed for modern education</motion.p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} whileHover={{ y: -10, scale: 1.02 }} className="group bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }} className="w-12 md:w-14 h-12 md:h-14 bg-gradient-to-br from-green-600 to-teal-500 rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                  <div className="text-white text-lg md:text-base">{feature.icon}</div>
                </motion.div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Courses */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <motion.h2 className="text-3xl md:text-4xl font-bold text-gray-900">Featured <span className="text-green-600">Courses</span></motion.h2>
              <motion.p className="text-gray-600 mt-2">Hand-picked by our expert team</motion.p>
            </div>
            <motion.div whileHover={{ x: 5 }}>
              <Link to="/marketplace" className="inline-flex items-center space-x-2 text-green-600 font-semibold hover:text-green-700"><span>View All Courses</span><ChevronRight className="w-5 h-5" /></Link>
            </motion.div>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayCourses.map((course, index) => (
              <motion.div key={course.id} variants={scaleIn} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} whileHover={{ y: -10 }} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="relative h-40 md:h-48 overflow-hidden">
                  <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.5 }} className="w-full h-full">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
                  </motion.div>
                  <div className="absolute top-2 md:top-4 left-2 md:left-4"><span className="px-2 md:px-3 py-1 text-xs md:text-sm bg-white/90 backdrop-blur-sm rounded-full font-medium">{course.category}</span></div>
                </div>
                <div className="p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                  <div className="flex items-center justify-between mb-4 text-sm md:text-base">
                    <div className="flex items-center"><Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" /><span className="ml-1 font-semibold text-xs md:text-sm">{course.rating}</span></div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center text-xs md:text-sm text-gray-600"><Users className="w-3 h-3 md:w-4 md:h-4 mr-1" /><span>{course.students.toLocaleString()}</span></div>
                    <div className="text-xs md:text-sm text-gray-600">{course.duration}</div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t gap-2">
                    <div><span className="text-lg md:text-2xl font-bold text-gray-900">₦{course.price.toLocaleString()}</span></div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-green-50 text-green-600 rounded-lg font-semibold hover:bg-green-100 transition-colors whitespace-nowrap">Enroll Now</motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* --- NEW SECTION: FIND A TUTOR --- */}
      <section className="py-20 bg-green-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-green-700 font-semibold text-sm mb-6 shadow-sm">
                <Globe className="w-4 h-4" /><span>Global Learning Access</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">Need a Personal <br/><span className="text-green-600">Home or Online Tutor?</span></h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">Whether you are in Nigeria or in the diaspora, finding the perfect tutor for your child shouldn't be a hassle. We connect you with vetted, expert tutors for personalized one-on-one learning in any subject.</p>
              <ul className="space-y-4 mb-10">
                {['Expert tutors for primary, secondary & exam prep', 'Flexible schedules (Online or Physical)', 'Tailored curriculum for specific learning goals', 'Trusted by parents worldwide'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-700" /></div><span className="text-gray-700 font-medium">{item}</span></li>
                ))}
              </ul>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/tutor-application" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-green-500/30 transition-all">Request a Tutor Now <ArrowRight className="ml-2 w-5 h-5" /></Link>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-green-500/20 to-teal-500/20 rounded-full blur-3xl" />
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
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="py-16 md:py-20 bg-gradient-to-br from-gray-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12 md:mb-16">
            <motion.h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted by <span className="text-teal-300">Thousands</span></motion.h2>
            <motion.p className="text-xl text-gray-300 max-w-2xl mx-auto">Join our community of successful learners and educators</motion.p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeInUp} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.2 }} whileHover={{ y: -10 }} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-8 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center mb-4 md:mb-6">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div key={i} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 + i * 0.05 }}><Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current" /></motion.div>
                    ))}
                  </div>
                </div>
                <motion.p className="text-gray-200 text-base md:text-lg italic mb-6 md:mb-8">"{testimonial.text}"</motion.p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-teal-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="ml-3 md:ml-4 min-w-0">
                    <div className="font-semibold text-white text-sm md:text-base">{testimonial.name}</div>
                    <div className="text-gray-300 text-xs md:text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-teal-600/10" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 relative text-center">
          <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }} className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-full mb-6 md:mb-8">
            <Sparkles className="w-5 h-5 text-white" /><span className="text-white font-semibold text-sm md:text-base">Start Your Journey Today</span>
          </motion.div>
          <motion.h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">Ready to Transform Your <span className="text-green-600">Learning</span>?</motion.h2>
          <motion.p className="text-base md:text-xl text-gray-600 mb-8 md:mb-10 max-w-2xl mx-auto">Join thousands of students, tutors, and institutions already thriving on our platform.</motion.p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }} whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" className="px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 block text-center">Create Free Account</Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }} whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
              <Link to="/marketplace" className="px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg bg-white text-gray-900 border-2 border-gray-200 rounded-lg md:rounded-xl font-semibold hover:border-green-500 hover:text-green-600 transition-all duration-300 block text-center">Browse Courses</Link>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }} className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {['No credit card required', '14-day free trial', 'Cancel anytime', '24/7 support'].map((item, index) => (
              <motion.div key={item} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.7 + index * 0.1 }} className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-700">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gray-900 text-white pt-12 md:pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-12">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center"><GraduationCap className="w-6 h-6 text-white" /></div>
                <div><h2 className="text-2xl font-bold">Lebanon Academy</h2><p className="text-gray-400">Future Ready Learning</p></div>
              </Link>
              <p className="text-gray-400 mb-8 max-w-md">Africa's premier digital learning ecosystem, transforming education through technology, innovation, and community.</p>
              <div className="flex space-x-4">
                {['Facebook', 'Twitter', 'LinkedIn', 'Instagram'].map((social) => (
                  <motion.a key={social} whileHover={{ y: -5, scale: 1.1 }} whileTap={{ scale: 0.9 }} href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors" aria-label={social}>{social[0]}</motion.a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Platform</h3>
              <ul className="space-y-4">
                {navItems.map((item) => (
                  <motion.li key={item.label} whileHover={{ x: 5 }}><Link to={item.path} className="text-gray-400 hover:text-white transition-colors">{item.label}</Link></motion.li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Resources</h3>
              <ul className="space-y-4">
                {['Blog', 'Help Center', 'Become Instructor', 'Careers', 'Privacy Policy'].map((item) => (
                  <motion.li key={item} whileHover={{ x: 5 }}><Link to="#" className="text-gray-400 hover:text-white transition-colors">{item}</Link></motion.li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
              <ul className="space-y-4 text-gray-400">
                <motion.li whileHover={{ x: 5 }}>hello@lebanonacademy.ng</motion.li>
                <motion.li whileHover={{ x: 5 }}>+234 800 123 4567</motion.li>
                <motion.li whileHover={{ x: 5 }}>Lagos, Nigeria</motion.li>
              </ul>
            </div>
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Lebanon Academy Limited. All rights reserved.</p>
            <p className="mt-2 text-sm">Empowering African learners through digital education.</p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}