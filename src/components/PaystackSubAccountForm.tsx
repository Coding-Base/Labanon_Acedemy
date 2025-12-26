import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { AlertCircle, CheckCircle, Loader2, Save } from 'lucide-react'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface Bank {
  id: number
  code: string
  name: string
}

interface SubAccountData {
  id?: number
  bank_code: string
  account_number: string
  account_name: string
  subaccount_code?: string
  is_active?: boolean
}

export default function PaystackSubAccountForm() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasSubAccount, setHasSubAccount] = useState(false)
  const [subAccountData, setSubAccountData] = useState<SubAccountData | null>(null)

  const [formData, setFormData] = useState({
    bank_code: '',
    account_number: '',
    account_name: '',
  })

  useEffect(() => {
    loadBanks()
    checkSubAccount()
  }, [])

  const loadBanks = async () => {
    try {
      setLoading(true)
      // For now, use a static list of Nigerian banks
      // In production, fetch from Paystack API
      const nigerianBanks = [
        { id: 1, code: '011', name: 'First Bank Nigeria' },
        { id: 2, code: '003', name: 'Guaranty Trust Bank (GTB)' },
        { id: 3, code: '044', name: 'Access Bank' },
        { id: 4, code: '101', name: 'Zenith Bank' },
        { id: 5, code: '050', name: 'EcoBank' },
        { id: 6, code: '007', name: 'Stanbic IBTC' },
        { id: 7, code: '020', name: 'FCMB Group' },
        { id: 8, code: '058', name: 'GTBank Plc' },
        { id: 9, code: '057', name: 'Guarantee Trust Bank' },
        { id: 10, code: '014', name: 'UBA' },
      ]
      setBanks(nigerianBanks)
    } catch (err) {
      console.error('Failed to load banks:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkSubAccount = async () => {
    try {
      const token = localStorage.getItem('access')
      if (!token) return

      const res = await axios.get(`${API_BASE}/subaccounts/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (res.data) {
        setHasSubAccount(true)
        setSubAccountData(res.data)
        setFormData({
          bank_code: res.data.bank_code,
          account_number: res.data.account_number,
          account_name: res.data.account_name,
        })
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Error checking sub-account:', err)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.bank_code || !formData.account_number || !formData.account_name) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('access')

      const res = await axios.post(
        `${API_BASE}/subaccounts/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setSuccess('Sub-account created successfully! You can now receive payments.')
      setHasSubAccount(true)
      setSubAccountData(res.data)
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to create sub-account'
      setError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Settlement Account</h3>
        <p className="text-gray-600">Add your bank details to receive payments from course and diploma sales</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {hasSubAccount && subAccountData ? (
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-4">Active Sub-Account</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Name</p>
              <p className="font-medium text-gray-900">{subAccountData.account_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Number</p>
              <p className="font-medium text-gray-900">{subAccountData.account_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Bank</p>
              <p className="font-medium text-gray-900">{subAccountData.bank_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {subAccountData.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          {subAccountData.subaccount_code && (
            <div className="mt-4 p-3 bg-white rounded border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Paystack Sub-account Code</p>
              <p className="font-mono text-sm text-gray-900 break-all">{subAccountData.subaccount_code}</p>
            </div>
          )}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bank *</label>
          <select
            name="bank_code"
            value={formData.bank_code}
            onChange={handleChange}
            disabled={submitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select your bank...</option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name} ({bank.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
          <input
            type="text"
            name="account_number"
            value={formData.account_number}
            onChange={handleChange}
            disabled={submitting}
            placeholder="e.g., 0123456789"
            maxLength={20}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">10-digit account number</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Name *</label>
          <input
            type="text"
            name="account_name"
            value={formData.account_name}
            onChange={handleChange}
            disabled={submitting}
            placeholder="As shown on your bank account"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Your name as registered with the bank</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your bank details will be used to create a Paystack sub-account. You'll automatically receive 95% of all course and diploma sales, with 5% going to the platform.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {hasSubAccount ? 'Update Sub-Account' : 'Create Sub-Account'}
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">How it works:</h4>
        <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
          <li>Student purchases your course/diploma through Paystack</li>
          <li>Payment is verified and split: 95% to you, 5% to platform</li>
          <li>Your 95% is automatically transferred to your sub-account</li>
          <li>You can withdraw from your sub-account anytime</li>
        </ol>
      </div>
    </motion.div>
  )
}
