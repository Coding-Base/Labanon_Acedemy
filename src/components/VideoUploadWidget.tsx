import React, { useState, useRef } from 'react'
import axios from 'axios'
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react'

const MAX_VIDEO_SECONDS = 6 * 60 // 6 minutes
const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

interface VideoUploadProps {
  onUploadComplete: (videoData: any) => void
  onError?: (error: string) => void
}

interface UploadedVideo {
  id: string
  cloudfront_url: string
  duration: number
  status: 'uploading' | 'processing' | 'ready' | 'failed'
}

export const VideoUploadWidget: React.FC<VideoUploadProps> = ({ onUploadComplete, onError }) => {
  const [mode, setMode] = useState<'upload' | 'youtube'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [durationError, setDurationError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = url
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve(video.duration || 0)
      }
      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Could not read video metadata'))
      }
    })
  }

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralError(null)
    setDurationError(null)

    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('video/')) {
      setDurationError('Please select a valid video file (mp4, webm, etc.)')
      setFile(null)
      return
    }

    try {
      const duration = await getVideoDuration(selectedFile)
      if (duration > MAX_VIDEO_SECONDS) {
        setDurationError(
          `Video is ${Math.round(duration)}s long. Maximum is ${MAX_VIDEO_SECONDS}s (6 minutes). ` +
          `Use YouTube embed for longer videos.`
        )
        setFile(null)
      } else {
        setFile(selectedFile)
        setDurationError(null)
      }
    } catch (err) {
      setDurationError('Could not determine video length. Try a different file.')
      setFile(null)
    }
  }

  const uploadToS3 = async () => {
    if (!file) return

    setIsUploading(true)
    setGeneralError(null)
    setUploadProgress(0)

    try {
      const token = localStorage.getItem('access')
      
      // Step 1: Initiate upload
      setUploadStatus('Initiating upload...')
      const initiateRes = await axios.post(
        `${API_BASE}/videos/initiate_upload/`,
        {
          title: file.name,
          description: '',
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          duration: await getVideoDuration(file)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { video_id, upload_id, presigned_url, s3_key } = initiateRes.data

      // Step 2: Upload file in chunks
      setUploadStatus('Uploading video...')
      const parts = []
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)
        const partNumber = i + 1

        // Get presigned URL for this part
        const presignedRes = await axios.post(
          `${API_BASE}/videos/get_presigned_url/`,
          {
            video_id,
            part_number: partNumber,
            content_length: chunk.size
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        // Decode HTML entities in presigned URL if needed
        let presignedUrl = presignedRes.data.presigned_url
        if (presignedUrl.includes('&amp;')) {
          // Replace HTML entities
          presignedUrl = presignedUrl.replace(/&amp;/g, '&')
        }

        // Upload chunk using fetch (not axios) to avoid double-signing
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: chunk
        })

        if (!uploadRes.ok) {
          throw new Error(`S3 upload failed: ${uploadRes.statusText}`)
        }

        const etag = uploadRes.headers.get('etag') || uploadRes.headers.get('ETag')
        
        parts.push({
          PartNumber: partNumber,
          ETag: etag
        })

        // Update progress
        const totalProgress = ((i + 1) / totalChunks) * 100
        setUploadProgress(Math.round(totalProgress))
      }

      // Step 3: Complete upload
      setUploadStatus('Finalizing upload...')
      const completeRes = await axios.post(
        `${API_BASE}/videos/complete_upload/`,
        {
          video_id,
          parts
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUploadStatus('Video processing...')
      onUploadComplete({
        video_id: video_id,
        status: 'processing',
        youtube_url: null,
        cloudfront_url: null
      })

      setFile(null)
      setUploadProgress(0)
      setIsUploading(false)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Upload failed'
      setGeneralError(errorMsg)
      onError?.(errorMsg)
      setIsUploading(false)
    }
  }

  const handleYouTubeSubmit = () => {
    if (!youtubeUrl.trim()) {
      setGeneralError('Please enter a YouTube URL')
      return
    }

    // Extract video ID from YouTube URL
    let videoId = ''
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ]

    for (const pattern of patterns) {
      const match = youtubeUrl.match(pattern)
      if (match) {
        videoId = match[1]
        break
      }
    }

    if (!videoId) {
      setGeneralError('Invalid YouTube URL format')
      return
    }

    onUploadComplete({
      youtube_url: youtubeUrl,
      status: 'ready',
      video_id: null,
      cloudfront_url: null
    })

    setYoutubeUrl('')
    setGeneralError(null)
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 border border-gray-300 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">Upload Video</h3>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 py-2 px-3 rounded transition ${
            mode === 'upload'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setMode('youtube')}
          className={`flex-1 py-2 px-3 rounded transition ${
            mode === 'youtube'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          YouTube Link
        </button>
      </div>

      {/* File Upload Mode */}
      {mode === 'upload' && (
        <div>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              Click to select video (max 6 minutes)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={onFileSelected}
              className="hidden"
            />
          </div>

          {file && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-medium text-blue-900">{file.name}</p>
              <p className="text-xs text-blue-700">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {durationError && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{durationError}</p>
            </div>
          )}

          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">{uploadStatus}</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{uploadProgress}%</p>
            </div>
          )}

          {generalError && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{generalError}</p>
            </div>
          )}

          <button
            onClick={uploadToS3}
            disabled={!file || isUploading}
            className="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      )}

      {/* YouTube Mode */}
      {mode === 'youtube' && (
        <div>
          <input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          {generalError && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{generalError}</p>
            </div>
          )}
          <button
            onClick={handleYouTubeSubmit}
            className="w-full mt-4 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Use YouTube Link
          </button>
        </div>
      )}
    </div>
  )
}
