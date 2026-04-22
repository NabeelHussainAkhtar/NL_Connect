// ─── RAMSHA MULTI-LAYER INTENT ENGINE ──────────────────────────────────────────
// Layer 1: Query normalization (Hinglish → English)
// Layer 2: Keyword detection (expanded patterns)
// Layer 3: Fuse.js fuzzy match (handles typos & variations)
// Layer 4: LLM classification (final fallback)

import Fuse from 'fuse.js';
import type { Intent } from './router';

// ── LAYER 1: Hinglish / Roman Urdu → English normalization ───────────────────
const HINGLISH_MAP: Record<string, string> = {
  // Weather
  mausam: 'weather', mausam_kya: 'weather today', baarish: 'rain weather',
  garmi: 'hot temperature', thand: 'cold temperature', dhoop: 'sunny weather',
  badal: 'cloudy weather', toofan: 'storm weather', barish: 'rain weather',
  kapkapi: 'cold temperature', umid: 'humidity weather',

  // Finance
  paisa: 'price money', daam: 'price', rate: 'price', bhav: 'price',
  sasta: 'cheap price', mehnga: 'expensive price', kitna: 'how much price',
  kitne_ka: 'how much price', rupee: 'inr price', rupaye: 'inr price',

  // Dictionary
  matlab: 'meaning definition', arth: 'meaning definition',
  matlab_kya: 'meaning of', kya_hota: 'definition meaning', bolte: 'called meaning',

  // Country
  desh: 'country', mulk: 'country', rajdhani: 'capital city',
  aabadi: 'population', jhanda: 'flag country', bhasha: 'language country',

  // Music
  gana: 'play song music', gaana: 'play song music', bajao: 'play music',
  sunao: 'play song music', chalao: 'play music', lagao: 'play music',
  music_laga: 'play music', song_sunao: 'play song', dhun: 'play song music',

  // Maps / Navigation
  kahan: 'where location', rasta: 'direction route map', raasta: 'direction route',
  kaise_jao: 'how to reach navigate', kaise_pahunche: 'how to reach',
  najdik: 'near me location', paas: 'near me location',

  // Live / Search
  kal: 'yesterday today score', aaj: 'today now latest',
  abhi: 'now live latest', taaza: 'latest news update',
  score: 'score today live', match: 'match today live',
  nataija: 'result today', khabar: 'news latest',

  // General helpers
  bata: 'tell me about', batao: 'tell me about', kya_hai: 'what is',
  kaun: 'who is', kab: 'when is', kyu: 'why is',
};

export function normalizeQuery(query: string): string {
  let q = query.toLowerCase().trim();

  // Remove punctuation except spaces
  q = q.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Apply Hinglish map word-by-word first
  const words = q.split(' ');
  const translated = words.map(w => HINGLISH_MAP[w] || w);

  // Also try 2-word phrases using ORIGINAL words (not translated)
  const result: string[] = [];
  let i = 0;
  while (i < words.length) {
    const twoWordKey = `${words[i]}_${words[i + 1]}`;
    if (i + 1 < words.length && HINGLISH_MAP[twoWordKey]) {
      result.push(HINGLISH_MAP[twoWordKey]);
      i += 2;
    } else {
      result.push(translated[i]); // single-word translation
      i++;
    }
  }

  return result.join(' ');
}

