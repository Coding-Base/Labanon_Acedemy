import React from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  Target,
  Users,
  Award,
  TrendingUp,
  Globe,
  Heart,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Star,
  Sparkles
} from 'lucide-react'

const About = () => {
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

  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'Democratizing quality education for everyone, everywhere.'
    },
    {
      icon: Heart,
      title: 'Student-Centric',
      description: 'Every feature designed with learner success in mind.'
    },
    {
      icon: Globe,
      title: 'Globally Connected',
      description: 'Connecting learners, educators, and institutions worldwide.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Constantly evolving with cutting-edge educational technology.'
    }
  ]

  const stats = [
    { number: '50K+', label: 'Active Learners' },
    { number: '1000+', label: 'Courses' },
    { number: '500+', label: 'Instructors' },
    { number: '100+', label: 'Institutions' }
  ]

  const features = [
    { icon: BookOpen, title: 'Comprehensive Learning', description: 'From beginner to advanced courses' },
    { icon: Award, title: 'Verified Certificates', description: 'Recognized digital credentials' },
    { icon: TrendingUp, title: 'Progress Analytics', description: 'Track your learning journey' },
    { icon: Users, title: 'Expert Instructors', description: 'Learn from industry professionals' },
    { icon: Globe, title: 'Global Community', description: 'Connect with learners worldwide' },
    { icon: Sparkles, title: 'Interactive Content', description: 'Engaging videos and practice exams' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">About Lebanon Academy</h1>
            <p className="text-xl text-purple-100 max-w-2xl leading-relaxed">
              We're reimagining education by connecting learners, instructors, and institutions on a single powerful platform designed for the future of learning.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Stats Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-4 gap-6 -mt-16 relative z-20 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white rounded-xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <p className="text-slate-600 font-semibold">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Our Story */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="my-16"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-slate-900">Our Story</h2>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                Lebanon Academy was founded with a simple vision: to make quality education accessible to everyone, regardless of their location or background. We recognized that traditional educational systems often fail to reach those who need them most.
              </p>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                Starting from a small group of passionate educators, we've grown into a thriving ecosystem where thousands of students access world-class courses, tutors share their expertise globally, and institutions scale their educational impact.
              </p>
              <p className="text-slate-700 text-lg leading-relaxed">
                Today, Lebanon Academy stands as a testament to what's possible when education meets technology and community.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-8 text-white">
            `{'>'}`
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Founded on Trust</h3>
                    <p className="text-purple-100">Built by educators, for learners</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Rapid Growth</h3>
                    <p className="text-purple-100">50K+ learners and counting</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Global Impact</h3>
                    <p className="text-purple-100">Learners from 100+ countries</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Core Values */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="my-20"
        >
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Our Core Values</h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2"
                >
                  <div className="bg-gradient-to-br from-green-500 to-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">{value.title}</h3>
                  <p className="text-slate-600">{value.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="my-20 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-12 text-white">
        `{'>'}`
          <h2 className="text-4xl font-bold mb-12 text-center">Why Choose Lebanon Academy</h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-lg border border-white border-opacity-20 hover:bg-opacity-20 transition-all"
                >
                  <Icon className="w-8 h-8 mb-3" />
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-purple-100">{feature.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>

        {/* Our Commitment */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="my-20 bg-white rounded-2xl p-12 border-2 border-slate-200"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-slate-900">Our Commitment to You</h2>
              <div className="space-y-4">
                {[
                  'Secure, transparent, and ethical platform practices',
                  'Quality-assured courses and instructors',
                  'Fair pricing for all learners',
                  'Responsive support and community',
                  'Continuous innovation and improvement',
                  'Protection of your privacy and data'
                ].map((commitment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <Star className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{commitment}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-br from-green-100 to-teal-100 rounded-xl p-8"
            >
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-4">
                  100%
                </div>
                <p className="text-lg font-semibold text-slate-900 mb-2">Committed to Excellence</p>
                <p className="text-slate-600">Every decision we make is guided by our commitment to learners, educators, and the future of education.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="my-20 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-12 text-white text-center"
        >
          <h2 className="text-4xl font-bold mb-6">Join the Learning Revolution</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Be part of a global community transforming education. Start learning, teaching, or building your institution today.
          </p>
          <button className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all inline-flex items-center gap-2 hover:bg-green-50">
            Get Started Now <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default About
