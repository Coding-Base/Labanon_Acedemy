import React, { useEffect, useRef, useState } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import HlsJs from 'hls.js'

interface VideoPlayerProps {
  src: string
  youtubeUrl?: string
  title?: string
  controls?: boolean
  autoplay?: boolean
  customHeaders?: Record<string, string>
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  youtubeUrl,
  title = 'Video Player',
  controls = true,
  autoplay = false,
  customHeaders = {}
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoRef.current) return

    // If it's a YouTube URL, embed it
    if (youtubeUrl) {
      const videoId = extractYouTubeId(youtubeUrl)
      if (videoId) {
        return // Skip videojs setup for YouTube
      }
    }

    // Initialize Video.js player
    playerRef.current = videojs(videoRef.current, {
      controls,
      autoplay,
      preload: 'auto',
      width: '100%',
      height: 'auto',
      responsive: true,
      poster: '',
      plugins: {
        hlsjs: {
          targetLatency: 5
        }
      }
    })

    const player = playerRef.current

    // Handle HLS source with hls.js
    if (src && src.endsWith('.m3u8')) {
      if (HlsJs.isSupported()) {
        const hls = new HlsJs({
          autoStartLoad: true,
          startLevel: undefined, // Auto quality
          capLevelOnFPSDrop: true,
          capLevelToPlayerSize: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
          maxBufferHole: 0.5,
          xhrSetup: (xhr, url) => {
            // Add custom security headers to all HLS.js requests
            Object.entries(customHeaders).forEach(([key, value]) => {
              xhr.setRequestHeader(key, value)
            })
            
            // Debug logs removed for production
          }
        })

        hls.loadSource(src)
        hls.attachMedia(videoRef.current)

        hls.on(HlsJs.Events.MANIFEST_PARSED, () => {
          // Manifest parsed; quality levels available in hls.levels
        })

        hls.on(HlsJs.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case HlsJs.ErrorTypes.NETWORK_ERROR:
                console.error('Network error, retrying...')
                setError('Network error loading video')
                hls.startLoad()
                break
              case HlsJs.ErrorTypes.MEDIA_ERROR:
                console.error('Media error, retrying...')
                setError('Media error playing video')
                hls.recoverMediaError()
                break
              default:
                console.error('HLS error:', data)
                setError('Error loading video')
                break
            }
          }
        })

        // Cleanup
        return () => {
          hls.destroy()
          player.dispose()
        }
      } else {
        // Fallback to native HLS support
        player.src({ src, type: 'application/x-mpegURL' })
      }
    } else if (src) {
      // Regular video source
      player.src({ src, type: 'video/mp4' })
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [src, controls, autoplay, customHeaders])

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  // Render YouTube embed if applicable
  if (youtubeUrl) {
    const videoId = extractYouTubeId(youtubeUrl)
    if (videoId) {
      return (
        <div className="w-full aspect-video bg-black rounded overflow-hidden">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )
    }
  }

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Video Error</p>
          <p>{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        className="video-js vjs-default-skin w-full"
        data-setup='{"responsive": true}'
      />
    </div>
  )
}
