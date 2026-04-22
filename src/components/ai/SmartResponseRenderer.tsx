import { memo } from 'react';
import { WeatherCard }    from './cards/WeatherCard';
import { FinanceCard }    from './cards/FinanceCard';
import { TrendingCard }   from './cards/TrendingCard';
import { MarketCard }     from './cards/MarketCard';
import { DictionaryCard } from './cards/DictionaryCard';
import { CountryCard }    from './cards/CountryCard';
import { CricketCard, CricketTextCard, parseCricketFromText } from './cards/CricketCard';
import { MusicCard }      from './cards/MusicCard';
import { SearchCard }     from './cards/SearchCard';
import { NewsCard }       from './cards/NewsCard';
import type { Intent }    from '@/lib/ai/router';

export interface CardPayload {
  type: Intent;
  data: any;
}

// Intents whose cards are fully self-contained (suppress LLM text commentary)
const SELF_CONTAINED: Intent[] = [
  'weather', 'finance', 'trending', 'market',
  'dictionary', 'country', 'music_cmd', 'maps', 'news', 'cricket',
];

interface Props {
  card?: CardPayload;
  text: string;
  hideText?: boolean;
}

export const SmartResponseRenderer = memo(function SmartResponseRenderer({ card, text, hideText }: Props) {
  const isLegacyMapCard = text.startsWith('__maps_card__');
  const isSelfContained = card && SELF_CONTAINED.includes(card.type);
  const showText = !hideText && !isSelfContained && text.length > 0 && !isLegacyMapCard;

  return (
    <div className="space-y-2">
      {/* 1. Rich card */}
      {card && <CardRenderer card={card} rawText={text} />}
      {/* 2. Commentary text below card (only for search/llm responses) */}
      {showText && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
          {text}
        </p>
      )}
    </div>
  );
});


function CardRenderer({ card, rawText }: { card: CardPayload; rawText: string }) {
  switch (card.type) {
    // ── Finance family ──────────────────────────────────────────────────────
    case 'weather':
      return card.data ? <WeatherCard data={card.data} /> : null;

    case 'finance':
      return card.data ? <FinanceCard data={card.data} /> : null;

    case 'trending':
      return card.data ? <TrendingCard data={card.data} /> : null;

    case 'market':
      return card.data ? <MarketCard data={card.data} /> : null;

    // ── Knowledge ───────────────────────────────────────────────────────────
    case 'dictionary':
      return card.data ? <DictionaryCard data={card.data} /> : null;

    case 'country':
      return card.data ? <CountryCard data={card.data} /> : null;

    // ── Media ───────────────────────────────────────────────────────────────
    case 'music_cmd':
      return card.data ? <MusicCard data={card.data} /> : null;

    // ── Maps ─────────────────────────────────────────────────────────────────
    case 'maps':
      // MapCard rendered inline in AIChat via __maps_card__ prefix
      return card.data ? (
        <div className="mt-2 text-sm opacity-60 italic" style={{ color: 'var(--text-primary)' }}>
          📍 Showing route for: {card.data.destination}
        </div>
      ) : null;

    // ── News ─────────────────────────────────────────────────────────────────
    case 'news':
      return card.data?.snippet ? (
        <NewsCard data={{
          query: card.data.query,
          headline: card.data.snippet,
          source: card.data.source,
        }} />
      ) : null;

    // ── Cricket (CricAPI structured) ───────────────────────────────────────
    case 'cricket':
      return card.data?.matches ? <CricketCard data={card.data} /> : null;

    // ── Search (generic + cricket text fallback) ───────────────────────
    case 'search': {
      // Try text-parsed cricket score from the search snippet
      const cricket = parseCricketFromText(card.data?.rawContext ?? rawText);
      if (cricket && (cricket.score1 || cricket.score2)) {
        return <CricketTextCard data={cricket} />;
      }
      // Generic Google search result
      return card.data?.snippet ? (
        <SearchCard data={{ query: card.data.query, snippet: card.data.snippet, source: card.data.source }} />
      ) : null;
    }

    default:
      return null;
  }
}
