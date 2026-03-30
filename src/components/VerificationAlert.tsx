import React from 'react'
import { AlertCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface VerificationAlertProps {
  verificationStatus: 'pending' | 'approved' | 'rejected' | null
  dashboardType: 'tutor' | 'institution'
  rejectionReason?: string
}

export default function VerificationAlert({ verificationStatus, dashboardType, rejectionReason }: VerificationAlertProps) {
  const navigate = useNavigate()

  // Only show if not verified
  if (verificationStatus === 'approved') return null

  const handleNavigateToCompliance = () => {
    // Navigate to role-specific compliance route
    if (dashboardType === 'tutor') {
      navigate('/tutor/compliance')
    } else if (dashboardType === 'institution') {
      navigate('/institution/compliance')
    } else {
      // Fallback to absolute compliance if role unknown
      navigate('/compliance')
    }
  }

  return (
    <div className={`rounded-2xl border-2 p-6 shadow-lg transition-all ${
      verificationStatus === 'rejected'
        ? 'bg-red-50 border-red-200'
        : 'bg-yellow-50 border-yellow-300 sticky top-4 z-40'
    }`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {verificationStatus === 'rejected' ? (
            <AlertCircle className="w-6 h-6 text-red-600" />
          ) : (
            <Clock className="w-6 h-6 text-yellow-600 animate-pulse" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${
                verificationStatus === 'rejected' ? 'text-red-900' : 'text-yellow-900'
              }`}>
                {verificationStatus === 'rejected'
                  ? '⚠️ Verification Rejected'
                  : '📋 Account Not Yet Verified'}
              </h3>
              <p className={`text-sm mt-2 ${
                verificationStatus === 'rejected' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {verificationStatus === 'rejected'
                  ? rejectionReason || 'Your verification documents were rejected. Please review the feedback and resubmit.'
                  : `Complete your identity verification to unlock all features. Submit required documents now and get verified in 2-3 business days.`}
              </p>
              
              {verificationStatus === 'rejected' && (
                <div className="mt-3 p-3 bg-white rounded-lg border-l-4 border-red-500">
                  <p className="text-xs font-semibold text-gray-900">What to do next:</p>
                  <ul className="text-xs text-gray-700 mt-1 space-y-1">
                    <li>✓ Review the rejection feedback above</li>
                    <li>✓ Prepare the required documents</li>
                    <li>✓ Resubmit via the compliance form</li>
                  </ul>
                </div>
              )}

              {verificationStatus === 'pending' && (
                <div className="mt-3 p-3 bg-white rounded-lg border-l-4 border-yellow-500">
                  <p className="text-xs font-semibold text-gray-900">Required documents:</p>
                  <ul className="text-xs text-gray-700 mt-1 space-y-1">
                    <li>✓ Government-issued ID or Passport</li>
                    <li>✓ Business registration certificate</li>
                    <li>✓ Tax ID or business license</li>
                    <li>✓ Proof of business address</li>
                    {dashboardType === 'tutor' && <li>✓ Professional qualifications</li>}
                  </ul>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleNavigateToCompliance}
              className={`flex-shrink-0 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                verificationStatus === 'rejected'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {verificationStatus === 'rejected' ? 'Resubmit' : 'Start Verification'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
