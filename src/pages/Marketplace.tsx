import React from 'react'
import CoursesList from '../shared/CoursesList'

export default function Marketplace() {
  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Course Marketplace</h1>
          <p className="text-sm text-gray-600">Browse and discover courses</p>
        </header>

        <section className="bg-white p-6 rounded shadow">
          <CoursesList />
        </section>
      </div>
    </div>
  )
}
