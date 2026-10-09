import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote,
  Plus,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  TrendingUp,
  Settings,
  ShieldAlert,
  Loader2,
  Eye,
  Check,
  X,
  CreditCard,
  Users,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Filter,
} from 'lucide-react';

interface AdminExamReferralPanelProps {
  dark?: boolean;
}

interface Campaign {
  id: number;
  exam: number;
  exam_id: number;
  exam_title: string;
  cash_reward: string;
  currency: string;
  is_active: boolean;
  payout_day?: string;
  payout_date?: string;
  payout_note?: string;
  max_rewards_per_referrer?: number;
  total_rewards_issued: number;
  total_amount_accrued: string;
}

interface RefereeItem {
  reward_id: number;
  referee_id: number;
  referee_name: string;
  referee_email: string;
  referee_username?: string;
  campaign_id: number;
  exam_id?: number | null;
  exam_title: string;
  amount: string;
  currency: string;
  status: string; // 'pending' | 'earned' | 'paid' | 'cancelled'
  status_display: string;
  earned_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  transaction_reference?: string;
  payout_id?: number | null;
  is_payable: boolean;
}

interface TopReferrer {
  user_id: number;
  name: string;
  username?: string;
  email: string;
  total_amount: string; // total accrued (earned + paid)
  total_paid?: string;
  pending_balance?: string;
  pending_count?: number;
  reward_count: number;
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
    is_verified: boolean;
  } | null;
  referees?: RefereeItem[];
}

interface RewardItem {
  id: number;
  campaign_id: number;
  exam_title: string;
  referrer_name: string;
  referrer_email: string;
  referee_name: string;
  referee_email: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
  earned_at?: string;
  paid_at?: string;
  bank_details?: any;
}

const COMMON_PAYOUT_DAYS = [
  'Every Friday',
  'Every Monday',
  'Every Saturday',
  'Every Sunday',
  'Every Thursday',
  'Every Wednesday',
  'Every Tuesday',
  'End of Month',
  'Bi-weekly (Fridays)',
];

