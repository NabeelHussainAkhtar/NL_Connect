const WORKER_BASE = 'https://nl-connect-worker.nabeelhussain2k02.workers.dev';

export interface WeatherData {
  city: string;           // resolved place name
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipProb: number;
  weatherCode: number;
  description: string;
  lat: number;
  lon: number;
}

export interface WeatherToolResult {
  context: string;
  data: WeatherData | null;
}

function weatherCodeToDesc(code: number): string {
  if (code === 0)  return 'Clear sky';
  if (code <= 3)   return 'Partly cloudy';
  if (code <= 48)  return 'Foggy';
  if (code <= 67)  return 'Rainy';
  if (code <= 77)  return 'Snowy';
  if (code <= 82)  return 'Rain showers';
  if (code <= 99)  return 'Thunderstorm';
  return 'Unknown';
}

/** Geocode a city name → { lat, lon, displayName } using OpenStreetMap Nominatim (free, no key) */
export async function geocodeCity(city: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=0`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return null;
    const data = await res.json() as any[];
    if (!data[0]) return null;
    const displayName = data[0].display_name?.split(',').slice(0, 2).join(', ') ?? city;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName };
  } catch {
    return null;
  }
}

/** Extract a city/place name from a weather query */
export function extractCityFromQuery(query: string): string {
  const q = query.trim();

  // Pattern A: "weather in Delhi", "temperature of London", "forecast for Mumbai"
  const afterKeyword = q.match(
    /\b(?:weather|temperature|temp|mausam|forecast|climate|barish|garmi|thand|baarish)\s+(?:in|of|at|for|near)\s+([a-zA-Z\s]{2,30?})(?:\s+(?:today|now|aaj|kal|tomorrow|this week|abhi|kya|hai))?\s*$/i
  );
  if (afterKeyword?.[1]) {
    const city = afterKeyword[1].trim();
    if (city.length > 1 && !['today','now','aaj','kal','abhi','kya','hai'].includes(city.toLowerCase())) return city;
  }

  // Pattern B: keyword + city (no preposition): "weather Delhi", "mausam Mumbai"
  const noPrep = q.match(
    /^(?:weather|temperature|temp|mausam|forecast)\s+([A-Za-z]{3,20})\s*$/i
  );
  if (noPrep?.[1]) return noPrep[1].trim();

  // Pattern C: CITY-FIRST order: "Delhi weather", "Mumbai temperature", "London mausam"
  const cityFirst = q.match(
    /^([A-Z][a-zA-Z]{2,20}(?:\s+[A-Z][a-zA-Z]{2,15})?)\s+(?:weather|temperature|temp|mausam|forecast|ka mausam|mein mausam|ki garmi|mein kitni|ki temperature)\b/i
  );
  if (cityFirst?.[1]) return cityFirst[1].trim();

  // Pattern D: "in Delhi mein mausam", "Mumbai mein kitni thand hai"
  const meinPattern = q.match(/([A-Z][a-zA-Z]{2,20})\s+(?:mein|ka|ki|ke)\s+(?:mausam|weather|temperature|garmi|thand|baarish)/i);
  if (meinPattern?.[1]) return meinPattern[1].trim();

  // Pattern E: Keyword appears after city phrase: "tell me weather in Paris"
  const afterIn = q.match(/\b(?:in|at|of|for|near)\s+([A-Z][a-zA-Z]{2,20}(?:\s+[A-Z][a-zA-Z]{2,15})?)\b/i);
  if (afterIn?.[1]) {
    const city = afterIn[1].trim();
    const noiseWords = ['today', 'now', 'tomorrow', 'current', 'aaj', 'kal', 'abhi', 'india', 'the'];
    if (!noiseWords.includes(city.toLowerCase())) return city;
  }

  return '';
}

export async function getWeather(lat: number, lon: number, city?: string): Promise<WeatherToolResult> {
  const empty: WeatherToolResult = { context: '', data: null };
  try {
    const res = await fetch(`${WORKER_BASE}/api/tool/weather?lat=${lat}&lon=${lon}`);
    if (!res.ok) return empty;
    const d = await res.json() as any;
    const c = d.current;
    if (!c) return empty;

    const data: WeatherData = {
      city: city || 'Your location',
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m ?? 0,
      windSpeed: Math.round(c.wind_speed_10m ?? 0),
      precipProb: c.precipitation_probability ?? 0,
      weatherCode: c.weather_code ?? 0,
      description: weatherCodeToDesc(c.weather_code ?? 0),
      lat,
      lon,
    };

    const context = `Weather in ${data.city}: ${data.description} | ${data.temp}°C (feels like ${data.feelsLike}°C) | Humidity: ${data.humidity}% | Wind: ${data.windSpeed} km/h | Rain chance: ${data.precipProb}%`;
    return { context, data };
  } catch {
    return empty;
  }
}
