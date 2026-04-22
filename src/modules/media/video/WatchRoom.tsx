import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tv2, Users, Copy, Check, LogOut, SkipForward, Monitor, Send, Maximize, FileVideo, Plus, Link as LinkIcon, MessageSquare, X, Search as SearchIcon, Play, Loader2, Volume2, Settings, Subtitles, Cast, FolderOpen, ArrowLeft, ArrowRight, PlayCircle } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import YouTube from 'react-youtube'
import { getISTTime } from '@/lib/date'
import { usePlayer } from '@/contexts/PlayerContext'
import { useAuth } from '@/contexts/AuthContext'
import { searchYouTube, YouTubeSearchResult } from '@/lib/youtube'

export default function WatchRoom() {
  const {
    roomId, isHost, connections, remoteStream, error, isConnecting,
    joinStatus, pendingRequests, approveRequest, rejectRequest,
    createRoom, joinRoom, broadcast, startScreenShare, streamMedia, stopStream, disconnect
  } = useRoom()

  const { profile } = useAuth()
  const { setPlaying } = usePlayer()

  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [messages, setMessages] = useState<{sender: string, text: string, time: string}[]>([])
  const [chatInp, setChatInp] = useState('')
  const [ytVideoId, setYtVideoId] = useState(() => localStorage.getItem('nl_room_video_id') || '')
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null)

  // Persist video ID
  useEffect(() => {
    if (ytVideoId) localStorage.setItem('nl_room_video_id', ytVideoId)
    else localStorage.removeItem('nl_room_video_id')
  }, [ytVideoId])
  
  // Sidebar Tabs (Desktop)
  const [sidebarTab, setSidebarTab] = useState<'discover' | 'chat'>('discover')

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const ytPlayerRef = useRef<any>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen?.().catch(err => console.error(err))
    } else {
      document.exitFullscreen?.()
    }
  }

  // Force stop Music Player
  useEffect(() => {
    if (roomId) setPlaying(false)
    const int = setInterval(() => { if (roomId) setPlaying(false) }, 5000)
    return () => clearInterval(int)
  }, [roomId, setPlaying])

  // Sync
  useEffect(() => {
    const handleSync = (e: any) => {
      const { videoId, isPlaying, currentTime, mode } = e.detail
      if (mode && mode !== 'video') return
      if (videoId && ytVideoId !== videoId) setYtVideoId(videoId)
      
      if (ytPlayerRef.current) {
        const delta = Math.abs(ytPlayerRef.current.getCurrentTime() - currentTime)
        if (delta > 2) ytPlayerRef.current.seekTo(currentTime)
        if (isPlaying) ytPlayerRef.current.playVideo()
        else ytPlayerRef.current.pauseVideo()
      }
    }
    const handleChat = (e: any) => {
      setMessages((prev: any[]) => [...prev, { ...e.detail, time: getISTTime() }])
    }
    window.addEventListener('room-sync' as any, handleSync)
    window.addEventListener('room-chat' as any, handleChat)
    return () => {
      window.removeEventListener('room-sync' as any, handleSync)
      window.removeEventListener('room-chat' as any, handleChat)
    }
  }, [ytVideoId])

  useEffect(() => {
    if (!isHost || !roomId) return
    const interval = setInterval(() => {
      if (ytPlayerRef.current && ytPlayerRef.current.getPlayerState) {
        broadcast('SYNC', {
          videoId: ytVideoId,
          isPlaying: ytPlayerRef.current.getPlayerState() === 1,
          currentTime: ytPlayerRef.current.getCurrentTime()
        }, 'video')
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [isHost, roomId, ytVideoId, broadcast])

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendChat = () => {
    if (!chatInp.trim()) return
    const time = getISTTime()
    const senderName = profile?.display_name || (isHost ? 'Host' : 'Guest')
    const msg = { text: chatInp, time, sender: senderName }
    broadcast('CHAT', msg, 'video')
    setMessages((prev: any[]) => [...prev, { sender: 'You', text: chatInp, time }])
    setChatInp('')
  }

  const handleVideoSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    const results = await searchYouTube(searchQuery, 'all')
    setSearchResults(results)
    setSearchLoading(false)
  }

  const selectVideo = (id: string) => {
    setYtVideoId(id)
    if (isHost && roomId) {
        broadcast('SYNC', { videoId: id, isPlaying: true, currentTime: 0 }, 'video')
    }
  }

  const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLocalVideoUrl(URL.createObjectURL(file))
    }
  }

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl" style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 20px 40px rgba(79,125,255,0.3)' }}>
          <Tv2 size={40} />
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>Watch Together</h1>
        <p className="text-[var(--text-secondary)] text-sm mb-10 max-w-sm font-medium">
          Create a private room to watch YouTube and stream your screen with friends in perfect sync.
        </p>

        <div className="grid grid-cols-1 gap-5 w-full max-w-sm">
          <button 
            onClick={() => {
              localStorage.removeItem('nl_room_video_id')
              setYtVideoId('')
              createRoom()
            }}
            className="p-5 flex items-center justify-between group transition-all"
            style={{ borderRadius: '1.5rem', background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(79,125,255,0.1)', color: 'var(--accent)' }}>
                <Plus size={24} />
              </div>
              <div className="text-left">
                <span className="block font-bold text-base" style={{ color: 'var(--text-primary)' }}>Create Room</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Be the host</span>
              </div>
            </div>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-tertiary)' }} />
          </button>

          <div className="p-5" style={{ borderRadius: '1.5rem', background: 'var(--surface-sunken)', border: '1px solid var(--border-color)' }}>
            {joinStatus === 'waiting' ? (
              <div className="flex flex-col items-center justify-center py-2 animate-in fade-in zoom-in-95">
                <Loader2 size={32} className="animate-spin mb-3" style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-black mb-1" style={{ color: 'var(--text-primary)' }}>Request Sent!</p>
                <p className="text-xs font-medium text-center mb-4" style={{ color: 'var(--text-tertiary)' }}>Waiting for the host to approve your entry...</p>
                <button 
                  onClick={() => disconnect()}
                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
                  style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--accent-danger)' }}
                >
                  Cancel Request
                </button>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-left" style={{ color: 'var(--accent)' }}>Join Existing</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="6-Digit Code" 
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    className="flex-1 rounded-xl px-4 py-3 text-sm font-bold tracking-widest outline-none transition-colors min-w-0"
                    style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    maxLength={6}
                  />
                  <button 
                    onClick={() => {
                      localStorage.removeItem('nl_room_video_id')
                      setYtVideoId('')
                      joinRoom(joinCode, profile?.display_name || 'Guest')
                    }}
                    disabled={joinCode.length < 4 || isConnecting}
                    className="font-bold px-6 rounded-xl disabled:opacity-50 active:scale-95 transition-all shadow-lg flex-shrink-0 flex items-center justify-center min-w-[80px]"
                    style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 4px 12px rgba(79,125,255,0.3)' }}
                  >
                    {isConnecting ? <Loader2 size={18} className="animate-spin" /> : 'Join'}
                  </button>
                </div>
                {error && (
                  <p className="text-xs font-bold mt-3 text-left animate-in fade-in" style={{ color: 'var(--accent-danger)' }}>
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col lg:flex-row bg-[var(--surface)] z-10 overflow-hidden">
      {/* Primary Content Area */}
      <section className="flex-1 flex flex-col gap-3 lg:gap-4 p-3 lg:p-6 min-h-0 min-w-0 overflow-hidden">
        
        {/* Room Header Ribbon */}
        <div className="flex items-center justify-between p-3 sm:p-4 flex-shrink-0 flex-wrap gap-2" style={{ borderRadius: '1.25rem', background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-raised)' }}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: 'var(--accent)', boxShadow: '0 4px 12px rgba(79,125,255,0.3)' }}>
              <Tv2 size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg leading-tight truncate" style={{ color: 'var(--text-primary)' }}>Watch Party</h1>
              <p className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }}></span> 
                {isHost ? 'Hosting' : 'Guest'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-1.5" style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border-color)' }}>
              <span className="hidden sm:inline text-[10px] uppercase tracking-widest font-black" style={{ color: 'var(--text-tertiary)' }}>Code</span>
              <span className="font-bold tracking-widest text-xs sm:text-sm" style={{ color: 'var(--accent)' }}>{roomId}</span>
              <button onClick={handleCopy} className="ml-1 hover:opacity-70 transition-opacity" style={{ color: copied ? 'green' : 'var(--text-primary)' }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('nl_room_video_id')
                setYtVideoId('')
                disconnect()
              }}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-red-500/10 transition-colors"
              style={{ color: 'var(--accent-danger)' }}
              title="Leave Room"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Pending Requests Banner (Host Only) */}
        {isHost && pendingRequests.length > 0 && (
          <div className="flex flex-col gap-2 p-3 rounded-xl animate-in slide-in-from-top-4 flex-shrink-0" style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 4px 16px rgba(79,125,255,0.3)' }}>
            <div className="text-xs font-bold flex items-center gap-2">
              <Users size={14} /> Join Requests ({pendingRequests.length})
            </div>
            {pendingRequests.map(req => (
              <div key={req.conn.peer} className="flex items-center justify-between bg-black/20 rounded-lg p-2">
                <span className="text-xs font-medium truncate pr-2">{req.name} wants to join</span>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => rejectRequest(req.conn.peer)} className="p-1.5 rounded-md hover:bg-red-500/80 transition-colors bg-black/20"><X size={14} /></button>
                  <button onClick={() => approveRequest(req.conn.peer)} className="p-1.5 rounded-md hover:bg-green-500 transition-colors bg-green-500/80"><Check size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Player Canvas */}
        <div ref={videoContainerRef} className="w-full aspect-video rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden relative group shadow-2xl flex-shrink-0" style={{ background: 'black', border: '1px solid var(--border-color)' }}>
          {/* Main YouTube Video */}
          {ytVideoId ? (
            <div className="w-full h-full relative">
              <YouTube 
                videoId={ytVideoId}
                onReady={e => ytPlayerRef.current = e.target}
                className="w-full h-full pointer-events-none" // Disable native interactions to hide UI and prevent redirects
                iframeClassName="w-full h-full scale-[1.05] pointer-events-none" // Slight scale to hide edges/watermarks
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: { 
                    autoplay: 1, 
                    controls: 0,
                    disablekb: 1,
                    modestbranding: 1,
                    rel: 0,
                    iv_load_policy: 3
                  }
                }}
              />
              {/* Click Shield for Custom Control */}
              <div 
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => {
                  if (isHost && ytPlayerRef.current) {
                    const state = ytPlayerRef.current.getPlayerState()
                    if (state === 1) ytPlayerRef.current.pauseVideo()
                    else ytPlayerRef.current.playVideo()
                  }
                }}
              />
              <button 
                onClick={toggleFullScreen}
                className="absolute bottom-4 right-4 p-2.5 bg-black/60 hover:bg-black/90 transition-colors backdrop-blur-md rounded-full text-white shadow-xl z-40 opacity-0 group-hover:opacity-100"
              >
                <Maximize size={18} />
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Tv2 size={48} className="opacity-20 mb-4 text-white" />
              <p className="text-white/50 text-sm font-bold tracking-widest uppercase">Waiting for host</p>
            </div>
          )}
          
          {/* Local Video Overlay */}
          {localVideoUrl && (
            <div className="absolute inset-0 z-20 bg-black">
               <video 
                 ref={localVideoRef}
                 src={localVideoUrl} 
                 controls 
                 autoPlay 
                 onPlay={() => {
                   if (isHost && localVideoRef.current) {
                     const stream = (localVideoRef.current as any).captureStream()
                     streamMedia(stream)
                   }
                 }}
                 className="w-full h-full object-contain" 
               />
               {isHost && (
                 <button 
                   onClick={() => {
                     setLocalVideoUrl(null)
                     stopStream()
                   }} 
                   className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors"
                 >
                   <X size={20} />
                 </button>
               )}
            </div>
          )}

          {/* Screen Share Overlay */}
          {(remoteStream || (isHost && localVideoUrl === 'SCREEN')) && (
            <div className="absolute inset-0 bg-black z-30">
              <video 
                ref={el => { if (el && remoteStream) el.srcObject = remoteStream }}
                autoPlay 
                playsInline 
                className="w-full h-full object-contain"
                onClick={(e) => (e.currentTarget as any).requestFullscreen?.()}
              />
              <button 
                onClick={() => (document.querySelector('.z-30 video') as any)?.requestFullscreen?.()}
                className="absolute bottom-4 right-4 p-3 bg-black/50 hover:bg-black/80 transition-colors backdrop-blur-md rounded-full text-white shadow-lg z-40"
              >
                <Maximize size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile-only Tabs (Visible only on small screens) */}
        <div className="flex lg:hidden gap-2 p-1.5 rounded-2xl flex-shrink-0 mt-2" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
           <button 
             onClick={() => setSidebarTab('discover')}
             className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
             style={{ background: sidebarTab === 'discover' ? 'var(--surface-container-high)' : 'transparent', color: sidebarTab === 'discover' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
           >
             Content
           </button>
           <button 
             onClick={() => setSidebarTab('chat')}
             className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors"
             style={{ background: sidebarTab === 'chat' ? 'var(--surface-container-high)' : 'transparent', color: sidebarTab === 'chat' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
           >
             Chat ({connections.length + 1})
           </button>
        </div>

        {/* Mobile Content Area (conditionally renders based on tab) */}
        <div className="lg:hidden flex-1 flex flex-col min-h-0 space-y-4">
          {sidebarTab === 'discover' ? (
             <MobileDiscoverContent 
               isHost={isHost} 
               searchQuery={searchQuery} 
               setSearchQuery={setSearchQuery} 
               handleVideoSearch={handleVideoSearch} 
               searchLoading={searchLoading} 
               searchResults={searchResults} 
               selectVideo={selectVideo} 
               handleLocalFile={handleLocalFile}
               startScreenShare={startScreenShare}
             />
          ) : (
             <ChatPanel messages={messages} chatInp={chatInp} setChatInp={setChatInp} sendChat={sendChat} connections={connections} />
          )}
        </div>
      </section>

      {/* Desktop Sidebar (Command Center) */}
      <aside className="hidden lg:flex w-96 flex-col gap-4 p-6 pl-0 flex-shrink-0">
        
        {/* Desktop Sidebar Tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl flex-shrink-0" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
           <button 
             onClick={() => setSidebarTab('discover')}
             className="flex-1 py-2 text-xs font-bold rounded-xl transition-colors"
             style={{ background: sidebarTab === 'discover' ? 'var(--surface-container-high)' : 'transparent', color: sidebarTab === 'discover' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
           >
             Discovery
           </button>
           <button 
             onClick={() => setSidebarTab('chat')}
             className="flex-1 py-2 text-xs font-bold rounded-xl transition-colors"
             style={{ background: sidebarTab === 'chat' ? 'var(--surface-container-high)' : 'transparent', color: sidebarTab === 'chat' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
           >
             Chat ({connections.length + 1})
           </button>
        </div>

        {sidebarTab === 'discover' ? (
          <div className="flex-1 flex flex-col gap-4 p-4 rounded-2xl overflow-hidden" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-raised)' }}>
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Media Sources</h2>
            
            {/* Host Tools */}
            {isHost ? (
              <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                <label className="flex flex-col items-center justify-center py-4 rounded-xl cursor-pointer transition-colors" style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border-color)' }}>
                  <FolderOpen size={20} style={{ color: 'var(--text-secondary)' }} className="mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Local File</span>
                  <input type="file" accept="video/*" className="hidden" onChange={handleLocalFile} />
                </label>
                <button onClick={startScreenShare} className="flex flex-col items-center justify-center py-4 rounded-xl transition-colors" style={{ background: 'rgba(79,125,255,0.1)', border: '1px solid rgba(79,125,255,0.2)' }}>
                  <Monitor size={20} style={{ color: 'var(--accent)' }} className="mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Share Screen</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl text-center" style={{ background: 'var(--surface-sunken)' }}>
                 <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Only the host can change media sources.</p>
              </div>
            )}

            {/* YouTube Search */}
            {isHost && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <form onSubmit={handleVideoSearch} className="relative flex-shrink-0">
                  <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                  <input 
                    type="text" 
                    placeholder="Search YouTube..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none transition-all"
                    style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <button type="submit" className="hidden" />
                </form>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                  {searchLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(video => (
                      <div 
                        key={video.videoId}
                        onClick={() => selectVideo(video.videoId)}
                        className="flex gap-3 p-2 rounded-xl cursor-pointer group hover:bg-[var(--surface-sunken)] transition-colors"
                      >
                        <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <img src={video.thumbnail} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <PlayCircle size={24} fill="white" className="text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="text-xs font-bold line-clamp-2 leading-tight group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>{video.title}</h3>
                          <p className="text-[10px] font-medium mt-1 truncate" style={{ color: 'var(--text-tertiary)' }}>{video.channelTitle}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                       <PlayCircle size={32} className="mb-2 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
                       <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Search for a video to start</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-raised)' }}>
             <ChatPanel messages={messages} chatInp={chatInp} setChatInp={setChatInp} sendChat={sendChat} connections={connections} />
          </div>
        )}
      </aside>
    </div>
  )
}

// Subcomponents for cleaner code

function MobileDiscoverContent({ isHost, searchQuery, setSearchQuery, handleVideoSearch, searchLoading, searchResults, selectVideo, handleLocalFile, startScreenShare }: any) {
  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3">
      {isHost ? (
        <div className="grid grid-cols-2 gap-2 flex-shrink-0">
          <label className="flex flex-col items-center justify-center py-4 rounded-2xl cursor-pointer shadow-sm" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
            <FolderOpen size={20} style={{ color: 'var(--text-secondary)' }} className="mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Local File</span>
            <input type="file" accept="video/*" className="hidden" onChange={handleLocalFile} />
          </label>
          <button onClick={startScreenShare} className="flex flex-col items-center justify-center py-4 rounded-2xl shadow-sm" style={{ background: 'rgba(79,125,255,0.1)', border: '1px solid rgba(79,125,255,0.2)' }}>
            <Monitor size={20} style={{ color: 'var(--accent)' }} className="mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Share Screen</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Only the host can change media sources.</p>
        </div>
      )}

      {isHost && (
        <div className="flex-1 flex flex-col min-h-0 space-y-3 bg-[var(--surface-card)] rounded-2xl p-4 border border-[var(--border-color)] shadow-sm">
          <form onSubmit={handleVideoSearch} className="relative flex-shrink-0">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              placeholder="Search YouTube..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none transition-all"
              style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <button type="submit" className="hidden" />
          </form>
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {searchLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
            ) : searchResults.length > 0 ? (
              searchResults.map((video: any) => (
                <div 
                  key={video.videoId}
                  onClick={() => selectVideo(video.videoId)}
                  className="flex gap-3 p-2 rounded-xl cursor-pointer group active:scale-95 transition-all"
                  style={{ background: 'var(--surface-sunken)' }}
                >
                  <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img src={video.thumbnail} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-xs font-bold line-clamp-2 leading-tight" style={{ color: 'var(--text-primary)' }}>{video.title}</h3>
                    <p className="text-[10px] font-medium mt-1 truncate" style={{ color: 'var(--text-tertiary)' }}>{video.channelTitle}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                  <PlayCircle size={32} className="mb-2 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Search for a video</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ChatPanel({ messages, chatInp, setChatInp, sendChat, connections }: any) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[var(--surface-card)] rounded-xl border border-[var(--border-color)]">
      <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between flex-shrink-0 bg-[var(--surface-sunken)]">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] flex items-center gap-2">
            <MessageSquare size={14} /> Live Chat
          </span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(48,209,88,0.1)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{connections.length + 1} Online</span>
          </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
             <MessageSquare size={32} className="mb-2 text-[var(--text-tertiary)]" />
             <p className="text-xs font-bold text-[var(--text-tertiary)]">Say hello!</p>
          </div>
        ) : (
          messages.map((m: any, i: number) => (
            <div key={i} className={`flex flex-col ${m.sender === 'You' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{m.sender}</span>
                {m.time && <span className="text-[9px] font-bold opacity-50" style={{ color: 'var(--text-tertiary)' }}>{m.time}</span>}
              </div>
              <div 
                className="px-4 py-2.5 text-[13px] font-medium max-w-[85%] shadow-sm leading-snug"
                style={{ 
                  borderRadius: m.sender === 'You' ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                  background: m.sender === 'You' ? 'var(--accent)' : 'var(--surface-sunken)',
                  color: m.sender === 'You' ? 'white' : 'var(--text-primary)',
                  border: m.sender === 'You' ? 'none' : '1px solid var(--border-color)'
                }}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-2 border-t border-[var(--border-color)] flex gap-2 bg-[var(--surface-sunken)] flex-shrink-0">
        <input 
          type="text" 
          placeholder="Chat publicly..." 
          value={chatInp}
          onChange={e => setChatInp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendChat()}
          className="flex-1 rounded-full px-4 py-2.5 text-xs font-bold outline-none"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
        <button 
          onClick={sendChat} 
          disabled={!chatInp.trim()}
          className="p-2.5 rounded-full active:scale-95 transition-all shadow-sm flex-shrink-0 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
