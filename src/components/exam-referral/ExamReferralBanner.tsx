import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X, Coins } from 'lucide-react';

interface ExamReferralBannerProps {
  campaigns: Array<{
    id: number;
    cash_reward: string | number;
    currency: string;
    exam_title?: string;
  }>;
  config: {
    banner_title?: string;
    banner_description?: string;
    banner_cta_text?: string;
    is_active?: boolean;
    show_dashboard_banner?: boolean;
  };
  onNavigate: () => void;
  dark?: boolean;
}

export const ExamReferralBanner: React.FC<ExamReferralBannerProps> = ({
  campaigns,
  config,
  onNavigate,
  dark = false,
}) => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const dismissedAt = localStorage.getItem('exam_referral_banner_dismissed');
      if (dismissedAt) {
        const diff = Date.now() - parseInt(dismissedAt, 10);
        // Cooldown: 24 hours
        if (diff < 24 * 60 * 60 * 1000) {
          setDismissed(true);
          return;
        }
      }
      setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('exam_referral_banner_dismissed', Date.now().toString());
    } catch {
      // ignore localStorage errors
    }
  };

  if (dismissed || !config?.is_active || !config?.show_dashboard_banner || campaigns.length === 0) {
    return null;
  }

  // Find max reward available
  const maxReward = campaigns.reduce((max, c) => {
    const val = parseFloat(String(c.cash_reward || 0));
    return val > max ? val : max;
  }, 0);

  const formattedMax = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(maxReward);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl mb-6 shadow-md shadow-amber-500/10 border border-amber-500/20 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950"
      >
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/20 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-600/20 blur-xl pointer-events-none" />

        <div className="relative p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5 pr-8">
            <div className="p-3 rounded-xl bg-black/10 backdrop-blur-sm shrink-0 mt-0.5">
              <Coins className="w-6 h-6 text-slate-950 animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/10 text-slate-900 mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Cash Referral Promo</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-950 leading-snug">
                {config.banner_title || 'Earn Cash by Referring Friends!'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-900/80 mt-1 max-w-2xl">
                {config.banner_description ||
                  `Invite your friends to practice for CBT exams. When they unlock an exam, you get paid up to ${formattedMax} straight to your bank account!`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 w-full sm:w-auto justify-end">
            <div className="text-right hidden sm:block">
              <span className="block text-[11px] font-bold text-slate-900/70 uppercase tracking-wider">
                Earn Up To
              </span>
              <span className="text-xl font-black text-slate-950">{formattedMax}</span>
            </div>

            <button
              onClick={onNavigate}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-950 text-white hover:bg-slate-900 shadow-md transition-all active:scale-95 group"
            >
              <span>{config.banner_cta_text || 'Start Earning'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-950/60 hover:text-slate-950 hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
