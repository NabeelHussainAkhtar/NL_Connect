import { useEffect, useRef, memo } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

interface VideoJSPlayerProps {
  src?:         string
  stream?:      MediaStream | null
  className?:   string
  onReady?:     (player: ReturnType<typeof videojs>) => void
}

const VideoJSPlayer = memo(function VideoJSPlayer({ src, stream, className = '', onReady }: VideoJSPlayerProps) {
  const videoRef  = useRef<HTMLDivElement>(null)
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null)

  useEffect(() => {
    if (!videoRef.current) return
    if (playerRef.current) return // Already initialized

    const videoEl = document.createElement('video-js')
    videoEl.classList.add('vjs-big-play-centered', 'vjs-skeuo-theme')
    videoRef.current.appendChild(videoEl)

    const player = playerRef.current = videojs(videoEl, {
      controls:    true,
      fluid:       true,
      preload:     'metadata', // Reduced from 'auto' for performance
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      sources:     src ? [{ src, type: guessType(src) }] : [],
    })

    player.ready(() => onReady?.(player))

    // --- Performance: Use IntersectionObserver to pause/unpause ---
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!player || player.isDisposed()) return
        if (!entry.isIntersecting) {
          player.pause()
        }
      })
    }, { threshold: 0.1 })

    if (videoRef.current) observer.observe(videoRef.current)

    return () => {
      observer.disconnect()
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update source
  useEffect(() => {
    const player = playerRef.current
    if (!player || player.isDisposed()) return
    if (src) player.src({ src, type: guessType(src) })
  }, [src])

  // Attach MediaStream (for WebRTC screen share)
  useEffect(() => {
    const player = playerRef.current
    if (!player || player.isDisposed() || !stream) return
    const el = player.tech({ IWillNotUseThisInPlugins: true })?.el?.() as HTMLVideoElement | undefined
    if (el) el.srcObject = stream
  }, [stream])

  return (
    <div
      className={`relative overflow-hidden rounded-skeuo-lg ${className}`}
      style={{ boxShadow: 'var(--shadow-skeuo-dark-card, var(--shadow-card))' }}
    >
      <div ref={videoRef} />
    </div>
  )
})

function guessType(src: string): string {
  if (src.includes('.m3u8'))   return 'application/x-mpegURL'
  if (src.includes('.mp4'))    return 'video/mp4'
  if (src.includes('.webm'))   return 'video/webm'
  return 'video/mp4'
}

export default VideoJSPlayer
