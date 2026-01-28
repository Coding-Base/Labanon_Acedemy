// src/pages/Marketplace.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import CoursesList from '../shared/CoursesList'

export default function Marketplace() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-brand-50">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 sm:p-3 rounded-lg hover:bg-white transition-colors text-gray-600 hover:text-gray-900"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Course Marketplace</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Browse and discover courses from instructors across the platform</p>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm text-gray-500">Find top-rated courses, certifications & more</div>
          </div>
        </header>

        <section className="bg-white p-6 rounded-2xl shadow">
          <CoursesList />
        </section>
      </div>
    </div>
  )
}
