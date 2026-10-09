import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Sparkles,
  ArrowRight,
  Banknote,
  X,
} from 'lucide-react';

const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:8000/api';

interface PromoConfig {
  show_homepage_banner?: boolean;
  show_dashboard_banner?: boolean;
  show_popup_modal?: boolean;
  banner_title?: string;
  banner_description?: string;
  banner_cta_text?: string;
  max_cash_reward?: string;
  active_campaigns_count?: number;
  featured_exam?: string;
  is_active?: boolean;
}

export const HomeReferralBanner: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PromoConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if dismissed in this browser session
    try {
      if (sessionStorage.getItem('lighthub_home_referral_banner_dismissed') === 'true') {
        setDismissed(true);
        setLoading(false);
        return;
      }
    } catch (_) {}

    const fetchConfig = async () => {
      try {
        const res = await axios.get(`${API_BASE}/courses/exam-referrals/promo-config/`);
        setConfig(res.data);
      } catch (err) {
        // Fallback default config if API call fails
        setConfig({
          is_active: true,
          show_homepage_banner: true,
          banner_title: 'Earn Cash by Referring Friends to CBT Exams',
          banner_description:
            'Share your referral link for any exam with a cash prize. When your friend unlocks the exam, you get paid real cash!',
          banner_cta_text: 'Start Earning',
          max_cash_reward: '1000.00',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('lighthub_home_referral_banner_dismissed', 'true');
    } catch (_) {}
  };

  const handleCtaClick = () => {
    const token = localStorage.getItem('access');
    if (token) {
      navigate('/student/exam-referrals');
    } else {
      navigate('/register');
    }
  };

  // If dismissed, loading, inactive, or homepage banner toggled off in admin dashboard
  if (loading || dismissed || !config || config.is_active === false || config.show_homepage_banner === false) {
    return null;
  }

  const formatReward = (val?: string) => {
    const num = parseFloat(val || '1000');
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(num || 1000);
  };

  const title = config.banner_title || 'Earn Cash by Referring Friends to CBT Exams';
  const description =
    config.banner_description ||
    'Share your referral link for any exam with a cash prize. When your friend unlocks the exam, you earn real money!';
  const ctaText = config.banner_cta_text || 'Start Earning';
  const maxReward = formatReward(config.max_cash_reward);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full mb-3 sm:mb-5 relative z-20"
        aria-label="Referral Program Announcement"
      >
        <div className="relative overflow-hidden rounded-2xl sm:rounded-full border transition-all duration-300 shadow-sm hover:shadow-md
          bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-amber-500/30 text-gray-900
          dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-zinc-900/90 dark:to-amber-950/80 dark:border-amber-500/35 dark:text-white
          backdrop-blur-md px-3.5 sm:px-5 py-2 sm:py-2.5"
        >
          {/* Subtle Ambient Decorative Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 dark:bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
            {/* Left: Badge + Title + Highlight */}
            <div className="flex items-center flex-wrap gap-2 text-left min-w-0 w-full sm:w-auto">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-wider uppercase shrink-0
                bg-amber-500 text-slate-950 dark:bg-amber-400 dark:text-slate-950 shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-slate-950 animate-pulse" />
                <span>Earn &amp; Refer</span>
              </span>

              <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate">
                {title}
              </span>

              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold shrink-0
                bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30"
              >
                <Banknote className="w-3 h-3 shrink-0" />
                <span>Up to {maxReward} / unlock</span>
              </span>

              <span className="hidden xl:inline text-xs text-gray-600 dark:text-zinc-300 truncate max-w-sm">
                • {description}
              </span>
            </div>

            {/* Right: CTA Action + Dismiss */}
            <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-black transition-all duration-200
                  bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950
                  dark:from-amber-400 dark:to-yellow-400 dark:hover:from-amber-300 dark:hover:to-yellow-300 dark:text-slate-950
                  shadow-sm hover:shadow active:scale-95"
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleDismiss}
                title="Dismiss"
                aria-label="Dismiss banner"
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HomeReferralBanner;
