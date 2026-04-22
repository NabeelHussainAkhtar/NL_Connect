import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw } from 'lucide-react'
import { usePlayer } from '@/contexts/PlayerContext'

const PlayPauseBtn = memo(function PlayPauseBtn({
  isPlaying, onToggle, size = 'lg',
}: { isPlaying: boolean; onToggle: () => void; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-14 h-14' : 'w-8 h-8'
  const iconSize = size === 'lg' ? 24 : 14
  return (
    <motion.button
      id="btn-play-pause"
      className={`${dim} rounded-full flex items-center justify-center text-white`}
      style={{ background: 'var(--accent)', boxShadow: '0 4px 12px rgba(79,125,255,0.4)' }}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {isPlaying
        ? <Pause size={iconSize} fill="white" />
        : <Play size={iconSize} fill="white" className="ml-0.5" />
      }
    </motion.button>
  )
})

export const SkeuoControls = memo(function SkeuoControls({ compact }: { compact?: boolean }) {
  const { state, togglePlay, skipNext, skipPrev, setProgress, setVolume, playerApiRef } = usePlayer()

  const handleSeek = useCallback((e: any) => {
    const percentage = Number(e.target.value)
    if (playerApiRef.current) {
      const targetTime = (percentage / 100) * state.duration
      playerApiRef.current.seekTo(targetTime)
    }
    setProgress(percentage)
  }, [setProgress, state.duration, playerApiRef])

  const jumpTime = useCallback((seconds: number) => {
    if (playerApiRef.current) {
      const currentTime = playerApiRef.current.getCurrentTime()
      playerApiRef.current.seekTo(currentTime + seconds)
    }
  }, [playerApiRef])

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <motion.button 
          whileTap={{ scale: 0.8 }} 
          onClick={skipPrev} 
          style={{ color: 'var(--text-secondary)' }}
          className="transition-opacity hover:opacity-100 opacity-70"
        >
          <SkipBack size={16} fill="currentColor" />
        </motion.button>
        <PlayPauseBtn isPlaying={state.isPlaying} onToggle={togglePlay} size="sm" />
        <motion.button 
          whileTap={{ scale: 0.8 }} 
          onClick={skipNext} 
          style={{ color: 'var(--text-secondary)' }}
          className="transition-opacity hover:opacity-100 opacity-70"
        >
          <SkipForward size={16} fill="currentColor" />
        </motion.button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Progress bar */}
      <div className="w-full space-y-1">
        <div className="relative group w-full h-1.5 flex items-center">
          <input
            id="music-progress"
            type="range"
            min={0} max={100}
            step="0.1"
            value={state.progress || 0}
            onChange={handleSeek}
            onInput={handleSeek}
            className="absolute w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer z-10"
            style={{
              background: `linear-gradient(to right, #fff ${state.progress}%, rgba(255,255,255,0.2) ${state.progress}%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/50 font-bold uppercase tracking-wider">
          <span>{formatTime((state.progress / 100) * state.duration || 0)}</span>
          <span>{formatTime(state.duration || 0)}</span>
        </div>
      </div>

      {/* Transport buttons */}
      <div className="flex items-center justify-between w-full mt-2">
        <button onClick={() => jumpTime(-10)} className="text-white/40 hover:text-white transition-all">
          <RotateCcw size={20} />
        </button>
        
        <div className="flex items-center gap-8">
          <button className="text-white/80 hover:text-white transition-all active:scale-90" onClick={skipPrev}>
            <SkipBack size={28} fill="currentColor" />
          </button>

          <PlayPauseBtn isPlaying={state.isPlaying} onToggle={togglePlay} size="lg" />

          <button className="text-white/80 hover:text-white transition-all active:scale-90" onClick={skipNext}>
            <SkipForward size={28} fill="currentColor" />
          </button>
        </div>

        <button onClick={() => jumpTime(10)} className="text-white/40 hover:text-white transition-all">
          <RotateCw size={20} />
        </button>
      </div>
    </div>
  )
})

function formatTime(s: number): string {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