export const AdminExamReferralPanel: React.FC<AdminExamReferralPanelProps> = ({ dark = false }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dashboard Stats
  const [metrics, setMetrics] = useState<any>({
    total_campaigns: 0,
    active_campaigns: 0,
    total_rewards_issued: 0,
    total_amount_accrued: '0.00',
    total_amount_paid: '0.00',
    total_amount_pending: '0.00',
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [recentRewards, setRecentRewards] = useState<RewardItem[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [allExams, setAllExams] = useState<Array<{ id: number; title: string }>>([]);

  // Promo config
  const [promoConfig, setPromoConfig] = useState<any>({
    show_homepage_banner: true,
    show_dashboard_banner: true,
    show_popup_modal: true,
    popup_frequency_hours: 24,
    banner_title: '',
    banner_description: '',
    banner_cta_text: '',
    is_active: true,
  });

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedReferrerForPayout, setSelectedReferrerForPayout] = useState<TopReferrer | null>(null);

  // New Campaign Form
  const [newCampaign, setNewCampaign] = useState({
    exam: '',
    cash_reward: '',
    currency: 'NGN',
    payout_day: 'Every Friday',
    custom_payout_day: '',
    payout_note: '',
    is_active: true,
    max_rewards_per_referrer: 0,
  });

  // Edit Campaign Form
  const [editForm, setEditForm] = useState({
    cash_reward: '',
    currency: 'NGN',
    payout_day: 'Every Friday',
    custom_payout_day: '',
    payout_note: '',
    is_active: true,
    max_rewards_per_referrer: 0,
  });

  // Payout Form & Selection
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    transaction_reference: '',
    admin_note: '',
  });
  const [selectedRewardIdsForPayout, setSelectedRewardIdsForPayout] = useState<number[]>([]);
  const [payoutRefereeLabel, setPayoutRefereeLabel] = useState<string>('');

  // Table filtering, debounced search, sorting & pagination
  const [referrerSearch, setReferrerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [sortBy, setSortBy] = useState<'pending_desc' | 'accrued_desc' | 'name_asc'>('pending_desc');
  const [expandedReferrers, setExpandedReferrers] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(referrerSearch);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [referrerSearch]);

  const toggleReferrerExpanded = (userId: number) => {
    setExpandedReferrers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access');
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, campRes, examsRes, historyRes, promoRes] = await Promise.all([
        axios.get(`${API_BASE}/courses/exam-referrals/admin/dashboard/`, { headers }),
        axios.get(`${API_BASE}/courses/exam-referrals/admin/campaigns/`, { headers }),
        axios.get(`${API_BASE}/cbt/exams/`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/courses/exam-referrals/admin/payout-history/`, { headers }),
        axios.get(`${API_BASE}/courses/exam-referrals/admin/promo-config/`, { headers }),
      ]);

      const d = dashRes.data;
      setMetrics({
        total_campaigns: d.total_campaigns || 0,
        active_campaigns: d.active_campaigns || 0,
        total_rewards_issued: d.total_rewards_issued || 0,
        total_amount_accrued: d.total_amount_accrued || '0.00',
        total_amount_paid: d.total_amount_paid || '0.00',
        total_amount_pending: d.total_amount_pending || '0.00',
      });
      setTopReferrers(d.top_referrers || []);
      setRecentRewards(d.recent_rewards || []);
      setCampaigns(campRes.data || []);
      setAllExams(Array.isArray(examsRes.data) ? examsRes.data : examsRes.data?.results || []);
      setPayoutHistory(historyRes.data || []);
      setPromoConfig(promoRes.data || {});
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load referral admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatMoney = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(num || 0);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.exam || !newCampaign.cash_reward) {
      alert('Please select an exam and specify the cash reward.');
      return;
    }

    const resolvedDay =
      newCampaign.payout_day === 'CUSTOM'
        ? newCampaign.custom_payout_day.trim() || 'Every Friday'
        : newCampaign.payout_day;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access');
      await axios.post(
        `${API_BASE}/courses/exam-referrals/admin/campaigns/`,
        {
          exam: parseInt(newCampaign.exam, 10),
          cash_reward: parseFloat(newCampaign.cash_reward),
          currency: newCampaign.currency,
          payout_day: resolvedDay,
          payout_note: newCampaign.payout_note,
          is_active: newCampaign.is_active,
          max_rewards_per_referrer: newCampaign.max_rewards_per_referrer,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg('Referral campaign created successfully!');
      setShowCreateModal(false);
      setNewCampaign({
        exam: '',
        cash_reward: '',
        currency: 'NGN',
        payout_day: 'Every Friday',
        custom_payout_day: '',
        payout_note: '',
        is_active: true,
        max_rewards_per_referrer: 0,
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (camp: Campaign) => {
    setEditingCampaign(camp);
    const isCustom = !COMMON_PAYOUT_DAYS.includes(camp.payout_day || '');
    setEditForm({
      cash_reward: String(camp.cash_reward),
      currency: camp.currency || 'NGN',
      payout_day: isCustom && camp.payout_day ? 'CUSTOM' : (camp.payout_day || 'Every Friday'),
      custom_payout_day: isCustom ? (camp.payout_day || '') : '',
      payout_note: camp.payout_note || '',
      is_active: camp.is_active,
      max_rewards_per_referrer: camp.max_rewards_per_referrer || 0,
    });
    setShowEditModal(true);
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    const resolvedDay =
      editForm.payout_day === 'CUSTOM'
        ? editForm.custom_payout_day.trim() || 'Every Friday'
        : editForm.payout_day;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access');
      await axios.patch(
        `${API_BASE}/courses/exam-referrals/admin/campaigns/${editingCampaign.id}/`,
        {
          cash_reward: parseFloat(editForm.cash_reward),
          currency: editForm.currency,
          payout_day: resolvedDay,
          payout_note: editForm.payout_note,
          is_active: editForm.is_active,
          max_rewards_per_referrer: editForm.max_rewards_per_referrer,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg(`Campaign for "${editingCampaign.exam_title}" updated successfully!`);
      setShowEditModal(false);
      setEditingCampaign(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (camp: Campaign) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the referral campaign for "${camp.exam_title}"?\n\nThis action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('access');
      await axios.delete(
        `${API_BASE}/courses/exam-referrals/admin/campaigns/${camp.id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMsg(`Campaign for "${camp.exam_title}" deleted.`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete campaign');
    }
  };

  const handleToggleCampaign = async (id: number, currentActive: boolean) => {
    try {
      const token = localStorage.getItem('access');
      await axios.patch(
        `${API_BASE}/courses/exam-referrals/admin/campaigns/${id}/`,
        { is_active: !currentActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update campaign');
    }
  };

  const handleConfirmPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferrerForPayout || !payoutForm.amount || !payoutForm.transaction_reference) {
      alert('Please fill out all required payout details.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access');
      const payload: any = {
        user_id: selectedReferrerForPayout.user_id,
        amount: parseFloat(payoutForm.amount),
        transaction_reference: payoutForm.transaction_reference,
        admin_note: payoutForm.admin_note,
      };
      if (selectedRewardIdsForPayout && selectedRewardIdsForPayout.length > 0) {
        payload.reward_ids = selectedRewardIdsForPayout;
      }
      await axios.post(
        `${API_BASE}/courses/exam-referrals/admin/confirm-payout/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg(`Payout confirmed for ${selectedReferrerForPayout.name}! Notification sent to their inbox.`);
      setShowPayoutModal(false);
      setPayoutForm({ amount: '', transaction_reference: '', admin_note: '' });
      setSelectedRewardIdsForPayout([]);
      setPayoutRefereeLabel('');
      setSelectedReferrerForPayout(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to confirm payout');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePromoConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('access');
      await axios.patch(`${API_BASE}/courses/exam-referrals/admin/promo-config/`, promoConfig, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMsg('Promo configuration updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update promo settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-sm text-gray-500">Loading referral management panel...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${dark ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
            <Banknote className="w-3.5 h-3.5" />
            <span>Master Admin Module</span>
          </div>
          <h1 className="text-2xl font-black">Exam Referral Management</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Create and edit exam cash referral campaigns, inspect student bank accounts, and record confirmed payouts.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black shadow-md shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New Exam Campaign</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`p-4 rounded-2xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Campaigns</span>
          <span className="text-xl font-black text-amber-500 mt-1 block">
            {metrics.active_campaigns} / {metrics.total_campaigns}
          </span>
          <span className="text-[10px] text-gray-500">Active / Total</span>
        </div>

        <div className={`p-4 rounded-2xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Rewards Issued</span>
          <span className="text-xl font-black text-amber-500 mt-1 block">{metrics.total_rewards_issued}</span>
          <span className="text-[10px] text-gray-500">Total Unlocks</span>
        </div>

        <div className={`p-4 rounded-2xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Accrued</span>
          <span className="text-xl font-black text-amber-500 mt-1 block">{formatMoney(metrics.total_amount_accrued)}</span>
          <span className="text-[10px] text-gray-500">Gross Liability</span>
        </div>

        <div className={`p-4 rounded-2xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Paid Out</span>
          <span className="text-xl font-black text-emerald-500 mt-1 block">{formatMoney(metrics.total_amount_paid)}</span>
          <span className="text-[10px] text-gray-500">Confirmed Transfers</span>
        </div>

        <div className={`p-4 rounded-2xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Pending Due</span>
          <span className="text-xl font-black text-blue-500 mt-1 block">{formatMoney(metrics.total_amount_pending)}</span>
          <span className="text-[10px] text-gray-500">Awaiting Payment</span>
        </div>

        <div className={`p-4 rounded-2xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Referrers</span>
          <span className="text-xl font-black text-purple-500 mt-1 block">{topReferrers.length}</span>
          <span className="text-[10px] text-gray-500">Active Partners</span>
        </div>
      </div>

      {/* Campaigns Management */}
      <div className={`p-6 rounded-3xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Configured Exam Campaigns</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Set cash rewards for CBT exams. Edit rewards, payout days, or delete campaigns anytime.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500">
            {campaigns.length} Campaigns
          </span>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No campaigns configured. Click &quot;New Exam Campaign&quot; to attach cash rewards to an exam!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Exam</th>
                  <th className="pb-3 px-4">Cash Reward</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Payout Day</th>
                  <th className="pb-3 px-4">Unlocks / Accrued</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {campaigns.map((c) => (
                  <tr key={c.id} className="transition-colors">
                    <td className="py-3.5 pr-4 font-bold text-gray-900 dark:text-white">{c.exam_title}</td>
                    <td className="py-3.5 px-4 font-black text-amber-500">{formatMoney(c.cash_reward)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          c.is_active
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                      {c.payout_day || 'Every Friday'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                      {c.total_rewards_issued} unlocks ({formatMoney(c.total_amount_accrued)})
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(c)}
                          title="Edit Campaign"
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Active Button */}
                        <button
                          onClick={() => handleToggleCampaign(c.id, c.is_active)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            c.is_active
                              ? 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300'
                              : 'bg-emerald-500 text-white hover:bg-emerald-600'
                          }`}
                        >
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteCampaign(c)}
                          title="Delete Campaign"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Referrers & Bank Details & Grouped Manual Payouts */}
      <div className={`p-6 rounded-3xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <span>Referrers, Bank Details & Manual Payouts</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Grouped referee records, strict single-confirmation guardrails, bank verification, and instant audit trails.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
              {topReferrers.length} Referrers
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500">
              Pending: {formatMoney(metrics.total_amount_pending)}
            </span>
          </div>
        </div>

        {/* Toolbar: Search input (debounced), Campaign filter, Status filter, Sort selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search referrer, referee, bank..."
              value={referrerSearch}
              onChange={(e) => setReferrerSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-colors ${
                dark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          {/* Exam Campaign Filter */}
          <div>
            <select
              value={campaignFilter}
              onChange={(e) => {
                setCampaignFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">All Exam Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.exam_title}
                </option>
              ))}
            </select>
          </div>

          {/* Payout Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">All Payout Statuses</option>
              <option value="pending">Has Pending Balance Due</option>
              <option value="settled">Fully Settled / Paid</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            >
              <option value="pending_desc">Sort: Highest Pending Due</option>
              <option value="accrued_desc">Sort: Highest Total Accrued</option>
              <option value="name_asc">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filtered & Paginated Referrers */}
        {(() => {
          // 1. Filter referrers based on search, campaign, status
          const filtered = topReferrers.filter((ref) => {
            const query = debouncedSearch.toLowerCase().trim();
            const matchesSearch =
              !query ||
              ref.name.toLowerCase().includes(query) ||
              ref.email.toLowerCase().includes(query) ||
              (ref.bank_details?.bank_name || '').toLowerCase().includes(query) ||
              (ref.bank_details?.account_number || '').includes(query) ||
              (ref.referees || []).some(
                (r) =>
                  r.referee_name.toLowerCase().includes(query) ||
                  r.referee_email.toLowerCase().includes(query) ||
                  r.exam_title.toLowerCase().includes(query)
              );

            if (!matchesSearch) return false;

            // Campaign filter
            if (campaignFilter !== 'all') {
              const campId = parseInt(campaignFilter, 10);
              const hasCampaign = (ref.referees || []).some((r) => r.campaign_id === campId);
              if (!hasCampaign) return false;
            }

            // Status filter
            const pendingBal = parseFloat(ref.pending_balance || '0');
            if (statusFilter === 'pending' && pendingBal <= 0) return false;
            if (statusFilter === 'settled' && pendingBal > 0) return false;

            return true;
          });

          // 2. Sort referrers
          filtered.sort((a, b) => {
            if (sortBy === 'pending_desc') {
              return parseFloat(b.pending_balance || '0') - parseFloat(a.pending_balance || '0');
            }
            if (sortBy === 'accrued_desc') {
              return parseFloat(b.total_amount || '0') - parseFloat(a.total_amount || '0');
            }
            if (sortBy === 'name_asc') {
              return a.name.localeCompare(b.name);
            }
            return 0;
          });

          const totalItems = filtered.length;
          const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
          const paginatedReferrers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

          if (totalItems === 0) {
            return (
              <div className="text-center py-12 text-sm text-gray-500">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
                <p>No referrers matched your search or filter criteria.</p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3 pr-2 w-8"></th>
                      <th className="pb-3 pr-4">Referrer</th>
                      <th className="pb-3 px-4">Bank Details</th>
                      <th className="pb-3 px-4">Total Accrued</th>
                      <th className="pb-3 px-4">Pending Due</th>
                      <th className="pb-3 px-4 text-center">Referees</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {paginatedReferrers.map((ref) => {
                      const bank = ref.bank_details;
                      const pendingBal = parseFloat(ref.pending_balance || '0');
                      const isExpanded = expandedReferrers.has(ref.user_id);
                      const refereeList = ref.referees || [];

                      return (
                        <React.Fragment key={ref.user_id}>
                          <tr
                            className={`transition-colors ${
                              isExpanded
                                ? dark
                                  ? 'bg-slate-800/40'
                                  : 'bg-amber-50/30'
                                : ''
                            }`}
                          >
                            {/* Expand / Collapse Chevron */}
                            <td className="py-3.5 pr-2">
                              <button
                                onClick={() => toggleReferrerExpanded(ref.user_id)}
                                className="p-1 rounded-md text-gray-400 hover:text-amber-500 transition-colors"
                                title={isExpanded ? 'Collapse referees' : 'View grouped referees'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            {/* Referrer Details */}
                            <td className="py-3.5 pr-4">
                              <span className="font-bold text-gray-900 dark:text-white block">{ref.name}</span>
                              <span className="text-[11px] text-gray-500 block">{ref.email}</span>
                            </td>

                            {/* Bank Details */}
                            <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                              {bank ? (
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                                    {bank.bank_name}
                                  </div>
                                  <div className="font-mono text-[11px] text-gray-500">
                                    {bank.account_number} ({bank.account_name})
                                  </div>
                                </div>
                              ) : (
                                <span className="text-rose-500 italic">No bank saved</span>
                              )}
                            </td>

                            {/* Total Accrued */}
                            <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                              {formatMoney(ref.total_amount)}
                              <span className="block text-[10px] text-gray-500 font-normal">
                                Paid: {formatMoney(ref.total_paid || '0.00')}
                              </span>
                            </td>

                            {/* Pending Balance Due */}
                            <td className="py-3.5 px-4">
                              {pendingBal > 0 ? (
                                <span className="font-black text-amber-500 text-sm block">
                                  {formatMoney(pendingBal)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  <Check className="w-3 h-3 mr-1" />
                                  All Paid
                                </span>
                              )}
                            </td>

                            {/* Referees Count badge */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => toggleReferrerExpanded(ref.user_id)}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                              >
                                {refereeList.length} Referees
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3 ml-1" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 ml-1" />
                                )}
                              </button>
                            </td>

                            {/* Actions: Confirm All Pending */}
                            <td className="py-3.5 pl-4 text-right">
                              {pendingBal > 0 ? (
                                <button
                                  onClick={() => {
                                    setSelectedReferrerForPayout(ref);
                                    setSelectedRewardIdsForPayout([]); // empty array triggers settling all earned
                                    setPayoutRefereeLabel('All Pending Unlocked Rewards');
                                    setPayoutForm({
                                      amount: ref.pending_balance || '0',
                                      transaction_reference: '',
                                      admin_note: `Settling all ${ref.pending_count || 1} pending referee unlock reward(s)`,
                                    });
                                    setShowPayoutModal(true);
                                  }}
                                  disabled={!bank}
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm transition-all disabled:opacity-40"
                                >
                                  Confirm All ({formatMoney(pendingBal)})
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                                >
                                  All Paid ✓
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Referee Breakdown Sub-table */}
                          {isExpanded && (
                            <tr>
                              <td
                                colSpan={7}
                                className={`p-4 rounded-2xl ${
                                  dark ? 'bg-slate-950/70 border-y border-slate-800' : 'bg-gray-50/80 border-y border-gray-200'
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 pb-1">
                                    <span>Referees Referred by {ref.name} ({refereeList.length} total)</span>
                                    <span className="text-[11px] font-normal">
                                      Payable rewards can only be confirmed once. Confirmed rewards are permanently locked.
                                    </span>
                                  </div>

                                  {refereeList.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No referees registered under this referrer.</p>
                                  ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                                      <table className="w-full text-left text-xs bg-white dark:bg-slate-900">
                                        <thead>
                                          <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 text-[11px] uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/40">
                                            <th className="py-2.5 px-3">Referee Name & Email</th>
                                            <th className="py-2.5 px-3">Exam Campaign</th>
                                            <th className="py-2.5 px-3">Amount</th>
                                            <th className="py-2.5 px-3">Unlock Status</th>
                                            <th className="py-2.5 px-3">Transfer Reference</th>
                                            <th className="py-2.5 px-3 text-right">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                          {refereeList.map((rf) => (
                                            <tr
                                              key={rf.reward_id}
                                              className="transition-colors"
                                            >
                                              {/* Referee */}
                                              <td className="py-2.5 px-3">
                                                <span className="font-semibold text-gray-900 dark:text-white block">
                                                  {rf.referee_name}
                                                </span>
                                                <span className="text-[10px] text-gray-400 block font-mono">
                                                  {rf.referee_email}
                                                </span>
                                              </td>

                                              {/* Campaign */}
                                              <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-medium">
                                                {rf.exam_title}
                                              </td>

                                              {/* Amount */}
                                              <td className="py-2.5 px-3 font-bold text-amber-500">
                                                {formatMoney(rf.amount)}
                                              </td>

                                              {/* Status */}
                                              <td className="py-2.5 px-3">
                                                {rf.status === 'earned' && (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Unlocked (Unpaid)
                                                  </span>
                                                )}
                                                {rf.status === 'paid' && (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Paid Out
                                                  </span>
                                                )}
                                                {rf.status === 'pending' && (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                                    Awaiting Unlock
                                                  </span>
                                                )}
                                                {rf.status === 'cancelled' && (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                    Cancelled
                                                  </span>
                                                )}
                                              </td>

                                              {/* Tx Reference */}
                                              <td className="py-2.5 px-3 text-[11px] font-mono text-gray-500 dark:text-gray-400">
                                                {rf.transaction_reference ? (
                                                  <span title={rf.transaction_reference}>
                                                    {rf.transaction_reference.slice(0, 16)}...
                                                  </span>
                                                ) : (
                                                  '—'
                                                )}
                                              </td>

                                              {/* Action Guardrail */}
                                              <td className="py-2.5 px-3 text-right">
                                                {rf.status === 'earned' ? (
                                                  <button
                                                    onClick={() => {
                                                      setSelectedReferrerForPayout(ref);
                                                      setSelectedRewardIdsForPayout([rf.reward_id]);
                                                      setPayoutRefereeLabel(
                                                        `${rf.referee_name} (${rf.exam_title})`
                                                      );
                                                      setPayoutForm({
                                                        amount: rf.amount,
                                                        transaction_reference: '',
                                                        admin_note: `Manual payout for referee unlock: ${rf.referee_name}`,
                                                      });
                                                      setShowPayoutModal(true);
                                                    }}
                                                    disabled={!bank}
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all disabled:opacity-40"
                                                  >
                                                    Confirm Payment
                                                  </button>
                                                ) : rf.status === 'paid' ? (
                                                  <button
                                                    disabled
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                                                    title="This reward has already been confirmed and paid."
                                                  >
                                                    Paid ✓
                                                  </button>
                                                ) : (
                                                  <button
                                                    disabled
                                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                                                    title="Referee has not unlocked this exam yet."
                                                  >
                                                    Awaiting Unlock
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800 text-xs">
                  <span className="text-gray-500">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, totalItems)} of {totalItems} referrers
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                          currentPage === page
                            ? 'bg-amber-500 text-black'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Payout History */}
      <div className={`p-6 rounded-3xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <History className="w-5 h-5 text-emerald-500" />
              <span>Confirmed Payout History</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Audit log of manual payments confirmed in the system.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
            {payoutHistory.length} Records
          </span>
        </div>

        {payoutHistory.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No payouts have been confirmed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 px-4">User</th>
                  <th className="pb-3 px-4">Amount</th>
                  <th className="pb-3 px-4">Transfer Ref</th>
                  <th className="pb-3 px-4">Confirmed By</th>
                  <th className="pb-3 pl-4">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {payoutHistory.map((p) => (
                  <tr key={p.id} className="transition-colors">
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(p.confirmed_at || p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {p.user_name}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-500">{formatMoney(p.amount)}</td>
                    <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300">
                      {p.transaction_reference}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{p.confirmed_by_name || 'Admin'}</td>
                    <td className="py-3 pl-4 text-gray-500 italic max-w-xs truncate">
                      {p.admin_note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promotional Settings Form */}
      <div className={`p-6 rounded-3xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Referral Promo Adverts Configuration</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Regulate banners and pop-up modals appearing on the student dashboard.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePromoConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={promoConfig.show_homepage_banner !== false}
                onChange={(e) =>
                  setPromoConfig({ ...promoConfig, show_homepage_banner: e.target.checked })
                }
                className="w-4 h-4 text-amber-500 rounded"
              />
              <span className="text-xs font-semibold">Show Homepage Banner</span>
            </label>

            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={promoConfig.show_dashboard_banner}
                onChange={(e) =>
                  setPromoConfig({ ...promoConfig, show_dashboard_banner: e.target.checked })
                }
                className="w-4 h-4 text-amber-500 rounded"
              />
              <span className="text-xs font-semibold">Show Dashboard Banner</span>
            </label>

            <label className="flex items-center space-x-3 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={promoConfig.show_popup_modal}
                onChange={(e) =>
                  setPromoConfig({ ...promoConfig, show_popup_modal: e.target.checked })
                }
                className="w-4 h-4 text-amber-500 rounded"
              />
              <span className="text-xs font-semibold">Show Pop-up Modal</span>
            </label>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Popup Frequency (hours)
              </label>
              <input
                type="number"
                min={1}
                value={promoConfig.popup_frequency_hours}
                onChange={(e) =>
                  setPromoConfig({
                    ...promoConfig,
                    popup_frequency_hours: parseInt(e.target.value, 10) || 24,
                  })
                }
                className={`w-full px-3 py-2 rounded-xl border text-xs ${
                  dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Banner Title
              </label>
              <input
                type="text"
                value={promoConfig.banner_title || ''}
                onChange={(e) => setPromoConfig({ ...promoConfig, banner_title: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${
                  dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={promoConfig.banner_cta_text || ''}
                onChange={(e) => setPromoConfig({ ...promoConfig, banner_cta_text: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${
                  dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Banner Description
            </label>
            <textarea
              rows={2}
              value={promoConfig.banner_description || ''}
              onChange={(e) => setPromoConfig({ ...promoConfig, banner_description: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl border text-xs ${
                dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
              }`}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-black shadow-md transition-all disabled:opacity-50"
            >
              Save Promo Settings
            </button>
          </div>
        </form>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-lg p-6 rounded-3xl border shadow-2xl z-10 ${
                dark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Create Exam Referral Campaign</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Select CBT Exam *
                  </label>
                  <select
                    required
                    value={newCampaign.exam}
                    onChange={(e) => setNewCampaign({ ...newCampaign, exam: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                      dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <option value="">Select an exam...</option>
                    {allExams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Cash Reward (NGN) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      step={50}
                      placeholder="e.g. 1000"
                      value={newCampaign.cash_reward}
                      onChange={(e) => setNewCampaign({ ...newCampaign, cash_reward: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                        dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Platform Payout Day *
                    </label>
                    <select
                      value={newCampaign.payout_day}
                      onChange={(e) => setNewCampaign({ ...newCampaign, payout_day: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                        dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      {COMMON_PAYOUT_DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                      <option value="CUSTOM">Custom Day...</option>
                    </select>
                  </div>
                </div>

                {newCampaign.payout_day === 'CUSTOM' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Specify Custom Payout Day
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Every 1st & 15th"
                      value={newCampaign.custom_payout_day}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, custom_payout_day: e.target.value })
                      }
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                        dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Payout Note (displayed to students)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Payouts are made directly to bank accounts every Friday"
                    value={newCampaign.payout_note}
                    onChange={(e) => setNewCampaign({ ...newCampaign, payout_note: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                      dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT CAMPAIGN MODAL */}
      <AnimatePresence>
        {showEditModal && editingCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-lg p-6 rounded-3xl border shadow-2xl z-10 ${
                dark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Edit Exam Campaign</h3>
                  <p className="text-xs text-gray-500">{editingCampaign.exam_title}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCampaign} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Cash Reward (NGN) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      step={50}
                      value={editForm.cash_reward}
                      onChange={(e) => setEditForm({ ...editForm, cash_reward: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold text-amber-500 ${
                        dark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Platform Payout Day *
                    </label>
                    <select
                      value={editForm.payout_day}
                      onChange={(e) => setEditForm({ ...editForm, payout_day: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                        dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      {COMMON_PAYOUT_DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                      <option value="CUSTOM">Custom Day...</option>
                    </select>
                  </div>
                </div>

                {editForm.payout_day === 'CUSTOM' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Specify Custom Payout Day
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Every Friday"
                      value={editForm.custom_payout_day}
                      onChange={(e) =>
                        setEditForm({ ...editForm, custom_payout_day: e.target.value })
                      }
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                        dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Payout Note
                  </label>
                  <input
                    type="text"
                    value={editForm.payout_note}
                    onChange={(e) => setEditForm({ ...editForm, payout_note: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                      dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                    <span>Campaign is Active</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM PAYOUT MODAL */}
      <AnimatePresence>
        {showPayoutModal && selectedReferrerForPayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPayoutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-lg p-6 rounded-3xl border shadow-2xl z-10 ${
                dark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Confirm Manual Payout</h3>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Beneficiary Details & Target Scope */}
              <div className={`p-4 rounded-2xl border mb-4 space-y-1.5 text-xs ${
                dark ? 'bg-slate-800/80 border-slate-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between">
                  <span>{selectedReferrerForPayout.name}</span>
                  <span className="text-[11px] font-normal text-gray-500">{selectedReferrerForPayout.email}</span>
                </div>
                {payoutRefereeLabel && (
                  <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Settling: {payoutRefereeLabel}
                  </div>
                )}
                <div className="text-gray-500">
                  Bank: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedReferrerForPayout.bank_details?.bank_name}</span>
                </div>
                <div className="text-gray-500">
                  Account: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{selectedReferrerForPayout.bank_details?.account_number}</span>
                </div>
                <div className="text-gray-500">
                  Account Name: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedReferrerForPayout.bank_details?.account_name}</span>
                </div>
              </div>

              <form onSubmit={handleConfirmPayout} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Amount Paid (NGN) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm font-black text-amber-500 ${
                      dark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Bank Transfer Reference / Session ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09026724010912345678"
                    value={payoutForm.transaction_reference}
                    onChange={(e) =>
                      setPayoutForm({ ...payoutForm, transaction_reference: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono ${
                      dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                  <span className="text-[10px] text-gray-400">
                    This reference will be visible in the student&apos;s payout history and confirmation inbox.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Admin Note (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via GTBank mobile transfer"
                    value={payoutForm.admin_note}
                    onChange={(e) => setPayoutForm({ ...payoutForm, admin_note: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                      dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Confirming...' : 'Confirm & Notify Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
