// ─── CRICKET TOOL — CricAPI Integration ─────────────────────────────────────
// Uses api.cricapi.com (500 hits/day) via Cloudflare Worker proxy.
// API key lives in the Worker — never exposed to client.

const WORKER_BASE = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CricketInning {
  inning: string;
  r: number;
  w: number;
  o: number;
}

export interface CricketMatch {
  id: string;
  name: string;
  matchType: 'odi' | 't20' | 'test' | string;
  status: string;
  venue?: string;
  date: string;
  dateTimeGMT?: string;
  teams: string[];
  score: CricketInning[];
  tossWinner?: string;
  matchWinner?: string;
}

export interface CricketData {
  matches: CricketMatch[];
  total: number;
  filter?: string;
  subIntent?: CricketSubIntent;
}

export type CricketSubIntent = 'live' | 'result' | 'upcoming' | 'player' | 'series' | 'general';

export interface CricketToolResult {
  context: string;
  data: CricketData | null;
}

// ── 30-second in-memory cache (prevent API hammering) ────────────────────────
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds for live data

function cacheGet(key: string) {
  const c = cache.get(key);
  if (c && Date.now() - c.ts < CACHE_TTL) return c.data;
  return null;
}
function cacheSet(key: string, data: any) {
  cache.set(key, { data, ts: Date.now() });
}

// ── Team alias map (abbreviation → search term) ──────────────────────────────
const TEAM_ALIASES: Record<string, string> = {
  csk: 'chennai',      rcb: 'bangalore',  mi: 'mumbai',
  kkr: 'kolkata',      dc: 'delhi',       srh: 'hyderabad',
  rr: 'rajasthan',     pbks: 'punjab',    gt: 'gujarat',
  lsg: 'lucknow',      pak: 'pakistan',   ind: 'india',
  aus: 'australia',    eng: 'england',    sa: 'south africa',
  nz: 'new zealand',   wi: 'west indies', ban: 'bangladesh',
  sl: 'sri lanka',     zim: 'zimbabwe',   afg: 'afghanistan',
};

// ── Player name map (common names → search terms) ───────────────────────────
const PLAYER_ALIASES: Record<string, string> = {
  virat: 'virat kohli',     kohli: 'virat kohli',
  dhoni: 'ms dhoni',        msd: 'ms dhoni',
  rohit: 'rohit sharma',    hitman: 'rohit sharma',
  bumrah: 'jasprit bumrah', babar: 'babar azam',
  warner: 'david warner',   smith: 'steve smith',
  root: 'joe root',         stokes: 'ben stokes',
  sachin: 'sachin tendulkar', tendulkar: 'sachin tendulkar',
};

// ── Sub-intent classifier ─────────────────────────────────────────────────────
export function classifyCricketSubIntent(query: string): CricketSubIntent {
  const q = query.toLowerCase();
  if (/\b(live|current|now|abhi|chal raha|playing now|ongoing)\b/.test(q)) return 'live';
  if (/\b(won|win|beat|result|jita|kaun jita|winner|defeated)\b/.test(q)) return 'result';
  if (/\b(next|upcoming|agla|schedule|when is|kab hai|future)\b/.test(q)) return 'upcoming';
  if (/\b(player|cricketer|baller|batsman|bowler|stats|virat|kohli|dhoni|rohit|bumrah|babar|warner)\b/.test(q)) return 'player';
  if (/\b(series|tournament|world cup|ipl 2024|ipl 2025|wpl|bbl)\b/.test(q)) return 'series';
  return 'general';
}

