import { motion } from 'framer-motion';

export interface NewsItem {
  title: string;
  source?: string;
  date?: string;
  link?: string;
  thumbnail?: string;
}

export interface NewsCardData {
  query: string;
  headline: string;   // top extracted headline (used as summary)
  items?: NewsItem[];
  source?: string;
}

export function NewsCard({ data }: { data: NewsCardData }) {
  // Parse the headline text into individual news items if not pre-structured
  const items: NewsItem[] = data.items?.length
    ? data.items
    : data.headline.split(' | ').filter(Boolean).slice(0, 5).map(h => {
        const parts = h.split(' — ');
        return { title: parts[0]?.trim(), source: parts[1]?.trim() };
      });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
      style={{ background: 'var(--surface)', boxShadow: '0 8px 32px rgba(59,130,246,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-blue-500/10 via-sky-500/5 to-transparent">
        <motion.span className="text-xl"
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}>
          📰
        </motion.span>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>
            Latest News
          </p>
          <p className="text-[10px] opacity-40 truncate" style={{ color: 'var(--text-primary)' }}>
            {data.query}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <motion.span className="w-2 h-2 rounded-full bg-blue-400"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-[10px] text-blue-400 font-bold">LIVE</span>
        </div>
      </div>

      {/* News items */}
      <div className="divide-y divide-white/5">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="px-4 py-3 flex items-start gap-3"
          >
            {/* Index dot */}
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/15 border border-blue-400/25 flex items-center justify-center mt-0.5">
              <span className="text-[9px] font-black text-blue-400">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
              {item.source && (
                <p className="text-[10px] mt-1 opacity-40" style={{ color: 'var(--text-primary)' }}>
                  {item.source}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="px-4 py-2 text-[9px] text-center opacity-25" style={{ color: 'var(--text-primary)' }}>
        Google News • {data.source || 'Live search'}
      </div>
    </motion.div>
  );
}
