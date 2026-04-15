// src/pages/Marketplace.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText } from 'lucide-react'
import CoursesList from '../shared/CoursesList'
import ResourcesList from '../components/Materials/ResourcesList'
import Footer from '../components/Footer'

type TabType = 'courses' | 'resources'

interface TabConfig {
  id: TabType
  label: string
  icon: React.ReactNode
}

const tabs: TabConfig[] = [
  { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'resources', label: 'Resources', icon: <FileText className="w-5 h-5" /> },
]

export default function Marketplace() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<TabType>('courses')

  // Handle navigation from DownloadsCard with activeTab in state
  useEffect(() => {
    const state = location.state as { activeTab?: TabType } | null
    if (state?.activeTab) {
      setActiveTab(state.activeTab)
    }
  }, [location])

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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Marketplace</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Browse and discover courses, resources, and more from the platform</p>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm text-gray-500">Explore top-rated content</div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white mb-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-wrap">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 min-w-[120px] sm:min-w-auto px-4 sm:px-6 py-4 flex items-center justify-center gap-2 
                  font-medium text-sm sm:text-base transition-all border-b-2 whitespace-nowrap
                  ${index > 0 ? 'border-l border-gray-200' : ''}
                  ${activeTab === tab.id
                    ? 'border-b-amber-500 text-amber-600 bg-amber-50'
                    : 'border-b-transparent text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <section className="bg-white p-6 rounded-2xl shadow">
          {activeTab === 'courses' && <CoursesList />}
          {activeTab === 'resources' && <ResourcesList />}
        </section>
      </div>
      <Footer />
    </div>
  )
}
