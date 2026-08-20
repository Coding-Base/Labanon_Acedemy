import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Users,
  Calendar,
  DollarSign,
  Shield,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  FileText,
  Award,
  Crown
} from 'lucide-react'
import showToast from '../../utils/toast'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface ActivationItem {
  id: number
  user_id: number
  username: string
  email: string
  full_name: string
  exam_identifier: string
  exam_title: string
  amount: number
  currency: string
  activated_at: string
  is_active: boolean
  revoked_at?: string | null
  revocation_reason?: string | null
  age_months: number
  age_days: number
}

interface ProPlanItem {
  id: number
  name: string
  slug: string
  description: string
  price_ngn: number
  price_usd: number
  billing_interval_days: number
  all_exams_unlocked: boolean
  included_exams: { id: number; title: string; slug: string }[]
  allow_mock_exams: boolean
  allow_materials_download: boolean
  material_download_limit: number
  features_list: string[]
  badge?: string | null
  is_active: boolean
  order: number
  active_subscribers_count: number
  created_at: string
}

interface SubscriberItem {
  id: number
  user_id: number
  username: string
  email: string
  full_name: string
  plan_name: string
  plan_id?: number
  status: string
  start_date: string
  end_date: string
  auto_renew: boolean
  days_remaining: number
  card_last4?: string
  card_brand?: string
  last_payment_amount?: number
  created_at: string
}

interface ResetLogItem {
  id: number
  admin: string
  exam_identifier: string
  exam_title: string
  months_threshold: number
  cutoff_date: string
  affected_users_count: number
  reason: string
  created_at: string
}

interface ExamOption {
  id: number
  title: string
  slug: string
}

