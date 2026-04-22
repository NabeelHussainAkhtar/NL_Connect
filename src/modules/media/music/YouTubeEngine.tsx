import { useEffect, useRef, useState, useMemo } from 'react'
import YouTube from 'react-youtube'
import { usePlayer } from '@/contexts/PlayerContext'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize, Minimize, Play, Pause, SkipBack, SkipForward, Volume2, Sun, Music } from 'lucide-react'
interface YouTubeEngineProps {
  onApiReady: (api: ReturnType<typeof useYouTubePlayer>['api']) => void
}

export default function YouTubeEngine({ onApiReady }: YouTubeEngineProps) {
  const { state, setPlaying, setProgress, setDuration, skipNext, skipPrev, loadTrack, setVolume, setVideoFullScreen, setBrightness } = usePlayer()
  const { api: ytApi, onReady: handleReady } = useYouTubePlayer()
  const audioRef = useRef<HTMLAudioElement>(null)
  const silentRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const SILENT_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="
  
  // Abstracted API supporting both YouTube and Local Audio
  const api = useMemo(() => ({
    get isReady() { return state.currentTrack?.isLocal ? !!audioRef.current : ytApi.isReady },
    play: () => state.currentTrack?.isLocal ? audioRef.current?.play() : ytApi.play(),
    pause: () => state.currentTrack?.isLocal ? audioRef.current?.pause() : ytApi.pause(),
    seekTo: (s: number) => state.currentTrack?.isLocal ? (audioRef.current && (audioRef.current.currentTime = s)) : ytApi.seekTo(s),
    setVolume: (v: number) => state.currentTrack?.isLocal ? (audioRef.current && (audioRef.current.volume = v / 100)) : ytApi.setVolume(v),
    getDuration: () => state.currentTrack?.isLocal ? (audioRef.current?.duration || 0) : ytApi.getDuration(),
    getCurrentTime: () => state.currentTrack?.isLocal ? (audioRef.current?.currentTime || 0) : ytApi.getCurrentTime()
  }), [state.currentTrack?.isLocal, ytApi])
  
  // Fullscreen states
  const [showControls, setShowControls] = useState(false)
  const lastTapRef = useRef<{ time: number, side: 'left'|'right'|null }>({ time: 0, side: null })
  const touchStartRef = useRef({ y: 0, val: 0 })
  const [feedbackOverlay, setFeedbackOverlay] = useState<{icon: any, text: string} | null>(null)

  // Expose api to parent
  useEffect(() => { onApiReady(api) }, [api, onApiReady])

  // Sync play/pause commands
  useEffect(() => {
    if (!api.isReady) return
    if (state.isPlaying) {
      api.play()
      silentRef.current?.play().catch(() => {})
    } else {
      api.pause()
      silentRef.current?.pause()
    }
  }, [state.isPlaying, api])

  // Sync volume
  useEffect(() => {
    if (api.isReady) api.setVolume(state.volume)
  }, [state.volume, api])

  // Progress loop via setInterval (more reliable in background than rAF)
  useEffect(() => {
    if (!api.isReady || !state.isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const update = () => {
      const duration = api.getDuration()
      const current = api.getCurrentTime()
      if (duration > 0) {
        const progressPercent = (current / duration) * 100
        setProgress(progressPercent)
        setDuration(duration)

        // Auto-skip logic
        if (progressPercent > 99.5 && duration > 20) {
          skipNext()
        }
      }
    }

    timerRef.current = setInterval(update, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [api, state.isPlaying, setProgress, setDuration, skipNext])

  // Media Session API for Background Playback
  useEffect(() => {
    if (!('mediaSession' in navigator) || !state.currentTrack) return

    const track = state.currentTrack
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.title,
      artist: track.channelTitle || 'N&L Connect',
      album: 'N&L Music',
      artwork: [
        { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        { src: track.thumbnail, sizes: '192x192', type: 'image/jpeg' },
      ],
    })

    navigator.mediaSession.setActionHandler('play', () => {
      setPlaying(true)
      api.play()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      setPlaying(false)
      api.pause()
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      skipPrev()
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      skipNext()
    })

    // Update position state for OS lockscreen slider
    if (api.isReady) {
      const duration = api.getDuration()
      const current = api.getCurrentTime()
      if (duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: current
        })
      }
    }
  }, [state.currentTrack, state.isPlaying, api, setPlaying, skipNext, skipPrev])

  // Handle Global Room Sync
  useEffect(() => {
    const handleSync = (e: any) => {
      const { videoId, isPlaying, currentTime, mode } = e.detail
      
      // Strict Mode Control: Ignore music packets if in video room mode
      if (mode && mode !== 'music') return

      // Robust Track Synchronization: If we are on a different video, FORCE load it now.
      if (videoId && state.currentTrack?.videoId !== videoId) {
        console.log("Sync mismatch: Loading track", videoId)
        // Check if track is in playlist
        const targetTrack = state.playlist.find(t => t.videoId === videoId)
        if (targetTrack) {
          loadTrack(targetTrack)
        } else {
          // Fallback loader for remote tracks not in local playlist
          loadTrack({ 
            videoId, 
            title: 'Remote Syced Track', 
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, 
            channelTitle: 'Synced from friend' 
          })
        }
        // Early return ensures we don't try to seek on an unready player; 
        // the next sync poll will handle position.
        return 
      }
      
      if (api.isReady) {
        // Sync position if drift is > 2 seconds
        const delta = Math.abs(api.getCurrentTime() - currentTime)
        if (delta > 2) {
          api.seekTo(currentTime)
        }
        
        // Sync play/pause state
        if (isPlaying && !state.isPlaying) setPlaying(true)
        if (!isPlaying && state.isPlaying) setPlaying(false)
        
        // Direct API backup
        if (isPlaying) api.play()
        else api.pause()
      }
    }

    window.addEventListener('room-sync' as any, handleSync)
    return () => window.removeEventListener('room-sync' as any, handleSync)
  }, [api, state.currentTrack, state.playlist, loadTrack, setPlaying, state.isPlaying])

  // Hide controls after 3 seconds
  useEffect(() => {
    if (!showControls) return
    const id = setTimeout(() => setShowControls(false), 3000)
    return () => clearTimeout(id)
  }, [showControls, state.isPlaying])

  // Gesture Handlers
  const handleTap = (side: 'left' | 'right') => {
    const now = Date.now()
    if (now - lastTapRef.current.time < 300 && lastTapRef.current.side === side) {
      // Double tap
      if (api.isReady) {
        const ct = api.getCurrentTime()
        const delta = side === 'right' ? 15 : -15
        api.seekTo(ct + delta)
        setFeedbackOverlay({ icon: side === 'right' ? SkipForward : SkipBack, text: `${side === 'right' ? '+' : ''}${delta}s` })
        setTimeout(() => setFeedbackOverlay(null), 800)
      }
      lastTapRef.current = { time: 0, side: null }
    } else {
      // Single tap
      setShowControls(prev => !prev)
      lastTapRef.current = { time: now, side }
    }
  }

  const handleTouchStart = (e: React.TouchEvent, side: 'left'|'right', currentVal: number) => {
    touchStartRef.current = { y: e.touches[0].clientY, val: currentVal }
  }

  const handleTouchMove = (e: React.TouchEvent, side: 'left'|'right') => {
    const deltaY = touchStartRef.current.y - e.touches[0].clientY
    const percentChange = (deltaY / window.innerHeight) * 150 // 150% multiplier for easier sliding
    const newVal = Math.max(0, Math.min(100, touchStartRef.current.val + percentChange))
    if (side === 'right') {
      setVolume(newVal)
      setFeedbackOverlay({ icon: Volume2, text: `${Math.round(newVal)}%` })
    } else {
      setBrightness(newVal / 100)
      setFeedbackOverlay({ icon: Sun, text: `${Math.round(newVal)}%` })
    }
  }

  const handleTouchEnd = () => {
    setTimeout(() => setFeedbackOverlay(null), 500)
  }

  // Calculate Layout Styles
  const isMini = !state.isFullPlayerVisible
  const isFullMusic = state.isFullPlayerVisible && state.isMusicMode
  const isVideoMini = state.isFullPlayerVisible && !state.isMusicMode && !state.isVideoFullScreen
  const isFullScreenVideo = state.isFullPlayerVisible && !state.isMusicMode && state.isVideoFullScreen

  return (
    <>
      {/* Global Brightness Overlay */}
      {state.brightness < 1 && (
        <div 
          className="fixed inset-0 z-[9999] pointer-events-none" 
          style={{ background: `rgba(0,0,0, ${1 - state.brightness})` }} 
        />
      )}

      <div
        aria-hidden={state.isMusicMode ? "true" : "false"}
        className="transition-all duration-500"
        style={{ 
          position: (isVideoMini || isFullScreenVideo) ? 'fixed' : 'absolute', 
          top: isFullScreenVideo ? 0 : (isVideoMini ? '120px' : 0),
          left: isFullScreenVideo ? 0 : (isVideoMini ? '50%' : 0),
          transform: isFullScreenVideo ? 'none' : (isVideoMini ? 'translateX(-50%)' : 'none'),
          width: isFullScreenVideo ? '100vw' : (isVideoMini ? 'calc(100vw - 48px)' : 0), 
          height: isFullScreenVideo ? '100vh' : 'auto',
          maxWidth: isFullScreenVideo ? 'none' : (isVideoMini ? '320px' : 0),
          aspectRatio: isFullScreenVideo ? 'auto' : '16/9',
          overflow: 'hidden', 
          pointerEvents: (isVideoMini || isFullScreenVideo) ? 'auto' : 'none', 
          zIndex: isFullScreenVideo ? 999 : (isVideoMini ? 100 : -1),
          borderRadius: isFullScreenVideo ? '0' : '2rem',
          boxShadow: isVideoMini ? '0 20px 50px rgba(0,0,0,0.3)' : 'none',
          background: 'black'
        }}
      >
        {state.currentTrack?.isLocal ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black relative pointer-events-none">
            <audio 
              ref={audioRef}
              src={state.currentTrack.localUrl}
              onEnded={() => skipNext()}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  setDuration(audioRef.current.duration)
                  audioRef.current.volume = state.volume / 100
                  if (state.isPlaying) audioRef.current.play()
                }
              }}
              className="hidden"
            />
            {state.currentTrack.thumbnail ? (
              <img src={state.currentTrack.thumbnail} className="w-full h-full object-cover opacity-60 blur-2xl" />
            ) : (
              <Music size={64} className="text-white/20" />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute z-10 w-[40%] max-w-[200px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center" style={{ background: 'var(--surface-sunken)' }}>
               {state.currentTrack.thumbnail ? (
                 <img src={state.currentTrack.thumbnail} className="w-full h-full object-cover" />
               ) : (
                 <Music size={48} className="text-[var(--accent)]" />
               )}
            </div>
          </div>
        ) : (
          <YouTube
            videoId={state.currentTrack?.videoId ?? ''}
            onReady={handleReady}
            onStateChange={e => {
              // YT.PlayerState: ENDED=0, PLAYING=1, PAUSED=2
              if (e.data === 0) skipNext()
              if (e.data === 1) setPlaying(true)
              if (e.data === 2) setPlaying(false)
            }}
            onError={() => skipNext()}
            opts={{
              host: 'https://www.youtube.com',
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: state.isPlaying ? 1 : 0,
                controls: 0,
                disablekb: 1,
                modestbranding: 1,
                rel: 0,
                iv_load_policy: 3,
                enablejsapi: 1,
                origin: window.location.origin,
              },
            }}
            className="w-full h-full pointer-events-none" // Disable native interactions to allow our gestures
            iframeClassName="w-full h-full pointer-events-none"
          />
        )}

        {/* Silent Loop to keep WebView alive in background */}
        <audio 
          ref={silentRef}
          src={SILENT_WAV}
          loop
          className="hidden"
        />

        {/* Gestures and UI Overlays for Video Mode */}
        {(isVideoMini || isFullScreenVideo) && (
          <div className="absolute inset-0 z-10 flex">
            {/* Left Touch Zone (Brightness / Skip Back) */}
            <div 
              className="flex-1 h-full"
              onTouchStart={(e) => handleTouchStart(e, 'left', state.brightness * 100)}
              onTouchMove={(e) => handleTouchMove(e, 'left')}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => { e.stopPropagation(); handleTap('left') }}
            />
            {/* Right Touch Zone (Volume / Skip Forward) */}
            <div 
              className="flex-1 h-full"
              onTouchStart={(e) => handleTouchStart(e, 'right', state.volume)}
              onTouchMove={(e) => handleTouchMove(e, 'right')}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => { e.stopPropagation(); handleTap('right') }}
            />

            {/* Controls UI */}
            <AnimatePresence>
              {showControls && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 pointer-events-none flex flex-col justify-center items-center"
                >
                  <div className="flex items-center gap-10 pointer-events-auto">
                     <button onClick={(e) => { e.stopPropagation(); skipPrev() }} className="text-white hover:text-[var(--accent)] active:scale-90 transition-all">
                       <SkipBack size={48} fill="currentColor" />
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); state.isPlaying ? api.pause() : api.play() }} className="text-white hover:text-[var(--accent)] active:scale-90 transition-all">
                       {state.isPlaying ? <Pause size={64} fill="currentColor" /> : <Play size={64} fill="currentColor" />}
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); skipNext() }} className="text-white hover:text-[var(--accent)] active:scale-90 transition-all">
                       <SkipForward size={48} fill="currentColor" />
                     </button>
                  </div>

                  {/* Top Bar */}
                  <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
                     <h3 className="text-white font-bold text-lg truncate max-w-[70%] drop-shadow-md">{state.currentTrack?.title}</h3>
                     <button 
                       onClick={(e) => { e.stopPropagation(); setVideoFullScreen(!state.isVideoFullScreen) }}
                       className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
                     >
                       {state.isVideoFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
                     </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-auto bg-gradient-to-t from-black/80 to-transparent">
                     <div 
                       className="w-full h-2 rounded-full bg-white/30 cursor-pointer overflow-hidden relative"
                       onClick={(e) => {
                         e.stopPropagation()
                         const rect = e.currentTarget.getBoundingClientRect()
                         const pct = (e.clientX - rect.left) / rect.width
                         api.seekTo(pct * state.duration)
                       }}
                     >
                       <div className="h-full bg-[var(--accent)]" style={{ width: `${state.progress}%` }} />
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transient Feedback Overlay (Volume/Brightness/Seek) */}
            <AnimatePresence>
              {feedbackOverlay && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-md px-6 py-4 rounded-3xl flex flex-col items-center justify-center pointer-events-none"
                >
                   <feedbackOverlay.icon size={32} className="text-white mb-2" />
                   <span className="text-white font-bold tracking-widest">{feedbackOverlay.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}
      </div>
    </>
  )
}
