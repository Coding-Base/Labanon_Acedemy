import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Crown,
  Check,
  Zap,
  Shield,
  Sparkles,
  BookOpen,
  HelpCircle,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Lock,
  ChevronDown,
  Star
} from 'lucide-react'
import showToast from '../utils/toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Plan {
  id: number
  name: string
  slug: string
  description: string
  price_ngn: number
  price_usd: number
  billing_interval_days: number
  all_exams_unlocked: boolean
  included_exams?: { id: number; title: string; slug: string }[]
  allow_mock_exams: boolean
  allow_materials_download: boolean
  material_download_limit: number
  features_list: string[]
  badge?: string | null
}

export default function ProPlansPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')
  const [autoRenew, setAutoRenew] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [currentSub, setCurrentSub] = useState<any>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const getHeaders = () => {
    const token = localStorage.getItem('access')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Load plans & current status
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [plansRes, statusRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/subscriptions/plans/`),
          axios.get(`${API_BASE}/subscriptions/my-status/`, { headers: getHeaders() })
        ])

        if (plansRes.status === 'fulfilled' && plansRes.value.data?.plans) {
          setPlans(plansRes.value.data.plans)
          if (plansRes.value.data.plans.length > 0) {
            setSelectedPlan(plansRes.value.data.plans[0])
          }
        }

        if (statusRes.status === 'fulfilled' && statusRes.value.data?.is_pro) {
          setCurrentSub(statusRes.value.data.subscription)
        }
      } catch (err) {
        console.error('Error loading subscription info', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubscribe = async (plan: Plan) => {
    const token = localStorage.getItem('access')
    if (!token) {
      showToast('Please log in or create a student account to subscribe', 'error')
      navigate('/login?redirect=/student/pro')
      return
    }

    setProcessingPayment(true)
    try {
      const res = await axios.post(
        `${API_BASE}/subscriptions/initiate/`,
        {
          plan_id: plan.id,
          currency: currency,
          auto_renew: autoRenew
        },
        { headers: getHeaders() }
      )

      if (res.data?.authorization_url) {
        // Redirect to Paystack secure checkout
        window.location.href = res.data.authorization_url
      } else {
        showToast('Could not initialize payment gateway', 'error')
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Payment initiation failed', 'error')
    } finally {
      setProcessingPayment(false)
    }
  }

  const faqs = [
    {
      q: "What exams are included in the Pro Plan?",
      a: "Pro gives you unrestricted, 100% access to all past questions, timed CBT tests, and practice modes for JAMB UTME, WAEC SSCE, NECO, GCE, and Post-UTME across all subjects with no limits."
    },
    {
      q: "How does the monthly automatic renewal work?",
      a: "When you pay with your debit card, the system securely saves a card token with Paystack. At the end of the 30-day billing cycle, your subscription automatically renews so you never lose study progress. You can easily toggle this on or off anytime from your dashboard with 1 click."
    },
    {
      q: "Can I cancel my subscription anytime?",
      a: "Yes, absolutely! You can cancel anytime from your Student Portal. When you cancel, you keep full Pro access until your current 30-day cycle ends, and you will never be charged again."
    },
    {
      q: "What if I only want to practice a single exam like JAMB?",
      a: "You can still unlock individual exams with one-time activation fees. However, the Pro Plan is our most cost-effective option if you are taking multiple exams (e.g. JAMB + WAEC) or want access to Mock Exams and downloadable study materials."
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 selection:bg-yellow-500 selection:text-black">
      {/* Background glow accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-yellow-500/15 via-amber-600/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-16">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 transition-all"
          >
            <span>&larr; Back to Portal</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCurrency('NGN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currency === 'NGN' ? 'bg-yellow-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              NGN (₦)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currency === 'USD' ? 'bg-yellow-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-orange-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider shadow-lg"
          >
            <Crown className="w-4 h-4 text-yellow-400" />
            <span>LightHub Academy Pro Access</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white"
          >
            Unlock All Exams &amp; Score Top Percentile with <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">Pro</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto"
          >
            One single monthly plan that gives you unlimited access to JAMB, WAEC, NECO CBT practice tests, custom mock exam sessions, and downloadable study materials.
          </motion.p>

          {currentSub && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl max-w-md mx-auto text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>You are currently a <strong>{currentSub.plan_name}</strong></span>
              </span>
              <button
                onClick={() => navigate('/student/subscription')}
                className="underline font-bold hover:text-white ml-3"
              >
                Manage Subscription
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
          {/* FREE TIER CARD */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Free Student</div>
              <h3 className="text-2xl font-bold text-white">Starter Practice</h3>
              <p className="text-xs text-slate-400">Basic access to sample questions and public courses.</p>

              <div className="py-4 border-y border-slate-800/80">
                <div className="text-3xl font-extrabold text-white">₦0</div>
                <div className="text-xs text-slate-500 mt-0.5">Free forever</div>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>5 Free trial CBT attempts per exam</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <Check className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>Access to free marketplace courses</span>
                </li>
                <li className="flex items-center space-x-2.5 text-slate-500">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>No Custom Mock Exam sessions</span>
                </li>
                <li className="flex items-center space-x-2.5 text-slate-500">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Limited material downloads</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/student/cbt')}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all text-center"
            >
              Current Free Tier
            </button>
          </div>

          {/* DYNAMIC PRO TIER CARDS */}
          {loading ? (
            <div className="col-span-1 md:col-span-2 p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
              <span>Loading Pro plans...</span>
            </div>
          ) : (
            plans.map((plan) => (
              <motion.div
                key={plan.id}
                whileHover={{ y: -6 }}
                className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-8 border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/10 flex flex-col justify-between space-y-6"
              >
                {/* Popular Badge */}
                <div className="absolute -top-3.5 right-6 px-4 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 text-black shadow-lg">
                  {plan.badge || 'Recommended'}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <Crown className="w-5 h-5" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">Pro All-Access</span>
                  </div>

                  <h3 className="text-2xl font-extrabold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400">{plan.description || 'Full unlimited access across all exams and study tools.'}</p>

                  <div className="py-4 border-y border-slate-800/80">
                    <div className="text-4xl font-extrabold text-white flex items-baseline space-x-1">
                      <span>{currency === 'USD' ? `$${plan.price_usd}` : `₦${plan.price_ngn.toLocaleString()}`}</span>
                      <span className="text-xs font-normal text-slate-400">/ {plan.billing_interval_days} days</span>
                    </div>
                    <div className="text-[11px] text-yellow-400/90 mt-1 font-medium">Billed monthly • Cancel anytime</div>
                  </div>

                  {/* Auto-renew checkbox toggle */}
                  <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      className="w-4 h-4 rounded text-yellow-500 focus:ring-yellow-400"
                    />
                    <span className="text-slate-300">
                      Enable automatic renewal <span className="text-slate-500">(uncheck for 1-time 30-day pass)</span>
                    </span>
                  </label>

                  <ul className="space-y-3 text-xs text-slate-200">
                    <li className="flex items-start space-x-2.5">
                      <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-white">
                        {plan.all_exams_unlocked
                          ? 'All CBT Exams Unlocked (JAMB, WAEC, NECO, GCE, Post-UTME)'
                          : plan.included_exams && plan.included_exams.length > 0
                          ? `Exams Included: ${plan.included_exams.map((e) => e.title).join(', ')}`
                          : 'Selected CBT Exams Access'}
                      </span>
                    </li>
                    <li className="flex items-center space-x-2.5">
                      <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>Unlimited Timed Practice Tests &amp; Instant Grading</span>
                    </li>
                    {plan.allow_mock_exams && (
                      <li className="flex items-center space-x-2.5">
                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span>Custom Mock Exam Interface &amp; Timed Simulations</span>
                      </li>
                    )}
                    {plan.allow_materials_download ? (
                      <li className="flex items-center space-x-2.5">
                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span>
                          {plan.material_download_limit > 0
                            ? `${plan.material_download_limit} Downloadable Study Guides & Past Question PDFs`
                            : 'Unlimited Study Materials & Past Question PDFs'}
                        </span>
                      </li>
                    ) : (
                      <li className="flex items-center space-x-2.5 text-slate-500">
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="line-through">Downloadable Study Materials</span>
                      </li>
                    )}
                    {plan.features_list && plan.features_list.length > 0 ? (
                      plan.features_list.map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-2.5">
                          <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5 flex-shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-center space-x-2.5">
                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span>In-Depth Score Analytics &amp; Leaderboard Ranking</span>
                      </li>
                    )}
                  </ul>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubscribe(plan)}
                  disabled={processingPayment}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-extrabold text-sm shadow-xl shadow-yellow-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  {processingPayment ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Upgrade to Pro Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            ))
          )}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-4xl mx-auto bg-slate-900/60 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <h3 className="text-xl font-bold text-white text-center">Plan Comparison Breakdown</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4 text-center">Free Student</th>
                  <th className="py-3 px-4 text-center font-bold text-yellow-400">Pro Student</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3.5 px-4 font-medium">JAMB, WAEC, NECO CBT Tests</td>
                  <td className="py-3.5 px-4 text-center text-slate-500">5 Attempts</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Unlimited (All Exams)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Multi-Subject Combinations</td>
                  <td className="py-3.5 px-4 text-center text-slate-500">Locked</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Full Access</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Custom Mock Exam Sessions</td>
                  <td className="py-3.5 px-4 text-center text-slate-500">No</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Unlimited Mock Exams</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Study Materials &amp; Syllabus Downloads</td>
                  <td className="py-3.5 px-4 text-center text-slate-500">Pay per download</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">100% Free Downloads</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Smart Question Explanations &amp; Review</td>
                  <td className="py-3.5 px-4 text-center text-slate-500">Basic</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Detailed Explanations</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Priority Student Support</td>
                  <td className="py-3.5 px-4 text-center text-slate-500">Standard</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">24/7 Priority Support</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-bold text-white">Frequently Asked Questions</h3>
            <p className="text-xs text-slate-400">Everything you need to know about LightHub Pro</p>
          </div>

          <div className="space-y-3 pt-4">
            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-semibold text-sm text-white hover:text-yellow-400 transition-colors"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-yellow-400' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/50 pt-3"
                    >
                      {f.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
