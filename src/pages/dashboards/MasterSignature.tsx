import React, { useState, useEffect } from 'react'
import api from '../../utils/axiosInterceptor'
import { Save, Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react'

export default function MasterSignature() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ signer_name: '', signature_image: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadMeta()
  }, [])

  const loadMeta = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/signature/')
      setFormData({ signer_name: res.data.signer_name || '', signature_image: res.data.signature_url || '' })
    } catch (err) {
      console.warn('Could not load master signature meta', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      // POST file directly to admin endpoint which writes backend/signature.png
      const res = await api.post('/admin/signature/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.status === 200) {
        setSuccess('Signature uploaded. It will be used on new certificates.')
        // Force-refresh signature image by appending cache buster
        setFormData(prev => ({ ...prev, signature_image: `${(import.meta.env as any).VITE_API_BASE?.replace('/api','') || 'http://localhost:8000'}/api/signature/?t=${Date.now()}` }))
      } else {
        setError('Upload failed')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to upload signature')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/admin/signature/', { signer_name: formData.signer_name })
      if (res.status === 200) {
        setSuccess('Signer name saved')
      } else {
        setError('Failed to save signer name')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to save signer name')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Platform (CEO) Signature</h2>
      <p className="text-gray-600 mb-6">Upload the master (CEO) signature. This will be embedded on certificates as the platform signature.</p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-yellow-50 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> {success}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Signer Name (e.g. "Ndubuisi Osinachi Blessed, CEO, LightHub Academy")</label>
          <input
            type="text"
            value={formData.signer_name}
            onChange={e => setFormData({...formData, signer_name: e.target.value})}
            placeholder="Signer name and title"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Signature Image</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {formData.signature_image ? (
              <div className="flex flex-col items-center">
                <img src={formData.signature_image} alt="Signature" className="h-24 object-contain mb-2" />
                <p className="text-sm text-green-600">Click to replace</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <Upload className="w-8 h-8 mb-2" />
                <p>Click to upload signature (PNG recommended)</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Recommended: Transparent PNG, dark ink.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          Save Signature
        </button>
      </div>
    </div>
  )
}
