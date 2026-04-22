import { motion } from 'framer-motion';

export interface MusicCardData {
  title: string;
  channelTitle: string;
  thumbnail: string;
  videoId: string;
}

const BAR_HEIGHTS = [4, 12, 8, 16, 6, 14, 10];

export function MusicCard({ data }: { data: MusicCardData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-xl flex items-stretch"
      style={{ background: 'var(--surface)' }}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-[88px] h-[88px] overflow-hidden">
        <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs ml-0.5">▶</span>
          </motion.div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 px-4 py-3.5 min-w-0">
        {/* Equalizer bars */}
        <div className="flex items-end gap-[2px] mb-2">
          {BAR_HEIGHTS.map((maxH, i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full bg-[#4285F4]"
              animate={{ height: [`${maxH * 0.4}px`, `${maxH}px`, `${maxH * 0.6}px`, `${maxH}px`] }}
              transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.07 }}
            />
          ))}
          <span className="text-[10px] text-[#4285F4] font-bold ml-1.5 uppercase tracking-widest">Now Playing</span>
        </div>
        <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>{data.title}</p>
        <p className="text-[11px] opacity-50 truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>{data.channelTitle}</p>
      </div>

      {/* YouTube */}
      <button
        onClick={() => window.open(`https://www.youtube.com/watch?v=${data.videoId}`, '_blank')}
        className="flex-shrink-0 flex items-center justify-center px-4 text-red-500 hover:bg-red-500/10 transition-colors border-l border-white/5"
        title="Open on YouTube"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-.9C17.1 2.8 12 2.8 12 2.8s-5.1 0-8.3.2c-.5.1-1.5.1-2.3.9C.7 4.6.5 6.2.5 6.2S.3 8.1.3 10v1.8c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.6.2 7.6.2s5.1 0 8.3-.2c.5-.1 1.5-.1 2.3-.9.7-.7.9-2.3.9-2.3s.2-1.9.2-3.8V10c0-1.9-.2-3.8-.2-3.8zM9.7 15V8.6l6.3 3.2-6.3 3.2z"/>
        </svg>
      </button>
    </motion.div>
  );
}
