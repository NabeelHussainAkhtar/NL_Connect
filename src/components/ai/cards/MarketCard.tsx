import { motion } from 'framer-motion';
import type { GlobalMarketData } from '@/lib/ai/tools/finance';

function StatBlock({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 min-w-0 rounded-xl px-3 py-3 border border-white/8"
      style={{ background: `${color}10`, borderColor: `${color}25` }}
    >
      <p className="text-[9px] uppercase tracking-widest opacity-50 mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <p className="text-sm font-black leading-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] opacity-50 mt-0.5" style={{ color: 'var(--text-primary)' }}>{sub}</p>}
    </motion.div>
  );
}

export function MarketCard({ data }: { data: GlobalMarketData }) {
  const capT = (data.totalMarketCapUsd / 1e12).toFixed(2);
  const volB = (data.totalVolumeUsd / 1e9).toFixed(0);
  const capUp = data.marketCapChangePercent24h >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
      style={{ background: 'var(--surface)', boxShadow: '0 8px 32px rgba(16,185,129,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-transparent">
        <span className="text-xl">🌐</span>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>
            Global Crypto Market
          </p>
        </div>
        <div className="flex items-center gap-1">
          <motion.span className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-[10px] text-emerald-400 font-bold">LIVE</span>
        </div>
      </div>

      {/* Big market cap */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1" style={{ color: 'var(--text-primary)' }}>
          Total Market Cap
        </p>
        <div className="flex items-end gap-2">
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-thin" style={{ color: 'var(--text-primary)' }}>
            ${capT}<span className="text-xl opacity-50">T</span>
          </motion.p>
          <p className={`text-sm font-bold mb-1 ${capUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {capUp ? '▲' : '▼'} {Math.abs(data.marketCapChangePercent24h).toFixed(2)}% 24h
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 pb-4 flex gap-2">
        <StatBlock label="BTC Dom." value={`${data.btcDominance.toFixed(1)}%`} color="#F7931A" />
        <StatBlock label="24h Volume" value={`$${volB}B`} color="#627EEA" />
        <StatBlock label="Active Coins" value={data.activeCryptos.toLocaleString()} color="#9945FF" />
      </div>

      <div className="px-4 pb-3 text-[9px] text-center opacity-25" style={{ color: 'var(--text-primary)' }}>
        CoinGecko Global Market Data
      </div>
    </motion.div>
  );
}
