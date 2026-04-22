const WORKER_BASE = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev';

export interface CoinData {
  id: string;
  name: string;
  usd: number;
  inr: number;
  change24h: number;
  vol24hUsd?: number;
  marketCapUsd?: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  rank?: number;
  priceBtc?: number;
  priceUsd?: string;
  change24h?: string;
}

export interface FinanceData {
  coins: CoinData[];
}

export interface TrendingData {
  coins: TrendingCoin[];
}

export interface GlobalMarketData {
  activeCryptos: number;
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  btcDominance: number;
  marketCapChangePercent24h: number;
}

export interface CoinDetailData {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  priceUsd: number;
  priceInr: number;
  marketCapUsd: number;
  volume24hUsd: number;
  change24h: number;
  change7d: number;
  change30d: number;
  athUsd: number;
  atlUsd: number;
  circulatingSupply: number;
  sparkline7d: number[];
}

export interface FinanceToolResult {
  context: string;
  data: FinanceData | null;
}

const COIN_MAP: Record<string, string> = {
  bitcoin: 'bitcoin',      btc: 'bitcoin',
  ethereum: 'ethereum',    eth: 'ethereum',
  bnb: 'binancecoin',      binance: 'binancecoin',
  solana: 'solana',        sol: 'solana',
  doge: 'dogecoin',        dogecoin: 'dogecoin',
  xrp: 'ripple',           ripple: 'ripple',
  ltc: 'litecoin',         litecoin: 'litecoin',
  ada: 'cardano',          cardano: 'cardano',
  matic: 'matic-network',  polygon: 'matic-network',
  dot: 'polkadot',         polkadot: 'polkadot',
  shib: 'shiba-inu',       shiba: 'shiba-inu',
  avax: 'avalanche-2',     avalanche: 'avalanche-2',
  link: 'chainlink',       chainlink: 'chainlink',
  atom: 'cosmos',          cosmos: 'cosmos',
  uni: 'uniswap',          uniswap: 'uniswap',
  pepe: 'pepe',
  ton: 'the-open-network', toncoin: 'the-open-network',
};

const COIN_NAMES: Record<string, string> = {
  bitcoin: 'Bitcoin',       binancecoin: 'BNB',         ethereum: 'Ethereum',
  solana: 'Solana',         dogecoin: 'Dogecoin',        ripple: 'XRP',
  litecoin: 'Litecoin',     cardano: 'Cardano',          'matic-network': 'Polygon',
  polkadot: 'Polkadot',     'shiba-inu': 'Shiba Inu',   'avalanche-2': 'Avalanche',
  chainlink: 'Chainlink',   cosmos: 'Cosmos',            uniswap: 'Uniswap',
  pepe: 'Pepe',             'the-open-network': 'Toncoin',
};

export function extractCoinIds(query: string): string[] {
  const q = query.toLowerCase();
  const found = Object.keys(COIN_MAP).filter(k => q.includes(k));
  const ids = [...new Set(found.map(k => COIN_MAP[k]))];
  // Default to top 3 market-cap coins if none specifically detected
  return ids.length > 0 ? ids : ['bitcoin', 'ethereum', 'solana'];
}

// ── Simple price (with 24h volume) ─────────────────────────────────────────
export async function getCryptoPrice(coinIds: string[]): Promise<FinanceToolResult> {
  const empty: FinanceToolResult = { context: '', data: null };
  try {
    const ids = coinIds.join(',');
    const res = await fetch(`${WORKER_BASE}/api/tool/finance?coins=${encodeURIComponent(ids)}`);
    if (!res.ok) return empty;
    const raw = await res.json() as Record<string, any>;

    const coins: CoinData[] = Object.entries(raw).map(([id, prices]) => ({
      id,
      name: COIN_NAMES[id] || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      usd: prices.usd ?? 0,
      inr: prices.inr ?? 0,
      change24h: prices.usd_24h_change ?? 0,
      vol24hUsd: prices.usd_24h_vol,
      marketCapUsd: prices.usd_market_cap,
    }));

    const data: FinanceData = { coins };
    const contextLines = coins.map(c => {
      const usd = c.usd.toLocaleString('en-US', { maximumFractionDigits: 2 });
      const inr = c.inr.toLocaleString('en-IN', { maximumFractionDigits: 0 });
      const arrow = c.change24h > 0 ? '📈' : '📉';
      return `${c.name}: $${usd} (₹${inr}) ${arrow} ${Math.abs(c.change24h).toFixed(2)}% 24h`;
    });
    return { context: contextLines.join(' | '), data };
  } catch {
    return empty;
  }
}

// ── Trending coins ─────────────────────────────────────────────────────────
export async function getTrendingCoins(): Promise<TrendingData | null> {
  try {
    const res = await fetch(`${WORKER_BASE}/api/tool/finance/trending`);
    if (!res.ok) return null;
    const data = await res.json() as any;
    return {
      coins: (data.coins || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol?.toUpperCase(),
        thumb: c.thumb,
        rank: c.rank,
        priceBtc: c.price_btc,
        priceUsd: c.data?.price,
        change24h: c.data?.price_change_percentage_24h?.usd?.toFixed(2),
      }))
    };
  } catch {
    return null;
  }
}

// ── Global market overview ─────────────────────────────────────────────────
export async function getGlobalMarket(): Promise<GlobalMarketData | null> {
  try {
    const res = await fetch(`${WORKER_BASE}/api/tool/finance/global`);
    if (!res.ok) return null;
    const raw = await res.json() as any;
    const d = raw.data;
    return {
      activeCryptos: d.active_cryptocurrencies,
      totalMarketCapUsd: d.total_market_cap?.usd ?? 0,
      totalVolumeUsd: d.total_volume?.usd ?? 0,
      btcDominance: d.market_cap_percentage?.btc ?? 0,
      marketCapChangePercent24h: d.market_cap_change_percentage_24h_usd ?? 0,
    };
  } catch {
    return null;
  }
}

// ── Full coin detail with sparkline ────────────────────────────────────────
export async function getCoinDetail(coinId: string): Promise<CoinDetailData | null> {
  try {
    const res = await fetch(`${WORKER_BASE}/api/tool/finance/coin?id=${encodeURIComponent(coinId)}`);
    if (!res.ok) return null;
    const d = await res.json() as any;
    const md = d.market_data || {};
    return {
      id: d.id,
      name: d.name,
      symbol: d.symbol,
      image: d.image,
      description: d.description,
      priceUsd: md.current_price?.usd ?? 0,
      priceInr: md.current_price?.inr ?? 0,
      marketCapUsd: md.market_cap?.usd ?? 0,
      volume24hUsd: md.total_volume?.usd ?? 0,
      change24h: md.price_change_24h ?? 0,
      change7d: md.price_change_7d ?? 0,
      change30d: md.price_change_30d ?? 0,
      athUsd: md.ath?.usd ?? 0,
      atlUsd: md.atl?.usd ?? 0,
      circulatingSupply: md.circulating_supply ?? 0,
      sparkline7d: d.sparkline_7d || [],
    };
  } catch {
    return null;
  }
}