// ── LAYER 2: Keyword sets (expanded, multi-language) ─────────────────────────
const KEYWORD_SETS: Record<Intent, string[]> = {
  music_cmd: [
    'play', 'chalao', 'baja', 'sunao', 'bajao', 'lagao', 'gana', 'gaana',
    'music', 'song', 'track', 'playlist', 'suno', 'dhun', 'stream',
  ],
  weather: [
    'weather', 'temperature', 'temp', 'rain', 'humid', 'wind', 'forecast',
    'sunny', 'cloudy', 'celsius', 'fahrenheit', 'mausam', 'baarish', 'barish',
    'garmi', 'thand', 'badal', 'toofan', 'dhoop', 'umbrella', 'coat',
    'hot outside', 'cold outside', 'storm', 'snow', 'fog', 'climate',
  ],
  dictionary: [
    'meaning', 'define', 'definition', 'synonym', 'antonym', 'vocab',
    'pronounce', 'pronunciation', 'spell', 'translate', 'word for',
    'what does', 'what is the meaning', 'matlab', 'arth', 'bolte',
    'kya hota', 'dictionary',
  ],
  country: [
    'capital', 'population', 'currency', 'flag', 'language', 'president',
    'prime minister', 'country', 'nation', 'continent', 'area of', 'located',
    'desh', 'mulk', 'rajdhani', 'aabadi', 'jhanda', 'bhasha',
  ],
  finance: [
    'bitcoin', 'btc', 'ethereum', 'eth', 'bnb', 'binance', 'solana', 'sol',
    'doge', 'dogecoin', 'xrp', 'ripple', 'litecoin', 'ltc', 'cardano', 'ada',
    'matic', 'polygon', 'shiba', 'polkadot', 'dot', 'crypto', 'coin', 'token',
    'blockchain', 'defi', 'nft', 'price', 'usd', 'market cap', 'trading',
    'paisa', 'daam', 'rate', 'bhav', 'kitne ka', 'kitna',
    // Trending / market
    'trending', 'trend', 'gainers', 'hot coin', 'top coin', 'popular coin',
    'crypto market', 'total market', 'btc dominance', 'market overview',
    'kaunsa coin', 'sabse acha coin', 'avax', 'avalanche', 'link', 'chainlink',
    'atom', 'cosmos', 'uni', 'uniswap', 'pepe', 'ton', 'toncoin',
  ],
  maps: [
    'direction', 'navigate', 'how to reach', 'route', 'map', 'location',
    'near me', 'nearest', 'how far', 'distance', 'rasta', 'raasta',
    'kaise jao', 'kaise pahunche', 'najdik', 'paas mein', 'where is',
    'show me', 'take me', 'get me to',
  ],
  search: [
    'today', 'now', 'latest', 'live', 'news', 'update', 'yesterday',
    'breaking', 'currently', 'recently', 'this week', 'just happened',
    'result', 'aaj', 'kal', 'abhi', 'taaza', 'khabar', 'nataija',
    'election', 'politics', 'headline', 'breaking news', 'aaj ki khabar', 'today news',
  ],
  trending: [
    'trending', 'trend', 'gainers', 'hot coin', 'top coin', 'popular coin',
    'kaunsa coin', 'sabse acha coin', 'which crypto',
  ],
  market: [
    'crypto market', 'total market', 'market cap', 'btc dominance',
    'market overview', 'bitcoin dominance', 'overall market',
  ],
  news: [
    'news', 'headline', 'khabar', 'breaking news', 'aaj ki khabar',
    'today news', 'latest news', 'current events',
  ],
  cricket: [
    // Live / current
    'cricket', 'live score', 'live match', 'aaj ka match', 'cricket today',
    'who is playing', 'current match', 'abhi kya chal raha',
    // Tournaments
    'ipl', 'psl', 'bbl', 'wpl', 'test match', 't20', 'odi', 'world cup',
    // Teams
    'csk', 'rcb', 'mi', 'kkr', 'dc', 'srh', 'rr', 'pbks', 'gt', 'lsg',
    'india vs', 'pakistan vs', 'australia vs', 'england vs',
    // Match terms
    'score', 'scorecard', 'innings', 'wicket', 'over', 'batting', 'bowling',
    'century', 'six', 'four', 'boundary', 'run',
    // Result
    'kaun jita', 'who won', 'match result', 'cricket result', 'winner',
    // Upcoming
    'next match', 'upcoming match', 'agla match', 'schedule',
    // Player
    'virat', 'kohli', 'dhoni', 'rohit', 'bumrah', 'babar', 'warner',
    'player info', 'cricketer',
  ],
  llm: [], // catch-all, no keywords
};


