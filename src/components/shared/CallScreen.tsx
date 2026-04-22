import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, FlipHorizontal, Maximize2, Minimize2, Camera, X, Loader2, RefreshCw } from 'lucide-react'
import { useCall } from '@/contexts/CallContext'
import { Avatar } from './Avatar'

export function CallScreen() {
  const { 
    callState, isVideo, localStream, remoteStream, 
    answerCall, rejectCall, endCall, toggleMedia, 
    remoteId, remoteName, remoteAvatar, switchCamera, currentCamera,
    callDuration
  } = useCall()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  const [micMuted, setMicMuted] = useState(false)
  const [vidMuted, setVidMuted] = useState(!isVideo)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLargeMinimized, setIsLargeMinimized] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [swapViews, setSwapViews] = useState(false)
  
  const timerRef = useRef<any>(null)

  // Use the resolved name/avatar from context, fallback to ID if still loading
  const displayName = remoteName || (remoteId ? `ID: ${remoteId.slice(0, 8)}...` : 'Unknown')
  const displayAvatar = remoteAvatar || '?'

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream
  }, [localStream, remoteStream, callState, isMinimized, swapViews])

  const resetTimer = () => {
    setShowControls(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (callState === 'connected') {
      timerRef.current = setTimeout(() => setShowControls(false), 5000)
    }
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const rs = s % 60
    return `${m}:${rs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [callState])

  if (callState === 'idle') return null

  if (isMinimized) {
    return (
      <motion.div 
        drag
        dragConstraints={{ top: 20, left: 20, right: 20, bottom: 80 }}
        className="fixed bottom-24 right-4 bg-black rounded-2xl overflow-hidden shadow-2xl z-[1001] border border-white/20 cursor-grab active:cursor-grabbing group"
        style={{ 
          width: isLargeMinimized ? '160px' : '110px', 
          height: isLargeMinimized ? '220px' : '160px',
          transition: 'width 0.3s, height 0.3s' 
        }}
      >
        {isVideo && (remoteStream || localStream) ? (
          <video ref={remoteStream ? remoteVideoRef : localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <Avatar initials={displayAvatar} size="md" />
          </div>
        )}
        
        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
           <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded-lg backdrop-blur-md">
                {formatDuration(callDuration)}
              </span>
              <button onClick={() => setIsMinimized(false)} className="p-1.5 bg-black/50 rounded-full text-white backdrop-blur-md">
                <Maximize2 size={12} />
              </button>
           </div>
           
           <div className="flex flex-col gap-2 items-center">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsLargeMinimized(!isLargeMinimized); }} 
                className="p-1.5 bg-white/20 rounded-full text-white backdrop-blur-md"
              >
                <RefreshCw size={12} />
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleMedia('audio'); setMicMuted(!micMuted); }} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md ${micMuted ? 'bg-red-500 text-white' : 'bg-black/50 text-white'}`}
                >
                  {micMuted ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); endCall(); }} 
                  className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg"
                >
                  <PhoneOff size={14} />
                </button>
              </div>
           </div>
        </div>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] bg-[#0a0d12] flex flex-col items-center justify-center overflow-hidden"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseMove={resetTimer}
        onClick={resetTimer}
        onTouchStart={resetTimer}
      >
        {callState === 'connected' && isVideo ? (
          <div className="absolute inset-0 bg-black">
            <video ref={swapViews ? localVideoRef : remoteVideoRef} autoPlay playsInline muted={swapViews} className="w-full h-full object-cover scale-x-[-1]" />
            <motion.div
              drag
              dragConstraints={{ top: 20, left: 20, right: 20, bottom: 120 }}
              className="absolute top-12 right-6 w-28 h-40 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-50 cursor-grab active:cursor-grabbing"
              onClick={(e) => { e.stopPropagation(); setSwapViews(!swapViews); }}
            >
              <video ref={swapViews ? remoteVideoRef : localVideoRef} autoPlay playsInline muted={!swapViews} className="w-full h-full object-cover scale-x-[-1]" />
              <button 
                onClick={(e) => { e.stopPropagation(); switchCamera(); }} 
                className="absolute bottom-2 right-2 p-2 bg-black/60 rounded-full text-white backdrop-blur-md border border-white/10 shadow-lg active:scale-90 transition-all"
              >
                <motion.div animate={{ rotate: currentCamera === 'back' ? 180 : 0 }}>
                  <RefreshCw size={16} />
                </motion.div>
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center pt-32 bg-gradient-to-b from-[#1a1f2e] to-[#0a0d12]">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#00f5d4]/30 shadow-[0_0_40px_rgba(0,245,212,0.2)]">
                 <img src={remoteAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${remoteId}`} className="w-full h-full object-cover" />
              </div>
              {callState === 'ringing' && (
                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 rounded-full ring-4 ring-[#00f5d4]" />
              )}
            </motion.div>
            
            <h2 className="mt-8 text-2xl font-black text-white tracking-tight uppercase italic">
              {remoteName || <div className="flex gap-1 items-center opacity-40"><Loader2 className="animate-spin" size={20} /> RESOLVING...</div>}
            </h2>
            
            {remoteName && <p className="text-[10px] font-bold text-white/30 tracking-widest mt-1 opacity-50 uppercase">{remoteId}</p>}

            <p className="text-[#00f5d4] text-[10px] mt-6 font-black uppercase tracking-[0.4em] animate-pulse">
              {callState === 'calling' ? 'CONNECTING...' : 'INCOMING CALL...'}
            </p>
          </div>
        )}

        <AnimatePresence>
          {showControls && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-12 left-0 right-0 px-6 flex items-center justify-between z-50">
              <button onClick={() => setIsMinimized(true)} className="p-2 bg-white/5 rounded-full text-white backdrop-blur-md border border-white/10"><Minimize2 size={20} /></button>
              
              <div className="flex flex-col items-center">
                 <div className="flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00f5d4] animate-pulse" />
                    <span className="text-[11px] font-bold text-white tracking-wider">{formatDuration(callDuration)}</span>
                 </div>
                 <span className="text-[8px] font-black text-[#00f5d4] uppercase tracking-[0.3em] mt-1 italic">JARVIS ENCRYPTED</span>
              </div>

              <div className="w-10" /> {/* Spacer */}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showControls && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute bottom-10 w-full px-12 flex items-center justify-around z-50">
              {callState === 'ringing' ? (
                <>
                  <button onClick={rejectCall} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-transform active:scale-90"><PhoneOff size={28} /></button>
                  <button onClick={answerCall} className="w-16 h-16 rounded-full bg-[#00f5d4] flex items-center justify-center text-black shadow-[0_0_30px_rgba(0,245,212,0.4)] transition-transform active:scale-90 animate-bounce"><Phone size={28} /></button>
                </>
              ) : (
                <div className="bg-white/5 backdrop-blur-2xl rounded-[40px] p-4 border border-white/10 flex items-center gap-10 shadow-2xl">
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => { toggleMedia('audio'); setMicMuted(!micMuted); }} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${micMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white hover:bg-[#00f5d4]/20 hover:text-[#00f5d4]'}`}>{micMuted ? <MicOff size={24} /> : <Mic size={24} />}</button>
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{micMuted ? 'Muted' : 'Mic On'}</span>
                  </div>
                  <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 transition-transform"><PhoneOff size={28} /></button>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => { toggleMedia('video'); setVidMuted(!vidMuted); }} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${vidMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white hover:bg-[#00f5d4]/20 hover:text-[#00f5d4]'}`}>{vidMuted ? <VideoOff size={24} /> : <Video size={24} />}</button>
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{vidMuted ? 'Camera Off' : 'Video On'}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
