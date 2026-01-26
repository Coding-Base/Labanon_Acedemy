import React from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
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
  Sparkles,
  Youtube,
  Facebook
} from 'lucide-react'

type ValueItem = { icon: React.ComponentType<any>; title: string; description: string }
type StatItem = { number: string; label: string }
type FeatureItem = { icon: React.ComponentType<any>; title: string; description: string }

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }

const values: ValueItem[] = [
  { icon: Target, title: 'Mission-Driven', description: 'Democratizing quality education for everyone.' },
  { icon: Heart, title: 'Student-Centric', description: 'Every feature designed to help learners succeed.' },
  { icon: Globe, title: 'Globally Connected', description: 'Connecting learners, educators and institutions.' },
  { icon: Zap, title: 'Innovation', description: 'Constantly evolving with modern learning tech.' }
]

const stats: StatItem[] = [
  { number: '50K+', label: 'Active Learners' },
  { number: '1K+', label: 'Courses' },
  { number: '500+', label: 'Instructors' },
  { number: '100+', label: 'Institutions' }
]

const features: FeatureItem[] = [
  { icon: BookOpen, title: 'Comprehensive Learning', description: 'From beginner to advanced courses.' },
  { icon: Award, title: 'Verified Certificates', description: 'Recognized digital credentials.' },
  { icon: TrendingUp, title: 'Progress Analytics', description: 'Track your learning journey.' },
  { icon: Users, title: 'Expert Instructors', description: 'Learn from industry professionals.' },
  { icon: Globe, title: 'Global Community', description: 'Connect with learners worldwide' },
  { icon: Sparkles, title: 'Interactive Content', description: 'Engaging videos and practice exams.' }
]

const StatCard: React.FC<{ stat: StatItem }> = ({ stat }) => (
  <motion.div variants={itemVariants} className="bg-white rounded-xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
    <div className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-blue-500 mb-2">
      {stat.number}
    </div>
    <p className="text-slate-600 font-semibold">{stat.label}</p>
  </motion.div>
)

const ValueCard: React.FC<{ item: ValueItem }> = ({ item }) => {
  const Icon = item.icon
  return (
    <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow hover:shadow-xl transition-all hover:-translate-y-2">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br from-yellow-500 to-blue-500 text-white">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold mb-1 text-slate-900">{item.title}</h3>
      <p className="text-slate-600 text-sm">{item.description}</p>
    </motion.div>
  )
}

const FeatureCard: React.FC<{ feature: FeatureItem }> = ({ feature }) => {
  const Icon = feature.icon
  return (
    <motion.div variants={itemVariants} className="bg-white bg-opacity-8 backdrop-blur-sm p-6 rounded-lg border border-white/10 hover:bg-opacity-12 transition-all">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-gradient-to-r from-yellow-500 to-blue-500 text-white">
          <Icon className="w-5 h-5" />
        </div>
        <h4 className="font-semibold text-slate-900">{feature.title}</h4>
      </div>
      {/* changed from text-teal-100 (low contrast on translucent white) -> text-white for readable contrast */}
      <p className="text-sm text-white">{feature.description}</p>
    </motion.div>
  )
}

