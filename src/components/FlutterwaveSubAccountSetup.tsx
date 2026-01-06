import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { AlertCircle, CheckCircle, Loader2, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Bank {
  id: number
  code: string
  name: string
}

interface SubAccount {
  id: number
  bank_code: string
  account_number: string
  account_name: string
  subaccount_id: string
  is_active: boolean
  created_at: string
}

export default function FlutterwaveSubAccountSetup() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [subAccount, setSubAccount] = useState<SubAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    bank_code: '',
    account_number: '',
    account_name: '',
    business_email: ''
  })
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    loadBanksAndSubAccount()
  }, [])

  async function loadBanksAndSubAccount() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      // Load banks
      const banksRes = await axios.post(
        `${API_BASE}/payments/flutterwave/list-banks/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setBanks(banksRes.data.banks || [])

      // Load existing subaccount
      const subRes = await axios.get(
        `${API_BASE}/flutterwave-subaccounts/`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (subRes.data.results && subRes.data.results.length > 0) {
        setSubAccount(subRes.data.results[0])
      }
    } catch (err: any) {
      console.error('Failed to load banks/subaccount:', err)
      setError(err.response?.data?.detail || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('access')
      if (!token) return

      const res = await axios.post(
        `${API_BASE}/flutterwave-subaccounts/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSuccess('Flutterwave subaccount created successfully!')
      setFormData({ bank_code: '', account_number: '', account_name: '', business_email: '' })
      setSubAccount(res.data)
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      console.error('Failed to create subaccount:', err)
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to create subaccount')
    } finally {
      setSubmitting(false)
    }
  }

  async function verifyAccount() {
    if (!formData.bank_code || !formData.account_number) {
      setError('Please select a bank and enter an account number to verify')
      return
    }
    setVerifying(true)
    setError('')
    try {
      const token = localStorage.getItem('access')
      if (!token) return
      const res = await axios.post(
        `${API_BASE}/payments/flutterwave/verify-account/`,
        { account_number: formData.account_number, account_bank: formData.bank_code },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const verifiedName = res.data?.data?.account_name || res.data?.data?.accountHolderName || ''
      if (verifiedName) {
        setFormData({ ...formData, account_name: verifiedName })
        setSuccess(`Account verified: ${verifiedName}`)
        setTimeout(() => setSuccess(''), 4000)
      } else {
        setSuccess('Account verified')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: any) {
      console.error('Account verification failed:', err)
      setError(err.response?.data?.detail || err.response?.data?.error || 'Account verification failed')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-green-600" />
        <h2 className="text-lg font-bold text-gray-900">Flutterwave Subaccount</h2>
      </div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800">{success}</span>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </motion.div>
      )}

      {/* Existing Subaccount Info */}
      {subAccount && subAccount.is_active && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Active Subaccount</h3>
              <p className="text-sm text-blue-800">
                Bank: <span className="font-medium">{subAccount.account_name}</span>
              </p>
              <p className="text-sm text-blue-800">
                Account: <span className="font-medium">****{subAccount.account_number.slice(-4)}</span>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Created on {new Date(subAccount.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Form */}
      {!subAccount?.is_active && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bank <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.bank_code}
              onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Choose a bank...</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })}
              placeholder="Enter your account number"
              maxLength={20}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Typically 10 digits, but may vary by bank</p>
            <div className="mt-2">
              <button
                type="button"
                onClick={verifyAccount}
                disabled={verifying || !formData.bank_code || !formData.account_number}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (<><Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Verifying...</>) : 'Verify Account'}
              </button>
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              placeholder="Account holder name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Business Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.business_email}
              onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
              placeholder="business@example.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !formData.bank_code || !formData.account_number || !formData.account_name || !formData.business_email}
            className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Setting up...
              </>
            ) : (
              'Create Subaccount'
            )}
          </button>
        </form>
      )}
    </motion.div>
  )
}
