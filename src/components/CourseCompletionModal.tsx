import React, { useState, useEffect } from 'react';
import { X, Download, Share2, CheckCircle, Loader2 } from 'lucide-react';
import {
  generateCertificate,
  downloadCertificate,
  shareToSocialMedia
} from '../utils/certificateGenerator';
import api from '../utils/axiosInterceptor';

// Helper to ensure URLs are absolute
const getAbsoluteUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  const cleanPath = url.replace(/^\/api/, '');
  const baseUrl = (import.meta.env as any).VITE_API_BASE?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

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
  
  // Store the course creator string and potential institution signature details
  const [courseCreator, setCourseCreator] = useState<string>('');
  // State now includes signature, logo, name, and position
  const [instSignature, setInstSignature] = useState<{
    url: string;
    logo_url?: string;
    name: string;
    position?: string;
  } | null>(null);

  // Fetch course details when modal opens to get the creator info
  useEffect(() => {
    if (isOpen && courseId) {
        api.get(`/courses/${courseId}/`)
            .then(async res => {
                const data = res.data;
                // Store the raw creator string. Generator handles parsing.
                setCourseCreator(data.creator || '');
                
                let institutionData = null;

                // 1. Try fetching via direct link (for new courses)
                if (data.institution) {
                    try {
                        const instRes = await api.get(`/institutions/${data.institution}/`);
                        institutionData = instRes.data;
                    } catch (e) { console.error("Failed to fetch institution by ID", e); }
                } 
                // 2. Fallback: Search via creator username (for legacy courses like ID 19)
                else if (data.creator_username) {
                    try {
                        const searchRes = await api.get(`/institutions/?search=${data.creator_username}`);
                        // Find the one owned by this creator
                        if (searchRes.data.results && searchRes.data.results.length > 0) {
                            const found = searchRes.data.results.find((i: any) => i.owner_username === data.creator_username);
                            if (found) institutionData = found;
                        }
                    } catch (e) { console.error("Failed to search institution", e); }
                }

                // 3. Set Signature State if data found (with absolute URLs)
                if (institutionData && institutionData.signature_image && institutionData.signer_name) {
                    setInstSignature({
                        url: getAbsoluteUrl(institutionData.signature_image) || institutionData.signature_image,
                        logo_url: getAbsoluteUrl(institutionData.logo_image),
                        name: institutionData.signer_name,
                        position: institutionData.signer_position
                    });
                }
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

      // 2b. Fetch current user's first/last name to prefer real name over username
      let userFirstName: string | undefined = undefined;
      let userLastName: string | undefined = undefined;
      try {
        const userRes = await api.get('/users/me/');
        const userData = userRes.data as any;
        userFirstName = userData.first_name || userData.firstName;
        userLastName = userData.last_name || userData.lastName;
      } catch (userErr) {
        console.warn('Could not fetch user profile for certificate names', userErr);
      }

      // 3. Generate PDF
      // Pass the fetched courseCreator and potential institution signature
      const certificateBlob = await generateCertificate({
        studentName: username,
        first_name: userFirstName,
        last_name: userLastName,
        username: username,
        courseTitle: courseName,
        completionDate: displayDate,
        certificateId: certData.certificate_id || 'PENDING',
        instructorName: courseCreator, // Generator checks for "(institution)" here
        verificationUrl: `https://lebanonacademy.ng/verify/${certData.certificate_id}`,
        institutionSignatureUrl: instSignature?.url,
        institutionLogoUrl: instSignature?.logo_url,
        institutionSignerName: instSignature?.name,
        institutionSignerPosition: instSignature?.position
      });

      // 4. Download — prefer first+last for filename when present
      const displayName = [userFirstName || '', userLastName || ''].filter(Boolean).join(' ') || username;
      downloadCertificate(certificateBlob, courseName, displayName);

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
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
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
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-yellow-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isGenerating ? 'Generating...' : 'Download Certificate'}
          </button>

          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="w-full px-6 py-3 bg-white border-2 border-yellow-600 text-green-600 rounded-lg font-semibold hover:bg-yellow-50 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Achievement
          </button>
        </div>
      </div>
    </div>
  );
}