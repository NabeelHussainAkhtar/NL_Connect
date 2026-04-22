import { motion, AnimatePresence } from 'framer-motion';
import type { CricketData, CricketMatch, CricketSubIntent } from '@/lib/ai/tools/cricket';

// ── Legacy text-parser (fallback for search results) ─────────────────────────
export interface CricketTextData {
  team1: string; team2: string;
  score1?: string; score2?: string;
  winner?: string;
  status: 'live' | 'completed' | 'upcoming';
  matchType?: string; venue?: string; summary?: string;
}
export function parseCricketFromText(text: string): CricketTextData | null {
  if (!text || text.length < 20) return null;
  const t = text.replace(/\s+/g, ' ').trim();
  const scoreRe = /\b([A-Z]{2,5})\s+(\d{2,3}(?:\/\d+|-\d+)?)/g;
  const scores: { team: string; score: string }[] = [];
  let sm;
  const noiseWords = new Set(['THE','AND','FOR','BUT','NOT','ARE','WAS','HAS','HAD','CAN','MAY','EDT','IST','GMT','UTC','IPL','PSL','ODI','T20']);
  while ((sm = scoreRe.exec(t)) !== null && scores.length < 2) {
    if (!noiseWords.has(sm[1]) && sm[1].length >= 2 && /\d{2,}/.test(sm[2]))
      scores.push({ team: sm[1], score: sm[2].trim() });
  }
  if (!scores.length) return null;
  const winner = t.match(/\b([\w\s]+?)\s+(?:won|wins|beat)\b/i)?.[1]?.trim();
  const isLive = /\b(live|ongoing|batting|bowling)\b/i.test(t);
  return {
    team1: scores[0]?.team, team2: scores[1]?.team || '',
    score1: scores[0]?.score, score2: scores[1]?.score,
    winner, status: winner ? 'completed' : isLive ? 'live' : 'upcoming',
    venue: t.match(/\b(?:at|in|venue:?)\s+([A-Z][a-zA-Z\s,]{5,40}?(?:Stadium|Ground|Oval|Park|Arena))/i)?.[1],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_CFG: Record<string, { bg: string; text: string; label: string }> = {
  t20:  { bg: 'rgba(168,85,247,0.15)',  text: '#c084fc', label: 'T20' },
  odi:  { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa', label: 'ODI' },
  test: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: 'TEST' },
};

function TypeBadge({ type }: { type: string }) {
  const c = TYPE_CFG[type?.toLowerCase()] || { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc', label: type?.toUpperCase() || 'MATCH' };
  return (
    <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

function LivePulse() {
  return (
    <div className="flex items-center gap-1.5">
      <motion.span className="w-2 h-2 rounded-full bg-red-400"
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.3, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }} />
      <span className="text-[10px] text-red-400 font-black uppercase tracking-wide">LIVE</span>
    </div>
  );
}

// ── Score display for one match ───────────────────────────────────────────────
function ScoreBlock({ match }: { match: CricketMatch }) {
  const isLive    = /live|ongoing|batting|bowling/i.test(match.status);
  const isWon     = !!match.matchWinner || /won|win|beat|defeat/i.test(match.status);
  const isUpcoming = /not started|yet to|scheduled|toss/i.test(match.status) && !match.score.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-white/8"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Match header bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <TypeBadge type={match.matchType} />
        {isLive && <LivePulse />}
        {isWon && <span className="text-[10px] text-emerald-400 font-bold">✓ RESULT</span>}
        {isUpcoming && <span className="text-[10px] text-blue-400 font-semibold">⏳ UPCOMING</span>}
        <p className="text-[10px] flex-1 truncate opacity-50 text-right" style={{ color: 'var(--text-primary)' }}>
          {match.date}
        </p>
      </div>

      <div className="px-3 py-3">
        {/* Teams + scores */}
        {match.score.length > 0 ? (
          <div className="space-y-2">
            {match.score.map((s, i) => {
              const teamName = s.inning.replace(/\s+Inning\s+\d+/i, '').trim();
              const isWinner = match.matchWinner && teamName.toLowerCase().includes(match.matchWinner.toLowerCase());
              return (
                <div key={i} className="flex items-center">
                  {isWinner && <span className="text-amber-400 mr-1.5">🏆</span>}
                  <p className={`flex-1 text-xs truncate ${isWinner ? 'font-bold' : 'opacity-60'}`}
                    style={{ color: 'var(--text-primary)' }}>
                    {teamName}
                  </p>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className={`text-base font-black ${isWinner ? 'text-amber-300' : ''}`}
                      style={!isWinner ? { color: 'var(--text-primary)' } : {}}>
                      {s.r}/{s.w}
                    </span>
                    <span className="text-[10px] opacity-40 ml-1.5" style={{ color: 'var(--text-primary)' }}>
                      ({s.o} ov)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Upcoming — show teams */
          <div className="flex items-center justify-between">
            {match.teams.map((t, i) => (
              <span key={i} className={`text-sm font-semibold ${i === 1 ? 'text-right' : ''}`}
                style={{ color: 'var(--text-primary)' }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Status row */}
        <p className={`text-[11px] mt-2 leading-snug ${
          isWon ? 'text-emerald-400' :
          isLive ? 'text-red-300' :
          isUpcoming ? 'text-blue-300' : 'opacity-40'
        }`} style={!isWon && !isLive && !isUpcoming ? { color: 'var(--text-primary)' } : {}}>
          {match.status}
        </p>

        {match.venue && (
          <p className="text-[9px] opacity-25 mt-1 truncate" style={{ color: 'var(--text-primary)' }}>
            📍 {match.venue.split(',')[0]}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Header config per sub-intent ─────────────────────────────────────────────
const HEADER_CFG: Record<CricketSubIntent, { icon: string; label: string; glow: string }> = {
  live:     { icon: '🔴', label: 'Live Cricket',     glow: 'rgba(239,68,68,0.1)' },
  result:   { icon: '🏆', label: 'Match Results',    glow: 'rgba(16,185,129,0.1)' },
  upcoming: { icon: '📅', label: 'Upcoming Matches', glow: 'rgba(59,130,246,0.1)' },
  player:   { icon: '👤', label: 'Player Info',      glow: 'rgba(168,85,247,0.1)' },
  series:   { icon: '🏟️', label: 'Series Info',      glow: 'rgba(245,158,11,0.1)' },
  general:  { icon: '🏏', label: 'Cricket',          glow: 'rgba(16,185,129,0.08)' },
};

// ── Main CricketCard ──────────────────────────────────────────────────────────
export function CricketCard({ data }: { data: CricketData }) {
  const sub = (data.subIntent || 'general') as CricketSubIntent;
  const cfg = HEADER_CFG[sub];
  const liveCount = data.matches.filter(m => /live|ongoing|batting/i.test(m.status)).length;
  const displayMatches = data.matches.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
      style={{ background: 'var(--surface)', boxShadow: `0 8px 32px ${cfg.glow}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5"
        style={{ background: `linear-gradient(135deg, ${cfg.glow}, transparent)` }}>
        <span className="text-xl">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>
            {cfg.label}
            {data.filter && ` — ${data.filter.split(' ').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')}`}
          </p>
          {liveCount > 0 && (
            <p className="text-[10px] text-red-400 font-semibold">
              {liveCount} match{liveCount > 1 ? 'es' : ''} live right now
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <motion.span className="w-2 h-2 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-[10px] text-green-400 font-bold">CricAPI</span>
        </div>
      </div>

      {/* Match cards */}
      <div className="p-3 space-y-2.5">
        <AnimatePresence>
          {displayMatches.length > 0 ? (
            displayMatches.map((match, i) => (
              <motion.div key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}>
                <ScoreBlock match={match} />
              </motion.div>
            ))
          ) : (
            <div className="py-6 text-center text-sm opacity-40" style={{ color: 'var(--text-primary)' }}>
              {sub === 'live' ? '😴 No matches live right now' :
               sub === 'upcoming' ? '📅 No upcoming matches found' :
               '🏏 No matches found'}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 py-2 text-[9px] text-center opacity-20" style={{ color: 'var(--text-primary)' }}>
        CricAPI · 500 hits/day · Updates every 30s
      </div>
    </motion.div>
  );
}

// ── Legacy text card (search fallback) ───────────────────────────────────────
export function CricketTextCard({ data }: { data: CricketTextData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="mt-2 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
      style={{ background: 'var(--surface)', boxShadow: '0 8px 32px rgba(16,185,129,0.08)' }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5"
        style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.1),transparent)' }}>
        <span className="text-xl">🏏</span>
        <p className="flex-1 text-xs font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-primary)' }}>
          Cricket Score
        </p>
        {data.status === 'live' && <LivePulse />}
      </div>
      <div className="px-4 py-3 space-y-2">
        {[{ team: data.team1, score: data.score1 }, { team: data.team2, score: data.score2 }]
          .filter(x => x.team).map((x, i) => (
          <div key={i} className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{x.team}</p>
            {x.score && <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{x.score}</p>}
          </div>
        ))}
        {data.winner && <p className="text-xs text-emerald-400 font-bold pt-1">🏆 {data.winner} won</p>}
        {data.venue && <p className="text-[10px] opacity-30" style={{ color: 'var(--text-primary)' }}>📍 {data.venue}</p>}
      </div>
    </motion.div>
  );
}