export default function SubscriptionManager() {
  const [activeSubTab, setActiveSubTab] = useState<'activations' | 'plans' | 'subscribers' | 'logs'>('activations')
  const [loading, setLoading] = useState(false)

  // 1. Activations State
  const [activations, setActivations] = useState<ActivationItem[]>([])
  const [metrics, setMetrics] = useState({
    total_activations: 0,
    active_unlocks: 0,
    revoked_unlocks: 0,
    older_than_9_months: 0,
    total_revenue: 0,
  })
  const [search, setSearch] = useState('')
  const [examFilter, setExamFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthsFilter, setMonthsFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 2. Exam List for Filters & Modals
  const [availableExams, setAvailableExams] = useState<ExamOption[]>([])

  // 3. Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetExam, setResetExam] = useState('all')
  const [resetMonths, setResetMonths] = useState(9)
  const [resetReason, setResetReason] = useState('Periodic exam reset for subscriptions older than 9 months')
  const [resetPreview, setResetPreview] = useState<{
    count: number
    cutoff_date: string
    sample_users: any[]
  } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [confirmResetText, setConfirmResetText] = useState('')
  const [resetting, setResetting] = useState(false)

  // 4. Pro Plans State
  const [plans, setPlans] = useState<ProPlanItem[]>([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<ProPlanItem | null>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price_ngn: 3500,
    price_usd: 5,
    billing_interval_days: 30,
    all_exams_unlocked: true,
    included_exam_ids: [] as number[],
    allow_mock_exams: true,
    allow_materials_download: true,
    material_download_limit: 0,
    features_list: '' as string, // newline-separated
    badge: 'Popular',
    is_active: true,
    order: 0,
  })
  const [savingPlan, setSavingPlan] = useState(false)

  // 5. Subscribers State
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([])
  const [subscribersCount, setSubscribersCount] = useState({ total: 0, active: 0 })
  const [subscriberSearch, setSubscriberSearch] = useState('')
  const [subscriberStatus, setSubscriberStatus] = useState('all')

  // 6. Grant Pro Modal
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [grantUserId, setGrantUserId] = useState('')
  const [grantDays, setGrantDays] = useState(30)
  const [grantNotes, setGrantNotes] = useState('Complimentary access granted by Admin')
  const [granting, setGranting] = useState(false)

  // 7. Reset Logs State
  const [resetLogs, setResetLogs] = useState<ResetLogItem[]>([])

  const getHeaders = () => {
    const token = localStorage.getItem('access')
    return { Authorization: `Bearer ${token}` }
  }

  // Load available exams
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await axios.get(`${API_BASE}/cbt/exams/`, { headers: getHeaders() })
        const items = Array.isArray(res.data?.results) ? res.data.results : (Array.isArray(res.data) ? res.data : [])
        if (items.length > 0) {
          setAvailableExams(items.map((e: any) => ({ id: e.id, title: e.title, slug: e.slug })))
        }
      } catch (err) {
        console.error('Failed to load exams list', err)
      }
    }
    loadExams()
  }, [])

  // Load activations data
  const loadActivations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      if (examFilter && examFilter !== 'all') params.append('exam', examFilter)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)
      if (monthsFilter) params.append('months_older_than', monthsFilter)

      const res = await axios.get(`${API_BASE}/subscriptions/admin/activations/?${params.toString()}`, {
        headers: getHeaders(),
      })
      setActivations(res.data.results || [])
      setMetrics(res.data.metrics || metrics)
      setTotalPages(res.data.pagination?.total_pages || 1)
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load activations', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, examFilter, statusFilter, search, monthsFilter])

  // Load plans data
  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/subscriptions/admin/plans/`, { headers: getHeaders() })
      setPlans(res.data.results || [])
      if (res.data.available_exams && Array.isArray(res.data.available_exams) && res.data.available_exams.length > 0) {
        setAvailableExams(res.data.available_exams)
      }
    } catch (err: any) {
      showToast('Failed to load Pro plans', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load subscribers data
  const loadSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (subscriberSearch) params.append('search', subscriberSearch)
      if (subscriberStatus && subscriberStatus !== 'all') params.append('status', subscriberStatus)

      const res = await axios.get(`${API_BASE}/subscriptions/admin/subscribers/?${params.toString()}`, {
        headers: getHeaders(),
      })
      setSubscribers(res.data.results || [])
      setSubscribersCount({
        total: res.data.total_subscribers || 0,
        active: res.data.active_subscribers || 0,
      })
    } catch (err: any) {
      showToast('Failed to load subscribers', 'error')
    } finally {
      setLoading(false)
    }
  }, [subscriberSearch, subscriberStatus])

  // Load reset logs
  const loadResetLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/subscriptions/admin/reset-logs/`, { headers: getHeaders() })
      setResetLogs(res.data.results || [])
    } catch (err: any) {
      showToast('Failed to load reset logs', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch when tab changes
  useEffect(() => {
    if (activeSubTab === 'activations') loadActivations()
    if (activeSubTab === 'plans') loadPlans()
    if (activeSubTab === 'subscribers') loadSubscribers()
    if (activeSubTab === 'logs') loadResetLogs()
  }, [activeSubTab, loadActivations, loadPlans, loadSubscribers, loadResetLogs])

  // Preview reset
  const handlePreviewReset = async () => {
    setPreviewLoading(true)
    try {
      const res = await axios.post(
        `${API_BASE}/subscriptions/admin/reset-activations/`,
        {
          exam_identifier: resetExam,
          months_threshold: resetMonths,
          dry_run: true,
          reason: resetReason,
        },
        { headers: getHeaders() }
      )
      setResetPreview({
        count: res.data.affected_count || 0,
        cutoff_date: res.data.cutoff_date,
        sample_users: res.data.sample_users || [],
      })
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to preview reset', 'error')
    } finally {
      setPreviewLoading(false)
    }
  }

  // Execute reset
  const handleExecuteReset = async () => {
    if (confirmResetText !== 'CONFIRM RESET') {
      showToast('Please type CONFIRM RESET to proceed with revoking access', 'error')
      return
    }

    setResetting(true)
    try {
      const res = await axios.post(
        `${API_BASE}/subscriptions/admin/reset-activations/`,
        {
          exam_identifier: resetExam,
          months_threshold: resetMonths,
          dry_run: false,
          reason: resetReason,
        },
        { headers: getHeaders() }
      )
      showToast(res.data.message || 'Reset completed successfully!', 'success')
      setShowResetModal(false)
      setResetPreview(null)
      setConfirmResetText('')
      loadActivations()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to execute reset', 'error')
    } finally {
      setResetting(false)
    }
  }

  // Save or Update Pro Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPlan(true)
    try {
      const featuresArray = planForm.features_list
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean)

      const payload = {
        name: planForm.name,
        description: planForm.description,
        price_ngn: planForm.price_ngn,
        price_usd: planForm.price_usd,
        billing_interval_days: planForm.billing_interval_days,
        all_exams_unlocked: planForm.all_exams_unlocked,
        included_exam_ids: planForm.all_exams_unlocked ? [] : planForm.included_exam_ids,
        allow_mock_exams: planForm.allow_mock_exams,
        allow_materials_download: planForm.allow_materials_download,
        material_download_limit: planForm.allow_materials_download ? planForm.material_download_limit : 0,
        features_list: featuresArray,
        badge: planForm.badge || null,
        is_active: planForm.is_active,
        order: planForm.order,
      }

      if (editingPlan) {
        await axios.put(`${API_BASE}/subscriptions/admin/plans/${editingPlan.id}/`, payload, {
          headers: getHeaders(),
        })
        showToast('Pro Plan updated successfully!', 'success')
      } else {
        await axios.post(`${API_BASE}/subscriptions/admin/plans/`, payload, {
          headers: getHeaders(),
        })
        showToast('Pro Plan created successfully!', 'success')
      }

      setShowPlanModal(false)
      setEditingPlan(null)
      loadPlans()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save plan', 'error')
    } finally {
      setSavingPlan(false)
    }
  }

  // Toggle plan active status
  const handleTogglePlanStatus = async (plan: ProPlanItem) => {
    try {
      await axios.put(
        `${API_BASE}/subscriptions/admin/plans/${plan.id}/`,
        { is_active: !plan.is_active },
        { headers: getHeaders() }
      )
      showToast(`Plan ${!plan.is_active ? 'activated' : 'deactivated'}`, 'success')
      loadPlans()
    } catch (err: any) {
      showToast('Failed to update plan status', 'error')
    }
  }

  // Grant Pro to a user
  const handleGrantPro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!grantUserId) {
      showToast('User ID is required', 'error')
      return
    }

    setGranting(true)
    try {
      const res = await axios.post(
        `${API_BASE}/subscriptions/admin/grant-pro/`,
        {
          user_id: grantUserId,
          days: grantDays,
          notes: grantNotes,
        },
        { headers: getHeaders() }
      )
      showToast(res.data.message || 'Granted Pro access successfully!', 'success')
      setShowGrantModal(false)
      setGrantUserId('')
      loadSubscribers()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to grant Pro access', 'error')
    } finally {
      setGranting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2.5 bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/30">
                <Crown className="w-6 h-6" />
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subscription & Access Manager</h1>
            </div>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base">
              Manage one-time exam activations, batch-reset periodic subscriptions (&gt;9 months), configure Pro student pricing tiers, and monitor active recurring subscribers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setShowResetModal(true)
                setResetPreview(null)
              }}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl font-semibold shadow-lg shadow-red-900/30 transition-all text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Exam Subscriptions</span>
            </button>

            <button
              onClick={() => {
                setEditingPlan(null)
                setPlanForm({
                  name: '',
                  description: '',
                  price_ngn: 3500,
                  price_usd: 5,
                  billing_interval_days: 30,
                  all_exams_unlocked: true,
                  included_exam_ids: availableExams.map((e) => e.id),
                  allow_mock_exams: true,
                  allow_materials_download: true,
                  material_download_limit: 0,
                  features_list: 'Full access to all JAMB, WAEC & NECO past questions\nUnlimited timed CBT practice tests with instant scoring\nFull access to Custom Mock Exam sessions\nUnlimited PDF study materials & syllabus downloads\nIn-depth performance analytics & leaderboard ranking',
                  badge: 'Popular',
                  is_active: true,
                  order: 0,
                })
                setShowPlanModal(true)
              }}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white rounded-xl font-semibold shadow-lg shadow-yellow-900/30 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Pro Tier</span>
            </button>
          </div>
        </div>

        {/* Global KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Total Activations</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.total_activations.toLocaleString()}</div>
            <div className="text-xs text-blue-400 mt-1 font-medium">All recorded unlocks</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Active Unlocks</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{metrics.active_unlocks.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">Currently practicing</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Older Than 9 Mos</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{metrics.older_than_9_months.toLocaleString()}</div>
            <div className="text-xs text-amber-300/80 mt-1">Due for renewal reset</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">₦{metrics.total_revenue.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">From unlock fees</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Active Pro Users</span>
              <Crown className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">{subscribersCount.active}</div>
            <div className="text-xs text-purple-300 mt-1">{subscribersCount.total} lifetime</div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('activations')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
            activeSubTab === 'activations'
              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Activation Payments &amp; Reset</span>
        </button>

        <button
          onClick={() => setActiveSubTab('plans')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
            activeSubTab === 'plans'
              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Pro Plans &amp; Pricing Tiers</span>
        </button>

        <button
          onClick={() => setActiveSubTab('subscribers')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
            activeSubTab === 'subscribers'
              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Pro Subscribers ({subscribersCount.active})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
            activeSubTab === 'logs'
              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Reset Audit Logs</span>
        </button>
      </div>

      {/* SUB-TAB 1: ACTIVATION PAYMENTS & RESET */}
      {activeSubTab === 'activations' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search student by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={examFilter}
                onChange={(e) => {
                  setExamFilter(e.target.value)
                  setPage(1)
                }}
                className="px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">All Exams</option>
                {availableExams.map((e) => (
                  <option key={e.id} value={e.slug || e.id}>
                    {e.title}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Access Only</option>
                <option value="revoked">Revoked / Reset Only</option>
              </select>

              <select
                value={monthsFilter}
                onChange={(e) => {
                  setMonthsFilter(e.target.value)
                  setPage(1)
                }}
                className="px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Any Age</option>
                <option value="6">&gt; 6 Months Old</option>
                <option value="9">&gt; 9 Months Old (Due Reset)</option>
                <option value="12">&gt; 1 Year Old</option>
              </select>
            </div>
          </div>

          {/* Activations Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                <span>Loading activations...</span>
              </div>
            ) : activations.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-base font-medium">No activation records match the criteria.</p>
                <p className="text-xs text-gray-400 mt-1">Try broadening your search or filter settings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
                  <thead className="bg-gray-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Exam Unlocked</th>
                      <th className="px-6 py-4">Paid Fee</th>
                      <th className="px-6 py-4">Activated Date</th>
                      <th className="px-6 py-4">Subscription Age</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                    {activations.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white">{item.full_name}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{item.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                            {item.exam_title}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                          {item.currency} {item.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div>{new Date(item.activated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                          <div className="text-gray-400">{new Date(item.activated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              item.age_months >= 9
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                                : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {item.age_months} months ({item.age_days}d)
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.is_active ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              <span>Revoked / Reset</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-sm">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-medium"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PRO PLANS & PRICING TIERS */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all duration-300 border ${
                  plan.is_active
                    ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-md hover:shadow-xl'
                    : 'bg-gray-50/80 dark:bg-slate-950/60 border-dashed border-gray-300 dark:border-slate-800 opacity-75'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-sm">
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl">
                    <Crown className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      plan.is_active
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>

                <div className="my-6 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                  <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    ₦{plan.price_ngn.toLocaleString()}
                    <span className="text-xs font-normal text-gray-500 dark:text-slate-400"> / {plan.billing_interval_days} days</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">(${plan.price_usd} USD)</div>
                </div>

                {/* Features list */}
                <ul className="space-y-2.5 text-xs text-gray-600 dark:text-slate-300 mb-6">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{plan.all_exams_unlocked ? 'All CBT Exams Unlocked' : `${plan.included_exams?.length || 0} Specific Exams`}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{plan.allow_mock_exams ? 'Custom Mock Exam Sessions' : 'No Mock Exams'}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{plan.allow_materials_download ? 'Unlimited Material Downloads' : 'Standard Materials'}</span>
                  </li>
                  {plan.features_list?.map((feat, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Subscriber count pill */}
                <div className="mb-4 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-200/50 dark:border-purple-900/30 flex items-center justify-between">
                  <span>Current Active Subscribers:</span>
                  <span className="font-bold">{plan.active_subscribers_count}</span>
                </div>

                {/* Card Action buttons */}
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setEditingPlan(plan)
                      setPlanForm({
                        name: plan.name,
                        description: plan.description,
                        price_ngn: plan.price_ngn,
                        price_usd: plan.price_usd,
                        billing_interval_days: plan.billing_interval_days,
                        all_exams_unlocked: plan.all_exams_unlocked,
                        included_exam_ids: plan.included_exams?.map((e) => e.id) || [],
                        allow_mock_exams: plan.allow_mock_exams,
                        allow_materials_download: plan.allow_materials_download,
                        material_download_limit: plan.material_download_limit || 0,
                        features_list: (plan.features_list || []).join('\n'),
                        badge: plan.badge || '',
                        is_active: plan.is_active,
                        order: plan.order,
                      })
                      setShowPlanModal(true)
                    }}
                    className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-semibold text-xs transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Plan</span>
                  </button>

                  <button
                    onClick={() => handleTogglePlanStatus(plan)}
                    className={`px-3 py-2 rounded-xl font-semibold text-xs transition-all ${
                      plan.is_active
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {plan.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ACTIVE PRO SUBSCRIBERS */}
      {activeSubTab === 'subscribers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search subscriber by username or email..."
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <select
                value={subscriberStatus}
                onChange={(e) => setSubscriberStatus(e.target.value)}
                className="px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">All Subscribers</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
                <option value="cancelled">Cancelled Only</option>
              </select>

              <button
                onClick={() => setShowGrantModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>Grant Pro Access</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {subscribers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No subscribers found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
                  <thead className="bg-gray-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Plan Tier</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Days Left</th>
                      <th className="px-6 py-4">Auto-Renew</th>
                      <th className="px-6 py-4">Expiration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 dark:text-white">{sub.full_name}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{sub.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-purple-600 dark:text-purple-400">{sub.plan_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              sub.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{sub.days_remaining} days</td>
                        <td className="px-6 py-4">
                          {sub.auto_renew ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Card Auto-Renew ({sub.card_brand || 'Card'} •••• {sub.card_last4 || '••••'})</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Manual Renewal</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium">
                          {new Date(sub.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: RESET AUDIT LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Exam Subscription Reset Audit Log</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Historical log of all bulk resets executed by master admins.</p>
          </div>

          {resetLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No reset logs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
                <thead className="bg-gray-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Date Executed</th>
                    <th className="px-6 py-4">Admin</th>
                    <th className="px-6 py-4">Exam Targeted</th>
                    <th className="px-6 py-4">Threshold</th>
                    <th className="px-6 py-4">Affected Students</th>
                    <th className="px-6 py-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                  {resetLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 text-xs font-semibold text-gray-900 dark:text-white">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium">{l.admin}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{l.exam_title}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-amber-600 dark:text-amber-400">
                        &gt; {l.months_threshold} Months
                      </td>
                      <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">
                        {l.affected_users_count} unlocks reset
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-slate-400">{l.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET EXAM SUBSCRIPTIONS MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-gray-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Batch Reset Exam Subscriptions</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Revoke access for student unlocks older than specified threshold.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                    Target CBT Exam
                  </label>
                  <select
                    value={resetExam}
                    onChange={(e) => {
                      setResetExam(e.target.value)
                      setResetPreview(null)
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All Exams (JAMB, WAEC, NECO, GCE, etc.)</option>
                    {availableExams.map((e) => (
                      <option key={e.id} value={e.slug || e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                    Subscription Duration Threshold
                  </label>
                  <select
                    value={resetMonths}
                    onChange={(e) => {
                      setResetMonths(Number(e.target.value))
                      setResetPreview(null)
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 font-semibold"
                  >
                    <option value={9}>Older than 9 Months (Default &amp; Recommended)</option>
                    <option value={6}>Older than 6 Months</option>
                    <option value={12}>Older than 12 Months (1 Year)</option>
                    <option value={3}>Older than 3 Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                    Reason / Audit Note
                  </label>
                  <input
                    type="text"
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Preview Trigger Button */}
                <button
                  type="button"
                  onClick={handlePreviewReset}
                  disabled={previewLoading}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 border border-gray-300 dark:border-slate-700 transition-all"
                >
                  {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4 text-blue-500" />}
                  <span>{previewLoading ? 'Calculating affected users...' : 'Calculate & Preview Affected Students'}</span>
                </button>

                {/* Preview Box */}
                {resetPreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Reset Impact Preview:</span>
                      </div>
                      <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-extrabold">
                        {resetPreview.count} Students Affected
                      </span>
                    </div>

                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      All subscriptions activated before{' '}
                      <strong>{new Date(resetPreview.cutoff_date).toLocaleDateString()}</strong> will be revoked. Students will be required to make a fresh payment to practice again.
                    </p>

                    {resetPreview.sample_users?.length > 0 && (
                      <div className="text-xs text-gray-600 dark:text-slate-400 mt-2">
                        <span className="font-semibold">Sample students to be reset:</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {resetPreview.sample_users.slice(0, 6).map((u) => (
                            <span key={u.id} className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-gray-200 dark:border-slate-800 text-[11px]">
                              {u.username} ({u.age_months}m)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Safety Confirmation Step */}
                {resetPreview && (
                  <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                    <label className="block text-xs font-bold text-red-600 dark:text-red-400">
                      To confirm execution, type <span className="underline">CONFIRM RESET</span> below:
                    </label>
                    <input
                      type="text"
                      placeholder="CONFIRM RESET"
                      value={confirmResetText}
                      onChange={(e) => setConfirmResetText(e.target.value)}
                      className="w-full px-4 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-xl text-sm font-bold text-red-600 focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteReset}
                  disabled={resetting || !resetPreview || confirmResetText !== 'CONFIRM RESET'}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  <span>{resetting ? 'Revoking Access...' : 'Execute Reset Now'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PRO PLAN CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-gray-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-2xl">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {editingPlan ? 'Edit Pro Plan Tier' : 'Create New Pro Subscription Tier'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Configure pricing, duration, and feature access permissions for students.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                      Plan Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pro Monthly Access"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                      Marketing Badge (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Most Popular, Best Value"
                      value={planForm.badge}
                      onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                    Plan Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description of this subscription plan..."
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                      Price (NGN ₦)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={planForm.price_ngn}
                      onChange={(e) => setPlanForm({ ...planForm, price_ngn: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                      Price (USD $)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={planForm.price_usd}
                      onChange={(e) => setPlanForm({ ...planForm, price_usd: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={planForm.billing_interval_days}
                      onChange={(e) => setPlanForm({ ...planForm, billing_interval_days: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 font-bold"
                    />
                  </div>
                </div>

                {/* Feature Permissions Checkboxes */}
                <div className="p-5 bg-gray-50 dark:bg-slate-800/70 rounded-2xl space-y-4 border border-gray-200 dark:border-slate-700">
                  <span className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                    Access &amp; Download Permissions
                  </span>

                  {/* 1. Exam Permissions */}
                  <div className="space-y-3 pb-3 border-b border-gray-200 dark:border-slate-700">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.all_exams_unlocked}
                        onChange={(e) => setPlanForm({ ...planForm, all_exams_unlocked: e.target.checked })}
                        className="w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          Unlock All CBT Exams Automatically
                        </span>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          Grants full access to all existing and future exams (JAMB, WAEC, NECO, GCE, etc.)
                        </p>
                      </div>
                    </label>

                    {/* Individual Exam Toggles when all_exams_unlocked is FALSE */}
                    {!planForm.all_exams_unlocked && (
                      <div className="mt-2 pl-4 sm:pl-7 space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-yellow-500/40">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                            Select Specific Exams: ({planForm.included_exam_ids.length} selected)
                          </span>
                          <div className="flex items-center space-x-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setPlanForm({ ...planForm, included_exam_ids: availableExams.map((e) => e.id) })}
                              className="text-yellow-600 dark:text-yellow-400 hover:underline font-bold"
                            >
                              Select All
                            </button>
                            <span className="text-gray-300 dark:text-slate-600">|</span>
                            <button
                              type="button"
                              onClick={() => setPlanForm({ ...planForm, included_exam_ids: [] })}
                              className="text-red-500 hover:underline font-bold"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        {availableExams.length === 0 ? (
                          <p className="text-xs text-gray-500 italic py-2">No exams found in database.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            {availableExams.map((exam) => {
                              const isSelected = planForm.included_exam_ids.includes(exam.id)
                              return (
                                <label
                                  key={exam.id}
                                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-yellow-500/10 border-yellow-500 text-gray-900 dark:text-white font-bold'
                                      : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setPlanForm({
                                            ...planForm,
                                            included_exam_ids: [...planForm.included_exam_ids, exam.id],
                                          })
                                        } else {
                                          setPlanForm({
                                            ...planForm,
                                            included_exam_ids: planForm.included_exam_ids.filter((id) => id !== exam.id),
                                          })
                                        }
                                      }}
                                      className="w-3.5 h-3.5 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                                    />
                                    <span className="truncate">{exam.title}</span>
                                  </div>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 uppercase font-mono ml-2 flex-shrink-0">
                                    {exam.slug}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Mock Exam Sessions */}
                  <div className="pb-3 border-b border-gray-200 dark:border-slate-700">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.allow_mock_exams}
                        onChange={(e) => setPlanForm({ ...planForm, allow_mock_exams: e.target.checked })}
                        className="w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          Allow Custom Mock Exam Simulator
                        </span>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          Enables custom timed multi-subject mock simulations
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* 3. Study Materials & Download Limits */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.allow_materials_download}
                        onChange={(e) => setPlanForm({ ...planForm, allow_materials_download: e.target.checked })}
                        className="w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          Allow Study Material Downloads
                        </span>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          Enables downloading past questions, curriculum guides &amp; PDFs
                        </p>
                      </div>
                    </label>

                    {planForm.allow_materials_download && (
                      <div className="pl-7 pt-1">
                        <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                          Material Download Limit per Billing Period:
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min={0}
                            placeholder="0 for unlimited"
                            value={planForm.material_download_limit}
                            onChange={(e) => setPlanForm({ ...planForm, material_download_limit: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-32 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                          />
                          <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                            {planForm.material_download_limit === 0 ? '(0 = Unlimited Downloads)' : `(Limited to ${planForm.material_download_limit} downloads per cycle)`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300 mb-1.5">
                    Marketing Feature Bullet Points (One per line)
                  </label>
                  <textarea
                    rows={4}
                    value={planForm.features_list}
                    onChange={(e) => setPlanForm({ ...planForm, features_list: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-yellow-900/30 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {savingPlan && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingPlan ? 'Update Plan' : 'Create Plan'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* GRANT COMPLIMENTARY PRO MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showGrantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-gray-200 dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Grant Complimentary Pro</h3>
                </div>
                <button onClick={() => setShowGrantModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGrantPro} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Student User ID</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 42"
                    value={grantUserId}
                    onChange={(e) => setGrantUserId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={grantDays}
                    onChange={(e) => setGrantDays(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Admin Notes</label>
                  <input
                    type="text"
                    value={grantNotes}
                    onChange={(e) => setGrantNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowGrantModal(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={granting}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md flex items-center space-x-2"
                  >
                    {granting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Grant Access</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
