const WORKER_BASE = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev';

export interface CountryData {
  name: string;
  capital: string;
  population: number;
  area: number;
  currencies: string;
  languages: string;
  region: string;
  subregion: string;
  flag: string;
  flagPng?: string;
  timezones: string[];
}

export interface CountryToolResult {
  context: string;
  data: CountryData | null;
}

export async function getCountryInfo(name: string): Promise<CountryToolResult> {
  const empty: CountryToolResult = { context: '', data: null };
  try {
    const res = await fetch(`${WORKER_BASE}/api/tool/country?name=${encodeURIComponent(name)}`);
    if (!res.ok) return empty;
    const raw = await res.json() as any[];
    const c = Array.isArray(raw) ? raw[0] : raw;
    if (!c) return empty;

    const data: CountryData = {
      name: c.name?.common ?? name,
      capital: Array.isArray(c.capital) ? c.capital[0] : (c.capital ?? 'N/A'),
      population: c.population ?? 0,
      area: c.area ?? 0,
      currencies: Object.values(c.currencies ?? {}).map((cur: any) => `${cur.name} (${cur.symbol ?? ''})`).join(', ') || 'N/A',
      languages: Object.values(c.languages ?? {}).join(', ') || 'N/A',
      region: c.region ?? '',
      subregion: c.subregion ?? '',
      flag: c.flags?.emoji ?? '🏳️',
      flagPng: c.flags?.png,
      timezones: c.timezones ?? [],
    };

    const pop = new Intl.NumberFormat('en-IN').format(data.population);
    const area = new Intl.NumberFormat('en-IN').format(data.area);
    const context = `${data.flag} ${data.name} | Capital: ${data.capital} | Population: ${pop} | Area: ${area} km² | Currency: ${data.currencies} | Languages: ${data.languages} | Region: ${data.subregion}, ${data.region}`;
    return { context, data };
  } catch {
    return empty;
  }
}
