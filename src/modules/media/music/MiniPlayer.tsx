import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayer } from '@/contexts/PlayerContext'
import { SkeuoControls } from './SkeuoControls'
import { Timer, Clock, X, Heart } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const MiniPlayer = memo(function MiniPlayer() {
  const { state, showFullPlayer, setPlaying } = usePlayer()
  const track = state.currentTrack

  const [showTimerMenu, setShowTimerMenu] = useState(false)
  const [sleepMinutes, setSleepMinutes] = useState<number | null>(null)
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null)
  const [isLiked, setIsLiked] = useState(false)

  // Sleep Timer logic
  useEffect(() => {
    let interval: any = null
    
    if (sleepMinutes !== null && sleepMinutes > 0) {
      const endTime = Date.now() + sleepMinutes * 60 * 1000
      setSleepRemaining(sleepMinutes * 60)
      
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000))
        setSleepRemaining(remaining)
        
        if (remaining <= 0) {
          clearInterval(interval)
          setPlaying(false)
          setSleepMinutes(null)
          setSleepRemaining(null)
          setShowTimerMenu(false)
        }
      }, 1000)
    } else {
      setSleepRemaining(null)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sleepMinutes, setPlaying])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!track) return null

  return (
    <AnimatePresence>
      <motion.div
        id="mini-player"
        className="fixed bottom-[60px] left-3 right-3 z-40 cursor-pointer"
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={() => showFullPlayer(true)}
      >
        <div
          className="relative flex items-center gap-3 p-2.5 overflow-hidden"
          style={{
            borderRadius: '1rem',
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(24px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
            boxShadow: 'var(--shadow-elevated)',
            border: '1px solid var(--border-color)',
          }}
        >
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 4s infinite linear',
            }}
          />

          {/* Album art — spinning when playing (Stitch-style) */}
          <motion.div
            layoutId="player-album-art"
            className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden shadow-md relative"
            style={{ border: '1px solid var(--border-color)' }}
          >
            <img
              src={track.thumbnail}
              alt={track.title}
              className="w-full h-full object-cover"
              style={{
                animation: state.isPlaying ? 'spin 20s linear infinite' : 'none',
              }}
            />
          </motion.div>

          {/* Track info */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <motion.div layoutId="player-track-info">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {track.title}
              </p>
              <p className="text-[11px] truncate font-light" style={{ color: 'var(--text-tertiary)' }}>
                {track.channelTitle}
              </p>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => setIsLiked(!isLiked)}
              className="p-1.5 transition-colors"
              style={{ color: isLiked ? 'var(--accent)' : 'var(--text-tertiary)' }}
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
            </motion.button>

            <SkeuoControls compact />

            <button 
              onClick={() => setShowTimerMenu(!showTimerMenu)}
              className="p-1.5 transition-colors"
              style={{ color: sleepMinutes ? 'var(--accent)' : 'var(--text-tertiary)' }}
            >
              <Timer size={16} />
            </button>
          </div>

          {/* Progress bar at bottom */}
          <div
            className="absolute bottom-0 left-4 right-4 h-[2px] overflow-hidden"
            style={{ background: 'var(--border-color)', borderRadius: '1px' }}
          >
            <motion.div 
              className="h-full"
              style={{ width: `${state.progress}%`, background: 'var(--accent)', borderRadius: '1px' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
            />
          </div>
        </div>

        {/* Floating Timer Menu */}
        <AnimatePresence>
          {showTimerMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 right-0 mb-3 p-4 shadow-2xl z-50 overflow-hidden"
              style={{
                borderRadius: '1rem',
                background: 'var(--surface-card)',
                backdropFilter: 'blur(24px)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-elevated)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Sleep Timer</span>
                </div>
                {sleepRemaining !== null && (
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    {formatTime(sleepRemaining)}
                  </span>
                )}
                <button onClick={() => setShowTimerMenu(false)} style={{ color: 'var(--text-tertiary)' }}>
                  <X size={16} />
                </button>
              </div>

              {sleepMinutes ? (
                <button 
                  onClick={() => setSleepMinutes(null)}
                  className="w-full py-3 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(186,26,26,0.08)', color: 'var(--accent-danger)', border: '1px solid rgba(186,26,26,0.15)' }}
                >
                  Turn Off Timer
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map(min => (
                    <button 
                      key={min} 
                      onClick={() => setSleepMinutes(min)}
                      className="py-2.5 rounded-xl text-xs font-bold transition-colors"
                      style={{
                        background: 'var(--surface-container-high)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
})

export default MiniPlayer