function keywordScore(normalized: string, intent: Intent): number {
  const keywords = KEYWORD_SETS[intent];
  if (keywords.length === 0) return 0;
  const words = normalized.split(' ');
  let matches = 0;
  for (const kw of keywords) {
    if (kw.includes(' ')) {
      if (normalized.includes(kw)) matches += 2; // phrase match = higher score
    } else {
      if (words.some(w => w === kw || (w.length > 3 && (w.startsWith(kw) || kw.startsWith(w))))) matches++;
    }
  }
  return matches;
}

// ── LAYER 3: Fuse.js fuzzy index (built once, reused) ────────────────────────
const FUZZY_EXAMPLES: Array<{ text: string; intent: Intent }> = [
  // Weather
  { text: 'mausam kaisa hai', intent: 'weather' },
  { text: 'weather today', intent: 'weather' },
  { text: 'will it rain', intent: 'weather' },
  { text: 'temperature outside', intent: 'weather' },
  { text: 'aaj garmi hai kya', intent: 'weather' },
  { text: 'kitni thand hai', intent: 'weather' },
  { text: 'baarish hogi', intent: 'weather' },
  // Finance
  { text: 'bitcoin price today', intent: 'finance' },
  { text: 'btc kitne ka hai', intent: 'finance' },
  { text: 'ethereum rate kya hai', intent: 'finance' },
  { text: 'crypto market', intent: 'finance' },
  { text: 'coin price abhi kya hai', intent: 'finance' },
  { text: 'doge price check', intent: 'finance' },
  // Dictionary
  { text: 'what does serendipity mean', intent: 'dictionary' },
  { text: 'define ephemeral', intent: 'dictionary' },
  { text: 'meaning of resilience', intent: 'dictionary' },
  { text: 'ubiquitous ka matlab', intent: 'dictionary' },
  { text: 'word definition', intent: 'dictionary' },
  // Country
  { text: 'capital of japan', intent: 'country' },
  { text: 'pakistan ki population', intent: 'country' },
  { text: 'currency of france', intent: 'country' },
  { text: 'india ka flag', intent: 'country' },
  { text: 'president of america', intent: 'country' },
  // Maps
  { text: 'how to reach connaught place', intent: 'maps' },
  { text: 'direction to airport', intent: 'maps' },
  { text: 'nearest hospital', intent: 'maps' },
  { text: 'rasta batao', intent: 'maps' },
  { text: 'distance from here to india gate', intent: 'maps' },
  // Cricket
  { text: 'ipl score today', intent: 'cricket' },
  { text: 'latest cricket match result', intent: 'cricket' },
  { text: 'aaj ka match kaun jita', intent: 'cricket' },
  { text: 'csk vs rcb score', intent: 'cricket' },
  { text: 'india vs pakistan live score', intent: 'cricket' },
  { text: 'cricket match today', intent: 'cricket' },
  { text: 'scorecard abhi', intent: 'cricket' },
  { text: 'ipl live score', intent: 'cricket' },
  // Search (non-cricket)
  { text: 'breaking news', intent: 'search' },
  { text: 'current news india', intent: 'search' },
  // Music
  { text: 'play tum hi ho', intent: 'music_cmd' },
  { text: 'gana laga do', intent: 'music_cmd' },
  { text: 'music chalao', intent: 'music_cmd' },
  { text: 'play kesariya song', intent: 'music_cmd' },
  { text: 'sunao koi gaana', intent: 'music_cmd' },
];

let _fuseIndex: Fuse<{ text: string; intent: Intent }> | null = null;

function getFuseIndex() {
  if (!_fuseIndex) {
    _fuseIndex = new Fuse(FUZZY_EXAMPLES, {
      keys: ['text'],
      threshold: 0.45,
      includeScore: true,
      ignoreLocation: true,
    });
  }
  return _fuseIndex;
}

