// ─── SHARED GPS UTILITY ─────────────────────────────────────────────────────
// Single source of truth for GPS — used by both router.ts and search.ts
// Caches for 10 minutes so we don't spam the browser permission dialog

let _gpsCache: { lat: number; lon: number; city: string; fetchedAt: number } | null = null;
const GPS_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface GPSResult {
  lat: number;
  lon: number;
  city: string;
}

/** Get user GPS + reverse-geocoded city. Cached for 10 min. */
export async function getSharedGPS(): Promise<GPSResult | null> {
  const now = Date.now();
  if (_gpsCache && now - _gpsCache.fetchedAt < GPS_TTL_MS) {
    return { lat: _gpsCache.lat, lon: _gpsCache.lon, city: _gpsCache.city };
  }

  try {
    // Capacitor (Android app)
    const win = window as any;
    if (win.Capacitor?.Plugins?.Geolocation) {
      const pos = await win.Capacitor.Plugins.Geolocation.getCurrentPosition({ timeout: 6000 });
      const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      _gpsCache = { lat: pos.coords.latitude, lon: pos.coords.longitude, city, fetchedAt: now };
      return { lat: _gpsCache.lat, lon: _gpsCache.lon, city };
    }
  } catch { /* fall through */ }

  // Browser geolocation
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        _gpsCache = { lat: pos.coords.latitude, lon: pos.coords.longitude, city, fetchedAt: Date.now() };
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, city });
      },
      () => resolve(null),
      { timeout: 6000, maximumAge: GPS_TTL_MS }
    );
  });
}

/** Reverse geocode lat/lon → city name using Nominatim (free) */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return 'Your location';
    const data = await res.json() as any;
    return (
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      data?.address?.state ||
      'Your location'
    );
  } catch {
    return 'Your location';
  }
}

/** Clear the GPS cache (call if user changes location manually) */
export function clearGPSCache(): void {
  _gpsCache = null;
}
