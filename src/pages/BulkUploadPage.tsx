import React, { useState } from 'react'
import axios from 'axios'
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface UploadResponse {
  success: number
  total: number
  created: Array<{ id: number; text: string }>
  errors: string[] | null
  exam: string
  year: number
}

export default function BulkUploadPage() {
  const [jsonInput, setJsonInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<UploadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        // Handle JSON or CSV formats
        if (file.name.toLowerCase().endsWith('.csv')) {
          // Basic CSV validation: check headers
          const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
          if (lines.length === 0) {
            setParseError('CSV appears empty')
            return
          }
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          const required = ['id', 'question_text', 'optiona', 'optionb', 'optionc', 'optiond', 'correct_answer', 'subject']
          const missing = required.filter(r => !headers.includes(r))
          if (missing.length > 0) {
            setParseError(`CSV missing required columns: ${missing.join(', ')}`)
            return
          }
          // If CSV looks OK, convert to internal JSON structure for preview/upload
          try {
            const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()))
            // Find year column index (optional)
            const yearIdx = headers.indexOf('year')
            const questions = rows.map(cols => ({
              id: cols[0],
              question_text: cols[1],
              options: { A: cols[2], B: cols[3], C: cols[4], D: cols[5] },
              correct_answer: cols[6],
              explanation: cols[7] || '',
              subject: cols[8] || '',
              year: yearIdx >= 0 && cols[yearIdx] ? cols[yearIdx] : ''
            }))
            const json = JSON.stringify({ exam_id: 'CSV_IMPORT', year: new Date().getFullYear(), questions }, null, 2)
            setJsonInput(json)
            setParseError(null)
          } catch (e) {
            setParseError('Failed to parse CSV. Ensure it uses commas and has the correct columns.')
          }
        } else {
          // Treat as JSON
          setJsonInput(content)
          setParseError(null)
        }
      }
      reader.readAsText(file)
    }
  }

  const validateJSON = () => {
    try {
      JSON.parse(jsonInput)
      setParseError(null)
      return true
    } catch (err: any) {
      setParseError(err.message)
      return false
    }
  }

  const handlePreview = () => {
    if (validateJSON()) {
      setShowPreview(true)
    }
  }

  const handleSubmit = async () => {
    if (!validateJSON()) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const token = localStorage.getItem('access')
      const jsonData = JSON.parse(jsonInput)

      const uploadData = {
        exam_id: jsonData.exam_id,
        year: jsonData.year,
        questions: jsonData.questions
      }

      const res = await axios.post(`${API_BASE}/cbt/bulk-upload/`, uploadData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setResponse(res.data)
      setJsonInput('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload questions')
    } finally {
      setLoading(false)
    }
  }

  const parsePreviewData = () => {
    try {
      return JSON.parse(jsonInput)
    } catch {
      return null
    }
  }

  const previewData = showPreview ? parsePreviewData() : null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-8 h-8 text-yellow-600" />
            Bulk Upload Questions
          </h1>
          <p className="text-gray-600 mt-2">Upload questions in JSON format for exams and subjects</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload JSON Data</h2>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select JSON File
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">JSON files only</p>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* JSON Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or paste JSON directly
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value)
                    setParseError(null)
                  }}
                  placeholder='{"exam_id": "JAMB_CHEM_2014", "year": 2014, "questions": [{"question_text": "...", "year": "2014", ...}]}'
                  className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Parse Error */}
              {parseError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Invalid JSON</p>
                    <p className="text-sm text-red-700">{parseError}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePreview}
                  disabled={!jsonInput || !!parseError}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Preview
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!jsonInput || loading || !!parseError}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>

            {/* Example Format */}
            <div className="mt-6 space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-600 rounded p-4">
                <p className="font-bold text-yellow-900 text-sm">📌 Year Field Requirement</p>
                <p className="text-xs text-yellow-800 mt-1">Include a <strong>"year"</strong> field in EACH question object to display the question year when students take exams. Example: <code className="bg-yellow-100 px-1 rounded">"year": "2014"</code></p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-semibold text-yellow-900 mb-2">JSON Format Example:</p>
                <pre className="text-xs text-yellow-800 overflow-x-auto">
{`{
  "exam_id": "JAMB_CHEM_2014",
  "year": 2014,
  "questions": [
    {
      "id": "2014_1",
      "question_text": "What is...",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correct_answer": "A",
      "explanation": "...",
      "subject": "Chemistry",
      "year": "2014"
    }
  ]
}`}
                </pre>
                <p className="text-xs text-yellow-700 mt-2 font-semibold">✓ IMPORTANT: Include "year" field in each question (e.g., "year": "2014")</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-semibold text-yellow-900 mb-2">CSV Format Example:</p>
                <pre className="text-xs text-yellow-800 overflow-x-auto whitespace-pre-wrap break-words">
{`id,question_text,optionA,optionB,optionC,optionD,correct_answer,explanation,subject,year
2014_1,"What is the chemical formula for salt?","H2O","NaCl","H2SO4","KCl","B","NaCl is the chemical formula for common salt","Chemistry","2014"
2014_2,"What is the atomic number of Carbon?","6","12","8","4","A","Carbon has an atomic number of 6","Chemistry","2014"`}
                </pre>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-semibold text-yellow-900 mb-2">CSV Format Guide:</p>
                <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                  <li><strong>Required columns:</strong> id, question_text, optionA, optionB, optionC, optionD, correct_answer, subject</li>
                  <li><strong>Optional columns:</strong> explanation, year</li>
                  <li>The <strong>year</strong> column is optional but recommended for better organization</li>
                  <li>If year is not provided in CSV, questions won't display a year when students take the exam</li>
                  <li>Wrap text containing commas in quotes: "text, with, comma"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Preview & Response Section */}
          <div>
            {/* Preview */}
            {showPreview && previewData && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Preview</h2>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Exam ID</p>
                    <p className="font-semibold text-gray-900">{previewData.exam_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-semibold text-gray-900">{previewData.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Questions</p>
                    <p className="font-semibold text-gray-900">{previewData.questions?.length || 0}</p>
                  </div>

                  {previewData.questions && previewData.questions.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-gray-600 mb-3">First 3 Questions</p>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {previewData.questions.slice(0, 3).map((q: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium text-gray-900">{q.id}</p>
                            <p className="text-xs text-gray-600 mt-1">{q.question_text.substring(0, 80)}...</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Subject: {q.subject} {q.year && `| Year: ${q.year}`} | Options: {Object.keys(q.options || {}).length}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success Response */}
            {response && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-xl font-bold text-gray-900">Upload Successful</h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Exam</p>
                      <p className="font-semibold text-gray-900">{response.exam}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Year</p>
                      <p className="font-semibold text-gray-900">{response.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className="font-semibold text-yellow-600">
                        {response.success}/{response.total}
                      </p>
                    </div>
                  </div>

                  {/* Created Questions */}
                  {response.created.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Created Questions ({response.created.length})</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {response.created.map((q) => (
                          <div key={q.id} className="p-2 bg-yellow-50 rounded text-sm text-gray-700">
                            <span className="font-medium text-yellow-700">Q{q.id}:</span> {q.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {response.errors && response.errors.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-red-700 mb-2">Errors ({response.errors.length})</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {response.errors.map((err, idx) => (
                          <div key={idx} className="p-2 bg-red-50 rounded text-xs text-red-700 border border-red-200">
                            {err}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setResponse(null)
                    setJsonInput('')
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Upload Another File
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <h2 className="text-xl font-bold text-red-900">Upload Failed</h2>
                </div>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
