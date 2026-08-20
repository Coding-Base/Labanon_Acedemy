import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Crown,
  CheckCircle2,
  Calendar,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  XCircle,
  ArrowRight,
  Shield,
  Loader2,
  Lock
} from 'lucide-react'
import showToast from '../utils/toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function SubscriptionSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [subData, setSubData] = useState<any>(null)
  const [togglingRenew, setTogglingRenew] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const getHeaders = () => {
    const token = localStorage.getItem('access')
    return { Authorization: `Bearer ${token}` }
  }

  const loadStatus = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/subscriptions/my-status/`, {
        headers: getHeaders(),
      })
      setSubData(res.data)
    } catch (err: any) {
      showToast('Failed to load subscription settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleToggleAutoRenew = async () => {
    setTogglingRenew(true)
    try {
      const res = await axios.post(
        `${API_BASE}/subscriptions/toggle-auto-renew/`,
        {},
        { headers: getHeaders() }
      )
      showToast(res.data.message || 'Auto-renewal setting updated', 'success')
      loadStatus()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update auto-renewal', 'error')
    } finally {
      setTogglingRenew(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCancelling(true)
    try {
      const res = await axios.post(
        `${API_BASE}/subscriptions/cancel/`,
        {},
        { headers: getHeaders() }
      )
      showToast(res.data.message || 'Subscription cancelled', 'success')
      setShowCancelModal(false)
      loadStatus()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to cancel subscription', 'error')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        <span>Loading subscription status...</span>
      </div>
    )
  }

  const sub = subData?.subscription

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <span>Manage Pro Subscription</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            View your active membership plan, renewal dates, and billing settings.
          </p>
        </div>

        <button
          onClick={() => navigate('/student/pro')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl shadow-md transition-all"
        >
          <span>View All Plans</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {!subData?.is_pro ? (
        /* NO ACTIVE SUBSCRIPTION STATE */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-2xl flex items-center justify-center mx-auto">
            <Crown className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">You are on the Free Plan</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            Upgrade to LightHub Pro to unlock all CBT Exams (JAMB, WAEC, NECO), custom mock exams, and unlimited study material downloads.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/student/pro')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all"
            >
              Explore Pro Plans
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE PRO SUBSCRIPTION DETAILS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Plan Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/60 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-wider flex items-center space-x-1">
                <Crown className="w-3.5 h-3.5" />
                <span>Active Member</span>
              </span>
              <span className="text-xs text-slate-400">
                Started: {new Date(sub.start_date).toLocaleDateString()}
              </span>
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-white">{sub.plan_name}</h2>
              <p className="text-xs text-slate-400 mt-1">Full access to all CBT past questions, mock exams &amp; resources.</p>
            </div>

            {/* Countdown bar */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Subscription Expiration:</span>
                <span className="font-bold text-yellow-400">
                  {new Date(sub.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {sub.days_remaining} <span className="text-xs font-normal text-slate-400">days remaining in current cycle</span>
              </div>
            </div>

            {/* Included features summary */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  {sub.all_exams_unlocked
                    ? 'All CBT Exams Unlocked (JAMB, WAEC, NECO, GCE, Post-UTME)'
                    : sub.included_exams && sub.included_exams.length > 0
                    ? `Included Exams: ${sub.included_exams.map((e: any) => e.title).join(', ')}`
                    : 'Access to Selected CBT Exams'}
                </span>
              </div>
              {sub.allow_mock_exams && (
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Unlimited Mock Exam Sessions</span>
                </div>
              )}
              {sub.allow_materials_download && (
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    {sub.material_download_limit > 0
                      ? `${sub.material_download_limit} Downloadable Study Guides & Past Question PDFs`
                      : 'Unlimited Study Material Downloads'}
                  </span>
                </div>
              )}
              {sub.features_list && sub.features_list.length > 0 && (
                sub.features_list.map((feat: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Billing & Auto-Renew Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-900 dark:text-white font-bold text-sm">
                <CreditCard className="w-4 h-4 text-yellow-500" />
                <span>Renewal Settings</span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Auto-Renewal</span>
                  <button
                    onClick={handleToggleAutoRenew}
                    disabled={togglingRenew}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sub.auto_renew ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sub.auto_renew ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                  {sub.auto_renew
                    ? `Your card (${sub.card_brand || 'Card'} •••• ${sub.card_last4 || '••••'}) will be charged automatically on renewal.`
                    : 'Auto-renew is disabled. You will be prompted to renew manually when your plan expires.'}
                </p>
              </div>

              <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
                <p>• Cancel anytime with no penalties</p>
                <p>• Retain access until end of billing cycle</p>
              </div>
            </div>

            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition-all"
            >
              Cancel Pro Subscription
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-gray-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-red-600 dark:text-red-400 font-bold">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Cancel Subscription?</h3>
              </div>

              <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                If you cancel, auto-renewal will be turned off. You will still have full Pro access until{' '}
                <strong>{new Date(sub?.end_date).toLocaleDateString()}</strong>, but your plan will not renew after that date.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Keep Subscription
                </button>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5"
                >
                  {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
