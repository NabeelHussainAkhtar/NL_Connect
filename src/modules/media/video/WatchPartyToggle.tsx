import { memo, useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebRTC } from '@/hooks/useWebRTC'
import { Tv2, AlertCircle, Link as LinkIcon, Copy, Check, Users } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

interface WatchPartyToggleProps {
  onStreamReady: (stream: MediaStream | null) => void
}

const BASE_URL = 'https://nl-connect.pages.dev'

const WatchPartyToggle = memo(function WatchPartyToggle({ onStreamReady }: WatchPartyToggleProps) {
  const {
    isWatchPartyActive, isUnavailable, error, roomId, remoteStream,
    startScreenShare, stopScreenShare, localStream, joinWatchParty, disconnect
  } = useWebRTC()

  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  // Auto-join from URL
  useEffect(() => {
    const watchParam = searchParams.get('watch')
    if (watchParam && !remoteStream && !isWatchPartyActive) {
      setJoinCode(watchParam.toUpperCase())
      // Add slight delay to ensure peer is ready before calling
      setTimeout(() => joinWatchParty(watchParam.toUpperCase()), 1000)
    }
  }, [searchParams, remoteStream, isWatchPartyActive, joinWatchParty])

  // Pass latest streams up to Media.tsx
  useEffect(() => {
    if (localStream) onStreamReady(localStream)
    else if (remoteStream) onStreamReady(remoteStream)
    else onStreamReady(null)
  }, [localStream, remoteStream, onStreamReady])

  const handleToggle = useCallback(async () => {
    if (isUnavailable) return
    if (isWatchPartyActive) {
      disconnect()
    } else {
      await startScreenShare()
    }
  }, [isUnavailable, isWatchPartyActive, startScreenShare, disconnect])

  const handleCopyLink = () => {
    if (!roomId) return
    const link = `${BASE_URL}/media?watch=${roomId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoin = () => {
    if (!joinCode.trim()) return
    joinWatchParty(joinCode.trim().toUpperCase())
    setSearchParams({ watch: joinCode.trim().toUpperCase() })
    setJoinCode('')
  }

  const handleDisconnect = () => {
    disconnect()
    searchParams.delete('watch')
    setSearchParams(searchParams)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tv2 size={16} style={{ color: isWatchPartyActive ? 'var(--accent)' : 'var(--text-secondary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Host Watch Party
          </span>
          {isUnavailable && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--surface-card)', color: 'var(--text-tertiary)' }}>
              Unavailable
            </span>
          )}
        </div>

        {/* Toggle switch */}
        <motion.button
          id="watch-party-toggle"
          className={`skeuo-toggle-track ${localStream ? 'active' : ''}`}
          onClick={handleToggle}
          disabled={isUnavailable || !!remoteStream} // Disable hosting if we are currently watching someone else
          aria-label="Toggle Watch Party"
          whileTap={(isUnavailable || !!remoteStream) ? {} : { scale: 0.95 }}
          style={{ opacity: (isUnavailable || !!remoteStream) ? 0.5 : 1, cursor: (isUnavailable || !!remoteStream) ? 'not-allowed' : 'pointer' }}
        >
          <div className="skeuo-toggle-nub" />
        </motion.button>
      </div>

      {isUnavailable && (
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          <AlertCircle size={11} />
          <span>Screen sharing unavailable in this browser/device</span>
        </div>
      )}
      {error && !isUnavailable && (
        <p className="text-[11px]" style={{ color: 'var(--accent-danger)' }}>{error}</p>
      )}

      {/* Connection Info / Form */}
      <AnimatePresence>
        {isWatchPartyActive && localStream && roomId && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-2">
            <div className="bg-[var(--surface-sunken)] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <LinkIcon size={14} className="text-[var(--text-secondary)]" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Your Room Code</span>
                </div>
                <code className="text-sm font-bold text-[var(--text-primary)] bg-black/10 dark:bg-white/10 px-2 py-1 rounded tracking-widest">{roomId}</code>
              </div>
              <div className="flex gap-2">
                <input readOnly value={`${BASE_URL}/media?watch=${roomId}`}
                  className="flex-1 text-xs bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-secondary)] truncate" />
                <button onClick={handleCopyLink}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 active:scale-95 transition-all">
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <p className="text-[11px] font-medium mt-2" style={{ color: 'var(--accent-success)' }}>
              ● Broadcasting your screen to party members
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!localStream && (
        <div className="bg-[var(--surface-sunken)] rounded-xl p-3 mt-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[var(--text-secondary)]" />
              <span className="text-xs font-medium text-[var(--text-secondary)]">Join a Stream</span>
            </div>
            {remoteStream && (
              <button onClick={handleDisconnect} className="text-[10px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-500 transition-colors hover:bg-red-500/30">
                Leave
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter room code..."
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              disabled={!!remoteStream}
              className="flex-1 text-xs bg-transparent border border-[var(--border-color)] rounded-lg px-3 py-2 outline-none tracking-widest font-bold disabled:opacity-50"
              style={{ color: 'var(--text-primary)' }}
            />
            <button onClick={handleJoin} disabled={joinCode.length < 4 || !!remoteStream}
              className="text-xs font-bold px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-color)] disabled:opacity-50 active:scale-95 transition-all"
              style={{ color: 'var(--text-primary)' }}>
              Join
            </button>
          </div>
          {remoteStream && (
            <p className="text-[11px] font-medium mt-2" style={{ color: 'var(--accent)' }}>
              ● Receiving stream
            </p>
          )}
        </div>
      )}
    </div>
  )
})

export default WatchPartyToggle
