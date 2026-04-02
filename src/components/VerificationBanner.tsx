import React from 'react'
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react'

interface VerificationBannerProps {
  isVerified: boolean
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'not_applicable'
  reason?: string
  onDismiss?: () => void
}

/**
 * Component to display verification status banner when user's account is not verified
 * Shows different messages and icons based on verification status
 */
export function VerificationBanner({
  isVerified,
  verificationStatus,
  reason,
  onDismiss
}: VerificationBannerProps) {
  // Don't show banner if verified or not applicable
  if (isVerified || verificationStatus === 'not_applicable') {
    return null
  }

  const iconMap = {
    pending: <Clock className="w-5 h-5 text-yellow-600" />,
    rejected: <XCircle className="w-5 h-5 text-red-600" />,
    approved: <CheckCircle className="w-5 h-5 text-green-600" />,
    not_applicable: <CheckCircle className="w-5 h-5 text-green-600" />
  }

  const bgMap = {
    pending: 'bg-yellow-50 border-yellow-200',
    rejected: 'bg-red-50 border-red-200',
    approved: 'bg-green-50 border-green-200',
    not_applicable: 'bg-green-50 border-green-200'
  }

  const titleMap = {
    pending: 'Account Pending Verification',
    rejected: 'Account Verification Rejected',
    approved: 'Account Verified',
    not_applicable: 'Account Verified'
  }

  const defaultReasonMap = {
    pending: 'Your account is pending verification. You can save courses as drafts, but cannot publish until your account is verified by the master admin.',
    rejected: 'Your account verification was rejected. Please review the feedback and resubmit your documents.',
    approved: 'Your account is verified. You can now publish courses.',
    not_applicable: ''
  }

  return (
    <div className={`border rounded-lg p-4 mb-6 flex items-start gap-3 ${bgMap[verificationStatus]}`}>
      <div className="flex-shrink-0 mt-0.5">
        {iconMap[verificationStatus]}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">
          {titleMap[verificationStatus]}
        </h3>
        <p className="text-sm text-gray-700 mt-1">
          {reason || defaultReasonMap[verificationStatus]}
        </p>
        {verificationStatus === 'pending' && (
          <a 
            href="/dashboard/compliance" 
            className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-2 inline-block"
          >
            Go to Compliance Dashboard →
          </a>
        )}
        {verificationStatus === 'rejected' && (
          <a 
            href="/dashboard/compliance" 
            className="text-sm font-medium text-red-600 hover:text-red-700 mt-2 inline-block"
          >
            Resubmit Documents →
          </a>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
          aria-label="Dismiss notification"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
