/**
 * CourseCompletionModal.tsx
 * Modal displayed when user completes a course
 * Allows downloading certificate and sharing achievement
 */

import React, { useState } from 'react';
import { X, Download, Share2, CheckCircle, Loader2 } from 'lucide-react';
import {
  generateCertificate,
  downloadCertificate,
  shareToSocialMedia
} from '../utils/certificateGenerator';
import api from '../utils/axiosInterceptor';

interface CourseCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  username: string;
  courseId: number;
  onCertificateDownloaded?: (certificateData: any) => void;
}

export default function CourseCompletionModal({
  isOpen,
  onClose,
  courseName,
  username,
  courseId,
  onCertificateDownloaded
}: CourseCompletionModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadCertificate = async () => {
    setIsGenerating(true);
    setDownloadError(null);

    try {
      // Generate the certificate
      const completionDate = new Date();
      const certificateBlob = await generateCertificate({
        courseName,
        username,
        completionDate,
        courseId
      });

      // Download the certificate
      await downloadCertificate(certificateBlob, courseName, username);

      // ALWAYS save certificate record to backend
      try {
        const response = await api.post('/certificates/create_certificate/', {
          course_id: courseId,
          completion_date: completionDate.toISOString().split('T')[0]
        });

        console.log('Certificate saved:', response.data);
        
        // Call callback if provided
        if (onCertificateDownloaded && (response.status === 201 || response.status === 200)) {
          onCertificateDownloaded(response.data);
        }
      } catch (err: any) {
        console.error('Failed to save certificate record:', err);
        setDownloadError('Certificate downloaded but failed to save to your account. Please refresh the page.');
      }
    } catch (error: any) {
      console.error('Failed to generate certificate:', error);
      setDownloadError(error.message || 'Failed to generate certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    shareToSocialMedia(courseName, username);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Congratulations Text */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
          Congratulations!
        </h2>

        <p className="text-center text-gray-600 mb-2">
          You have successfully completed
        </p>

        <p className="text-center text-lg font-semibold text-green-600 mb-6">
          {courseName}
        </p>

        <p className="text-center text-gray-500 text-sm mb-8">
          Download your certificate and share your achievement with friends on social media.
        </p>

        {/* Error message if any */}
        {downloadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{downloadError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-4">
          {/* Download Certificate Button */}
          <button
            onClick={handleDownloadCertificate}
            disabled={isGenerating}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Certificate
              </>
            )}
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="w-full px-6 py-3 bg-white border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="w-5 h-5" />
            Share Achievement
          </button>
        </div>

        {/* Close button alternative */}
        <button
          onClick={onClose}
          className="w-full px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
        >
          Close
        </button>

        {/* Certificate Preview Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            ℹ️ Your certificate will be professionally designed with your name, course title, completion date, and Lebanon Academy signature.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to generate unique certificate ID
 */
function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}-${random}`;
}
