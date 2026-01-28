import React, { useState, useEffect } from 'react';
// Import the secure instance
import api from '../utils/axiosInterceptor'; 
import { Save, Loader2, AlertCircle, CheckCircle, Copy, Globe, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

interface Portfolio {
  id: number;
  title: string;
  description: string;
  overview: string;
  image: string;
  website: string;
  location: string;
  phone: string;
  email: string;
  published: boolean;
  public_token: string;
  theme_color?: string;
}

// Accept props from the Dashboard
export default function InstitutionPortfolio({ institutionId }: { institutionId?: number }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Portfolio>>({
    title: '',
    description: '',
    overview: '',
    website: '',
    location: '',
    phone: '',
    email: '',
    theme_color: '#0ea5a4',
  });

  const [gallery, setGallery] = useState<any[]>([]);
  const [galleryForm, setGalleryForm] = useState({ 
    title: '', 
    description: '', 
    imageUrl: '', 
    file: null as File | null 
  });

  const loadPortfolio = async () => {
    if (!institutionId) return; // Wait until ID is passed
    
    try {
      setLoading(true);
      
      // Fetch ONLY portfolios belonging to THIS institution
      const res = await api.get('/portfolios/', {
        params: { institution: institutionId } 
      });
      
      // Check if we found a portfolio for this institution
      const myPortfolio = res.data.find((p: any) => p.institution === institutionId) || (res.data.length > 0 ? res.data[0] : null);

      if (myPortfolio) {
        setPortfolio(myPortfolio);
        setFormData({
          title: myPortfolio.title,
          description: myPortfolio.description,
          overview: myPortfolio.overview,
          website: myPortfolio.website,
          location: myPortfolio.location,
          phone: myPortfolio.phone,
          email: myPortfolio.email,
          theme_color: myPortfolio.theme_color || '#0ea5a4',
          image: myPortfolio.image
        });
      } else {
        console.log("No portfolio found, user can create one.");
      }
    } catch (err: any) {
       console.error('Failed to load portfolio', err);
       setError('Failed to load portfolio data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, [institutionId]);

  useEffect(() => {
    if (portfolio?.id) fetchGallery();
  }, [portfolio?.id]);

  const fetchGallery = async () => {
    try {
      const res = await api.get('/portfolio-gallery/', { 
        params: { portfolio: portfolio?.id } 
      });
      setGallery(res.data);
    } catch (err) {
      console.error('Failed to load gallery', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, theme_color: e.target.value });
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as any;
    if (name === 'file' && files && files.length > 0) {
      setGalleryForm({ ...galleryForm, file: files[0] });
    } else {
      setGalleryForm({ ...galleryForm, [name]: value });
    }
  };

  // FIX: Updated URL to match courses/urls.py
  const uploadImage = async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    try {
      // Corrected Endpoint
      const res = await api.post('/courses/upload-image/', data, { 
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.url || res.data.url;
    } catch (err) {
      console.error('Upload failed', err);
      throw err;
    }
  };

  const addGalleryItem = async () => {
    if (!portfolio?.id) return setError('Create portfolio first');
    try {
      let imageUrl = galleryForm.imageUrl;
      if (galleryForm.file) {
        imageUrl = await uploadImage(galleryForm.file);
      }
      const payload = { 
        portfolio: portfolio.id, 
        title: galleryForm.title, 
        description: galleryForm.description, 
        image: imageUrl 
      };
      
      await api.post('/portfolio-gallery/', payload);
      
      setGalleryForm({ title: '', description: '', imageUrl: '', file: null });
      await fetchGallery();
      setSuccess('Gallery item added');
    } catch (err: any) {
      console.error(err);
      setError('Failed to add gallery item');
    }
  };

  const deleteGalleryItem = async (id: number) => {
    try {
      await api.delete(`/portfolio-gallery/${id}/`);
      await fetchGallery();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!institutionId) {
        setError('Institution ID not loaded. Please refresh.');
        return;
      }

      // Prepare payload with current formData
      // Note: Image upload is handled by the onChange handler of the file input immediately
      const payload = {
        ...formData,
        institution: institutionId,
      };

      if (portfolio?.id) {
        await api.put(`/portfolios/${portfolio.id}/`, payload);
        setSuccess('Portfolio updated successfully!');
      } else {
        const res = await api.post('/portfolios/', payload);
        setPortfolio(res.data);
        setSuccess('Portfolio created successfully!');
      }

      await loadPortfolio();
    } catch (err: any) {
      console.error('Save error:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!portfolio?.id) return;
    try {
      setSaving(true);
      const action = portfolio.published ? 'unpublish' : 'publish';
      await api.post(`/portfolios/${portfolio.id}/${action}/`, {});
      setSuccess(`Portfolio ${action}ed successfully!`);
      await loadPortfolio();
    } catch (err: any) {
      setError(`Failed to ${portfolio?.published ? 'unpublish' : 'publish'} portfolio`);
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = portfolio?.public_token
    ? `${window.location.origin}/portfolio/${portfolio.public_token}`
    : '';

  const copyToClipboard = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Institution Portfolio</h2>
        {portfolio?.id && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePublish}
            disabled={saving}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
              portfolio.published
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-yellow-100 text-green-700 hover:bg-yellow-200'
            } disabled:opacity-60`}
          >
            {portfolio.published ? 'Unpublish' : 'Publish'} Portfolio
          </motion.button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {portfolio?.published && publicUrl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-50 to-indigo-50 rounded-2xl border border-yellow-200 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-yellow-600" />
            <h3 className="font-bold text-yellow-900">Public Portfolio Link</h3>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            Share this link with your students or anyone to showcase your institution:
          </p>
          <div className="flex items-center gap-2 bg-white rounded-lg p-3">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 bg-transparent outline-none text-sm font-mono text-gray-700"
            />
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              <Copy className={`w-4 h-4 ${copied ? 'text-green-600' : 'text-gray-600'}`} />
            </button>
          </div>
          {copied && <p className="text-xs text-green-600 mt-2">✓ Copied!</p>}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Title</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                placeholder="e.g., Lebanon Tech Institute Portfolio"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
              <input type="color" name="theme_color" value={(formData.theme_color as string) || '#0ea5a4'} onChange={handleColorChange} className="w-16 h-10 p-0 border rounded" />
              <p className="text-xs text-gray-500 mt-1">Choose a hex color that will be used on the public portfolio page.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Image (URL)</label>
              <input type="text" name="image" value={formData.image || ''} onChange={handleChange} placeholder="https://... or leave blank to upload" className="w-full px-3 py-2 border rounded-lg" />
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Or upload image</label>
              <input type="file" name="main_image_file" accept="image/*" onChange={async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (!f) return;
                try {
                  const url = await uploadImage(f);
                  setFormData(prev => ({ ...prev, image: url })); // Functional update for safety
                  setSuccess('Image uploaded successfully');
                } catch (err) {
                  setError('Upload failed');
                }
              }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overview</label>
            <textarea
              name="overview"
              value={formData.overview || ''}
              onChange={handleChange}
              placeholder="Short overview of your institution..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="Tell your story... history, values, achievements..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                placeholder="City, State"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="+234..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="info@..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-gradient-to-r from-green-600 to-yellow-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Portfolio'}
            </button>
          </div>
        </form>
      </motion.div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Gallery</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="space-y-3">
              {gallery.length === 0 ? (
                <div className="text-sm text-gray-500">No gallery items yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {gallery.map((g) => (
                    <div key={g.id} className="border rounded-lg overflow-hidden relative">
                      <img src={g.image} alt={g.title} className="w-full h-40 object-cover" />
                      <div className="p-3">
                        <div className="font-semibold text-sm">{g.title}</div>
                        {g.description && <div className="text-xs text-gray-500">{g.description}</div>}
                      </div>
                      <button onClick={() => deleteGalleryItem(g.id)} className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-red-600">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input name="title" value={galleryForm.title} onChange={handleGalleryChange} className="w-full px-2 py-1 border rounded mb-2" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={galleryForm.description} onChange={handleGalleryChange} rows={3} className="w-full px-2 py-1 border rounded mb-2" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input name="imageUrl" value={galleryForm.imageUrl} onChange={handleGalleryChange} className="w-full px-2 py-1 border rounded mb-2" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Or upload file</label>
            <input type="file" name="file" accept="image/*" onChange={handleGalleryChange} className="w-full mb-3" />
            <button onClick={addGalleryItem} className="w-full bg-yellow-600 text-white py-2 rounded">Add to gallery</button>
          </div>
        </div>
      </div>
    </div>
  );
}