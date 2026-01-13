import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Users,
  GraduationCap,
  Building2,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  Search,
  Award
} from 'lucide-react'

const Documentation = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>('student')

  const sections = [
    {
      id: 'student',
      title: 'For Students',
      icon: GraduationCap,
      color: 'from-green-500 to-teal-500',
      content: [
        {
          step: 1,
          title: 'Create Your Account',
          description: 'Sign up on Lebanon Academy with your email address. Verify your email and complete your profile with your name, institution, and learning goals.'
        },
        {
          step: 2,
          title: 'Browse Courses & Exams',
          description: 'Explore our comprehensive catalog of courses and CBT exams. Use filters to find courses that match your interests and skill level.'
        },
        {
          step: 3,
          title: 'Enroll in Courses',
          description: 'Click "Enroll" to join a course. Payment may be required for premium courses. Access course materials immediately after enrollment.'
        },
        {
          step: 4,
          title: 'Access Learning Materials',
          description: 'View video lectures, download notes, and read course content. Track your progress and access materials anytime.'
        },
        {
          step: 5,
          title: 'Take Practice Exams',
          description: 'Complete CBT practice exams to test your knowledge. Review detailed answers and track your performance metrics.'
        },
        {
          step: 6,
          title: 'Get Your Certificate',
          description: 'Upon course completion, download your digital certificate. Share your achievements on your professional profiles.'
        }
      ]
    },
    {
      id: 'tutor',
      title: 'For Tutors',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      content: [
        {
          step: 1,
          title: 'Register as a Tutor',
          description: 'Sign up as a tutor and complete your profile with qualifications, expertise, and teaching experience.'
        },
        {
          step: 2,
          title: 'Create Courses',
          description: 'Click "Create Course" and fill in course details: title, description, level, and pricing. Add your course cover image.'
        },
        {
          step: 3,
          title: 'Upload Video Content',
          description: 'Record or upload video lectures. Support for MP4, WebM formats. Add chapters and organize content into modules.'
        },
        {
          step: 4,
          title: 'Add Course Materials',
          description: 'Attach PDFs, documents, and resources. Create lecture notes and study materials for your students.'
        },
        {
          step: 5,
          title: 'Manage CBT Exams',
          description: 'Create multiple-choice question banks. Organize questions by topic and difficulty level. Set time limits for exams.'
        },
        {
          step: 6,
          title: 'Track Student Progress',
          description: 'View student enrollment, completion rates, and exam scores. Provide feedback and monitor learning outcomes.'
        },
        {
          step: 7,
          title: 'Earn Revenue',
          description: 'Get paid based on course sales and enrollment. Withdraw earnings monthly through secure payment channels.'
        }
      ]
    },
    {
      id: 'institution',
      title: 'For Institutions',
      icon: Building2,
      color: 'from-green-500 to-emerald-500',
      content: [
        {
          step: 1,
          title: 'Create Institutional Account',
          description: 'Register your institution on Lebanon Academy. Verify your organization and complete administrative details.'
        },
        {
          step: 2,
          title: 'Set Up Your Workspace',
          description: 'Configure your institution dashboard. Add institutional branding and customize your learning portal.'
        },
        {
          step: 3,
          title: 'Invite Instructors',
          description: 'Add instructors to your institution. Assign roles and manage permissions for different team members.'
        },
        {
          step: 4,
          title: 'Bulk Upload Courses',
          description: 'Import existing courses in bulk. Use our CSV template to quickly populate course catalog.'
        },
        {
          step: 5,
          title: 'Manage Batch CBT Exams',
          description: 'Administer exams to student batches. Set exam schedules, configure settings, and manage question banks.'
        },
        {
          step: 6,
          title: 'Monitor Analytics',
          description: 'View comprehensive dashboards with student performance, course completion rates, and revenue reports.'
        },
        {
          step: 7,
          title: 'Issue Certificates',
          description: 'Automatically generate and send certificates to students upon course completion.'
        }
      ]
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-10 h-10" />
              <h1 className="text-4xl md:text-5xl font-bold">Documentation</h1>
            </div>
            <p className="text-lg text-green-100 max-w-2xl">
              Complete setup guides and instructions for students, tutors, and institutions to get started on Lebanon Academy.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {sections.map((section) => {
            const Icon = section.icon
            const isExpanded = expandedSection === section.id

            return (
              <motion.div
                key={section.id}
                variants={itemVariants}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Section Header */}
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className={`w-full p-6 bg-gradient-to-r ${section.color} text-white flex items-center justify-between hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-8 h-8" />
                    <div className="text-left">
                      <h2 className="text-2xl font-bold">{section.title}</h2>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <ChevronDown className="w-6 h-6" />
                  )}
                </button>

                {/* Section Content */}
                <motion.div
                  initial={false}
                  animate={{ height: isExpanded ? 'auto' : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-8 bg-slate-50">
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate={isExpanded ? 'visible' : 'hidden'}
                      className="grid md:grid-cols-2 gap-6"
                    >
                      {section.content.map((item, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="bg-white p-6 rounded-lg border-l-4 border-gradient-to-r"
                          style={{
                            borderLeftColor: section.color.split(' ')[1]
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`bg-gradient-to-r ${section.color} text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm`}>
                              {item.step}
                            </div>
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
              </motion.div>
            )
          })}
        </motion.div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-8 text-white">
        `{'>'}`
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
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 bg-white rounded-xl p-8 border-2 border-slate-200 text-center"
        >
          <h3 className="text-2xl font-bold mb-4 text-slate-900">Need Help?</h3>
          <p className="text-slate-600 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <button className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
            Contact Support <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default Documentation
