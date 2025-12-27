import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import PaystackSubAccountForm from './PaystackSubAccountForm';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function InstitutionPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total_amount: 0,
    total_success: 0,
    total_pending: 0,
    total_failed: 0,
    success_count: 0,
    pending_count: 0,
    failed_count: 0
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [pageCount, setPageCount] = useState(1);

  // Load institution info
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [institutionLoading, setInstitutionLoading] = useState(true);

  useEffect(() => {
    const loadInstitution = async () => {
      try {
        const token = localStorage.getItem('access');
        
        // Get institution for current user
        try {
          const instRes = await axios.get(`${API_BASE}/institutions/my_institution/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setInstitutionId(instRes.data.id);
        } catch (instError: any) {
          // If endpoint returns 404, try to create an institution
          if (instError.response?.status === 404) {
            const userRes = await axios.get(`${API_BASE}/users/me/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const createRes = await axios.post(`${API_BASE}/institutions/`, 
              { name: `${userRes.data.username}'s Institution` },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setInstitutionId(createRes.data.id);
          } else {
            throw instError;
          }
        }
      } catch (err: any) {
        console.error('Failed to load institution:', err);
        setError('Institution account not set up. Please contact support.');
      } finally {
        setInstitutionLoading(false);
      }
    };
    loadInstitution();
  }, []);

  // Load payments and stats
  useEffect(() => {
    if (institutionId) {
      loadPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId, page]);

  async function loadPayments() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }
      
      // Fetch course payments for this institution
      let coursePaymentsRes: any = { data: { results: [], count: 0 } };
      try {
        coursePaymentsRes = await axios.get(`${API_BASE}/payments/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            page,
            page_size: pageSize,
            course__institution: institutionId
          }
        });
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          throw err; // Re-throw auth errors
        }
        // Otherwise silently fail for this endpoint
        console.warn('Failed to load course payments:', err);
      }

      // Fetch diploma payments for this institution
      let diplomaPaymentsRes: any = { data: { results: [], count: 0 } };
      try {
        diplomaPaymentsRes = await axios.get(`${API_BASE}/payments/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            page,
            page_size: pageSize,
            diploma__institution: institutionId
          }
        });
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          throw err; // Re-throw auth errors
        }
        // Otherwise silently fail for this endpoint
        console.warn('Failed to load diploma payments:', err);
      }

      // Combine both course and diploma payments
      const coursePayments = coursePaymentsRes.data.results || [];
      const diplomaPayments = diplomaPaymentsRes.data.results || [];
      const allPayments = [...coursePayments, ...diplomaPayments];

      setPayments(Array.isArray(allPayments) ? allPayments : []);
      const totalCount = (coursePaymentsRes.data.count || 0) + (diplomaPaymentsRes.data.count || 0);
      setPageCount(Math.ceil(totalCount / pageSize));

      // Calculate stats
      const successPayments = allPayments.filter((p: any) => p.status === 'success');
      const pendingPayments = allPayments.filter((p: any) => p.status === 'pending');
      const failedPayments = allPayments.filter((p: any) => p.status === 'failed');

      const totalAmount = allPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      const successAmount = successPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

      setStats({
        total_amount: totalAmount,
        total_success: successAmount,
        total_pending: pendingPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
        total_failed: failedPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
        success_count: successPayments.length,
        pending_count: pendingPayments.length,
        failed_count: failedPayments.length
      });
    } catch (err: any) {
      console.error('[InstitutionPayments] Failed to load payments:', err);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setError('Session expired. Please refresh or log in again.');
      } else {
        setError(err.response?.data?.detail || 'Failed to load payments');
      }
    } finally {
      setLoading(false);
    }
  }

  if (institutionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">Loading institution...</div>
      </div>
    );
  }

  const platformFee = +(stats.total_success * 0.05).toFixed(2);
  const institutionShare = +(stats.total_success - platformFee).toFixed(2);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment History & Earnings</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Amount */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">₦{stats.total_amount.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">From all course sales</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Successful Payments */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium">Successful Payments</div>
              <div className="text-3xl font-bold text-green-600 mt-2">₦{stats.total_success.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">{stats.success_count} transactions</div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Platform Fee */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium">Platform Fee (5%)</div>
              <div className="text-3xl font-bold text-red-600 mt-2">₦{platformFee.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">Your contribution</div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Your Earnings */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium">Your Earnings (95%)</div>
              <div className="text-3xl font-bold text-teal-600 mt-2">₦{institutionShare.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">Net earnings</div>
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="text-sm text-amber-700 font-medium">Pending Payments</div>
          <div className="text-2xl font-bold text-amber-900 mt-2">₦{stats.total_pending.toLocaleString()}</div>
          <div className="text-xs text-amber-600 mt-1">{stats.pending_count} transactions</div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-700 font-medium">Failed Payments</div>
          <div className="text-2xl font-bold text-red-900 mt-2">₦{stats.total_failed.toLocaleString()}</div>
          <div className="text-xs text-red-600 mt-1">{stats.failed_count} transactions</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-700 font-medium">Average Transaction</div>
          <div className="text-2xl font-bold text-blue-900 mt-2">
            ₦{payments.length > 0 ? (stats.total_amount / payments.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
          </div>
          <div className="text-xs text-blue-600 mt-1">{payments.length} transactions shown</div>
        </div>
      </div>

      {/* Sub-account / Settlement setup */}
      <div className="mb-8">
        <PaystackSubAccountForm />
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payment Transactions</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600">
            <div className="inline-block animate-spin mb-2">Loading payments...</div>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No payment transactions yet.</p>
            <p className="text-sm mt-2">Payments will appear here once students purchase your courses.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Course</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, idx) => (
                    <tr key={payment.id || idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.user?.name || payment.user?.username || payment.student_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {payment.course?.title || payment.diploma?.title || payment.course_name || payment.diploma_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₦{Number(payment.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'success' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString()} {new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{pageCount}</span>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pageCount}
                  onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
