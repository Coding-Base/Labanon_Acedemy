// src/App.tsx
import React, { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Loader from './components/Loader'
import { setupAxiosInterceptors } from './utils/axiosInterceptor'

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
// role dashboards (lazy)
const StudentDashboard = lazy(() => import('./pages/dashboards/StudentDashboard'))
const TutorDashboard = lazy(() => import('./pages/dashboards/TutorDashboard'))
const InstitutionDashboard = lazy(() => import('./pages/dashboards/InstitutionDashboard'))
const MasterAdminDashboard = lazy(() => import('./pages/dashboards/MasterAdminDashboard'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

// CBT pages (lazy)
const PerformancePage = lazy(() => import('./components/cbt/PerformancePage'))
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage'))
const PaymentVerify = lazy(() => import('./pages/PaymentVerify'))

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

  return (
    <BrowserRouter>
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

            {/* other app routes */}
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<CourseDetail />} />
            <Route path="/diploma/:id" element={<DiplomaDetail />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/portfolio/:token" element={<PublicPortfolio />} />
            <Route path="/tutor-application" element={<TutorApplication />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />   
            <Route path="/" element={<Home />} />
          </Routes>
       </Suspense> 
      </div> 
    </BrowserRouter>
  )
}