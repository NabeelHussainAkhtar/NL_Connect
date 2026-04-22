const WORKER_BASE = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev';

export interface DictionaryMeaning {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryData {
  word: string;
  phonetic: string;
  audioUrl?: string;
  origin?: string;
  meanings: DictionaryMeaning[];
}

export interface DictionaryToolResult {
  context: string;
  data: DictionaryData | null;
}

export async function lookupWord(word: string): Promise<DictionaryToolResult> {
  const empty: DictionaryToolResult = { context: '', data: null };
  try {
    const clean = word.trim().toLowerCase().split(' ')[0];
    const res = await fetch(`${WORKER_BASE}/api/tool/dict?word=${encodeURIComponent(clean)}`);
    if (!res.ok) return empty;
    const raw = await res.json() as any[];
    const entry = raw?.[0];
    if (!entry) return empty;

    const audioEntry = entry.phonetics?.find((p: any) => p.audio);
    const data: DictionaryData = {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
      audioUrl: audioEntry?.audio ? `https:${audioEntry.audio}` : undefined,
      origin: entry.origin,
      meanings: (entry.meanings ?? []).slice(0, 3).map((m: any) => ({
        partOfSpeech: m.partOfSpeech,
        definition: m.definitions?.[0]?.definition ?? '',
        example: m.definitions?.[0]?.example,
        synonyms: (m.synonyms ?? []).slice(0, 4),
        antonyms: (m.antonyms ?? []).slice(0, 3),
      })),
    };

    const contextParts = data.meanings.slice(0, 2).map(
      m => `${m.partOfSpeech}: ${m.definition}${m.example ? ` (e.g., "${m.example}")` : ''}`
    );
    const context = `"${data.word}" [${data.phonetic}] — ${contextParts.join(' | ')}`;
    return { context, data };
  } catch {
    return empty;
  }
}
