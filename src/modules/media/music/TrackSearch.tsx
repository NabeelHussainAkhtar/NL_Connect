import { memo, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePlayer } from '@/contexts/PlayerContext'
import { YouTubeSearchResult, searchYouTube, getMockTracks } from '@/lib/youtube'
import { DiscoveryResult } from '@/lib/discovery'
import { SmartSearchBar } from '@/components/shared/SmartSearchBar'
import { Loader2, Music, MoreHorizontal, Play } from 'lucide-react'

const TrackRow = memo(function TrackRow({
  track, isActive, onSelect,
}: { track: YouTubeSearchResult; isActive: boolean; onSelect: () => void }) {
  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer group transition-all mx-2"
      style={{
        borderRadius: '1rem',
        background: isActive ? 'rgba(79,125,255,0.08)' : 'transparent',
      }}
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="w-14 h-14 overflow-hidden flex-shrink-0 relative"
        style={{
          borderRadius: '0.75rem',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        {isActive && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
             <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />
             </div>
          </div>
        )}
        {!isActive && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play size={16} className="text-white" fill="white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
          {track.title}
        </p>
        <p className="text-xs truncate font-light mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          {track.channelTitle}
        </p>
      </div>
      <button
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{ color: 'var(--text-tertiary)', background: 'var(--surface-container)' }}
        onClick={(e) => e.stopPropagation()}
      >
         <MoreHorizontal size={16} />
      </button>
    </motion.div>
  )
})

export default function TrackSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YouTubeSearchResult[]>([])
  const [suggestions, setSuggestions] = useState<DiscoveryResult[]>([])
  const [loading, setLoading] = useState(false)
  const { state, loadTrack, setPlaylist } = usePlayer()

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setQuery(q)
    try {
      const res = await searchYouTube(q)
      setResults(res)
      setPlaylist(res)
    } finally {
      setLoading(false)
    }
  }, [setPlaylist])

  const onDiscoverySelect = (res: DiscoveryResult) => {
    handleSearch(res.title)
  }

  const handleSelect = useCallback((track: YouTubeSearchResult) => {
    loadTrack(track)
  }, [loadTrack])

  return (
    <div className="h-full flex flex-col pt-4 overflow-hidden" style={{ background: 'var(--surface)' }}>
      {/* Search Input */}
      <div
        className="px-4 py-4 sticky top-0 z-20"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="relative">
          <SmartSearchBar
            value={query}
            onChange={setQuery}
            results={suggestions}
            onSelect={onDiscoverySelect}
            onSubmit={handleSearch}
            placeholder="Search tracks, artists, playlists..."
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="animate-spin" size={16} style={{ color: 'var(--accent)' }} />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-1">
        {results.length > 0 ? (
          results.map((track) => (
            <TrackRow
              key={track.videoId}
              track={track}
              isActive={state.currentTrack?.videoId === track.videoId}
              onSelect={() => handleSelect(track)}
            />
          ))
        ) : !loading && (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface-container-high)' }}
            >
              <Music size={32} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
              Search for something to play
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
