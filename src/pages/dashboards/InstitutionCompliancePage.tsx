import React, { useEffect, useState } from 'react'
import ComplianceForm from '../../components/ComplianceForm'
import axios from 'axios'
import { FileText, Download } from 'lucide-react'
import useNotifications from '../../utils/useNotifications'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

export default function InstitutionCompliancePage({ darkMode: darkModeProp }: { darkMode?: boolean }) {
  const [legalDocs, setLegalDocs] = useState<any[]>([])
  const [showForm, setShowForm] = useState(true)
  // Show notification with delay when this component mounts (user opens compliance page)
  useNotifications(true)
  useEffect(() => {
    loadLegalDocs()
  }, [])

  const darkMode = typeof window !== 'undefined' && (darkModeProp ?? (localStorage.getItem('institutionDashboardDarkMode') === 'true'))

  async function loadLegalDocs() {
    try {
      const res = await axios.get(`${API_BASE}/legal-documents/`)
      // Handle both paginated response (with results property) and direct array response
      const payload = res.data
      const items = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : [])
      setLegalDocs(items)
    } catch (e) {
      console.error('Failed to load legal documents', e)
      setLegalDocs([])
    }
  }

  return (
    <div className={`${darkMode ? 'space-y-6 text-slate-100' : 'space-y-6'}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compliance & Verification</h1>
        <button onClick={() => setShowForm(s => !s)} className="px-4 py-2 bg-yellow-600 text-white rounded">
          {showForm ? 'Hide Request Form' : 'Request Verification'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {showForm && (
            <div className={`${darkMode ? 'bg-slate-800 border-slate-700 p-6 rounded-lg' : 'bg-white p-6 rounded-lg border border-gray-200'}`}>
              <ComplianceForm entityType="institution" darkMode={darkMode} />
            </div>
          )}

          <div className={`${darkMode ? 'bg-slate-800 border-slate-700 p-6 rounded-lg' : 'bg-white p-6 rounded-lg border border-gray-200'}`}>
            <h3 className="font-semibold mb-4">Available Legal Documents</h3>
            <div className="space-y-3">
              {legalDocs.length === 0 && <p className="text-sm text-gray-500">No documents available yet.</p>}
              {legalDocs.map(doc => (
                <div key={doc.id} className={`${darkMode ? 'flex items-center justify-between p-3 border rounded border-slate-700' : 'flex items-center justify-between p-3 border rounded'}`}>
                  <div className="flex items-center gap-3">
                    <FileText className={`${darkMode ? 'w-5 h-5 text-slate-300' : 'w-5 h-5 text-gray-500'}`} />
                    <div>
                      <div className={`${darkMode ? 'font-medium text-slate-100' : 'font-medium'}`}>{doc.title}</div>
                      <div className={`${darkMode ? 'text-xs text-slate-400' : 'text-xs text-gray-500'}`}>v{doc.version} — {doc.document_type}</div>
                    </div>
                  </div>
                  <a href={doc.document_file} target="_blank" rel="noreferrer" className={`${darkMode ? 'px-3 py-1 bg-slate-700/40 rounded flex items-center gap-2' : 'px-3 py-1 bg-gray-100 rounded flex items-center gap-2'}`}>
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h4 className="font-semibold mb-2">How this works</h4>
          <p className="text-sm text-blue-800">Download the official legal document, print and sign where required, attach your supporting documents and upload them via the request form. The admin will review and approve or reject.</p>
        </aside>
      </div>
    </div>
  )
}
