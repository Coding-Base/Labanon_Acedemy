import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8000/api'

interface ExchangeRateData {
  ngn_per_usd: number
  source: string
  updated_at: string | null
}

interface CurrencySelectorProps {
  /** The base price in NGN */
  baseAmountNGN: number
  /** Currently selected currency */
  selectedCurrency?: string
  /** Callback when currency changes: (currency, convertedAmount, rate) */
  onCurrencyChange: (currency: string, convertedAmount: number, rate: number) => void
  /** Compact mode for smaller layouts */
  compact?: boolean
  /** Disable the selector */
  disabled?: boolean
}

const STORAGE_KEY = 'preferred_currency'

export default function CurrencySelector({
  baseAmountNGN,
  selectedCurrency: externalCurrency,
  onCurrencyChange,
  compact = false,
  disabled = false,
}: CurrencySelectorProps) {
  const [currency, setCurrency] = useState<string>(
    externalCurrency || localStorage.getItem(STORAGE_KEY) || 'NGN'
  )
  const [rate, setRate] = useState<ExchangeRateData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // Sync with external currency prop
  useEffect(() => {
    if (externalCurrency && externalCurrency !== currency) {
      setCurrency(externalCurrency)
    }
  }, [externalCurrency])

  // Fetch exchange rate on mount
  useEffect(() => {
    let mounted = true
    const fetchRate = async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await axios.get(`${API_BASE}/payments/exchange-rate/`)
        if (mounted) {
          setRate(res.data)
        }
      } catch {
        if (mounted) {
          setError(true)
          // Fallback rate
          setRate({ ngn_per_usd: 1600, source: 'fallback', updated_at: null })
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchRate()
    return () => { mounted = false }
  }, [])

  // Notify parent when currency or rate changes
  useEffect(() => {
    if (!rate) return
    const ngnPerUsd = rate.ngn_per_usd || 1600
    if (currency === 'USD') {
      const usdAmount = Math.round((baseAmountNGN / ngnPerUsd) * 100) / 100
      onCurrencyChange('USD', usdAmount, ngnPerUsd)
    } else {
      onCurrencyChange('NGN', baseAmountNGN, ngnPerUsd)
    }
  }, [currency, rate, baseAmountNGN])

  const handleSelect = (cur: string) => {
    if (disabled || loading) return
    setCurrency(cur)
    localStorage.setItem(STORAGE_KEY, cur)
  }

  const ngnPerUsd = rate?.ngn_per_usd || 1600

  return (
    <div className={compact ? '' : 'mb-3'}>
      <label className={`block font-semibold text-gray-900 dark:text-gray-100 ${compact ? 'text-xs mb-1.5' : 'text-sm mb-2'}`}>
        Pay with
      </label>

      {/* Pill toggle */}
      <div className={`inline-flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {[
          { code: 'NGN', symbol: '₦', label: 'Naira' },
          { code: 'USD', symbol: '$', label: 'Dollar' },
        ].map((option) => {
          const isActive = currency === option.code
          return (
            <motion.button
              key={option.code}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(option.code)}
              className={`relative px-4 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="font-bold">{option.symbol}</span>
              <span>{option.code}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Rate info */}
      {rate && (
        <div className={`flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mt-1.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {loading ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : null}
          <span>
            Rate: $1 = ₦{ngnPerUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
          {rate.source === 'fallback' && (
            <span className="text-yellow-600 dark:text-yellow-500">(estimated)</span>
          )}
        </div>
      )}

      {error && !rate && (
        <p className="text-[10px] text-red-500 mt-1">Could not load exchange rate</p>
      )}
    </div>
  )
}
