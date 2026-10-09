import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';

interface ExamReferralPromoModalProps {
  campaigns: Array<{
    id: number;
    cash_reward: string | number;
    currency: string;
    exam_title?: string;
  }>;
  config: {
    is_active?: boolean;
    show_popup_modal?: boolean;
    popup_frequency_hours?: number;
    banner_title?: string;
    banner_description?: string;
    banner_cta_text?: string;
  };
  onNavigate: () => void;
  dark?: boolean;
}

export const ExamReferralPromoModal: React.FC<ExamReferralPromoModalProps> = ({
  campaigns,
  config,
  onNavigate,
  dark = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!config?.is_active || !config?.show_popup_modal || campaigns.length === 0) {
      return;
    }

    try {
      const lastShown = localStorage.getItem('exam_referral_modal_last_shown');
      const cooldownHours = config.popup_frequency_hours || 24;
      const cooldownMs = cooldownHours * 60 * 60 * 1000;

      if (lastShown) {
        const diff = Date.now() - parseInt(lastShown, 10);
        if (diff < cooldownMs) {
          return;
        }
      }

      // Small delay so dashboard loads smoothly before popping up
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('exam_referral_modal_last_shown', Date.now().toString());
      }, 1500);

      return () => clearTimeout(timer);
    } catch {
      // ignore localStorage errors
    }
  }, [config, campaigns]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCTA = () => {
    setIsOpen(false);
    onNavigate();
  };

  if (!isOpen) return null;

  const topCampaign = [...campaigns].sort(
    (a, b) => parseFloat(String(b.cash_reward || 0)) - parseFloat(String(a.cash_reward || 0))
  )[0];

  const maxReward = topCampaign ? parseFloat(String(topCampaign.cash_reward || 0)) : 0;
  const formattedReward = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(maxReward);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl z-10 ${
            dark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-amber-500 to-yellow-400 p-6 text-slate-950">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-slate-950 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/15 text-slate-950 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Special Offer</span>
            </div>

            <div className="flex items-center space-x-3 mb-1">
              <div className="p-3 rounded-2xl bg-black/10">
                <Gift className="w-8 h-8 text-slate-950" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900/80 uppercase tracking-wider">
                  Earn Real Cash
                </span>
                <h2 className="text-2xl font-black text-slate-950 leading-tight">
                  Up to {formattedReward} per friend
                </h2>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Did you know you can earn cash by introducing students to our CBT practice portal?
              Whenever someone joins using your link and unlocks an exam, the reward is yours!
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center space-x-2.5 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Direct payout to your Nigerian bank account</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Track your referrals & payout progress in real time</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                </div>
                <span>Easy link sharing via WhatsApp, Facebook, or SMS</span>
              </div>
            </div>

            {topCampaign?.exam_title && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                dark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <span className="text-gray-400 block text-[11px]">Featured Campaign:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{topCampaign.exam_title}</span>
                </div>
                <span className="font-bold text-amber-500 text-sm">
                  {formattedReward} Reward
                </span>
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleClose}
                className={`w-1/3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  dark
                    ? 'bg-slate-800 hover:bg-slate-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Maybe Later
              </button>
              <button
                onClick={handleCTA}
                className="w-2/3 inline-flex items-center justify-center py-2.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <span>Start Earning Now</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
