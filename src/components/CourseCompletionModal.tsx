import React, { useState, useEffect } from 'react';
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
  
  // Store the course creator string (e.g. "OurSaviour (institution)")
  const [courseCreator, setCourseCreator] = useState<string>('');

  // Fetch course details when modal opens to get the creator info
  useEffect(() => {
    if (isOpen && courseId) {
        api.get(`/courses/${courseId}/`)
           .then(res => {
               // Store the raw creator string. Generator handles parsing.
               setCourseCreator(res.data.creator || '');
           })
           .catch(err => console.error("Failed to fetch course details for certificate", err));
    }
  }, [isOpen, courseId]);

  if (!isOpen) return null;

  const handleDownloadCertificate = async () => {
    setIsGenerating(true);
    setDownloadError(null);

    try {
      // 1. Create Record in Backend (Get ID)
      const todayISO = new Date().toISOString().split('T')[0];
      const response = await api.post('/certificates/create_certificate/', {
        course_id: courseId,
        completion_date: todayISO
      });

      const certData = response.data;

      // 2. Prepare Date String
      const displayDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      // 3. Generate PDF
      // Pass the fetched courseCreator to instructorName
      const certificateBlob = await generateCertificate({
        studentName: username,
        courseTitle: courseName,
        completionDate: displayDate,
        certificateId: certData.certificate_id || 'PENDING',
        instructorName: courseCreator, // Generator checks for "(institution)" here
        verificationUrl: `https://lebanonacademy.ng/verify/${certData.certificate_id}`
      });

      // 4. Download
      downloadCertificate(certificateBlob, courseName, username);

      if (onCertificateDownloaded) {
        onCertificateDownloaded(certData);
      }

    } catch (error: any) {
      console.error('Failed to process certificate:', error);
      setDownloadError('Failed to generate certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    shareToSocialMedia('native', courseName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">Congratulations!</h2>
        <p className="text-center text-gray-600 mb-2">You have successfully completed</p>
        <p className="text-center text-lg font-semibold text-green-600 mb-6">{courseName}</p>
        <p className="text-center text-gray-500 text-sm mb-8">Download your professional certificate.</p>

        {downloadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{downloadError}</p>
          </div>
        )}

        <div className="space-y-3 mb-4">
          <button
            onClick={handleDownloadCertificate}
            disabled={isGenerating}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isGenerating ? 'Generating...' : 'Download Certificate'}
          </button>

          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="w-full px-6 py-3 bg-white border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Achievement
          </button>
        </div>
      </div>
    </div>
  );
}