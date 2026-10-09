import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Banknote,
  Copy,
  Check,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  History,
  TrendingUp,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Building2,
  Users,
  Info,
} from 'lucide-react';
import { BankAccountForm } from '../../components/exam-referral/BankAccountForm';

interface ExamReferralPageProps {
  dark?: boolean;
}

interface Campaign {
  id: number;
  exam: number;
  exam_id: number;
  exam_title: string;
  exam_slug: string;
  cash_reward: string;
  currency: string;
  is_active: boolean;
  is_valid: boolean;
  payout_day?: string;
  payout_date?: string;
  payout_note?: string;
  referral_count?: number;
  referral_code?: string;
}

interface Reward {
  id: number;
  campaign_id: number;
  exam_title: string;
  referee_name: string;
  referee_email: string;
  amount: string;
  currency: string;
  status: 'pending' | 'earned' | 'paid' | 'cancelled';
  earned_at?: string;
  paid_at?: string;
  created_at: string;
}

interface Payout {
  id: number;
  amount: string;
  currency: string;
  status: string;
  confirmed_at?: string;
  transaction_reference?: string;
  admin_note?: string;
  created_at: string;
}

export const ExamReferralPage: React.FC<ExamReferralPageProps> = ({ dark = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [referralCode, setReferralCode] = useState('');
  const [pointsBalance, setPointsBalance] = useState('0.00');
  const [totalEarned, setTotalEarned] = useState('0.00');
  const [totalPaid, setTotalPaid] = useState('0.00');
  const [totalPending, setTotalPending] = useState('0.00');
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [nextPayoutDate, setNextPayoutDate] = useState<string | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);

  const [showBankForm, setShowBankForm] = useState(false);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_BASE}/courses/exam-referrals/my-rewards/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const d = res.data;
      setReferralCode(d.referral_code || '');
      setPointsBalance(d.points_balance || '0.00');
      setTotalEarned(d.total_earned || '0.00');
      setTotalPaid(d.total_paid || '0.00');
      setTotalPending(d.total_pending || '0.00');
      setBankAccount(d.bank_account);
      setNextPayoutDate(d.next_payout_date);
      setRewards(d.rewards || []);
      setPayouts(d.payouts || []);
      setActiveCampaigns(d.active_campaigns || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load referral details');
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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => {
      setCopiedLink(null);
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
          </span>
        );
      case 'earned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" /> Awaiting Payout
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
            <Clock className="w-3 h-3 mr-1" /> Awaiting Unlock
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            Cancelled
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-sm text-gray-500">Loading referral rewards...</p>
      </div>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const generalRegisterLink = `${origin}/register?ref=${encodeURIComponent(referralCode)}`;
  const generalMarketplaceLink = `${origin}/marketplace?ref=${encodeURIComponent(referralCode)}`;

  return (
    <div className={`p-4 md:p-8 max-w-7xl mx-auto space-y-8 ${dark ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
          <Banknote className="w-3.5 h-3.5" />
          <span>Cash Referral Rewards</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Exam Referral Program</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
          Refer other students to unlock exams and earn instant cash rewards paid directly to your bank account!
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Platform Payout Day Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-black">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400">Platform Payout Day</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Admin processes verified cash payouts across the platform on{' '}
              <span className="font-semibold underline">
                {activeCampaigns.find(c => c.payout_day)?.payout_day || 'Every Friday'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div
          whileHover={{ y: -3 }}
          className={`p-6 rounded-3xl border relative overflow-hidden ${
            dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Accrued
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500">{formatMoney(totalEarned)}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Earned across all exam unlocks</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className={`p-6 rounded-3xl border relative overflow-hidden ${
            dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Paid Out
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500">{formatMoney(totalPaid)}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Successfully sent to your bank</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className={`p-6 rounded-3xl border relative overflow-hidden ${
            dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Pending Payout
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-500">{formatMoney(totalPending)}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Due on upcoming payout date</p>
        </motion.div>
      </div>

      {/* Bank Account Section */}
      <div className={`p-6 rounded-3xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Payout Bank Account</h3>
              {bankAccount ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {bankAccount.bank_name} &bull; <span className="font-mono">***{bankAccount.account_number.slice(-4)}</span> &bull; {bankAccount.account_name}
                </p>
              ) : (
                <p className="text-xs text-rose-500 font-medium">
                  No bank account setup yet. Add your details to receive cash payouts.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowBankForm(!showBankForm)}
            className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              showBankForm
                ? 'bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-gray-200'
                : 'bg-amber-500 text-black hover:bg-amber-600'
            }`}
          >
            {bankAccount ? (showBankForm ? 'Hide Form' : 'Update Bank Details') : 'Add Bank Account'}
            {showBankForm ? <ChevronUp className="w-4 h-4 ml-1.5" /> : <ChevronDown className="w-4 h-4 ml-1.5" />}
          </button>
        </div>

        {showBankForm && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
            <BankAccountForm
              existingAccount={bankAccount}
              onSaved={(acc) => {
                setBankAccount(acc);
                setShowBankForm(false);
              }}
              dark={dark}
            />
          </div>
        )}
      </div>

      {/* 1. Active Exam Referral Campaigns (Now Placed BEFORE General Platform Links) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <span>Active Exam Referral Campaigns</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
              {activeCampaigns.length} Available
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Share these links with friends. When they register and unlock the exam, you earn cash paid to your bank account!
          </p>
        </div>

        {activeCampaigns.length === 0 ? (
          <div className={`p-8 text-center rounded-3xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <p className="text-sm text-gray-500">No active exam referral campaigns at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeCampaigns.map((camp) => {
              const shareLink = `${origin}/register?ref=${encodeURIComponent(referralCode)}&exam=${camp.exam_id}`;
              const isCopied = copiedLink === `camp-${camp.id}`;

              return (
                <div
                  key={camp.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:shadow-md ${
                    dark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Exam Cash Reward
                      </span>
                      <span className="text-lg font-black text-amber-500">
                        {formatMoney(camp.cash_reward)}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base mb-1 text-gray-900 dark:text-white">
                      {camp.exam_title}
                    </h3>

                    {camp.payout_date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Payout Day: {camp.payout_day || 'Every Friday'}</span>
                      </p>
                    )}

                    {camp.payout_note && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                        &quot;{camp.payout_note}&quot;
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => copyToClipboard(shareLink, `camp-${camp.id}`)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center space-x-1.5 transition-all ${
                        isCopied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Referral Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Platform Referral Links (Now Placed AFTER Active Campaigns + Info Icon & Explanation) */}
      <div className={`p-6 rounded-3xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold">Your Platform Referral Links</h2>
              <button
                type="button"
                onClick={() => setShowPointsInfo(!showPointsInfo)}
                className="p-1 rounded-full text-amber-500 hover:bg-amber-500/10 transition-colors"
                title="Click for info about these links"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPointsInfo(!showPointsInfo)}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
            >
              <span>{showPointsInfo ? 'Hide explanation' : 'How do these links work?'}</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Share these links to invite students to register or explore courses on LightHub Academy.
          </p>
        </div>

        {/* Informative Note when info icon is toggled */}
        {showPointsInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-gray-700 dark:text-gray-300 space-y-1.5"
          >
            <div className="flex items-center space-x-2 font-bold text-amber-600 dark:text-amber-400">
              <Info className="w-4 h-4 shrink-0" />
              <span>Important: These Links Earn Points, NOT Cash Payouts</span>
            </div>
            <p>
              When friends sign up or purchase courses/study materials using these general links, you earn <strong>Platform Reward Points</strong> credited to your academy balance. Points can be spent to unlock premium courses, study notes, and materials for free.
            </p>
            <p className="font-medium text-amber-700 dark:text-amber-300">
              To earn <strong>Cash Prizes (₦)</strong> paid directly to your Nigerian bank account, share the links in the <strong>Active Exam Referral Campaigns</strong> section above!
            </p>
            {Number(pointsBalance) > 0 && (
              <div className="pt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Your Current Credit Balance: ₦{Number(pointsBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </motion.div>
        )}

        <div className="space-y-3">
          <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            dark ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                Registration Invite Link (Earns Points on Purchase)
              </span>
              <span className="block text-xs font-mono truncate text-gray-900 dark:text-gray-100">
                {generalRegisterLink}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(generalRegisterLink, 'general-reg')}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                copiedLink === 'general-reg'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-black shadow-sm'
              }`}
            >
              {copiedLink === 'general-reg' ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            dark ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                Marketplace Invite Link (Earns Points on Purchase)
              </span>
              <span className="block text-xs font-mono truncate text-gray-900 dark:text-gray-100">
                {generalMarketplaceLink}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(generalMarketplaceLink, 'general-market')}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                copiedLink === 'general-market'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-black shadow-sm'
              }`}
            >
              {copiedLink === 'general-market' ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
          Your unique referral code is <span className="font-mono font-bold text-amber-500">{referralCode}</span>
        </p>
      </div>

      {/* Referral Progress Table */}
      <div className={`p-6 rounded-3xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Referral Progress</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Track whether your referees have unlocked exams and earned you money
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
            {rewards.length} Referees
          </span>
        </div>

        {rewards.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No referral activity recorded yet. Share your links to start tracking!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Referee</th>
                  <th className="pb-3 px-4">Exam</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Reward Amount</th>
                  <th className="pb-3 pl-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {rewards.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pr-4 font-semibold text-gray-900 dark:text-white">
                      {r.referee_name || 'Anonymous Student'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">{r.exam_title || '—'}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-500">{formatMoney(r.amount)}</td>
                    <td className="py-3.5 pl-4 text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout History Table */}
      <div className={`p-6 rounded-3xl border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <History className="w-5 h-5 text-emerald-500" />
              <span>Payout History</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Record of manual cash transfers confirmed by the platform admin
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
            {payouts.length} Payments
          </span>
        </div>

        {payouts.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No payouts have been made yet. As your referees unlock exams, payments will appear here!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 px-4">Amount</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Transfer Reference</th>
                  <th className="pb-3 pl-4">Admin Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pr-4 text-gray-500">
                      {new Date(p.confirmed_at || p.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-500">{formatMoney(p.amount)}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Confirmed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-300">
                      {p.transaction_reference || 'N/A'}
                    </td>
                    <td className="py-3.5 pl-4 text-gray-500 italic max-w-xs truncate">
                      {p.admin_note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
