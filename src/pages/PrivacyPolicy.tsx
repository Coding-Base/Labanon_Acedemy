import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  Users,
  Database,
  FileText,
  ChevronDown,
  ChevronUp,
  Mail
} from 'lucide-react'

type Section = { title: string; icon: React.ComponentType<any>; content: string }
type OffPlatformWarning = { role: string; warning: string }

const sections: Section[] = [
  {
    title: 'Data Collection',
    icon: Database,
    content: `We collect the following types of personal data:
    
• Account Information: Name, email, phone number, institution name
• Educational Data: Course history, exam scores, certificates
• Payment Information: Billing address, transaction history (processed securely)
• Usage Data: Login times, courses accessed, time spent on platform
• Device Information: IP address, browser type, device type
    
This data is used to provide services, improve platform functionality, and send important notifications.`
  },
  {
    title: 'Data Security',
    icon: Lock,
    content: `Your data security is our priority:
    
• SSL encryption for all data transmission
• Secure password storage using industry-standard hashing
• Regular security audits and penetration testing
• Access controls and user authentication
• Compliance with GDPR and data protection regulations
• Data backups stored in secure, encrypted locations
• Immediate notification in case of data breaches`
  },
  {
    title: 'Data Usage',
    icon: Eye,
    content: `We use your data to:
    
• Provide and improve our services
• Send course materials and educational content
• Process payments and verify transactions
• Generate performance reports and certificates
• Communicate important platform updates
• Prevent fraud and unauthorized access
• Analyze usage patterns to enhance user experience
• Send marketing communications (with your consent)`
  },
  {
    title: 'Third-Party Sharing',
    icon: Users,
    content: `Your data is shared with:
    
• Payment processors (for secure transaction handling)
• Course instructors (limited to enrollment and progress data)
• Analytics partners (anonymized data only)
• Government authorities (only when legally required)
    
We DO NOT sell your personal data to third parties under any circumstances.`
  },
  {
    title: 'User Rights',
    icon: FileText,
    content: `You have the right to:
    
• Access your personal data anytime through your account
• Request corrections to inaccurate information
• Download your data in a portable format
• Request deletion of your account and associated data
• Opt-out of marketing communications
• Lodge complaints with data protection authorities
    
Contact our privacy team via the Contact page to exercise these rights.`
  }
]

const offPlatformWarnings: OffPlatformWarning[] = [
  {
    role: 'Students',
    warning: 'Do NOT accept payment requests, bank transfers, or money transfers outside this platform. All legitimate transactions occur through our secure payment gateway. Any off-platform transactions are NOT the responsibility of LightHub Academy management.'
  },
  {
    role: 'Tutors',
    warning: 'Do NOT solicit students for payments outside this platform. All course payments must be processed through LightHub Academy. Tutors caught conducting off-platform transactions will face immediate suspension and permanent removal from the platform.'
  },
  {
    role: 'Institutions',
    warning: 'Do NOT encourage students or staff to make payments outside this platform. All institutional transactions must use our payment system. Violations will result in immediate account termination and legal action if necessary.'
  }
]

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }

