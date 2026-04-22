import { motion } from 'framer-motion';

export interface SearchResultData {
  query: string;
  snippet: string;
  source?: string;
  cricketData?: import('./CricketCard').CricketData | null;
}

export function SearchCard({ data }: { data: SearchResultData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 rounded-2xl overflow-hidden border border-white/10"
      style={{ background: 'var(--surface)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-indigo-500/5">
        <span className="text-base">🔍</span>
        <p className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>
          Live Result
        </p>
        <span className="ml-auto text-[10px] text-blue-400 font-semibold">● Web</span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{data.snippet}</p>
        {data.source && (
          <p className="text-[10px] mt-2 opacity-40" style={{ color: 'var(--text-primary)' }}>
            Source: {data.source}
          </p>
        )}
      </div>
    </motion.div>
  );
}
