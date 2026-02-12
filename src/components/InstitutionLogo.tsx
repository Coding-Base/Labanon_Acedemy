import React, { useState, useEffect } from 'react';
import api from '../utils/axiosInterceptor';
import { Save, Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function InstitutionLogo() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadInstitution(); }, []);

  const loadInstitution = async () => {
    try {
      setLoading(true);
      const res = await api.get('/institutions/my_institution/');
      setInstitutionId(res.data.id);
      setLogoUrl(res.data.logo_image || '');
    } catch (err) {
      console.error(err);
      setError('Failed to load institution details.');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    const res = await api.post('/courses/upload-image/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const url = await uploadImage(file);
      setLogoUrl(url);
      setSuccess('Logo uploaded. Click save to persist.');
    } catch (err) {
      console.error(err);
      setError('Failed to upload image.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!institutionId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/institutions/${institutionId}/`, { logo_image: logoUrl });
      setSuccess('Logo saved successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to save logo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Institution Logo</h2>
      <p className="text-gray-600 mb-6">Upload your institution logo. This will appear at the top of certificates issued for courses or diplomas created by your institution.</p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-yellow-50 text-green-700 rounded-lg flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {success}</div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo Image</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative group">
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            {logoUrl ? (
              <div className="flex flex-col items-center">
                <img src={logoUrl} alt="Institution logo" className="h-24 object-contain mb-2" width={240} height={96} loading="lazy" decoding="async" />
                <p className="text-sm text-green-600 font-medium group-hover:underline">Click to replace</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <Upload className="w-8 h-8 mb-2" />
                <p>Click to upload logo (PNG/SVG recommended)</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Recommended: PNG with transparent background, at least 300x100px.</p>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} Save Logo
        </button>
      </div>
    </div>
  );
}
