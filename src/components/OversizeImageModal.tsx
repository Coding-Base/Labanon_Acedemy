/**
 * OversizeImageModal Component
 * Displays a modal when user attempts to upload an image > 400KB
 */

import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { COMPRESS_IMAGE_URL, formatBytes } from '../utils/uploadValidators';

interface OversizeImageModalProps {
  open: boolean;
  size: number;
  maxSize: number;
  onClose: () => void;
  darkMode?: boolean;
}

export default function OversizeImageModal({
  open,
  size,
  maxSize,
  onClose,
  darkMode = false,
}: OversizeImageModalProps) {
  if (!open) return null;

  const sizeFormatted = formatBytes(size);
  const maxFormatted = formatBytes(maxSize);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className={`${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-100'
              : 'bg-white border-gray-200 text-gray-900'
          } rounded-2xl shadow-xl border max-w-md w-full animate-in fade-in zoom-in-95 duration-200`}
        >
          {/* Header */}
          <div className={`p-6 border-b ${darkMode ? 'border-slate-700' : 'border-gray-100'} flex items-start gap-4`}>
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                darkMode ? 'bg-red-900/20' : 'bg-red-50'
              }`}
            >
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Image Size Exceeded</h2>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'} mt-1`}>
                Your image is too large to upload
              </p>
            </div>
          </div>

          {/* Content */}
          <div className={`p-6 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`rounded-lg p-4 mb-4 ${darkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                File Information:
              </p>
              <ul className={`space-y-1 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <li>
                  <span className="font-medium">Current size:</span> {sizeFormatted}
                </li>
                <li>
                  <span className="font-medium">Maximum allowed:</span> {maxFormatted}
                </li>
              </ul>
            </div>

            <div className={`rounded-lg p-4 mb-6 ${darkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                The image you are about to upload is more than 400kb. You can kindly visit{' '}
                <a
                  href={COMPRESS_IMAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-semibold inline-flex items-center gap-1 ${
                    darkMode
                      ? 'text-blue-400 hover:text-blue-300'
                      : 'text-blue-600 hover:text-blue-700'
                  } transition-colors`}
                >
                  iloveimg.com
                  <ExternalLink className="w-3 h-3" />
                </a>{' '}
                to compress it.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                Close
              </button>
              <a
                href={COMPRESS_IMAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Visit Compression Tool
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
