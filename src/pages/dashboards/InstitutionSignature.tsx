import React, { useState, useEffect } from 'react';
import api from '../utils/axiosInterceptor';
import { Save, Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function InstitutionSignature() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    signer_name: '',
    signature_image: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadInstitution();
  }, []);

  const loadInstitution = async () => {
    try {
      setLoading(true);
      const res = await api.get('/institutions/my_institution/');
      setInstitutionId(res.data.id);
      setFormData({
        signer_name: res.data.signer_name || '',
        signature_image: res.data.signature_image || ''
      });
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
      setSaving(true); // Show saving state during upload
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, signature_image: url }));
      setSuccess('Signature uploaded successfully. Don\'t forget to save.');
    } catch (err) {
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
      await api.patch(`/institutions/${institutionId}/`, formData);
      setSuccess('Signature details saved successfully!');
    } catch (err) {
      setError('Failed to save details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Certificate Signature</h2>
      <p className="text-gray-600 mb-6">
        Upload a signature and provide the name of the signer. This will appear on certificates issued for your courses.
      </p>

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
          <label className="block text-sm font-medium text-gray-700 mb-2">Signer Name</label>
          <input
            type="text"
            value={formData.signer_name}
            onChange={e => setFormData({...formData, signer_name: e.target.value})}
            placeholder="e.g. Dr. John Doe, Dean of Studies"
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
  );
}