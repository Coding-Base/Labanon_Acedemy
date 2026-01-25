// src/components/PaymentHistory.tsx
import React, { useState, useEffect } from 'react'
import { Loader2, AlertCircle, DollarSign, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
// 1. Use Secure API
import api from '../utils/axiosInterceptor'

interface Transaction {
  id: number
  amount: number | string
  platform_fee: number | string
  creator_amount: number | string
  gateway?: string
  reference?: string
  merchant_fee?: number | string
  gateway_fee?: number | string
  status: 'pending' | 'success' | 'failed'
  kind: 'course' | 'diploma' | 'unlock'
  course_title?: string
  diploma_title?: string
  created_at: string
  verified_at?: string
}

interface PaymentHistoryProps {
  userRole?: 'student' | 'tutor' | 'institution' | 'master_admin'
}

export default function PaymentHistory({ userRole = 'student' }: PaymentHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalEarned, setTotalEarned] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null })

  useEffect(() => {
    loadTransactions(1)
    return () => {}
  }, [])

  const loadTransactions = async (page: number = 1) => {
    try {
      setLoading(true)
      // Token is handled automatically by api instance
      let res
      
      if (userRole === 'tutor') {
        // For tutors, fetch payments for courses they created
        const me = await api.get('/users/me/')
        const uid = me.data.id
        res = await api.get('/payments/', {
            params: { tutor: uid, page: page, page_size: 10 }
        })
      } else {
        res = await api.get('/payments/', {
            params: { page: page, page_size: 10 }
        })
      }

      const trans = res.data.results || []
      setTransactions(trans)
      setCurrentPage(page)
      setPageInfo({
        count: res.data.count || 0,
        next: res.data.next || null,
        previous: res.data.previous || null
      })

      // Calculate totals
      let spent = 0
      let earned = 0

      trans.forEach((t: Transaction) => {
        // Safety parsing
        const amount = parseFloat(t.amount?.toString() || '0')
        const creatorAmt = parseFloat(t.creator_amount?.toString() || '0')

        if (userRole === 'student' && t.status === 'success') {
          spent += amount
        } else if (['tutor', 'institution', 'master_admin'].includes(userRole) && t.status === 'success') {
          earned += creatorAmt
        }
      })

      setTotalSpent(spent)
      setTotalEarned(earned)
    } catch (err: any) {
      console.error('Failed to load transactions:', err)
      setError('Failed to load payment history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-yellow-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      success: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      failed: { bg: 'bg-red-100', text: 'text-red-800' },
    }
    const badge = badges[status] || badges.pending
    return badge
  }

  const getItemTitle = (transaction: Transaction) => {
    if (transaction.kind === 'course' && transaction.course_title) {
      return transaction.course_title
    } else if (transaction.kind === 'diploma' && transaction.diploma_title) {
      return transaction.diploma_title
    } else if (transaction.kind === 'unlock') {
      return 'Account Activation'
    }
    return transaction.kind ? transaction.kind.charAt(0).toUpperCase() + transaction.kind.slice(1) : 'Payment'
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userRole === 'student' && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <p className="text-sm text-blue-700 font-medium">Total Spent</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">₦{totalSpent.toLocaleString()}</p>
          </div>
        )}

        {['tutor', 'institution', 'master_admin'].includes(userRole) && (
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-yellow-600" />
              <p className="text-sm text-yellow-700 font-medium">Total Earnings (95%)</p>
            </div>
            <p className="text-3xl font-bold text-yellow-900">₦{totalEarned.toLocaleString()}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Transactions - Desktop Table & Mobile Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Payment History</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadTransactions}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            title="Refresh payment data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {transactions.length === 0 ? (
          <div className="px-4 sm:px-6 py-12 text-center">
            <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <>
            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Gateway</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reference</th>
                    
                    {['tutor', 'institution', 'master_admin'].includes(userRole) && (
                      <>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Your Share (95%)</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Platform Fee (5%)</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Gateway Fee</th>
                      </>
                    )}
                    
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1 text-sm">{getItemTitle(transaction)}</p>
                          <p className="text-xs text-gray-500 capitalize mt-1">{transaction.kind}</p>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                        {transaction.gateway || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <p className="font-semibold text-gray-900 text-sm">₦{parseFloat(transaction.amount.toString()).toLocaleString()}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                        <span className="line-clamp-1">{transaction.reference || '—'}</span>
                      </td>
                      
                      {['tutor', 'institution', 'master_admin'].includes(userRole) && (
                        <>
                          <td className="px-4 sm:px-6 py-4">
                            <p className="font-semibold text-yellow-600 text-sm">
                              ₦{parseFloat(transaction.creator_amount?.toString() || '0').toLocaleString()}
                            </p>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <p className="text-sm text-gray-600">
                              ₦{parseFloat(transaction.platform_fee?.toString() || '0').toLocaleString()}
                            </p>
                          </td>
                          <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                            <p className="text-sm text-gray-600">
                              ₦{parseFloat((transaction.gateway_fee ?? 0).toString()).toLocaleString()}
                            </p>
                          </td>
                        </>
                      )}

                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(transaction.status).bg} ${getStatusBadge(transaction.status).text}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden space-y-3 p-4 sm:p-6">
              {transactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors bg-gray-50"
                >
                  <div className="space-y-3">
                    {/* Item Title */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Item</p>
                      <p className="font-semibold text-gray-900 text-sm">{getItemTitle(transaction)}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{transaction.kind}</p>
                    </div>

                    {/* Amount Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Amount</p>
                        <p className="font-semibold text-gray-900 text-sm">₦{parseFloat(transaction.amount.toString()).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getStatusIcon(transaction.status)}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusBadge(transaction.status).bg} ${getStatusBadge(transaction.status).text}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gateway & Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Gateway</p>
                        <p className="text-sm text-gray-700">{transaction.gateway || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
                        <p className="text-sm text-gray-700">{new Date(transaction.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Reference */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Reference</p>
                      <p className="text-xs text-gray-700 font-mono break-all">{transaction.reference || '—'}</p>
                    </div>

                    {/* Tutor/Institution Breakdown */}
                    {['tutor', 'institution', 'master_admin'].includes(userRole) && (
                      <div className="pt-3 border-t border-gray-300 space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Your Share (95%)</p>
                            <p className="font-semibold text-yellow-600 text-sm">
                              ₦{parseFloat(transaction.creator_amount?.toString() || '0').toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Platform Fee (5%)</p>
                            <p className="text-sm text-gray-600">
                              ₦{parseFloat(transaction.platform_fee?.toString() || '0').toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Gateway Fee</p>
                          <p className="text-sm text-gray-600">
                            ₦{parseFloat((transaction.gateway_fee ?? 0).toString()).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 bg-white rounded-xl">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            Showing page {currentPage} of {Math.ceil(pageInfo.count / 10)} ({pageInfo.count?.toLocaleString() || '0'} total)
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => loadTransactions(currentPage - 1)}
              disabled={!pageInfo.previous || loading}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
            >
              ← Previous
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => loadTransactions(currentPage + 1)}
              disabled={!pageInfo.next || loading}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-yellow-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-700 transition-colors"
            >
              Next →
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  )
}