const About: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="px-3 py-2 rounded-md hover:bg-slate-100">← Back</button>
            <nav className="hidden sm:flex items-center gap-3">
              <Link to="/" className="text-slate-700 hover:text-yellow-600">Home</Link>
              <Link to="/documentation" className="text-slate-700 hover:text-yellow-600">Docs</Link>
              <Link to="/privacy-policy" className="text-slate-700 hover:text-yellow-600">Privacy</Link>
            </nav>
          </div>
          <div>
            <Link to="/register" className="bg-yellow-600 text-white px-3 py-2 rounded-md shadow-sm hover:opacity-90">Sign up</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-yellow-600 via-blue-600 to-blue-600 text-white py-20 px-4 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-10">
          <div className="absolute top-[-8%] left-[-8%] w-96 h-96 rounded-full bg-white/80 filter blur-2xl" />
          <div className="absolute bottom-[-8%] right-[-8%] w-96 h-96 rounded-full bg-white/80 filter blur-2xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">About LightHub Academy</h1>
            <p className="text-lg md:text-xl max-w-2xl leading-relaxed text-blue-100">
              Reimagining education by connecting learners, tutors, and institutions on a single, modern learning platform built to scale.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" aria-label="Get started" className="inline-flex items-center gap-2 bg-white text-yellow-700 font-semibold px-5 py-3 rounded-lg shadow hover:shadow-lg transition">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>

              <Link to="/contact" aria-label="Contact us" className="inline-flex items-center gap-2 border border-white/30 text-white px-5 py-3 rounded-lg hover:bg-white/10 transition">
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Stats */}
        <motion.section variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-4 gap-6 -mt-16 mb-12">
          {stats.map((s) => (
            <StatCard key={s.label} stat={s} />
          ))}
        </motion.section>

        {/* Our Story */}
        <section className="mb-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Our Story
            </motion.h2>

            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-slate-700 text-lg leading-relaxed mb-4">
              LightHub Academy started with a simple idea: quality education should be accessible. From a small team of educators to a global platform, our mission hasn't changed — make learning possible for everyone.
            </motion.p>

            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.7 }} className="text-slate-700 text-lg leading-relaxed">
              We combine careful curation, modern tech, and community to help learners reach their goals — whether that's exam prep, career growth, or lifelong learning.
            </motion.p>
          </div>

          <motion.aside initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="bg-gradient-to-br from-yellow-500 to-blue-600 rounded-xl p-8 text-white shadow-lg">
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Founded on Trust</h4>
                  <p className="text-blue-100 text-sm">Built by educators, for learners.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Rapid Growth</h4>
                  <p className="text-blue-100 text-sm">50K+ learners and counting.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">Global Impact</h4>
                  <p className="text-blue-100 text-sm">Learners from 100+ countries.</p>
                </div>
              </li>
            </ul>
          </motion.aside>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-10">
            Our Core Values
          </motion.h2>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <ValueCard key={v.title} item={v} />
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <motion.div className="bg-gradient-to-r from-yellow-600 to-blue-600 rounded-2xl p-10 text-white" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <h3 className="text-2xl font-bold mb-8 text-center">Why Choose LightHub Academy</h3>

            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <FeatureCard key={f.title} feature={f} />
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Commitment */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Our Commitment to You
              </motion.h2>

              <div className="space-y-4">
                {[
                  'Secure, transparent and ethical platform practices',
                  'Quality-assured courses and instructors',
                  'Fair pricing for learners',
                  'Responsive support and community',
                  'Continuous innovation and improvement',
                  'Protection of your privacy and data'
                ].map((c, i) => (
                  <motion.div key={c} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-700 flex-shrink-0" />
                    <span className="text-slate-700">{c}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="bg-white rounded-xl p-8 border border-slate-100">
              <div className="text-center">
                <div className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-blue-500 mb-3">
                  100%
                </div>
                <p className="text-lg font-semibold text-slate-900 mb-2">Committed to Excellence</p>
                <p className="text-slate-600">We measure success by learner outcomes and continuous improvement.</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12 text-center">
          <motion.h3 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} className="text-3xl font-bold mb-4 text-slate-900">
            Join the Learning Revolution
          </motion.h3>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
            Be part of a global community transforming education — start learning, teaching, or building with us today.
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 border border-yellow-600 text-yellow-700 px-6 py-3 rounded-lg hover:bg-yellow-50 transition">
              Become an Instructor
            </Link>
          </div>

          {/* Social Media Links */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-12 pt-12 border-t border-slate-200">
            <p className="text-slate-600 font-semibold mb-4">Follow Us On Social Media</p>
            <div className="flex items-center justify-center gap-6">
              <a 
                href="https://youtube.com/@lebanonacademy?si=S1NjHg2K7TMPpj5Z" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center w-12 h-12 bg-red-100 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
                aria-label="Follow us on YouTube"
              >
                <Youtube className="w-6 h-6" />
              </a>
              <a 
                href="https://www.facebook.com/profile.php?id=61587344120717" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  )
}

export default About


