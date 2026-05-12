/**
 * Image Upload Validation Utility
 * Enforces 400KB max size limit for all image uploads
 */

export const MAX_IMAGE_SIZE_BYTES = 400 * 1024; // 400 KB
export const COMPRESS_IMAGE_URL = 'https://www.iloveimg.com';

export interface ImageValidationResult {
  ok: boolean;
  bytes: number;
  maxBytes: number;
  message?: string;
}

/**
 * Validates if an image file is within the 400KB size limit
 * @param file - File object to validate
 * @param maxBytes - Optional max size in bytes (defaults to 400KB)
 * @returns Validation result with ok flag and size info
 */
export function validateImageSize(
  file: File,
  maxBytes: number = MAX_IMAGE_SIZE_BYTES
): ImageValidationResult {
  const bytes = file.size;
  const ok = bytes <= maxBytes;

  return {
    ok,
    bytes,
    maxBytes,
    message: ok
      ? undefined
      : `The image you are about to upload is more than 400kb you can kindly visit iloveimg.com to compress it.`,
  };
}

/**
 * Checks if file is an image by MIME type
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Formats bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
