import React from 'react'
import { motion } from 'framer-motion'

interface PaymentMethodSelectorProps {
  selectedMethod: 'paystack' | 'flutterwave'
  onMethodChange: (method: 'paystack' | 'flutterwave') => void
  disabled?: boolean
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <label className="block text-sm font-semibold text-gray-900">
        Choose Payment Method <span className="text-red-500">*</span>
      </label>
      
      <div className="space-y-2">
        {/* Paystack Option */}
        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
          selectedMethod === 'paystack'
            ? 'border-yellow-500 bg-yellow-50'
            : 'border-gray-200 bg-white hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="radio"
            name="payment-method"
            value="paystack"
            checked={selectedMethod === 'paystack'}
            onChange={() => !disabled && onMethodChange('paystack')}
            disabled={disabled}
            className="w-4 h-4 text-green-600 cursor-pointer"
          />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">Paystack</p>
            <p className="text-xs text-gray-500">Fast and secure payment</p>
          </div>
        </label>

        {/* Flutterwave Option */}
        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
          selectedMethod === 'flutterwave'
            ? 'border-yellow-500 bg-yellow-50'
            : 'border-gray-200 bg-white hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="radio"
            name="payment-method"
            value="flutterwave"
            checked={selectedMethod === 'flutterwave'}
            onChange={() => !disabled && onMethodChange('flutterwave')}
            disabled={disabled}
            className="w-4 h-4 text-yellow-600 cursor-pointer"
          />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">Flutterwave</p>
            <p className="text-xs text-gray-500">Reliable and convenient</p>
          </div>
        </label>
      </div>
    </motion.div>
  )
}
