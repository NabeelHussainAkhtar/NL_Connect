import { motion } from 'framer-motion';
import type { FinanceData } from '@/lib/ai/tools/finance';

// Emoji icons for known coins
const COIN_META: Record<string, { icon: string; color: string }> = {
  Bitcoin:      { icon: '₿', color: '#F7931A' },
  Ethereum:     { icon: 'Ξ', color: '#627EEA' },
  BNB:          { icon: '⬡', color: '#F3BA2F' },
  Solana:       { icon: '◎', color: '#9945FF' },
  Dogecoin:     { icon: 'Ð', color: '#C2A633' },
  XRP:          { icon: '✕', color: '#346AA9' },
  Litecoin:     { icon: 'Ł', color: '#BFBBBB' },
  Cardano:      { icon: '₳', color: '#0033AD' },
  Polygon:      { icon: '⬟', color: '#8247E5' },
  Polkadot:     { icon: '●', color: '#E6007A' },
  'Shiba Inu':  { icon: '🐕', color: '#FFA500' },
};

function CoinRow({ coin, index }: { coin: FinanceData['coins'][0]; index: number }) {
  const up = coin.change24h >= 0;
  const meta = COIN_META[coin.name] || { icon: '🪙', color: '#6366f1' };

  const usdFmt = coin.usd >= 1
    ? '$' + coin.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '$' + coin.usd.toFixed(8);
  const inrFmt = coin.inr >= 1
    ? '₹' + coin.inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    : '₹' + coin.inr.toFixed(4);

  const barPct = Math.min(Math.abs(coin.change24h) / 10, 1) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0"
    >
      {/* Coin icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-md"
        style={{ background: `${meta.color}22`, color: meta.color, border: `1.5px solid ${meta.color}44` }}
      >
        {meta.icon}
      </div>

      {/* Name + bar */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{coin.name}</p>
        <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden w-full">
          <motion.div
            className={`h-full rounded-full ${up ? 'bg-emerald-400' : 'bg-red-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${barPct}%` }}
            transition={{ delay: index * 0.07 + 0.2, duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Prices */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{usdFmt}</p>
        <p className="text-[11px] opacity-50 mt-0.5" style={{ color: 'var(--text-primary)' }}>{inrFmt}</p>
        <p className={`text-[10px] font-bold mt-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
          {up ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}%
        </p>
      </div>
    </motion.div>
  );
}

export function FinanceCard({ data }: { data: FinanceData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
      style={{ background: 'var(--surface)', boxShadow: '0 8px 32px rgba(16,185,129,0.1)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/5">
        <span className="text-xl">📊</span>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--text-primary)' }}>
            Crypto Prices
          </p>
        </div>
        <div className="flex items-center gap-1">
          <motion.span
            className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[10px] text-emerald-400 font-bold">LIVE</span>
        </div>
      </div>

      {/* Coin rows */}
      <div>
        {data.coins.map((coin, i) => <CoinRow key={coin.id} coin={coin} index={i} />)}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-[9px] text-center opacity-25" style={{ color: 'var(--text-primary)' }}>
        CoinGecko • USD & ₹INR • Updates every 5 min
      </div>
    </motion.div>
  );
}
