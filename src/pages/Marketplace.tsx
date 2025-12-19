// src/pages/Marketplace.tsx
import React from 'react'
import CoursesList from '../shared/CoursesList'

export default function Marketplace() {
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Marketplace</h1>
            <p className="text-sm text-gray-600 mt-1">Browse and discover courses from instructors across the platform</p>
          </div>
          <div>
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
