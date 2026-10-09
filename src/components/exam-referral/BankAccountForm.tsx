import React, { useState } from 'react';
import axios from 'axios';
import { Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BankAccount {
  id?: number;
  bank_name: string;
  bank_code?: string;
  account_number: string;
  account_name: string;
  is_verified?: boolean;
}

interface BankAccountFormProps {
  existingAccount: BankAccount | null;
  onSaved: (account: BankAccount) => void;
  dark?: boolean;
}

const COMMON_NIGERIAN_BANKS = [
  'Access Bank',
  'Access Bank (Diamond)',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Bank',
  'Jaiz Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Moniepoint MFB',
  'OPay (PayCom)',
  'Optimus Bank',
  'Palmpay',
  'Parallex Bank',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'SunTrust Bank',
  'TAJ Bank',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'Wema Bank / ALAT',
  'Zenith Bank',
];

export const BankAccountForm: React.FC<BankAccountFormProps> = ({
  existingAccount,
  onSaved,
  dark = false,
}) => {
  const [bankName, setBankName] = useState(existingAccount?.bank_name || '');
  const [customBank, setCustomBank] = useState('');
  const [accountNumber, setAccountNumber] = useState(existingAccount?.account_number || '');
  const [accountName, setAccountName] = useState(existingAccount?.account_name || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const resolvedBank = bankName === 'OTHER' ? customBank.trim() : bankName.trim();
    if (!resolvedBank) {
      setError('Please specify your bank name');
      return;
    }

    const cleanAccNumber = accountNumber.trim().replace(/\D/g, '');
    if (cleanAccNumber.length !== 10) {
      setError('Account number must be exactly 10 digits');
      return;
    }

    if (!accountName.trim()) {
      setError('Account name is required');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('access');
      const payload = {
        bank_name: resolvedBank,
        account_number: cleanAccNumber,
        account_name: accountName.trim(),
      };

      const method = existingAccount ? 'put' : 'post';
      const res = await axios[method](
        `${API_BASE}/courses/exam-referrals/bank-account/`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMsg('Bank account details saved successfully!');
      onSaved(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save bank details. Please check your inputs.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        dark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Bank Account Details</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Required for receiving your referral cash payouts
            </p>
          </div>
        </div>

        {existingAccount?.is_verified && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Verified
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            Bank Name
          </label>
          <select
            value={COMMON_NIGERIAN_BANKS.includes(bankName) ? bankName : (bankName ? 'OTHER' : '')}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'OTHER') {
                setBankName('OTHER');
              } else {
                setBankName(val);
                setCustomBank('');
              }
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              dark
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Select your bank</option>
            {COMMON_NIGERIAN_BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
            <option value="OTHER">Other Bank (specify)</option>
          </select>
        </div>

        {bankName === 'OTHER' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Specify Bank Name
            </label>
            <input
              type="text"
              value={customBank}
              onChange={(e) => setCustomBank(e.target.value)}
              placeholder="Enter bank name"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                dark
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Account Number (10 digits)
            </label>
            <input
              type="text"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="0123456789"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono ${
                dark
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. John Doe"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                dark
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-sm text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : existingAccount ? (
              'Update Bank Account'
            ) : (
              'Save Bank Account'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
