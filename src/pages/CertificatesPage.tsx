import React, { useEffect, useState } from 'react';
import { Award, Download, Loader2, FileCheck } from 'lucide-react';
import api from '../utils/axiosInterceptor';
import { downloadCertificate, generateCertificate } from '../utils/certificateGenerator';

// Interface matching your API response
interface Certificate {
  id: number;
  user_id: number;
  username: string;
  course: number; // This is the Course ID
  course_title: string;
  certificate_id: string;
  issue_date: string;
  completion_date: string;
  is_downloaded: boolean;
  download_count: number;
  last_downloaded_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Certificate[];
}

// Helper to ensure URLs are absolute
const getAbsoluteUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  // Remove /api prefix if it exists in the URL to avoid double api/api
  const cleanPath = url.replace(/^\/api/, '');
  const baseUrl = (import.meta.env as any).VITE_API_BASE?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reprintingId, setReprintingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, [currentPage, pageSize]);

  const fetchCertificates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<PaginatedResponse>('/certificates/', {
        params: { page: currentPage, page_size: pageSize }
      });
      setCertificates(response.data.results);
      setTotalPages(Math.ceil(response.data.count / pageSize));
    } catch (err: any) {
      console.error('Failed to fetch certificates:', err);
      setError('Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  const handleReprint = async (cert: Certificate) => {
    setReprintingId(cert.id);
    try {
      // 1. Fetch Course Details
      const courseRes = await api.get(`/courses/${cert.course}/`);
      const courseData = courseRes.data;
      const creatorString = courseData.creator || ""; 
      const creatorUsername = courseData.creator_username;

      let instSignerName = undefined;
      let instSignerPosition = undefined; // <--- New Variable
      let instSignatureUrl = undefined;

      // 2. Logic to find Institution Signature
      try {
        let institutionData = null;

        // Path A: Course is directly linked to an institution (Ideal)
        if (courseData.institution) {
            const instRes = await api.get(`/institutions/${courseData.institution}/`);
            institutionData = instRes.data;
        } 
        // Path B: Fallback - Search for institution by creator username
        // This fixes legacy courses that have "institution": null
        else if (creatorUsername) {
            const searchRes = await api.get(`/institutions/?search=${creatorUsername}`);
            // Find the one owned by this creator
            if (searchRes.data.results && searchRes.data.results.length > 0) {
                 // Assuming the search returns relevant results, take the first one
                 institutionData = searchRes.data.results[0];
            }
        }

        // If we found institution data, extract signature details
        if (institutionData) {
            if (institutionData.signer_name) instSignerName = institutionData.signer_name;
            if (institutionData.signer_position) instSignerPosition = institutionData.signer_position; // <--- Extract Position
            if (institutionData.signature_image) {
                instSignatureUrl = getAbsoluteUrl(institutionData.signature_image);
            }
        }
      } catch (instErr) {
        console.warn("Could not fetch institution signature", instErr);
      }

      // 3. Format Date
      const dateStr = new Date(cert.completion_date || cert.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      // 4. Fetch current user profile to obtain first/last name (fallback to username)
      let userFirstName: string | undefined = undefined;
      let userLastName: string | undefined = undefined;
      try {
        const userRes = await api.get('/users/me/');
        const userData = userRes.data as any;
        userFirstName = userData.first_name || userData.firstName;
        userLastName = userData.last_name || userData.lastName;
      } catch (userErr) {
        // Not critical — we'll fall back to username
        console.warn('Could not fetch user profile for certificate names', userErr);
      }

      // 5. Generate PDF
      const blob = await generateCertificate({
        studentName: cert.username,
        first_name: userFirstName,
        last_name: userLastName,
        username: cert.username,
        courseTitle: cert.course_title,
        completionDate: dateStr,
        certificateId: cert.certificate_id,
        instructorName: creatorString,
        verificationUrl: `https://lebanonacademy.ng/verify/${cert.certificate_id}`,
        institutionSignerName: instSignerName,
        institutionSignerPosition: instSignerPosition, // <--- Pass Position to Generator
        institutionSignatureUrl: instSignatureUrl
      });

      // 5. Download
      downloadCertificate(blob, cert.course_title, cert.username);

      // 6. Update Stat
      await api.post(`/certificates/${cert.id}/mark_downloaded/`);
      fetchCertificates(); 

    } catch (error: any) {
      console.error('Failed to reprint:', error);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setReprintingId(null);
    }
  };

  if (loading && certificates.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-yellow-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">My Certificates</h2>
          <p className="opacity-90">View and download your earned credentials</p>
        </div>
        <Award className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white opacity-20" />
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Course</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Certificate ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Date Earned</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{cert.course_title}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">
                    {cert.certificate_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(cert.completion_date || cert.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleReprint(cert)}
                      disabled={reprintingId === cert.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-green-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {reprintingId === cert.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                      {reprintingId === cert.id ? 'Generating...' : 'Download'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {certificates.map((cert) => (
            <div key={cert.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <FileCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">{cert.course_title}</div>
                  <div className="text-xs text-gray-500 mt-1">ID: {cert.certificate_id}</div>
                </div>
              </div>
              <button
                onClick={() => handleReprint(cert)}
                disabled={reprintingId === cert.id}
                className="w-full flex justify-center items-center gap-2 py-2 bg-yellow-50 text-green-700 rounded-lg font-medium text-sm"
              >
                {reprintingId === cert.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                Download PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}