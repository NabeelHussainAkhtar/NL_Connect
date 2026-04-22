import { memo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayer } from '@/contexts/PlayerContext'
import { 
  Users, ChevronDown, MoreVertical, Clock, Heart, Share2, 
  Music2, Video as VideoIcon, Volume2, X, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Cast, ListMusic, VolumeX
} from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'

import { Maximize } from 'lucide-react'

export const FullPlayerOverlay = memo(function FullPlayerOverlay() {
  const { state, showFullPlayer, setPlaying, setMusicMode, togglePlay, skipNext, skipPrev, setProgress, playerApiRef, toggleShuffle, toggleRepeat, setVolume, setVideoFullScreen } = usePlayer()
  const { roomId, connections, createRoom, joinRoom, disconnect } = useRoom()
  
  const [showSyncPopup, setShowSyncPopup] = useState(false)
  const [showTimerSelector, setShowTimerSelector] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [timerLeft, setTimerLeft] = useState<number | null>(null)

  useEffect(() => {
    if (timerLeft === null) return
    if (timerLeft <= 0) {
      state.isPlaying && setPlaying(false)
      setTimerLeft(null)
      return
    }
    const id = setInterval(() => setTimerLeft(prev => (prev ? prev - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [timerLeft, state.isPlaying, setPlaying])

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60)
    const rs = Math.floor(s % 60)
    return `${m}:${rs.toString().padStart(2, '0')}`
  }

  const handleSeek = useCallback((e: any) => {
    // This is for the input range
    const percentage = Number(e.target.value)
    if (playerApiRef.current) {
      const targetTime = (percentage / 100) * state.duration
      playerApiRef.current.seekTo(targetTime)
    }
    setProgress(percentage)
  }, [setProgress, state.duration, playerApiRef])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // This is for clicking the custom progress bar track
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    if (playerApiRef.current) {
      const targetTime = (percentage / 100) * state.duration
      playerApiRef.current.seekTo(targetTime)
    }
    setProgress(percentage)
  }, [setProgress, state.duration, playerApiRef])

  const track = state.currentTrack

  return (
    <AnimatePresence>
      {state.isFullPlayerVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col overflow-hidden text-[var(--text-primary)]"
          style={{ background: 'var(--surface)' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
        >
          {/* Header */}
          <header 
            className="relative z-10 flex items-center justify-between px-6 w-full flex-shrink-0"
            style={{ 
              height: 'calc(4rem + env(safe-area-inset-top))',
              paddingTop: 'env(safe-area-inset-top)' 
            }}
          >
            <button 
              onClick={() => showFullPlayer(false)}
              className="p-2 transition-colors active:scale-95 text-[var(--text-tertiary)] hover:text-[var(--accent)]"
            >
              <ChevronDown size={28} strokeWidth={2.5} />
            </button>

            <div className="flex bg-[var(--surface-container-high)] rounded-full p-1 border border-[var(--border-color)] w-[180px] justify-between shadow-sm">
               <button 
                onClick={() => setMusicMode(true)}
                className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-colors w-1/2 ${state.isMusicMode ? 'bg-[var(--surface-card)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                style={{ background: state.isMusicMode ? 'var(--surface-card)' : 'transparent', color: state.isMusicMode ? 'var(--accent)' : 'var(--text-tertiary)' }}
               >
                 <Music2 size={16} /> Music
               </button>
               <button 
                onClick={() => setMusicMode(false)}
                className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-colors w-1/2 ${!state.isMusicMode ? 'bg-[var(--surface-card)] text-[var(--accent)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                style={{ background: !state.isMusicMode ? 'var(--surface-card)' : 'transparent', color: !state.isMusicMode ? 'var(--accent)' : 'var(--text-tertiary)' }}
               >
                 <VideoIcon size={16} /> Video
               </button>
            </div>

            <button className="p-2 transition-colors active:scale-95 text-[var(--text-tertiary)] hover:text-[var(--accent)]">
              <MoreVertical size={24} />
            </button>
          </header>

          <main className="flex-1 flex flex-col pt-8 pb-8 px-6 overflow-y-auto w-full max-w-[600px] mx-auto relative z-10">
            
            {/* Album Art / Video Container */}
            <div className="flex-1 flex items-center justify-center min-h-[250px] mb-8 relative">
              <div 
                className="absolute inset-0 blur-[80px] rounded-full z-0 pointer-events-none"
                style={{ background: 'var(--accent)', opacity: 0.15 }}
              />
              <AnimatePresence mode="wait">
                {state.isMusicMode ? (
                  <motion.div 
                    key="artwork"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative z-10 w-full max-w-[320px] aspect-square rounded-[2rem] overflow-hidden shadow-2xl group border border-[var(--border-color)]"
                    style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
                  >
                    <img 
                      src={track?.thumbnail} 
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      alt={track?.title}
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="video"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="relative z-10 w-full max-w-[320px] aspect-video rounded-[2rem] overflow-hidden flex items-center justify-center border border-transparent"
                  >
                     {/* The actual YouTube iframe will overlay here from YouTubeEngine.tsx */}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Only show music controls if in Music Mode */}
            {state.isMusicMode ? (
              <>
                {/* Track Info */}
                <div className="mb-6 flex flex-col items-center text-center">
                  <h2 className="text-2xl md:text-3xl font-black truncate w-full" style={{ color: 'var(--text-primary)' }}>
                    {track?.title || 'Unknown Audio'}
                  </h2>
                  <p className="text-lg font-medium truncate w-full mt-1" style={{ color: 'var(--accent)', opacity: 0.9 }}>
                    {track?.channelTitle || 'Discover something new'}
                  </p>
                </div>

                {/* Action Bar */}
                <div className="flex justify-between items-center mb-8 px-2 w-full">
                  <button 
                    onClick={() => setIsLiked(!isLiked)}
                    className="p-2 transition-colors active:scale-90"
                    style={{ color: isLiked ? 'var(--accent)' : 'var(--text-tertiary)' }}
                  >
                    <Heart size={28} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  </button>

                  <button 
                    onClick={() => setShowSyncPopup(true)}
                    className="transition-colors active:scale-90 border rounded-full w-12 h-12 flex items-center justify-center shadow-sm"
                    style={{ 
                      background: roomId ? 'var(--accent)' : 'transparent',
                      borderColor: roomId ? 'var(--accent)' : 'var(--border-color)',
                      color: roomId ? 'white' : 'var(--text-primary)' 
                    }}
                  >
                    <Users size={22} fill={roomId ? 'currentColor' : 'none'} />
                  </button>

                  <button 
                    onClick={() => setShowTimerSelector(true)}
                    className="transition-colors active:scale-90 border rounded-full w-12 h-12 flex items-center justify-center shadow-sm"
                    style={{ 
                      background: timerLeft !== null ? 'var(--accent)' : 'transparent',
                      borderColor: timerLeft !== null ? 'var(--accent)' : 'var(--border-color)',
                      color: timerLeft !== null ? 'white' : 'var(--text-primary)' 
                    }}
                  >
                    <Clock size={22} fill={timerLeft !== null ? 'currentColor' : 'none'} />
                  </button>

                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: track?.title || 'NL Connect Track', text: 'Listen to this track on NL Connect!', url: window.location.href })
                          .catch(() => alert('Failed to share'))
                      } else {
                        alert('Share feature is not supported on this browser.')
                      }
                    }}
                    className="p-2 transition-colors active:scale-90 text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                  >
                    <Share2 size={28} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 w-full flex flex-col">
                  <div 
                    className="w-full h-2 rounded-full overflow-hidden cursor-pointer relative"
                    style={{ background: 'var(--surface-container-high)' }}
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-linear"
                      style={{ width: `${state.progress || 0}%`, background: 'var(--accent)' }}
                    />
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md transition-all duration-100 ease-linear"
                      style={{ left: `${state.progress || 0}%`, background: 'white', transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-black tracking-widest text-[var(--text-tertiary)]">
                    <span>{formatTimer((state.progress / 100) * state.duration || 0)}</span>
                    <span>{formatTimer(state.duration || 0)}</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex justify-between items-center mb-10 px-4 w-full">
                  <button 
                    onClick={toggleShuffle} 
                    className={`p-2 transition-colors active:scale-90 ${state.isShuffle ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                  >
                    <Shuffle size={24} />
                  </button>
                  
                  <button onClick={skipPrev} className="p-3 transition-colors active:scale-90 text-[var(--text-primary)] hover:text-[var(--accent)]">
                    <SkipBack size={36} fill="currentColor" strokeWidth={1.5} />
                  </button>

                  {/* Play/Pause Button */}
                  <button 
                    onClick={togglePlay}
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 group"
                    style={{ background: 'var(--accent)', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
                  >
                    {state.isPlaying ? (
                      <Pause size={36} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                    ) : (
                      <Play size={36} fill="currentColor" className="ml-1 group-hover:scale-110 transition-transform" />
                    )}
                  </button>

                  <button onClick={skipNext} className="p-3 transition-colors active:scale-90 text-[var(--text-primary)] hover:text-[var(--accent)]">
                    <SkipForward size={36} fill="currentColor" strokeWidth={1.5} />
                  </button>

                  <button 
                    onClick={toggleRepeat}
                    className={`p-2 transition-colors active:scale-90 ${state.isRepeat ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                  >
                    <Repeat size={24} />
                  </button>
                </div>

                {/* Extra Controls */}
                <div 
                  className="flex items-center gap-4 mt-auto p-4 rounded-2xl w-full flex-shrink-0"
                  style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
                >
                  <button onClick={() => alert('Casting is not available on this network.')}>
                    <Cast size={20} className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors" />
                  </button>
                  <div className="flex-1 flex items-center gap-3">
                    <VolumeX size={16} className="text-[var(--text-tertiary)]" />
                    <div 
                      className="flex-1 h-2 rounded-full overflow-hidden cursor-pointer relative" 
                      style={{ background: 'var(--surface-container-high)' }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setVolume(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
                      }}
                    >
                      <div className="h-full rounded-full transition-all" style={{ width: `${state.volume}%`, background: 'var(--accent)' }} />
                    </div>
                    <Volume2 size={16} className="text-[var(--text-tertiary)]" />
                  </div>
                  <button onClick={() => alert('Playlist view coming soon!')}>
                    <ListMusic size={20} className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-start items-center pt-8 w-full">
                 <button 
                   onClick={() => setVideoFullScreen(true)}
                   className="w-full py-4 text-white rounded-2xl font-bold uppercase tracking-widest transition-all active:scale-95 flex justify-center items-center gap-2 shadow-lg" 
                   style={{ background: 'var(--accent)' }}
                 >
                   <Maximize size={20} /> ENTER FULL SCREEN
                 </button>
              </div>
            )}

          </main>

          {/* Overlays */}
          <AnimatePresence>
            {showSyncPopup && (
              <Overlay title="Listen Together" onClose={() => setShowSyncPopup(false)}>
                 {!roomId ? (
                    <div className="space-y-4">
                       <button onClick={createRoom} className="w-full py-4 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-90 shadow-lg" style={{ background: 'var(--accent)' }}>
                         Start Session
                       </button>
                       <div className="flex gap-2">
                          <input 
                            placeholder="INVITE CODE" 
                            className="flex-1 border rounded-2xl px-4 py-4 text-xs font-bold uppercase tracking-widest outline-none min-w-0"
                            style={{ background: 'var(--surface-container-high)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value.toUpperCase())}
                          />
                          <button onClick={() => joinRoom(joinCode)} className="px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors flex-shrink-0 shadow-sm hover:opacity-90" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
                            Join
                          </button>
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'var(--surface-container-high)', border: '1px solid var(--border-color)' }}>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>Session ID</p>
                             <p className="text-xl font-black tracking-widest" style={{ color: 'var(--text-primary)' }}>{roomId}</p>
                          </div>
                       </div>
                       <div className="flex items-center justify-between px-2">
                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{connections.length + 1} connected</span>
                          <button onClick={() => disconnect()} className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--accent-danger, #ff4444)' }}>End Session</button>
                       </div>
                    </div>
                 )}
              </Overlay>
            )}

            {showTimerSelector && (
              <Overlay title="Sleep Timer" onClose={() => setShowTimerSelector(false)}>
                <div className="grid grid-cols-3 gap-3">
                  {[15, 30, 45, 60, 90, 0].map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        setTimerLeft(m === 0 ? null : m * 60)
                        setShowTimerSelector(false)
                      }}
                      className="py-5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                      style={{ 
                        background: ((timerLeft || 0) / 60 === m) ? 'var(--accent)' : 'var(--surface-container-high)', 
                        color: ((timerLeft || 0) / 60 === m) ? 'white' : 'var(--text-primary)',
                        border: `1px solid ${((timerLeft || 0) / 60 === m) ? 'var(--accent)' : 'var(--border-color)'}`
                      }}
                    >
                      {m === 0 ? 'OFF' : `${m}M`}
                    </button>
                  ))}
                </div>
                {timerLeft !== null && (
                  <p className="text-center text-[10px] font-black uppercase mt-6 tracking-[0.2em] animate-pulse" style={{ color: 'var(--accent)' }}>
                    Stopping in {formatTimer(timerLeft)}
                  </p>
                )}
              </Overlay>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

function Overlay({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
       <motion.div
         initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }}
         className="w-full max-w-[360px] rounded-[2rem] p-6 shadow-2xl relative"
         style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
         onClick={e => e.stopPropagation()}
       >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              <h3 className="font-bold tracking-[0.2em] text-xs uppercase" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            </div>
            <button onClick={onClose} className="transition-colors hover:text-white" style={{ color: 'var(--text-tertiary)' }}>
              <X size={20} />
            </button>
          </div>
          {children}
       </motion.div>
    </motion.div>
  )
}
