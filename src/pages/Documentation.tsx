import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Users,
  GraduationCap,
  Building2,
  Award,
  BarChart3,
  Shield,
  MessageSquare,
  Zap,
  Search,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

type Step = {
  step: number
  title: string
  description: string
}

type Section = {
  id: string
  title: string
  icon: React.ComponentType<any>
  colorKey: 'green' | 'purple' | 'emerald'
  content: Step[]
}

const colorMap: Record<
  Section['colorKey'],
  { gradient: string; borderColor: string }
> = {
  // kept purple mapping in case you want it later, but we will use green for tutor now
  green: { gradient: 'from-yellow-500 to-blue-500', borderColor: 'border-yellow-500' },
  purple: { gradient: 'from-purple-500 to-pink-500', borderColor: 'border-pink-500' },
  emerald: { gradient: 'from-yellow-500 to-blue-600', borderColor: 'border-yellow-500' }
}

const Documentation: React.FC = () => {
  const navigate = useNavigate()
  const [expandedSection, setExpandedSection] = useState<string | null>('student')

  const sections: Section[] = [
    {
      id: 'student',
      title: 'For Students',
      icon: GraduationCap,
      colorKey: 'green',
      content: [
        { step: 1, title: 'Create Your Account', description: 'Sign up on LightHub Academy with your email address. Verify your email and complete your profile with your name, institution, and learning goals.' },
        { step: 2, title: 'Explore the Dashboard', description: 'Once logged in you’ll see tabs like My Courses, Schedule, CBT Exams, and Profile. Use the sidebar to navigate quickly.' },
        { step: 3, title: 'Browse & Enroll in Courses', description: 'Open My Courses or Marketplace to browse available courses. Click "Enroll", make payment for premium courses and gain immediate access to materials.' },
        { step: 4, title: 'Course Player & Progress', description: 'Play video lessons, read notes and complete modules. Your progress is saved automatically; complete the course to earn a certificate.' },
        { step: 5, title: 'CBT Exams (JAMB, NECO, WAEC, etc.)', description: 'Go to the CBT Exams tab to select an exam. Some exams require a one-time unlock payment. After unlocking you can specify the number of questions and time limit, then start the exam.' },
        { step: 6, title: 'Review & Certificates', description: 'After completing courses or CBTs you can review answers, see performance metrics, and download or share certificates from your profile.' }
      ]
    },
    {
      id: 'tutor',
      title: 'For Tutors',
      icon: Users,
      // switched tutor from purple -> green so the UI is consistent
      colorKey: 'green',
      content: [
        { step: 1, title: 'Register & Unlock Tutor Account', description: 'Sign up and submit the required verification to unlock tutor features (qualification, ID, portfolio). Admin approves and you gain access to tutor tools.' },
        { step: 2, title: 'Create Courses (Modules & Lessons)', description: 'Use Create Course to add title, description, price, requirements, and course cover. Structure content by modules; each module holds lessons (video, text, attachments).' },
        { step: 3, title: 'Upload & Organize Video Content', description: 'Upload MP4/WebM or link streaming sources. Add chapters, timestamps and supplemental files per lesson for a polished learning experience.' },
        { step: 4, title: 'Manage Courses & Publishing', description: 'From Manage Course you can edit drafts, publish, unpublish, or remove courses. You can also view enrollment counts and edit pricing.' },
        { step: 5, title: 'Payments, Payouts & Subaccounts', description: 'Track sales and earnings on the Payments tab. Configure payout preferences and create subaccounts (if supported) to split revenue automatically.' },
        { step: 6, title: 'Leaderboard & Performance', description: 'See course rankings and your position on the tutor leaderboard (bestseller, top-rated). Use analytics to optimize content and pricing.' },
        { step: 7, title: 'Support & Refunds', description: 'Access tutor support, respond to student queries, and view refund/claim workflows from the dashboard.' }
      ]
    },
    {
      id: 'institution',
      title: 'For Institutions',
      icon: Building2,
      colorKey: 'emerald',
      content: [
        { step: 1, title: 'Create Institutional Account', description: 'Register your institution on LightHub Academy. Verify your organization and complete administrative details.' },
        { step: 2, title: 'Set Up Your Workspace', description: 'Configure your institution dashboard. Add branding and establish admin roles for staff and instructors.' },
        { step: 3, title: 'Invite Instructors', description: 'Add and invite instructors, assign roles and permissions, and group them by department or course set.' },
        { step: 4, title: 'Bulk Upload Courses', description: 'Import course catalogs using our CSV template to populate your learning portal quickly.' },
        { step: 5, title: 'Manage Batch CBT Exams', description: 'Schedule CBT exams for batches, configure timings, and assign question banks to specific cohorts.' },
        { step: 6, title: 'Monitor Analytics', description: 'Access dashboards for student performance, completion rates, course engagement, and revenue reports.' },
        { step: 7, title: 'Issue Certificates', description: 'Automatically generate and email certificates to students upon successful course completion.' }
      ]
    }
  ]

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="px-3 py-2 rounded-md hover:bg-slate-100">← Back</button>
            <nav className="hidden sm:flex items-center gap-3">
              <Link to="/" className="text-slate-700 hover:text-yellow-600">Home</Link>
              <Link to="/about" className="text-slate-700 hover:text-yellow-600">About</Link>
              <Link to="/privacy" className="text-slate-700 hover:text-yellow-600">Privacy</Link>
            </nav>
          </div>
          <div>
            <Link to="/register" className="bg-yellow-600 text-white px-3 py-2 rounded-md shadow-sm hover:opacity-90">Sign up</Link>
          </div>
        </div>
      </header>

      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-blue-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-10 h-10" />
              <h1 className="text-4xl md:text-5xl font-bold">Documentation</h1>
            </div>
            <p className="text-lg text-blue-100 max-w-2xl">Complete setup guides and instructions for students, tutors, and institutions to get started on LightHub Academy.</p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon
            const isExpanded = expandedSection === section.id
            const color = colorMap[section.colorKey]

            return (
              <motion.div key={section.id} variants={itemVariants} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  aria-expanded={isExpanded}
                  className={`w-full p-6 bg-gradient-to-r ${color.gradient} text-white flex items-center justify-between`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-8 h-8" />
                    <div className="text-left">
                      <h2 className="text-2xl font-bold">{section.title}</h2>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
                      <div className="p-8 bg-slate-50">
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-6">
                          {section.content.map((item) => (
                            <motion.div key={item.step} variants={itemVariants} className={`bg-white p-6 rounded-lg border-l-4 ${color.borderColor} shadow-sm`}>
                              <div className="flex items-start gap-4">
                                <div className={`rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm bg-gradient-to-r ${color.gradient} text-white`}>{item.step}</div>
                                <div>
                                  <h3 className="font-bold text-lg mb-2 text-slate-900">{item.title}</h3>
                                  <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Key Features */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-16 bg-gradient-to-r from-yellow-600 to-blue-600 rounded-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6">Platform Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Award, text: 'Digital Certificates' },
              { icon: BarChart3, text: 'Performance Analytics' },
              { icon: Shield, text: 'Secure Transactions' },
              { icon: MessageSquare, text: 'Student Support' },
              { icon: Zap, text: 'Quick Setup' },
              { icon: Search, text: 'Smart Search' }
            ].map((feature, index) => {
              const FeatureIcon = feature.icon
              return (
                <div key={index} className="flex items-center gap-3">
                  <FeatureIcon className="w-5 h-5 flex-shrink-0" />
                  <span>{feature.text}</span>
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* Contact Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-12 bg-white rounded-xl p-8 border-2 border-slate-200 text-center">
          <h3 className="text-2xl font-bold mb-4 text-slate-900">Need Help?</h3>
          <p className="text-slate-600 mb-6">Can't find what you're looking for? Our support team is here to help.</p>
          <Link to="/contact" aria-label="Contact support" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
            Contact Support <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.section>
      </main>
    </div>
  )
}

export default Documentation
