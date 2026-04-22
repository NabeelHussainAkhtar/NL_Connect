import { useState } from 'react'
import { SkeuoControls } from '@/modules/media/music/SkeuoControls'
import TrackSearch from '@/modules/media/music/TrackSearch'
import ListenTogether from '@/modules/media/music/ListenTogether'
import VideoJSPlayer from '@/modules/media/video/VideoJSPlayer'
import WatchRoom from '@/modules/media/video/WatchRoom'
import { usePlayer } from '@/contexts/PlayerContext'
import { Music, Video, Tv2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import DiscoverTab from '@/modules/media/music/DiscoverTab'
import LibraryTab from '@/modules/media/music/LibraryTab'
import MiniPlayer from '@/modules/media/music/MiniPlayer'

type Tab = 'music' | 'video' | 'room'
type MusicTab = 'discover' | 'search' | 'library'

export default function Media() {
  const { state } = usePlayer()
  const [tab, setTab] = useState<Tab>('music')
  const [musicTab, setMusicTab] = useState<MusicTab>('discover')
  const [localVideoSrc, setLocalVideoSrc] = useState<string>("https://www.w3schools.com/html/mov_bbb.mp4")

  const handleLocalVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLocalVideoSrc(URL.createObjectURL(file))
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>
      {/* Tab switcher - Compact & Animated */}
      <div className="flex justify-center mt-4 mb-2 flex-shrink-0 relative z-10 px-4">
        <div className="flex gap-2 p-1.5 rounded-full" style={{ background: 'var(--surface-container-high)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-raised)' }}>
          {(['music', 'video', 'room'] as Tab[]).map(t => (
            <motion.button
              key={t}
              id={`tab-${t}`}
              className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 relative transition-colors z-10"
              style={{
                color: tab === t ? 'white' : 'var(--text-tertiary)',
              }}
              onClick={() => setTab(t)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab === t && (
                <motion.div
                  layoutId="media-active-tab"
                  className="absolute inset-0 rounded-full -z-10"
                  style={{ background: 'var(--accent)', boxShadow: '0 4px 12px rgba(79,125,255,0.3)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              {t === 'music' && <Music size={12} />}
              {t === 'video' && <Video size={12} />}
              {t === 'room' && <Tv2 size={12} />}
              <span>{t}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Music tab */}
        {tab === 'music' && (
          <motion.div 
            key="music"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col min-h-0"
            style={{ background: 'var(--surface-container)' }}
          >
            {/* Music Sub-tabs */}
            <div className="flex gap-4 px-6 pt-4 pb-2 items-center">
              {[
                { id: 'discover', label: 'Discovery' },
                { id: 'search', label: 'Search' },
                { id: 'library', label: 'Library' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setMusicTab(st.id as MusicTab)}
                  className="text-[10px] font-black uppercase tracking-[0.2em] transition-all relative"
                  style={{ color: musicTab === st.id ? 'var(--accent)' : 'var(--text-tertiary)' }}
                >
                  {st.label}
                  {musicTab === st.id && (
                    <motion.div 
                      layoutId="music-tab-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative pb-[80px]">
              <AnimatePresence mode="wait">
                {musicTab === 'discover' && (
                  <motion.div key="discover" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                    <DiscoverTab />
                  </motion.div>
                )}
                {musicTab === 'search' && (
                  <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                    <TrackSearch />
                  </motion.div>
                )}
                {musicTab === 'library' && (
                  <motion.div key="library" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                    <LibraryTab />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <MiniPlayer />
          </motion.div>
        )}

        {/* Video tab */}
        {tab === 'video' && (
          <motion.div 
            key="video"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto"
          >
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--border-color)' }}>
              <VideoJSPlayer
                src={localVideoSrc}
                className="flex-shrink-0"
              />
            </div>

            <div className="p-4 flex-shrink-0 flex items-center justify-between rounded-2xl" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <div>
                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Local Media</h3>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Watch your own files offline</p>
              </div>
              <label className="text-xs font-bold px-4 py-2.5 rounded-xl text-white cursor-pointer active:scale-95 transition-transform" style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-raised)' }}>
                Browse
                <input type="file" accept="video/*" className="hidden" onChange={handleLocalVideo} />
              </label>
            </div>
            
            <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(79,125,255,0.08)', border: '1px solid rgba(79,125,255,0.15)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 text-white rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                  <Tv2 size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>Watch Together</h4>
                  <p className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>Sync with friends</p>
                </div>
              </div>
              <button 
                onClick={() => setTab('room')}
                className="px-4 py-2.5 text-white text-[10px] font-black rounded-xl active:scale-95 transition-transform"
                style={{ background: 'var(--accent)', boxShadow: '0 4px 12px rgba(79,125,255,0.3)' }}
              >
                GO TO ROOM
              </button>
            </div>
          </motion.div>
        )}

        {/* Room tab */}
        {tab === 'room' && (
          <motion.div 
            key="room"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1"
          >
            <WatchRoom />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
