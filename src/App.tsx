// src/App.tsx
import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminRegister = lazy(() => import('./pages/admin/AdminRegister'))
const Home = lazy(() => import('./pages/Home'))

// role dashboards (lazy)
const StudentDashboard = lazy(() => import('./pages/dashboards/StudentDashboard'))
const TutorDashboard = lazy(() => import('./pages/dashboards/TutorDashboard'))
const InstitutionDashboard = lazy(() => import('./pages/dashboards/InstitutionDashboard'))
const MasterAdminDashboard = lazy(() => import('./pages/dashboards/MasterAdminDashboard'))

// CBT pages (lazy)
const PerformancePage = lazy(() => import('./components/cbt/PerformancePage'))
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage'))

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
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

            {/* other app routes */}
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<CourseDetail />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}
