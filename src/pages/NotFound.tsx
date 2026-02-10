import React from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 — Page Not Found</h1>
        <p className="text-gray-600 mb-6">The page you are looking for doesn't exist or has been moved.</p>
        <div className="flex justify-center">
          <Link to="/" className="px-4 py-2 bg-yellow-600 text-white rounded-lg">Go Home</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
