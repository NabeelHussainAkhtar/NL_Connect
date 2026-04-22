// ─── RAMSHA MEMORY SYSTEM (3-Tier TTL + Source Tagging) ─────────────────────
import type { Intent } from './router';

export interface MemoryCache {
  query: string;
  normalizedQuery: string;
  answer: string;
  timestamp: number;
  type: 'static' | 'semi' | 'dynamic';
  source: Intent | 'unknown';
  ttl: number;
  popularity: number;
}

const DB_NAME = 'RamshaBrain';
const STORE_NAME = 'search_cache';
const DB_VERSION = 2; // bumped to add 'semi' and 'source'

// TTL table
const TTL: Record<MemoryCache['type'], number> = {
  static:  30 * 24 * 60 * 60 * 1000, // 30 days
  semi:     1 * 24 * 60 * 60 * 1000,  // 1 day
  dynamic:       5 * 60 * 1000,       // 5 minutes
};

// Which sources use which TTL
export function sourceToType(source: Intent): MemoryCache['type'] {
  switch (source) {
    case 'dictionary': return 'static';
    case 'country':    return 'static';
    case 'llm':        return 'static';
    case 'weather':    return 'semi';
    case 'finance':    return 'dynamic';
    case 'search':     return 'dynamic';
    case 'maps':       return 'semi';
    default:           return 'static';
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'normalizedQuery' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror  = () => reject(request.error);
  });
}

// ── Query normalizer (removes stopwords & punctuation) ────────────────────
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\b(what|is|the|tell|me|about|who|where|when|how|a|an|does|do|can|could|would|please|aur|kya|bata|dost)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Legacy intent classifier (kept for backwards compat) ──────────────────
export function classifyIntent(query: string): 'static' | 'dynamic' {
  const dynamicKeywords = ['today', 'now', 'latest', 'live', 'score', 'price', 'news', 'weather', 'update', 'yesterday', 'match', 'ipl'];
  return dynamicKeywords.some(k => query.toLowerCase().includes(k)) ? 'dynamic' : 'static';
}

// ── Read from memory ───────────────────────────────────────────────────────
export async function getFromMemory(query: string): Promise<string | null> {
  try {
    const normalized = normalizeQuery(query);
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(normalized);
      request.onsuccess = () => {
        const result = request.result as MemoryCache | undefined;
        if (!result) { resolve(null); return; }
        const age = Date.now() - result.timestamp;
        if (age > result.ttl) {
          resolve(null); // expired
        } else {
          // Boost popularity silently
          saveToMemory(query, result.answer, result.source as Intent, result.popularity + 1).catch(() => {});
          resolve(result.answer);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ── Write to memory ────────────────────────────────────────────────────────
export async function saveToMemory(
  query: string,
  answer: string,
  source: Intent | 'unknown' = 'unknown',
  existingPopularity = 1
): Promise<void> {
  try {
    const type = sourceToType(source as Intent);
    const normalized = normalizeQuery(query);
    const db = await openDB();
    const cacheItem: MemoryCache = {
      query,
      normalizedQuery: normalized,
      answer,
      timestamp: Date.now(),
      type,
      source,
      ttl: TTL[type],
      popularity: existingPopularity,
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(cacheItem);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } catch {
    // Never crash the app because of cache write failure
  }
}
