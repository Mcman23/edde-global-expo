/**
 * Route destinations shown in the WebAR cinematic sequence (Baku → world).
 * Plain data only (no three.js import) so both the heavy 3D scene and the
 * lightweight page shell (captions, analytics) can share it without pulling
 * the 3D engine into the fast start-screen bundle.
 *
 * All names are in English by design.
 */
export const ROUTE_ORDER = [
  'usa',
  'uk',
  'canada',
  'germany',
  'france',
  'italy',
  'spain',
  'poland',
  'hungary',
  'latvia',
  'lithuania',
  'netherlands',
  'australia',
  'southkorea',
  'japan',
  'singapore',
  'turkey',
  'uae',
] as const;

export type RouteKey = (typeof ROUTE_ORDER)[number];

export const ROUTE_META: Record<RouteKey, { name: string; country: string; lat: number; lon: number }> = {
  usa: { name: 'New York', country: 'United States', lat: 40.71, lon: -74.01 },
  uk: { name: 'London', country: 'United Kingdom', lat: 51.5, lon: -0.13 },
  canada: { name: 'Toronto', country: 'Canada', lat: 43.65, lon: -79.38 },
  germany: { name: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.405 },
  france: { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  italy: { name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964 },
  spain: { name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038 },
  poland: { name: 'Warsaw', country: 'Poland', lat: 52.2297, lon: 21.0122 },
  hungary: { name: 'Budapest', country: 'Hungary', lat: 47.4979, lon: 19.0402 },
  latvia: { name: 'Riga', country: 'Latvia', lat: 56.9496, lon: 24.1052 },
  lithuania: { name: 'Vilnius', country: 'Lithuania', lat: 54.6872, lon: 25.2797 },
  netherlands: { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041 },
  australia: { name: 'Sydney', country: 'Australia', lat: -33.87, lon: 151.21 },
  southkorea: { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.978 },
  japan: { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  singapore: { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
  turkey: { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784 },
  uae: { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708 },
};

/** Seconds each route arc gets on screen — kept short since there are 18 of them. */
export const ROUTE_DURATION = 0.55;
