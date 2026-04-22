import { motion } from 'framer-motion'
import { Bookmark, ListMusic, History, Download, ChevronRight, Music, Plus } from 'lucide-react'
import { usePlayer } from '@/contexts/PlayerContext'
import { YouTubeSearchResult } from '@/lib/youtube'
import { LocalLibraryScanner } from '@/lib/media/LocalLibraryScanner'
import { useState, useEffect } from 'react'

export default function LibraryTab() {
  const { state, loadTrack, setPlaylist } = usePlayer()
  const [localTracks, setLocalTracks] = useState<YouTubeSearchResult[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('nl_local_library')
    if (saved) setLocalTracks(JSON.parse(saved))
  }, [])

  const handleScan = async () => {
    const tracks = await LocalLibraryScanner.scanForMusic()
    if (tracks.length > 0) {
      const merged = [...tracks, ...localTracks].filter((v, i, a) => a.findIndex(t => t.videoId === v.videoId) === i)
      setLocalTracks(merged)
      localStorage.setItem('nl_local_library', JSON.stringify(merged))
    } else {
      alert("No music files found in root storage. Try importing manually.")
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const newTracks: YouTubeSearchResult[] = files.map(f => ({
      videoId: `local-${Math.random().toString(36).substr(2, 9)}`,
      title: f.name.replace(/\.[^/.]+$/, ""),
      thumbnail: '',
      channelTitle: 'Local Audio',
      isLocal: true,
      localUrl: URL.createObjectURL(f)
    }))

    const merged = [...newTracks, ...localTracks]
    setLocalTracks(merged)
    localStorage.setItem('nl_local_library', JSON.stringify(merged))
    loadTrack(newTracks[0])
    setPlaylist([...newTracks, ...state.playlist])
  }

  const sections = [
    { id: 'favs', label: 'Favorites', icon: Bookmark, sub: '0 tracks', color: '#ff4d4d' },
    { id: 'playlist', label: 'Playlists', icon: ListMusic, sub: '3 collections', color: '#4f7dff' },
    { id: 'recents', label: 'History', icon: History, sub: 'Recently played', color: '#30d158' },
    { id: 'downloads', label: 'Downloads', icon: Download, sub: 'Offline tracks', color: '#ffd60a' },
  ]

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-6 space-y-8 pb-[100px]" style={{ background: 'var(--surface)' }}>
       <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Your Music</h1>
          <button
            className="w-10 h-10 rounded-full text-white flex items-center justify-center active:scale-90 transition-all"
            style={{ background: 'var(--accent)', boxShadow: '0 4px 16px rgba(79,125,255,0.4)' }}
          >
             <Plus size={22} />
          </button>
       </div>

       {/* Quick Sections */}
       <div className="grid grid-cols-2 gap-3">
          {sections.map(s => (
            <motion.div
              key={s.id}
              whileTap={{ scale: 0.97 }}
              className="p-5 space-y-3 cursor-pointer transition-colors"
              style={{
                borderRadius: '1.5rem',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
               <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: s.color, boxShadow: `0 4px 12px ${s.color}44` }}>
                  <s.icon size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.sub}</p>
               </div>
            </motion.div>
          ))}
       </div>

       {/* Recent Activity List */}
       <div className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight px-1" style={{ color: 'var(--text-primary)' }}>Recently Played</h2>
          <div className="space-y-2">
             {state.playlist.slice(0, 5).map(track => (
               <motion.div
                 key={track.videoId}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => loadTrack(track)}
                 className="flex items-center gap-3 p-2.5 group transition-colors cursor-pointer"
                 style={{
                   borderRadius: '1rem',
                   background: 'var(--surface-card)',
                   border: '1px solid var(--border-color)',
                   boxShadow: 'var(--shadow-raised)',
                 }}
               >
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                     <img src={track.thumbnail} className="w-full h-full object-cover" alt={track.title} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{track.title}</p>
                     <p className="text-[10px] font-light truncate" style={{ color: 'var(--text-tertiary)' }}>{track.channelTitle}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
               </motion.div>
             ))}
          </div>
       </div>

        {/* Local Library List */}
        <div className="space-y-3">
           <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Local Library</h2>
              <button 
                onClick={handleScan}
                className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest bg-[var(--accent)]/10 px-3 py-1 rounded-full"
              >
                Scan Storage
              </button>
           </div>
           <div className="space-y-2">
              {localTracks.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-[var(--border-color)] rounded-2xl opacity-40">
                   <p className="text-xs font-bold text-[var(--text-tertiary)]">No local music synced</p>
                </div>
              ) : (
                localTracks.map(track => (
                  <motion.div
                    key={track.videoId}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      loadTrack(track)
                      setPlaylist([track, ...state.playlist.filter(t => t.videoId !== track.videoId)])
                    }}
                    className="flex items-center gap-3 p-2.5 group transition-colors cursor-pointer"
                    style={{
                      borderRadius: '1rem',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-raised)',
                    }}
                  >
                     <div className="w-12 h-12 rounded-xl bg-[var(--surface-sunken)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {track.thumbnail ? (
                          <img src={track.thumbnail} className="w-full h-full object-cover" alt={track.title} />
                        ) : (
                          <Music size={20} className="text-[var(--text-tertiary)] opacity-40" />
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{track.title}</p>
                        <p className="text-[10px] font-light truncate" style={{ color: 'var(--text-tertiary)' }}>{track.channelTitle}</p>
                     </div>
                     <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                  </motion.div>
                ))
              )}
           </div>
        </div>

       {/* Connect Local Library CTA */}
       <div
         className="p-8 text-center space-y-4"
         style={{
           borderRadius: '1.5rem',
           background: 'rgba(79,125,255,0.06)',
           border: '1px solid rgba(79,125,255,0.12)',
         }}
       >
          <div
            className="w-14 h-14 rounded-2xl text-white flex items-center justify-center mx-auto"
            style={{ background: 'var(--accent)', boxShadow: '0 8px 24px rgba(79,125,255,0.4)' }}
          >
            <Music size={28} />
          </div>
          <div className="space-y-1">
             <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Connect Local Library</h3>
             <p className="text-xs font-light px-4" style={{ color: 'var(--text-tertiary)' }}>
               Import tracks from your device storage to sync across sessions.
             </p>
          </div>
          <label
            className="px-6 py-3 text-white rounded-xl text-xs font-bold active:scale-95 transition-all inline-block cursor-pointer"
            style={{ background: 'var(--accent)', boxShadow: '0 4px 16px rgba(79,125,255,0.3)' }}
          >
             Import Media
             <input type="file" accept="audio/*" multiple className="hidden" onChange={handleImport} />
          </label>
       </div>
    </div>
  )
}