/** Extract team filter from query */
export function extractCricketFilter(query: string): string {
  const q = query.toLowerCase();
  if (/\bipl\b/i.test(q)) return 'premier league';
  if (/\bpsl\b/i.test(q)) return 'pakistan super';
  if (/\bbbl\b/i.test(q)) return 'big bash';
  if (/\bwpl\b/i.test(q)) return "women's premier";
  if (/\bworld cup\b/i.test(q)) return 'world cup';

  const teamPat = /\b(csk|rcb|mi|kkr|dc|srh|rr|pbks|gt|lsg|india|pakistan|australia|england|west indies|new zealand|south africa|bangladesh|sri lanka|afghanistan)\b/i;
  const tm = q.match(teamPat);
  if (tm?.[1]) {
    const key = tm[1].toLowerCase();
    return TEAM_ALIASES[key] || key;
  }
  return '';
}

/** Extract player name from query */
export function extractPlayerName(query: string): string | null {
  const q = query.toLowerCase();
  for (const [alias, full] of Object.entries(PLAYER_ALIASES)) {
    if (q.includes(alias)) return full;
  }
  return null;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Current (live) matches */
export async function getCurrentMatches(filter = ''): Promise<CricketToolResult> {
  const cacheKey = `current:${filter}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const result = await _fetchMatches('current', filter);
  if (result.data) cacheSet(cacheKey, result);
  return result;
}

/** Recent/all matches (used for results + upcoming) */
export async function getRecentMatches(filter = ''): Promise<CricketToolResult> {
  const cacheKey = `all:${filter}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const result = await _fetchMatches('all', filter);
  if (result.data) cacheSet(cacheKey, result);
  return result;
}

async function _fetchMatches(type: 'current' | 'all', filter: string): Promise<CricketToolResult> {
  const empty: CricketToolResult = { context: '', data: null };
  try {
    const params = new URLSearchParams({ type });
    if (filter) params.set('q', filter);
    const res = await fetch(`${WORKER_BASE}/api/tool/cricket?${params}`);
    if (!res.ok) return empty;
    const raw = await res.json() as { matches: CricketMatch[]; total: number; status: string };
    if (raw.status !== 'success') return empty;
    const data: CricketData = { matches: raw.matches, total: raw.total, filter };
    return { context: buildContext(raw.matches), data };
  } catch {
    return empty;
  }
}

/** Smart route: picks the right API call based on sub-intent */
export async function smartCricketFetch(query: string): Promise<CricketToolResult & { subIntent: CricketSubIntent }> {
  const subIntent = classifyCricketSubIntent(query);
  const filter = extractCricketFilter(query);
  const empty = { context: '', data: null, subIntent };

  let result: CricketToolResult;

  if (subIntent === 'live' || subIntent === 'general') {
    result = await getCurrentMatches(filter);
    // Fallback to all matches if nothing live
    if (!result.data?.matches?.length) {
      result = await getRecentMatches(filter);
    }
  } else if (subIntent === 'result') {
    // Get recent matches and filter for completed ones
    result = await getRecentMatches(filter);
    if (result.data) {
      const completed = result.data.matches.filter(m =>
        /won|win|beat|defeated|result/i.test(m.status) || m.matchWinner
      );
      result.data = { ...result.data, matches: completed, subIntent: 'result' };
    }
  } else if (subIntent === 'upcoming') {
    result = await getRecentMatches(filter);
    if (result.data) {
      const upcoming = result.data.matches.filter(m =>
        /not started|upcoming|scheduled|yet to|toss/i.test(m.status) && !m.matchWinner
      );
      result.data = { ...result.data, matches: upcoming, subIntent: 'upcoming' };
    }
  } else {
    result = await getCurrentMatches(filter);
    if (!result.data?.matches?.length) result = await getRecentMatches(filter);
  }

  if (result.data) result.data.subIntent = subIntent;
  return { ...result, subIntent };
}

function buildContext(matches: CricketMatch[]): string {
  if (!matches.length) return 'No cricket matches found.';
  return matches.slice(0, 3).map(m => {
    const scoreStr = m.score.length
      ? m.score.map(s => `${s.inning}: ${s.r}/${s.w} (${s.o} ov)`).join(' | ')
      : 'Score N/A';
    return `${m.name} — ${m.status} | ${scoreStr} | ${m.venue || ''}`;
  }).join('\n');
}
