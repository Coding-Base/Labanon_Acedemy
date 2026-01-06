/**
 * CertificatesPage.tsx
 * Display list of downloaded certificates with pagination and reprint functionality
 */

import React, { useEffect, useState } from 'react';
import { Award, Download, Loader2, MoreVertical, ChevronLeft, ChevronRight, FileCheck } from 'lucide-react';
import api from '../utils/axiosInterceptor';
import { downloadCertificate, generateCertificate } from '../utils/certificateGenerator';

interface Certificate {
  id: number;
  user_id: number;
  username: string;
  course: number;
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

  // Fetch certificates on mount and when page/size changes
  useEffect(() => {
    fetchCertificates();
  }, [currentPage, pageSize]);

  const fetchCertificates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<PaginatedResponse>('/certificates/', {
        params: {
          page: currentPage,
          page_size: pageSize
        }
      });

      const data = response.data;
      setCertificates(data.results);
      
      // Calculate total pages
      const pages = Math.ceil(data.count / pageSize);
      setTotalPages(pages);
    } catch (err: any) {
      console.error('Failed to fetch certificates:', err);
      setError('Failed to load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReprint = async (certificate: Certificate) => {
    setReprintingId(certificate.id);
    try {
      // Generate certificate
      const completionDate = new Date(certificate.completion_date || certificate.created_at);
      const certificateBlob = await generateCertificate({
        courseName: certificate.course_title,
        username: certificate.username,
        completionDate,
        courseId: certificate.course
      });

      // Download the certificate
      await downloadCertificate(certificateBlob, certificate.course_title, certificate.username);

      // Mark as downloaded on backend
      try {
        await api.post(`/certificates/${certificate.id}/mark_downloaded/`);
        // Refresh the list
        fetchCertificates();
      } catch (err) {
        console.error('Failed to update download status:', err);
        // Continue - download was successful
      }
    } catch (error: any) {
      console.error('Failed to reprint certificate:', error);
      setError('Failed to reprint certificate. Please try again.');
    } finally {
      setReprintingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && certificates.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your certificates...</p>
        </div>
      </div>
    );
  }

  if (certificates.length === 0 && !loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Your Certificates</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Complete courses to earn certificates. Your certificates will appear here once you finish your first course.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Your Certificates</h2>
          <p className="opacity-90">Download and share your course completion certificates</p>
        </div>
        <Award className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-white opacity-20" />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Certificates List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {/* Desktop View - Table */}
        <div className="hidden md:block w-full">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Certificate ID</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Downloads</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider min-w-max">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-teal-100 rounded flex items-center justify-center flex-shrink-0">
                          <FileCheck className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-gray-900 truncate text-sm">{cert.course_title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-600">{cert.certificate_id}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(cert.completion_date || cert.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {cert.download_count}x
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleReprint(cert)}
                        disabled={reprintingId === cert.id}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs whitespace-nowrap"
                      >
                        {reprintingId === cert.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Reprint</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View - Card Layout */}
        <div className="md:hidden divide-y divide-gray-200">
          {certificates.map((cert) => (
            <div key={cert.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors w-full">
              <div className="flex items-start gap-3 w-full">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="font-medium text-gray-900 truncate">{cert.course_title}</div>
                  <div className="font-mono text-xs text-gray-600 mt-1 truncate">{cert.certificate_id}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm w-full">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Completion Date</p>
                  <p className="text-gray-900 font-medium">{formatDate(cert.completion_date || cert.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Downloads</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {cert.download_count}x
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleReprint(cert)}
                disabled={reprintingId === cert.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {reprintingId === cert.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Reprint Certificate
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Showing page <span className="font-semibold">{currentPage}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                    page === currentPage
                      ? 'bg-green-600 text-white'
                      : 'border hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-gray-600">
              Per page:
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-700">
          💡 Tip: You can download and reprint your certificates anytime. Share them on social media to showcase your achievements!
        </p>
      </div>
    </div>
  );
}
