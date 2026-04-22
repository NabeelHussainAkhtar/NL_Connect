import { motion } from 'framer-motion';
import type { WeatherData } from '@/lib/ai/tools/weather';

// ── Weather condition config ─────────────────────────────────────────────────
const CONDITIONS: Record<string, {
  gradient: string; bgGlow: string; icon: string; particles: string[]; textDark: boolean;
}> = {
  clear:       { gradient: 'from-amber-400 via-orange-400 to-yellow-300', bgGlow: 'rgba(251,191,36,0.3)', icon: '☀️', particles: ['✨','🌟','💫'], textDark: false },
  cloudy:      { gradient: 'from-slate-500 via-slate-400 to-blue-400',   bgGlow: 'rgba(100,116,139,0.3)', icon: '⛅', particles: ['☁️','🌤️'], textDark: false },
  foggy:       { gradient: 'from-gray-500 via-gray-400 to-slate-300',    bgGlow: 'rgba(107,114,128,0.2)', icon: '🌫️', particles: ['🌁','💨'], textDark: false },
  rainy:       { gradient: 'from-blue-700 via-indigo-600 to-blue-900',   bgGlow: 'rgba(37,99,235,0.4)',  icon: '🌧️', particles: ['💧','🌊','🐸'], textDark: false },
  snowy:       { gradient: 'from-sky-200 via-blue-200 to-indigo-100',    bgGlow: 'rgba(186,230,253,0.4)', icon: '❄️', particles: ['❄️','⛄','🌨️'], textDark: true },
  showers:     { gradient: 'from-teal-500 via-blue-500 to-cyan-700',     bgGlow: 'rgba(20,184,166,0.3)', icon: '🌦️', particles: ['💦','🌈'], textDark: false },
  thunderstorm:{ gradient: 'from-purple-900 via-gray-900 to-indigo-950', bgGlow: 'rgba(88,28,135,0.5)', icon: '⛈️', particles: ['⚡','🌪️'], textDark: false },
};

function weatherType(code: number): string {
  if (code === 0) return 'clear';
  if (code <= 3)  return 'cloudy';
  if (code <= 48) return 'foggy';
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'snowy';
  if (code <= 82) return 'showers';
  return 'thunderstorm';
}

export function WeatherCard({ data }: { data: WeatherData }) {
  const type = weatherType(data.weatherCode);
  const cond = CONDITIONS[type];
  const textColor = cond.textDark ? 'text-gray-800' : 'text-white';
  const subColor  = cond.textDark ? 'text-gray-600' : 'text-white/75';

  const stats = [
    { icon: '💧', label: 'Humidity',  value: `${data.humidity}%` },
    { icon: '💨', label: 'Wind',      value: `${data.windSpeed} km/h` },
    { icon: '🌂', label: 'Rain',      value: `${data.precipProb}%` },
    { icon: '🌡️', label: 'Feels',    value: `${data.feelsLike}°C` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`mt-2 rounded-2xl overflow-hidden bg-gradient-to-br ${cond.gradient} shadow-xl`}
      style={{ boxShadow: `0 8px 32px ${cond.bgGlow}` }}
    >
      {/* Main area */}
      <div className="relative px-5 pt-6 pb-4 overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {cond.particles.map((p, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl opacity-15"
              style={{ top: `${15 + i * 25}%`, right: `${8 + i * 12}%` }}
              animate={{ y: [-4, 4, -4], rotate: [-5, 5, -5] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
            >
              {p}
            </motion.span>
          ))}
        </div>

        <div className="flex items-start justify-between relative z-10">
          {/* Temp + city */}
          <div>
            {/* City name */}
            <p className={`text-xs font-semibold mb-1 uppercase tracking-widest ${subColor}`}>
              📍 {data.city}
            </p>
            <div className="flex items-end gap-1">
              <span className={`text-7xl font-thin leading-none ${textColor}`}>{data.temp}</span>
              <span className={`text-3xl font-light mb-2 ${subColor}`}>°C</span>
            </div>
            <p className={`text-sm font-medium mt-1 ${textColor}`}>{data.description}</p>
            <p className={`text-xs mt-0.5 ${subColor}`}>Feels like {data.feelsLike}°C</p>
          </div>
          {/* Big icon */}
          <motion.span
            className="text-7xl"
            animate={{ rotate: type === 'clear' ? [0, 5, 0] : [0, -3, 3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {cond.icon}
          </motion.span>
        </div>
      </div>

      {/* Stats grid */}
      <div className={`grid grid-cols-4 divide-x ${cond.textDark ? 'divide-black/10 bg-black/5' : 'divide-white/15 bg-white/10'} backdrop-blur-sm`}>
        {stats.map(s => (
          <div key={s.label} className="py-3 text-center">
            <p className="text-lg leading-none">{s.icon}</p>
            <p className={`text-sm font-bold mt-1 ${textColor}`}>{s.value}</p>
            <p className={`text-[10px] mt-0.5 ${subColor}`}>{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
