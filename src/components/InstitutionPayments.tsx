// src/components/InstitutionPayments.tsx
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
// 1. Use the secure API instance
import api from '../utils/axiosInterceptor';
import PaystackSubAccountForm from './PaystackSubAccountForm';

export default function InstitutionPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Stats State
  const [stats, setStats] = useState({
    total_gross: 0,      // Total amount paid by students
    total_earnings: 0,   // Total creator_amount (Your Share)
    total_fees: 0,       // Total platform_fee
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
        // Get institution for current user
        try {
          const instRes = await api.get('/institutions/my_institution/');
          setInstitutionId(instRes.data.id);
        } catch (instError: any) {
          // If endpoint returns 404, try to create an institution
          if (instError.response?.status === 404) {
            const userRes = await api.get('/users/me/');
            const createRes = await api.post('/institutions/', { 
              name: `${userRes.data.username}'s Institution` 
            });
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
      // 1. Fetch Course Payments
      const courseReq = api.get('/payments/', {
        params: { 
          page,
          page_size: pageSize,
          course__institution: institutionId
        }
      });

      // 2. Fetch Diploma Payments
      const diplomaReq = api.get('/payments/', {
        params: { 
          page,
          page_size: pageSize,
          diploma__institution: institutionId
        }
      });

      // Execute both
      const [courseRes, diplomaRes] = await Promise.all([
        courseReq.catch(() => ({ data: { results: [], count: 0 } })),
        diplomaReq.catch(() => ({ data: { results: [], count: 0 } }))
      ]);

      const courseResults = courseRes.data.results || [];
      const diplomaResults = diplomaRes.data.results || [];

      // 3. Deduplicate Transactions
      // We use a Map keyed by ID to ensure no duplicate transactions appear in the table
      const uniquePaymentsMap = new Map();
      
      [...courseResults, ...diplomaResults].forEach(p => {
        uniquePaymentsMap.set(p.id, p);
      });

      // Convert back to array & Sort by date desc
      const allPayments = Array.from(uniquePaymentsMap.values()).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPayments(allPayments);

      // Total count logic (approximation since we are merging two paginated lists)
      // Ideally, the backend should provide a single endpoint for 'all institution payments'
      const totalCount = (courseRes.data.count || 0) + (diplomaRes.data.count || 0);
      setPageCount(Math.ceil(totalCount / pageSize) || 1);

      // 4. Calculate Stats based on the fetched batch
      // (Note: For true global totals, the backend should provide a /stats endpoint. 
      // These totals currently reflect the fetched page/batch mostly, unless we fetch all.
      // Assuming for now we calculate based on what we see or what is loaded.)
      
      let gross = 0;
      let earnings = 0;
      let fees = 0;
      let sCount = 0;
      let pCount = 0;
      let fCount = 0;

      allPayments.forEach((p: any) => {
        const amount = parseFloat(p.amount || '0');
        const creatorAmt = parseFloat(p.creator_amount || '0');
        const fee = parseFloat(p.platform_fee || '0');

        if (p.status === 'success') {
          gross += amount;
          earnings += creatorAmt;
          fees += fee;
          sCount++;
        } else if (p.status === 'pending') {
          pCount++;
        } else if (p.status === 'failed') {
          fCount++;
        }
      });

      setStats({
        total_gross: gross,
        total_earnings: earnings,
        total_fees: fees,
        success_count: sCount,
        pending_count: pCount,
        failed_count: fCount
      });

    } catch (err: any) {
      console.error('[InstitutionPayments] Failed to load payments:', err);
      setError('Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  }

  if (institutionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

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
        
        {/* Card 1: Your Earnings (Total Creator Amount) */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-teal-500">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium">Your Earnings</div>
              <div className="text-3xl font-bold text-teal-600 mt-2">₦{stats.total_earnings.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">Net income (95%)</div>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        {/* Card 2: Successful Payments (Total Gross) */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium">Successful Payments</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">₦{stats.total_gross.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">{stats.success_count} successful transactions</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Card 3: Total Revenue (Same as Earnings per your request) */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">₦{stats.total_earnings.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">Available for withdrawal</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Card 4: Platform Fees */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-600 font-medium">Platform Fees</div>
              <div className="text-3xl font-bold text-red-600 mt-2">₦{stats.total_fees.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">5% Service charge</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="text-sm text-amber-700 font-medium">Pending</div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{stats.pending_count}</div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-700 font-medium">Failed</div>
          <div className="text-2xl font-bold text-red-900 mt-1">{stats.failed_count}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-700 font-medium">Avg. Ticket Size</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            ₦{stats.success_count > 0 ? (stats.total_gross / stats.success_count).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
          </div>
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
          <div className="p-12 text-center text-gray-600">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-green-600" />
            <p>Loading transactions...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">No payment transactions found.</p>
            <p className="text-sm mt-1">Sales from your courses and diplomas will appear here.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Your Earnings</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment, idx) => (
                    // Use composite key or payment ID to ensure React doesn't complain
                    <tr key={`${payment.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {payment.user?.name || payment.user?.username || `User #${payment.user}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="max-w-xs truncate" title={payment.course_title || payment.diploma_title}>
                          {payment.course_title || payment.diploma_title || 'Unknown Item'}
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                          {payment.kind ? payment.kind.toUpperCase() : 'COURSE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ₦{Number(payment.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-teal-600">
                        ₦{Number(payment.creator_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${payment.status === 'success' ? 'bg-green-100 text-green-800' : 
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {payment.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-400">
                          {new Date(payment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{pageCount}</span>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition font-medium text-sm shadow-sm"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pageCount}
                  onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition font-medium text-sm shadow-sm"
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