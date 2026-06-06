import React, { useState, useEffect } from 'react';
import api from '../utils/axiosInterceptor';
import { Save, Loader2, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import OversizeImageModal from './OversizeImageModal';
import { validateImageSize } from '../utils/uploadValidators';

// Helper to ensure URLs are absolute
const getAbsoluteUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const cleanPath = url.replace(/^\/api/, '');
  const baseUrl = (import.meta.env as any).VITE_API_BASE?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

// Target canvas dimensions for the normalized signature
const SIG_WIDTH = 500;
const SIG_HEIGHT = 200;

/**
 * Auto-normalize any uploaded signature image:
 * 1. Draw the image onto a canvas
 * 2. Detect the bounding box of non-white / non-transparent ink pixels
 * 3. Crop to that bounding box
 * 4. Re-center the cropped signature into a 500×200 landscape canvas,
 *    positioned in the lower-middle portion (ideal for certificate placement)
 * 5. Return the result as a PNG File object
 */
const normalizeSignatureImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Step 1: Draw original image onto a scratch canvas
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = img.width;
        srcCanvas.height = img.height;
        const srcCtx = srcCanvas.getContext('2d')!;
        srcCtx.drawImage(img, 0, 0);

        // Step 2: Detect bounding box of ink (non-white, non-transparent pixels)
        const imageData = srcCtx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;
        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        const WHITE_THRESHOLD = 240; // pixels brighter than this are considered "background"
        const ALPHA_THRESHOLD = 30;  // pixels more transparent than this are considered "background"

        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const i = (y * img.width + x) * 4;
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
            // Is this pixel "ink"? (not transparent AND not near-white)
            const isTransparent = a < ALPHA_THRESHOLD;
            const isWhite = r > WHITE_THRESHOLD && g > WHITE_THRESHOLD && b > WHITE_THRESHOLD;
            if (!isTransparent && !isWhite) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // If no ink found, just use the original
        if (maxX <= minX || maxY <= minY) {
          resolve(file);
          return;
        }

        // Step 3: Extract the cropped region
        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;

        // Step 4: Re-center into SIG_WIDTH × SIG_HEIGHT canvas
        const outCanvas = document.createElement('canvas');
        outCanvas.width = SIG_WIDTH;
        outCanvas.height = SIG_HEIGHT;
        const outCtx = outCanvas.getContext('2d')!;
        // Transparent background (default)

        // Scale the cropped region to fit within the target canvas with padding
        const PAD = 16; // px padding on all sides
        const availW = SIG_WIDTH - PAD * 2;
        const availH = SIG_HEIGHT - PAD * 2;
        const scale = Math.min(availW / cropW, availH / cropH, 1); // don't upscale
        const drawW = cropW * scale;
        const drawH = cropH * scale;

        // Center horizontally, place in lower-middle vertically
        // (offset 60% down so signature "sits" above the line on the certificate)
        const drawX = (SIG_WIDTH - drawW) / 2;
        const drawY = (SIG_HEIGHT - drawH) * 0.6;

        outCtx.drawImage(
          srcCanvas,
          minX, minY, cropW, cropH,  // source crop
          drawX, drawY, drawW, drawH // destination
        );

        // Step 5: Export as PNG File
        outCanvas.toBlob((blob) => {
          if (!blob) {
            resolve(file); // fallback to original
            return;
          }
          const normalizedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '') + '_normalized.png',
            { type: 'image/png' }
          );
          resolve(normalizedFile);
        }, 'image/png');
      } catch (e) {
        console.warn('Signature normalization failed, using original:', e);
        resolve(file); // fallback
      }
    };
    img.onerror = () => {
      console.warn('Could not load image for normalization, using original');
      resolve(file);
    };
    img.src = URL.createObjectURL(file);
  });
};

