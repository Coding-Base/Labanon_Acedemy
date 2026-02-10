// src/App.tsx
import React, { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Loader from './components/Loader'
import { setupAxiosInterceptors } from './utils/axiosInterceptor'
import { useLocation } from 'react-router-dom'
import { initGA, sendPageView } from './utils/googleAnalytics'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const DiplomaDetail = lazy(() => import('./pages/DiplomaDetail'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminRegister = lazy(() => import('./pages/admin/AdminRegister'))
const Home = lazy(() => import('./pages/Home'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogDetail = lazy(() => import('./pages/BlogDetail'))
const PublicPortfolio = lazy(() => import('./pages/PublicPortfolio'))
const TutorApplication = lazy(() => import('./components/TutorApplicationForm'))
const Documentation = lazy(() => import('./pages/Documentation'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const About = lazy(() => import('./pages/About'))
// role dashboards (lazy)
const StudentDashboard = lazy(() => import('./pages/dashboards/StudentDashboard'))
const TutorDashboard = lazy(() => import('./pages/dashboards/TutorDashboard'))
const InstitutionDashboard = lazy(() => import('./pages/dashboards/InstitutionDashboard'))
const MasterAdminDashboard = lazy(() => import('./pages/dashboards/MasterAdminDashboard'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const NotFound = lazy(() => import('./pages/NotFound'))

// CBT pages (lazy)
const PerformancePage = lazy(() => import('./components/cbt/PerformancePage'))
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage'))
const PaymentVerify = lazy(() => import('./pages/PaymentVerify'))
const ActivateCheckout = lazy(() => import('./pages/ActivateCheckout'))

export default function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    // Setup axios interceptors for token expiry handling
    setupAxiosInterceptors();
    
    // Show loader for minimum 2.5 seconds for visual impact
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, -1)

    return () => clearTimeout(timer)
  }, [])

  // Initialize GA once (measurement id available via Vite env)
  useEffect(() => {
    const measurementId = (import.meta as any).env.VITE_GA_MEASUREMENT_ID
    initGA(measurementId)
  }, [])

  // Route listener component to send page_view on location changes
  function RouteListener() {
    const location = useLocation()
    useEffect(() => {
      try {
        sendPageView(location.pathname + (location.search || ''))
        // also notify backend about referrer and UTM data
        // sendServerPageView is fire-and-forget
        ;(async () => {
          try {
            const mod = await import('./utils/googleAnalytics')
            if (typeof mod.sendServerPageView === 'function') mod.sendServerPageView(location.pathname + (location.search || ''))
          } catch (e) {
            // ignore
          }
        })()
      } catch (e) {
        // ignore
      }
    }, [location])
    return null
  }

  return (
    <BrowserRouter>
      <RouteListener />
      <div className="min-h-screen bg-gray-100"> 
        {isInitialLoading }
         <Suspense >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin auth */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />

            {/* Direct role dashboards (login will navigate here, passing summary in location.state optionally) */}
            <Route path="/student/*" element={<StudentDashboard />} />
            <Route path="/tutor/*" element={<TutorDashboard />} />
            <Route path="/institution/*" element={<InstitutionDashboard />} />
            <Route path="/admin/*" element={<MasterAdminDashboard />} />

            {/* CBT/Exam Routes */}
            <Route path="/performance/:attemptId" element={<PerformancePage />} />
            <Route path="/bulk-upload" element={<BulkUploadPage />} />
            
            {/* Payment verification routes */}
            {/* 1. Paystack Verification */}
            <Route path="/payment/verify" element={<PaymentVerify />} />
            
            {/* 2. Flutterwave Verification (ADDED THIS ROUTE) */}
            <Route path="/payment/flutterwave/verify" element={<PaymentVerify />} />

            {/* Activation / Checkout for exam / subject unlocks */}
            <Route path="/activate" element={<ActivateCheckout />} />

            {/* other app routes */}
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<CourseDetail />} />
            <Route path="/diploma/:id" element={<DiplomaDetail />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/portfolio/:token" element={<PublicPortfolio />} />
            <Route path="/online-tutorial-for-student-application" element={<TutorApplication />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<About />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />   
            <Route path="/" element={<Home />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
       </Suspense> 
      </div> 
    </BrowserRouter>
  )
}