// ─── RAMSHA SMART ROUTER ──────────────────────────────────────────────────────
import { detectIntent }          from './intent';
import { getSharedGPS }          from './gps';
import { getWeather, geocodeCity, extractCityFromQuery } from './tools/weather';
import { lookupWord }            from './tools/dictionary';
import { getCountryInfo }        from './tools/countries';
import { getCryptoPrice, getTrendingCoins, getGlobalMarket, extractCoinIds } from './tools/finance';
import { smartCricketFetch, extractCricketFilter } from './tools/cricket';
import { performWebSearch }      from './search';

export type Intent =
  | 'music_cmd' | 'weather'  | 'dictionary' | 'country'
  | 'finance'   | 'trending' | 'market'     | 'news'
  | 'cricket'   | 'maps'     | 'search'     | 'llm';

export interface RouterResult {
  intent: Intent;
  apiContext: string | null;
  structuredData: any | null;
  extractedParam: string;
}

// ── GPS — delegated to shared gps.ts (single cache, one permission dialog) ──
// See src/lib/ai/gps.ts

// ── Param extractors ──────────────────────────────────────────────────────────
function extractWord(q: string): string {
  const pats = [
    /\bmeaning of\s+["']?(\w+)/i,
    /\bdefine\s+["']?(\w+)/i,
    /\bdefinition of\s+["']?(\w+)/i,
    /\bwhat does\s+["']?(\w+)(?:\s+mean)?/i,
    /\bpronunciation of\s+["']?(\w+)/i,
    /\bmatlab\s+["']?(\w+)/i,
    /\barth\s+["']?(\w+)/i,
    /\bsynonym(?:s)? (?:of|for)\s+(\w+)/i,
  ];
  for (const p of pats) {
    const m = q.match(p);
    if (m?.[1] && m[1].length > 1) return m[1].toLowerCase();
  }
  // Last meaningful word (skip short/common words)
  const stopWords = new Set(['what', 'does', 'mean', 'tell', 'me', 'the', 'define', 'is', 'of', 'a', 'an']);
  return q.replace(/[^a-zA-Z\s]/g, '').trim()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
    .slice(-1)[0] || '';
}

function extractCountry(q: string): string {
  // "capital of Japan", "India ki population", "flag of France"
  const patterns = [
    /\b(?:capital|population|currency|flag|language|president|prime minister|area|pm|about|size)\s+of\s+([A-Z][a-zA-Z\s]{1,25}?)(?:\s+(?:is|are|kya|hai))?\s*[?.]?\s*$/i,
    /\b([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?)\s+(?:ki|ka|ke)\s+(?:capital|rajdhani|population|aabadi|currency|flag|language)/i,
    /\b(?:tell me about|about|info on|information about)\s+([A-Z][a-zA-Z\s]{2,20}?)(?:\s+country)?\s*[?.]?\s*$/i,
  ];
  for (const p of patterns) {
    const m = q.match(p);
    if (m?.[1]) return m[1].trim();
  }
  // Fallback: first capitalized word that looks like a country
  const capWord = q.match(/\b([A-Z][a-zA-Z]{2,})\b/);
  return capWord?.[1] ?? '';
}

function extractDestination(q: string): string {
  const patterns = [
    /\b(?:navigate to|directions? to|route to|how to reach|take me to|get me to)\s+(.+?)(?:\s+from\s+.+)?$/i,
    /\b(?:nearest|near me|closest)\s+(.+)/i,
    /\b(?:where is|location of|map of|show me)\s+(.+)/i,
    /\b(?:distance (?:to|from|between))\s+(.+)/i,
  ];
  for (const p of patterns) {
    const m = q.match(p);
    if (m?.[1]) return m[1].replace(/[?.]$/, '').trim();
  }
  return q.replace(/\b(direction|navigate|map of|where is|nearest|near me|how far|distance)\b/gi, '').trim();
}

// ── Cricket query formatter ──────────────────────────────────────────────────
function buildCricketQuery(query: string): string {
  const q = query.toLowerCase();
  // If specific teams or tournament mentioned, keep them; add scorecard suffix
  const hasTournament = /ipl|psl|bbl|csk|rcb|kkr|mi|srh|dc|rr|pbks|gt|lsg/i.test(q);
  if (hasTournament) {
    return `${query} scorecard today 2025 site:espncricinfo.com OR site:cricbuzz.com`;
  }
  return `cricket match score today 2025 ${query} site:espncricinfo.com OR site:cricbuzz.com`;
}

// ── Main router ───────────────────────────────────────────────────────────────
export async function routeQuery(query: string): Promise<RouterResult> {
  const none: RouterResult = { intent: 'llm', apiContext: null, structuredData: null, extractedParam: '' };

  const { intent } = await detectIntent(query);

  switch (intent) {
    // ── MUSIC ────────────────────────────────────────────────────────────────
    case 'music_cmd':
      return { intent, apiContext: null, structuredData: null, extractedParam: '' };

    // ── WEATHER (place-aware) ────────────────────────────────────────────────
    case 'weather': {
      const cityName = extractCityFromQuery(query);
      let lat: number, lon: number, resolvedCity: string;

      if (cityName) {
        // User specified a place → geocode it (NEVER use cached GPS)
        const geo = await geocodeCity(cityName);
        if (!geo) {
          return { ...none, intent: 'weather', apiContext: `Could not find location: ${cityName}`, structuredData: null, extractedParam: cityName };
        }
        lat = geo.lat;
        lon = geo.lon;
        resolvedCity = geo.displayName;
      } else {
        // No place specified → use shared GPS
        const gps = await getSharedGPS();
        if (!gps) return none;
        lat = gps.lat;
        lon = gps.lon;
        resolvedCity = gps.city; // already reverse-geocoded by getSharedGPS()
      }

      const { context, data } = await getWeather(lat, lon, resolvedCity);
      return { intent, apiContext: context, structuredData: data, extractedParam: resolvedCity };
    }

    // ── DICTIONARY ───────────────────────────────────────────────────────────
    case 'dictionary': {
      const word = extractWord(query);
      if (!word) return none;
      const { context, data } = await lookupWord(word);
      if (!data) return none;
      return { intent, apiContext: context, structuredData: data, extractedParam: word };
    }

    // ── COUNTRY ──────────────────────────────────────────────────────────────
    case 'country': {
      const country = extractCountry(query);
      if (!country) return none;
      const { context, data } = await getCountryInfo(country);
      if (!data) return none;
      return { intent, apiContext: context, structuredData: data, extractedParam: country };
    }

    // ── FINANCE ───────────────────────────────────────────────────────────
    case 'finance': {
      // Detect if user wants trending or global market overview
      const q = query.toLowerCase();
      const wantsTrending = /\b(trend|trending|hot|gainers|top coin|popular coin|which coin|kaunsa coin|sabse)\b/i.test(q);
      const wantsMarket   = /\b(market|overall|crypto market|total market|market cap|dominance|bitcoin dominance|overview)\b/i.test(q);

      if (wantsTrending) {
        const data = await getTrendingCoins();
        if (!data) return none;
        const ctx = data.coins.map(c => `${c.name} (${c.symbol}) ${c.change24h ? c.change24h + '%' : ''}`).join(', ');
        return { intent: 'trending', apiContext: `Trending coins: ${ctx}`, structuredData: data, extractedParam: '' };
      }
      if (wantsMarket) {
        const data = await getGlobalMarket();
        if (!data) return none;
        const cap = (data.totalMarketCapUsd / 1e12).toFixed(2);
        const ctx = `Total market cap: $${cap}T | BTC dominance: ${data.btcDominance.toFixed(1)}% | 24h change: ${data.marketCapChangePercent24h.toFixed(2)}%`;
        return { intent: 'market', apiContext: ctx, structuredData: data, extractedParam: '' };
      }

      const coinIds = extractCoinIds(query);
      const { context, data } = await getCryptoPrice(coinIds);
      if (!data) return none;
      return { intent: 'finance', apiContext: context, structuredData: data, extractedParam: coinIds.join(',') };
    }

    // ── MAPS ─────────────────────────────────────────────────────────────────
    case 'maps': {
      const destination = extractDestination(query);
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(destination)}`;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
      return {
        intent,
        apiContext: `Maps URL for "${destination}": ${mapsUrl}`,
        structuredData: { destination, mapsUrl, directionsUrl, distanceInfo: '' },
        extractedParam: destination,
      };
    }

    // ── CRICKET (CricAPI — smart sub-routing) ────────────────────────────────
    case 'cricket': {
      const { context, data, subIntent } = await smartCricketFetch(query);
      if (!data) return none;
      const filter = extractCricketFilter(query);
      return {
        intent: 'cricket',
        apiContext: context,
        structuredData: { ...data, subIntent },
        extractedParam: filter || subIntent || 'general',
      };
    }

    // ── LIVE SEARCH (news, etc.) ──────────────────────────────────
    case 'search': {
      const isNews    = /\b(news|headline|khabar|breaking|latest news|aaj ki khabar|today news)\b/i.test(query);
      const rawContext = await performWebSearch(isNews ? `${query} latest today` : query);
      if (!rawContext) return none;
      const structuredData = {
        query,
        rawContext,
        snippet: rawContext.slice(0, 400),
        source: isNews ? 'Google News' : 'Google Search',
        isNews,
      };
      return { intent: isNews ? 'news' : 'search', apiContext: rawContext, structuredData, extractedParam: query };
    }

    default:
      return none;
  }
}
