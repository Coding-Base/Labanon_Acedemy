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
      // 1. Fetch Course Details to get the 'creator' string (e.g. "OurSaviour (institution)")
      // We need this to determine if we should display an Institution Name
      const courseRes = await api.get(`/courses/${cert.course}/`);
      const creatorString = courseRes.data.creator; // "Name (role)"

      // 2. Format Date
      const dateStr = new Date(cert.completion_date || cert.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      // 3. Generate PDF
      const blob = await generateCertificate({
        studentName: cert.username,
        courseTitle: cert.course_title,
        completionDate: dateStr,
        certificateId: cert.certificate_id,
        instructorName: creatorString || "", // Pass the raw creator string
        verificationUrl: `https://lebanonacademy.ng/verify/${cert.certificate_id}`
      });

      // 4. Download
      downloadCertificate(blob, cert.course_title, cert.username);

      // 5. Update Stat
      await api.post(`/certificates/${cert.id}/mark_downloaded/`);
      fetchCertificates(); // Refresh UI to show new download count

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
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white relative overflow-hidden">
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
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
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
                className="w-full flex justify-center items-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm"
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