const PolicySection: React.FC<{ section: Section; index: number; isOpen: boolean; toggle: (i: number) => void }> = ({ section, index, isOpen, toggle }) => {
  const Icon = section.icon
  return (
    <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg overflow-hidden">
      <button onClick={() => toggle(index)} aria-expanded={isOpen} className="w-full p-6 bg-gradient-to-r from-green-600 to-teal-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Icon className="w-8 h-8" />
          <h2 className="text-xl font-semibold">{section.title}</h2>
        </div>
        {isOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
            <div className="p-6 bg-slate-50">
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">{section.content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const WarningCard: React.FC<{ warning: OffPlatformWarning }> = ({ warning }) => (
  <div className="border-l-4 border-green-600 pl-6 py-4 bg-white rounded-md shadow-sm">
    <h3 className="font-bold text-lg text-slate-900 mb-2">{warning.role}:</h3>
    <p className="text-slate-700 leading-relaxed">{warning.warning}</p>
  </div>
)

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate()
  const [expandedSection, setExpandedSection] = useState<number | null>(0)

  const toggleSection = (index: number) => setExpandedSection((prev) => (prev === index ? null : index))

  const formattedDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="px-3 py-2 rounded-md hover:bg-slate-100">← Back</button>
            <nav className="hidden sm:flex items-center gap-3">
              <Link to="/" className="text-slate-700 hover:text-green-600">Home</Link>
              <Link to="/about" className="text-slate-700 hover:text-green-600">About</Link>
              <Link to="/docs" className="text-slate-700 hover:text-green-600">Docs</Link>
            </nav>
          </div>
          <div>
            <Link to="/register" className="bg-green-600 text-white px-3 py-2 rounded-md shadow-sm hover:opacity-90">Sign up</Link>
          </div>
        </div>
      </header>

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-10 h-10" />
              <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-lg text-teal-100 max-w-2xl">LightHub Academy is committed to protecting your privacy and ensuring transparency about how we handle your data.</p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 mb-12">
          {sections.map((section, index) => (
            <PolicySection key={section.title} section={section} index={index} isOpen={expandedSection === index} toggle={toggleSection} />
          ))}
        </motion.div>

        {/* Critical Warning */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-12">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-1">
            <div className="bg-white rounded-lg p-8">
              <div className="flex items-start gap-4 mb-6">
                <AlertTriangle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">⚠️ Critical Warning — Off-Platform Transactions</h2>
                  <p className="text-green-600 font-semibold text-lg">LightHub Academy is not responsible for transactions conducted outside the platform.</p>
                </div>
              </div>

              <div className="space-y-6">
                {offPlatformWarnings.map((w) => <WarningCard key={w.role} warning={w} />)}
              </div>

              <div className="mt-8 bg-green-50 border-2 border-green-600 rounded-lg p-6">
                <h3 className="font-bold text-green-900 mb-4">Consequences of Violation:</h3>
                <ul className="space-y-3 text-slate-700 list-none">
                  <li className="flex items-start gap-3"><span className="text-green-600 font-bold">•</span><span><strong>Immediate Account Suspension:</strong> Accounts involved in off-platform transactions will be suspended immediately pending investigation.</span></li>
                  <li className="flex items-start gap-3"><span className="text-green-600 font-bold">•</span><span><strong>Permanent Removal:</strong> Users caught conducting off-platform transactions will be permanently banned from the platform.</span></li>
                  <li className="flex items-start gap-3"><span className="text-green-600 font-bold">•</span><span><strong>Refund Denial:</strong> No refunds will be issued for off-platform transaction disputes.</span></li>
                  <li className="flex items-start gap-3"><span className="text-green-600 font-bold">•</span><span><strong>Legal Action:</strong> LightHub Academy may pursue legal action against violators for fraud and unauthorized transactions.</span></li>
                  <li className="flex items-start gap-3"><span className="text-green-600 font-bold">•</span><span><strong>Blacklisting:</strong> Violators will be blacklisted from all LightHub Academy services permanently.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Policy Acknowledgment */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-8 text-white mb-8">
          <div className="flex items-start gap-4">
            <Lock className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold mb-4">Policy Acknowledgment</h3>
              <p className="mb-4 leading-relaxed">By using LightHub Academy, you acknowledge that you have read and understood this Privacy Policy. You agree to comply with all terms and conditions, including the strict prohibition of off-platform transactions. By continuing to use our platform, you consent to our data collection and usage practices.</p>
              <p className="text-teal-100">Last Updated: {formattedDate}</p>
            </div>
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-12 bg-white rounded-xl p-8 border-2 border-slate-200 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-slate-900" />
            <h3 className="text-2xl font-bold text-slate-900">Privacy Concerns?</h3>
          </div>
          <p className="text-slate-600 mb-6">If you have questions or concerns about our privacy practices, contact our privacy team.</p>
          <Link to="/contact" aria-label="Report privacy issue" className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
            Report Privacy Issue
          </Link>
        </motion.section>
      </main>
    </div>
  )
}

export default PrivacyPolicy

