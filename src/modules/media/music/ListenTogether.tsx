import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Volume2, LogOut } from 'lucide-react'
import { usePlayer } from '@/contexts/PlayerContext'
import { useRoom } from '@/contexts/RoomContext'

export default function ListenTogether() {
    const { state, setPlaying, playerApiRef } = usePlayer()
    const {
        roomId, isHost, connections, broadcast,
        createRoom, joinRoom, disconnect,
        pendingRequests, approveRequest, rejectRequest,
        isConnecting, joinStatus, error
    } = useRoom()

    const [joinCode, setJoinCode] = useState('')
    const [copied, setCopied] = useState(false)
    const [isMinimized, setIsMinimized] = useState(() => {
        return localStorage.getItem('nl_lt_minimized') === 'true'
    })

    useEffect(() => {
        localStorage.setItem('nl_lt_minimized', isMinimized.toString())
    }, [isMinimized])

    // Broadcast host state for music sync
    useEffect(() => {
        if (!isHost || !roomId) return

        const interval = setInterval(() => {
            if (playerApiRef?.current) {
                broadcast('SYNC', {
                    videoId: state.currentTrack?.videoId,
                    isPlaying: state.isPlaying,
                    currentTime: playerApiRef.current.getCurrentTime()
                }, 'music')
            }
        }, 2000)

        return () => clearInterval(interval)
    }, [isHost, roomId, state.isPlaying, state.currentTrack, broadcast, playerApiRef])

    const handleCopy = () => {
        if (!roomId) return
        navigator.clipboard.writeText(roomId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (roomId && !isHost) {
        // Simple auto-redirect or focus for joined members could go here
    }

    return (
        <div className="mx-4 mb-4 space-y-3">
            {/* Floating Action Button */}
            {isMinimized && (
                <motion.button
                    layoutId="lt-badge"
                    className="fixed bottom-40 right-6 z-50 w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg border-2 border-white/20"
                    onClick={() => setIsMinimized(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Volume2 size={24} className="text-white" />
                </motion.button>
            )}

            {/* Listen Together Card */}
            {!isMinimized && (
                <motion.div
                    layoutId="lt-badge"
                    className="skeuo-card p-4 relative group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Volume2 size={18} className="text-[var(--accent)]" />
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">Music Together</h3>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-black uppercase">Active P2P</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-1.5 bg-[var(--surface-sunken)] rounded-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14" />
                                </svg>
                            </button>
                            {roomId && (
                                <button onClick={() => disconnect()} className="p-1.5 bg-red-500/10 text-red-500 rounded-lg">
                                    <LogOut size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {!roomId ? (
                        <div className="space-y-4">
                            <button onClick={createRoom} className="w-full py-3 bg-[var(--surface-sunken)] border border-[var(--border-color)] rounded-xl text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors">
                                Create Private Session
                            </button>
                            <div className="flex gap-2">
                                <input
                                    placeholder="Room Code..."
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                    className="flex-1 bg-[var(--surface-sunken)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                />
                                <button 
                                    onClick={() => joinRoom(joinCode)} 
                                    disabled={isConnecting || joinCode.length < 4}
                                    className="bg-[var(--accent)] text-white px-6 rounded-xl text-xs font-bold shrink-0 disabled:opacity-50"
                                >
                                    {isConnecting ? '...' : 'Join'}
                                </button>
                            </div>

                            {joinStatus === 'waiting' && (
                                <p className="text-[10px] font-bold text-[var(--accent)] text-center animate-pulse">
                                    Waiting for host approval...
                                </p>
                            )}

                            {error && (
                                <p className="text-[10px] font-bold text-red-500 text-center">
                                    {error}
                                </p>
                            )}
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            {/* Pending Requests Banner */}
                            {isHost && pendingRequests.length > 0 && (
                                <div className="p-3 rounded-xl bg-[var(--accent)] text-white shadow-lg space-y-2 mb-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                        Join Requests ({pendingRequests.length})
                                    </p>
                                    {pendingRequests.map(req => (
                                        <div key={req.conn.peer} className="flex items-center justify-between bg-black/20 rounded-lg p-2">
                                            <span className="text-[10px] font-bold truncate pr-2">{req.name}</span>
                                            <div className="flex gap-1">
                                                <button onClick={() => rejectRequest(req.conn.peer)} className="p-1 bg-red-500 rounded-md"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                                                <button onClick={() => approveRequest(req.conn.peer)} className="p-1 bg-green-500 rounded-md"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-[var(--surface-sunken)] rounded-xl p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Room Code</p>
                                    <p className="text-sm font-black text-[var(--text-primary)] tracking-widest">{roomId}</p>
                                </div>
                                <button onClick={handleCopy} className="p-2 bg-[var(--surface-card)] rounded-lg">
                                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-tertiary)]">
                                <span>{isHost ? 'Hosting' : 'Joined Session'}</span>
                                <span>{connections.length + 1} Listeners</span>
                            </div>
                            {state.currentTrack && (
                                <div className="flex items-center gap-3 p-2 bg-[var(--accent)]/5 rounded-xl border border-[var(--accent)]/10">
                                    <img src={state.currentTrack.thumbnail} className="w-8 h-8 rounded-lg" alt="" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold truncate text-[var(--text-primary)]">{state.currentTrack.title}</p>
                                        <p className="text-[9px] text-[var(--accent)] font-bold">In Sync</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    )
}