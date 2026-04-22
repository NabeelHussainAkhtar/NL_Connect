import { motion } from 'framer-motion';
import type { TrendingData } from '@/lib/ai/tools/finance';

const RANK_COLORS = ['#F7931A', '#627EEA', '#9945FF', '#F3BA2F', '#C2A633', '#346AA9', '#E6007A'];

export function TrendingCard({ data }: { data: TrendingData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
      style={{ background: 'var(--surface)', boxShadow: '0 8px 32px rgba(249,115,22,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-transparent">
        <motion.span className="text-xl"
          animate={{ rotate: [0, 15, -10, 15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}>
          🔥
        </motion.span>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>
            Trending on CoinGecko
          </p>
        </div>
        <div className="flex items-center gap-1">
          <motion.span className="w-2 h-2 rounded-full bg-orange-400"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-[10px] text-orange-400 font-bold">LIVE</span>
        </div>
      </div>

      {/* Coin list */}
      <div>
        {data.coins.map((coin, i) => {
          const color = RANK_COLORS[i] || '#6366f1';
          const up = !coin.change24h || parseFloat(coin.change24h) >= 0;
          return (
            <motion.div
              key={coin.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0"
            >
              {/* Rank + thumb */}
              <div className="flex items-center gap-2 w-8 flex-shrink-0">
                <span className="text-[11px] font-bold opacity-40 w-4" style={{ color: 'var(--text-primary)' }}>
                  #{i + 1}
                </span>
              </div>
              {coin.thumb ? (
                <img src={coin.thumb} alt={coin.name} className="w-8 h-8 rounded-full flex-shrink-0" style={{ border: `2px solid ${color}33` }} />
              ) : (
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: `${color}22`, color, border: `2px solid ${color}44` }}>
                  {coin.symbol?.charAt(0)}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{coin.name}</p>
                <p className="text-[10px] opacity-40" style={{ color: 'var(--text-primary)' }}>{coin.symbol}</p>
              </div>

              {/* Price + change */}
              <div className="text-right flex-shrink-0">
                {coin.priceUsd && (
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{coin.priceUsd}</p>
                )}
                {coin.change24h && (
                  <p className={`text-[10px] font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {up ? '▲' : '▼'} {Math.abs(parseFloat(coin.change24h)).toFixed(2)}%
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="px-4 py-2 text-[9px] text-center opacity-25" style={{ color: 'var(--text-primary)' }}>
        CoinGecko Trending • Top 7 by search volume
      </div>
    </motion.div>
  );
}
