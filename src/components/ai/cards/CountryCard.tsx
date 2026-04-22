import { motion } from 'framer-motion';
import type { CountryData } from '@/lib/ai/tools/countries';

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
      <p className="text-[9px] uppercase tracking-widest opacity-50 mb-0.5" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

export function CountryCard({ data }: { data: CountryData }) {
  const pop = data.population > 0 ? new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(data.population) : 'N/A';
  const area = data.area > 0 ? new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(data.area) + ' km²' : 'N/A';

  const stats = [
    { label: 'Capital', value: data.capital || 'N/A' },
    { label: 'Population', value: pop },
    { label: 'Area', value: area },
    { label: 'Currency', value: data.currencies || 'N/A' },
    { label: 'Languages', value: data.languages || 'N/A' },
    { label: 'Region', value: data.subregion || data.region || 'N/A' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 rounded-2xl overflow-hidden border border-white/10"
      style={{ background: 'var(--surface)' }}
    >
      {/* Hero */}
      <div className="relative px-5 pt-6 pb-5 bg-gradient-to-br from-[#4285F4]/10 via-purple-500/5 to-transparent border-b border-white/5">
        {/* Flag + Name */}
        <div className="flex items-center gap-4">
          <span className="text-6xl" role="img" aria-label="flag">{data.flag}</span>
          <div>
            <h2 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{data.name}</h2>
            <p className="text-xs opacity-50 mt-0.5" style={{ color: 'var(--text-primary)' }}>{data.subregion}, {data.region}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-4 grid grid-cols-2 gap-2">
        {stats.map(s => <StatChip key={s.label} label={s.label} value={s.value} />)}
      </div>

      {/* Timezone */}
      {data.timezones.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] opacity-40" style={{ color: 'var(--text-primary)' }}>
            🕐 {data.timezones.slice(0, 2).join(', ')}
          </p>
        </div>
      )}
    </motion.div>
  );
}