function fuzzyDetect(normalized: string): { intent: Intent; confidence: number } | null {
  const fuse = getFuseIndex();
  const results = fuse.search(normalized);
  if (!results.length) return null;
  const best = results[0];
  const confidence = 1 - (best.score ?? 1); // score 0 = perfect match → confidence 1
  if (confidence < 0.55) return null;
  return { intent: best.item.intent, confidence };
}

// ── LAYER 4: LLM intent classification (async, fallback) ─────────────────────
const WORKER_BASE = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev';

async function llmClassify(query: string): Promise<Intent> {
  try {
    const prompt = `Classify this user query into exactly ONE category. Return ONLY the category name, nothing else.

Categories: weather, finance, trending, market, dictionary, country, cricket, news, search, music_cmd, maps, llm

Query: "${query}"

Category:`;

    const res = await fetch(`${WORKER_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'meta-llama/llama-3-8b-instruct',
        stream: false,
        uid: 'intent-classifier',
      }),
    });

    if (!res.ok) return 'llm';
    const data = await res.json() as any;
    const raw = (data?.result?.response ?? data?.message ?? '').toLowerCase().trim();
    const validIntents: Intent[] = [
      'weather', 'finance', 'trending', 'market',
      'dictionary', 'country', 'cricket', 'news',
      'search', 'music_cmd', 'maps', 'llm'
    ];
    const matched = validIntents.find(i => raw.includes(i));
    return matched ?? 'llm';
  } catch {
    return 'llm';
  }
}

// ── COMBINED DETECTOR (exported) ─────────────────────────────────────────────
export interface IntentResult {
  intent: Intent;
  confidence: 'high' | 'medium' | 'low';
  method: 'keyword' | 'fuzzy' | 'llm' | 'default';
}

export async function detectIntent(rawQuery: string): Promise<IntentResult> {
  // Step 1: Normalize
  const normalized = normalizeQuery(rawQuery);

  // Step 2: Keyword scoring across all intents (except llm)
  const intents: Intent[] = [
    'music_cmd', 'weather', 'dictionary', 'country',
    'finance', 'trending', 'market', 'maps', 'cricket', 'news', 'search'
  ];
  const scores = intents.map(intent => ({ intent, score: keywordScore(normalized, intent) }));
  scores.sort((a, b) => b.score - a.score);

  // High confidence keyword match
  if (scores[0].score >= 2) {
    // Tie-break: if 'play'/'sunao'/'gana' is in query, always prefer music_cmd
    const isPlayQuery = /\b(play|sunao|bajao|gana|gaana|chalao|lagao|baja|suno|dhun)\b/i.test(rawQuery);
    if (isPlayQuery && scores.find(s => s.intent === 'music_cmd' && s.score >= 1)) {
      return { intent: 'music_cmd', confidence: 'high', method: 'keyword' };
    }
    return { intent: scores[0].intent, confidence: 'high', method: 'keyword' };
  }
  // Medium confidence keyword match
  if (scores[0].score === 1) {
    const isPlayQuery = /\b(play|sunao|bajao|gana|gaana|chalao|lagao)\b/i.test(rawQuery);
    if (isPlayQuery) return { intent: 'music_cmd', confidence: 'medium', method: 'keyword' };
    return { intent: scores[0].intent, confidence: 'medium', method: 'keyword' };
  }

  // Step 3: Fuzzy match
  const fuzzy = fuzzyDetect(normalized);
  if (fuzzy) {
    return {
      intent: fuzzy.intent,
      confidence: fuzzy.confidence > 0.75 ? 'high' : 'medium',
      method: 'fuzzy',
    };
  }

  // Step 4: LLM classification (async fallback for ambiguous queries)
  const llmIntent = await llmClassify(rawQuery);
  if (llmIntent !== 'llm') {
    return { intent: llmIntent, confidence: 'low', method: 'llm' };
  }

  return { intent: 'llm', confidence: 'high', method: 'default' };
}
