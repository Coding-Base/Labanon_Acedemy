import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { resendVerificationEmail } from '../api/auth';
import labanonLogo from './labanonlogo.png';

export default function VerifyEmailSent() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';
  const role = location.state?.role || 'student';
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage(null);
    try {
      const response = await resendVerificationEmail(email);
      setResendMessage({ 
        type: 'success', 
        text: response?.detail || 'Verification email has been resent successfully! Please check your inbox and spam folder.' 
      });
    } catch (err: any) {
      // Extract error message from multiple possible locations
      let errorMessage = 'Failed to resend verification email. Please try again.';
      
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.response?.data?.email && Array.isArray(err.response.data.email)) {
        errorMessage = err.response.data.email[0];
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setResendMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-brand-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <img src={labanonLogo} alt="LightHub Academy logo" width={40} height={40} className="w-10 h-10 object-contain" />
            <div className="text-left">
              <h1 className="text-xl font-bold text-gray-900">
                LightHub Academy
              </h1>
              <p className="text-xs text-gray-500">Future Ready Learning</p>
            </div>
          </Link>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-400 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            Verify Your Email
          </motion.h2>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6"
          >
            We've sent a confirmation email to <strong>{email}</strong>. Click the link in the email to verify your account and get started.
          </motion.p>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4 mb-8 text-left"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Check Your Inbox</p>
                <p className="text-sm text-gray-600">Look for an email from LightHub Academy</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Click the Verification Link</p>
                <p className="text-sm text-gray-600">Open the link to confirm your email address</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Account Activated</p>
                <p className="text-sm text-gray-600">You'll be able to log in to your account</p>
              </div>
            </div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left"
          >
            <p className="text-sm text-blue-900">
              <strong>Didn't receive the email?</strong> Check your spam folder or click the button below to resend it.
            </p>
          </motion.div>

          {/* Resend Message */}
          {resendMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg mb-6 flex gap-3 items-start ${
                resendMessage.type === 'success' 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {resendMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  resendMessage.type === 'success' 
                    ? 'text-green-900'
                    : 'text-red-900'
                }`}>
                  {resendMessage.type === 'success' ? 'Email Sent!' : 'Unable to Resend Email'}
                </p>
                <p className={`text-sm mt-1 ${
                  resendMessage.type === 'success' 
                    ? 'text-green-700'
                    : 'text-red-700'
                }`}>
                  {resendMessage.text}
                </p>
              </div>
            </motion.div>
          )}

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full py-3 border-2 border-brand-600 text-brand-600 rounded-xl font-semibold hover:bg-brand-50 transition disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>

            <Link
              to="/login"
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-gray-500 mt-6"
          >
            Email verification link expires in 48 hours
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
