import { getSharedGPS } from './gps';

const WORKER_BASE = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev';

export interface SearchResult {
  result: string | null;
  richData?: {
    type: 'answer_box' | 'sports' | 'news' | 'knowledge';
    [key: string]: any;
  } | null;
}

export async function performWebSearch(query: string): Promise<string | null> {
  try {
    const gps = await getSharedGPS();
    const location = gps?.city ?? 'India';
    const url = `${WORKER_BASE}/api/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Search Worker Failed:', response.statusText);
      return null;
    }
    const data = await response.json() as SearchResult;
    return data.result;
  } catch (error) {
    console.error('Search fetch error:', error);
    return null;
  }
}