export default function InstitutionSignature({ darkMode }: { darkMode?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    signer_name: '',
    signer_position: '', // <--- New State
    signature_image: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [oversizeModalOpen, setOversizeModalOpen] = useState(false);
  const [oversizeFileSize, setOversizeFileSize] = useState(0);

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
        signer_position: res.data.signer_position || '', // <--- Load existing
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
    // Ensure this matches your backend URL configuration
    const res = await api.post('/courses/upload-image/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image size
    const validation = validateImageSize(file);
    if (!validation.ok) {
      setOversizeFileSize(validation.bytes);
      setOversizeModalOpen(true);
      return;
    }
    
    try {
      setSaving(true);
      setSuccess('');
      setError('');

      // Auto-normalize: crop and re-center the signature into the ideal 500×200 layout
      const normalizedFile = await normalizeSignatureImage(file);

      const url = await uploadImage(normalizedFile);
      setFormData(prev => ({ ...prev, signature_image: url }));
      setSuccess('Signature uploaded and auto-optimized for certificates. Don\'t forget to save.');
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
      await api.patch(`/institutions/${institutionId}/`, {
        signer_name: formData.signer_name,
        signer_position: formData.signer_position,
        signature_image_input: formData.signature_image,
      });
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
        Upload a signature and provide the signer's details. These will appear on certificates issued for your courses.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signer Name</label>
                <input
                    type="text"
                    value={formData.signer_name}
                    onChange={e => setFormData({...formData, signer_name: e.target.value})}
                    placeholder="e.g. Dr. John Doe"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                />
            </div>
            
            {/* New Position Field */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title / Position</label>
                <input
                    type="text"
                    value={formData.signer_position}
                    onChange={e => setFormData({...formData, signer_position: e.target.value})}
                    placeholder="e.g. Dean of Studies"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                />
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Signature Image</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative group">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {formData.signature_image ? (
              <div className="flex flex-col items-center">
                <img src={getAbsoluteUrl(formData.signature_image)} alt="Institution signature image" className="h-24 object-contain mb-2" width={240} height={96} loading="lazy" decoding="async" />
                <p className="text-sm text-green-600 font-medium group-hover:underline">Click to replace</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <Upload className="w-8 h-8 mb-2" />
                <p>Click to upload signature (PNG recommended)</p>
              </div>
            )}
          </div>

          {/* Signature Format Guidance */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Signature Image Guidelines for Best Certificate Placement
                </p>
                <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
                  <li>
                    <strong>Ideal size:</strong> 500 × 200 pixels (landscape, 2.5:1 ratio).
                    The system currently renders signatures in a <strong>40mm wide</strong> box above the
                    signature line on the certificate, with approximately 28mm of vertical space.
                  </li>
                  <li>
                    <strong>Format:</strong> PNG with a <strong>transparent background</strong> is strongly
                    recommended so the signature blends seamlessly with the certificate's cream background.
                  </li>
                  <li>
                    <strong>Ink color:</strong> Use <strong>dark ink</strong> (black or very dark color)
                    for maximum contrast and readability.
                  </li>
                  <li>
                    <strong>Positioning:</strong> The signature strokes should be <strong>centered
                    horizontally</strong> and sit in the <strong>lower-middle portion</strong> of the
                    image, leaving some top padding — this ensures the signature naturally "rests" above
                    the signature line on the certificate.
                  </li>
                  <li>
                    <strong>Cropping:</strong> Tightly crop the image with minimal empty space around
                    the actual signature strokes.
                  </li>
                </ul>
                <p className="text-xs text-blue-700 mt-2 italic">
                  💡 Don't worry if your image doesn't follow this pattern exactly — the system will
                  automatically crop, re-center, and resize your signature to fit the ideal 500×200
                  landscape layout when you upload it.
                </p>
              </div>
            </div>
          </div>
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

      <OversizeImageModal
        open={oversizeModalOpen}
        size={oversizeFileSize}
        maxSize={400 * 1024}
        onClose={() => setOversizeModalOpen(false)}
        darkMode={darkMode}
      />
    </div>
  );
}