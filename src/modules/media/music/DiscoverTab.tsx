import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Heart, MoreHorizontal, Sparkles, TrendingUp, Clock, ChevronRight } from 'lucide-react'
import { usePlayer } from '@/contexts/PlayerContext'
import { YouTubeSearchResult, searchYouTube } from '@/lib/youtube'

export default function DiscoverTab() {
  const { state, loadTrack, setPlaylist } = usePlayer()
  const [trending, setTrending] = useState<YouTubeSearchResult[]>([])
  const [loading, setLoading] = useState(true)

  const handlePlay = (track: YouTubeSearchResult) => {
    loadTrack(track)
    setPlaylist(trending)
  }

  // Featured hero track (first from playlist or trending)
  const heroTrack = state.playlist[0] || trending[0]
  const recentTracks = state.playlist.slice(0, 8)
  const trendingTracks = trending.slice(0, 6)

  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-8" style={{ background: 'var(--surface)' }}>

      {/* ── Hero Banner (Stitch-style) ── */}
      {heroTrack && (
        <section className="px-4 pt-4">
          <div
            className="relative w-full h-56 overflow-hidden group"
            style={{ borderRadius: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
          >
            <img
              alt="Featured"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              src={heroTrack.thumbnail}
            />
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 4s infinite linear',
              }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)' }} />
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 p-5 w-full flex justify-between items-end">
              <div className="max-w-[70%]">
                <span
                  className="inline-block px-3 py-1 text-[9px] font-black rounded-full mb-2 uppercase tracking-[0.15em]"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  Now Playing
                </span>
                <h2 className="text-xl font-extrabold text-white mb-0.5 line-clamp-2 leading-tight">
                  {heroTrack.title}
                </h2>
                <p className="text-xs text-white/70 font-medium">{heroTrack.channelTitle}</p>
              </div>
              <motion.button
                aria-label="Play Featured"
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: 'white', color: 'var(--accent)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePlay(heroTrack)}
              >
                <Play size={22} fill="currentColor" />
              </motion.button>
            </div>
          </div>
        </section>
      )}

      {/* ── Recently Played (Horizontal Scroll — Stitch style) ── */}
      {recentTracks.length > 0 && (
        <section className="px-4 space-y-3">
          <div className="flex items-end justify-between px-1">
            <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Recent Chill
            </h3>
            <button className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              History
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
            {recentTracks.map((track, i) => (
              <motion.div
                key={track.videoId + i}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlay(track)}
                className="flex-shrink-0 w-36 snap-start group cursor-pointer"
              >
                <div
                  className="w-full aspect-square overflow-hidden mb-2.5 relative"
                  style={{
                    borderRadius: '1.5rem',
                    boxShadow: 'var(--shadow-card)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <img
                    src={track.thumbnail}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={track.title}
                  />
                  {/* Hover play overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={28} className="text-white" fill="white" />
                  </div>
                </div>
                <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {track.title}
                </h4>
                <p className="text-xs font-light truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {track.channelTitle}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Trending Section (Stitch card list style) ── */}
      <section className="px-4 space-y-3">
        <h3 className="text-lg font-bold tracking-tight px-1" style={{ color: 'var(--text-primary)' }}>
          Trending Now
        </h3>

        {/* Featured trending card */}
        {trendingTracks.length > 0 && (
          <motion.div
            className="p-4 flex gap-4 items-center cursor-pointer group relative overflow-hidden"
            style={{
              borderRadius: '2rem',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-card)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePlay(trendingTracks[0])}
          >
            {/* Shimmer */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 4s infinite linear',
              }}
            />
            <img
              alt="Top Track"
              className="w-20 h-20 object-cover shadow-md"
              style={{ borderRadius: '1rem' }}
              src={trendingTracks[0].thumbnail}
            />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold block mb-1 uppercase tracking-[0.15em]" style={{ color: 'var(--accent)' }}>
                #1 Trending
              </span>
              <h4 className="text-base font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                {trendingTracks[0].title}
              </h4>
              <p className="text-xs font-light" style={{ color: 'var(--text-tertiary)' }}>
                {trendingTracks[0].channelTitle}
              </p>
            </div>
            <motion.button
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                border: '1px solid var(--border-color)',
                color: 'var(--accent)',
                background: 'var(--surface-container)',
              }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); handlePlay(trendingTracks[0]) }}
            >
              <Play size={18} fill="currentColor" />
            </motion.button>
          </motion.div>
        )}

        {/* Remaining trending rows */}
        <div className="space-y-2">
          {trendingTracks.slice(1).map((track) => (
            <motion.div
              key={track.videoId}
              className="p-3 flex gap-3 items-center cursor-pointer group relative overflow-hidden"
              style={{
                borderRadius: '1rem',
                background: 'var(--surface-card)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-raised)',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePlay(track)}
            >
              <img
                alt={track.title}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                src={track.thumbnail}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {track.title}
                </h4>
                <p className="text-xs font-light truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {track.channelTitle}
                </p>
              </div>
              <button
                className="p-1"
                style={{ color: 'var(--text-tertiary)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Made For You (bottom list) ── */}
      {trending.length > 4 && (
        <section className="px-4 space-y-3 pb-8">
          <h3 className="text-lg font-bold tracking-tight px-1" style={{ color: 'var(--text-primary)' }}>
            Made For You
          </h3>
          <div className="space-y-2">
            {trending.slice(4, 8).map((track) => (
              <motion.div
                key={track.videoId}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlay(track)}
                className="p-2.5 flex items-center gap-4 group transition-colors cursor-pointer"
                style={{
                  borderRadius: '1rem',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={track.thumbnail} className="w-full h-full object-cover" alt={track.title} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{track.title}</p>
                  <p className="text-[10px] font-light truncate" style={{ color: 'var(--text-tertiary)' }}>{track.channelTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button style={{ color: 'var(--text-tertiary)' }}>
                    <Heart size={16} />
                  </button>
                  <button style={{ color: 'var(--text-tertiary)' }}>
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
