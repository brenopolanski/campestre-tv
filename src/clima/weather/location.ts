import { searchPlaces } from './openMeteo'
import type { Place } from './types'

/**
 * The user's location.
 *  - on entry, the app asks for the location and shows the real city
 *  - until the answer arrives (or if it is denied), use the city for the device timezone
 */

export const HERE_ID = 'here'

/** Clube Campestre — default city for /clima. */
export const CLUB_PLACE: Place = {
  id: 'campestre',
  // name: 'Campina Grande',
  name: 'Clube Campestre',
  region: 'Paraíba, Brasil',
  latitude: -7.248611,
  longitude: -35.874167,
}

// Brazil timezones → capital / reference city
const TIMEZONE_CITIES: Record<string, Omit<Place, 'id'>> = {
  'America/Sao_Paulo': {
    name: 'São Paulo',
    region: 'São Paulo, Brasil',
    latitude: -23.5505,
    longitude: -46.6333,
  },
  'America/Bahia': {
    name: 'Salvador',
    region: 'Bahia, Brasil',
    latitude: -12.9711,
    longitude: -38.5108,
  },
  'America/Fortaleza': {
    name: 'Fortaleza',
    region: 'Ceará, Brasil',
    latitude: -3.7319,
    longitude: -38.5267,
  },
  'America/Recife': {
    name: 'Recife',
    region: 'Pernambuco, Brasil',
    latitude: -8.0476,
    longitude: -34.877,
  },
  'America/Maceio': {
    name: 'Maceió',
    region: 'Alagoas, Brasil',
    latitude: -9.6658,
    longitude: -35.735,
  },
  'America/Belem': {
    name: 'Belém',
    region: 'Pará, Brasil',
    latitude: -1.4558,
    longitude: -48.4902,
  },
  'America/Santarem': {
    name: 'Santarém',
    region: 'Pará, Brasil',
    latitude: -2.4385,
    longitude: -54.6996,
  },
  'America/Araguaina': {
    name: 'Palmas',
    region: 'Tocantins, Brasil',
    latitude: -10.1844,
    longitude: -48.3336,
  },
  'America/Manaus': {
    name: 'Manaus',
    region: 'Amazonas, Brasil',
    latitude: -3.119,
    longitude: -60.0217,
  },
  'America/Cuiaba': {
    name: 'Cuiabá',
    region: 'Mato Grosso, Brasil',
    latitude: -15.601,
    longitude: -56.0974,
  },
  'America/Campo_Grande': {
    name: 'Campo Grande',
    region: 'Mato Grosso do Sul, Brasil',
    latitude: -20.4697,
    longitude: -54.6201,
  },
  'America/Porto_Velho': {
    name: 'Porto Velho',
    region: 'Rondônia, Brasil',
    latitude: -8.7612,
    longitude: -63.9004,
  },
  'America/Boa_Vista': {
    name: 'Boa Vista',
    region: 'Roraima, Brasil',
    latitude: 2.8235,
    longitude: -60.6758,
  },
  'America/Rio_Branco': {
    name: 'Rio Branco',
    region: 'Acre, Brasil',
    latitude: -9.9754,
    longitude: -67.8249,
  },
  'America/Noronha': {
    name: 'Fernando de Noronha',
    region: 'Pernambuco, Brasil',
    latitude: -3.8547,
    longitude: -32.4247,
  },
}

function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
  } catch {
    return ''
  }
}

// timezone outside Brazil → city found by search (saved for the next visit)
const TZ_PLACE_KEY = 'climinha:tz-place:v1'

function readTimezonePlace(tz: string): Place | null {
  try {
    const saved = JSON.parse(localStorage.getItem(TZ_PLACE_KEY) ?? 'null') as {
      tz: string
      place: Place
    } | null
    return saved?.tz === tz ? saved.place : null
  } catch {
    return null
  }
}

/** Approximate city from the device timezone — shows immediately, without asking. */
export function timezonePlace(): Place {
  const tz = deviceTimezone()
  const city = TIMEZONE_CITIES[tz]
  if (city) {
    return { id: `tz-${tz}`, ...city }
  }
  return readTimezonePlace(tz) ?? { id: 'tz-default', ...TIMEZONE_CITIES['America/Sao_Paulo'] }
}

/**
 * Timezone outside Brazil (e.g. America/Los_Angeles): looks up the city named by the timezone.
 * Returns null when that city is already known or the search finds nothing.
 */
export async function resolveTimezonePlace(): Promise<Place | null> {
  const tz = deviceTimezone()
  if (!tz || TIMEZONE_CITIES[tz] || readTimezonePlace(tz)) {
    return null
  }
  const name = tz.split('/').pop()?.replace(/_/g, ' ')
  if (!name || !tz.includes('/')) {
    return null
  }
  const [found] = await searchPlaces(name)
  if (!found) {
    return null
  }
  const place = { ...found, id: `tz-${tz}` }
  try {
    localStorage.setItem(TZ_PLACE_KEY, JSON.stringify({ tz, place }))
  } catch {
    // no storage: search again on the next visit
  }
  return place
}

export function getPosition(timeout = 12000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      return reject(new Error('sem geolocalização'))
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout,
      maximumAge: 15 * 60 * 1000,
    })
  })
}

/** Already granted? (so we can ask for the position without showing the prompt again) */
export async function locationPermission(): Promise<PermissionState | 'unknown'> {
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    return status.state
  } catch {
    return 'unknown'
  }
}

interface CityName {
  name: string
  region?: string
}

async function fromBigDataCloud(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<CityName | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    localityLanguage: 'pt',
  })
  const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`, {
    signal,
  })
  if (!res.ok) {
    return null
  }
  const d = (await res.json()) as {
    city?: string
    locality?: string
    principalSubdivision?: string
    countryName?: string
  }
  // in capitals "city" sometimes comes back as the metro area: then the municipality is "locality"
  const regional = /regi[aã]o|metropolitana|microrregi/i
  const name = d.city && !regional.test(d.city) ? d.city : (d.locality ?? d.city)
  if (!name) {
    return null
  }
  return { name, region: [d.principalSubdivision, d.countryName].filter(Boolean).join(', ') }
}

async function fromNominatim(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<CityName | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lon),
    zoom: '10',
    'accept-language': 'pt',
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal })
  if (!res.ok) {
    return null
  }
  const d = (await res.json()) as { address?: Record<string, string> }
  const a = d.address ?? {}
  const name = a.city || a.town || a.municipality || a.village || a.county
  if (!name) {
    return null
  }
  return { name, region: [a.state, a.country].filter(Boolean).join(', ') }
}

/** Coordinates → city name (two free services, one as a fallback). */
export async function cityNameAt(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<CityName | null> {
  for (const source of [fromBigDataCloud, fromNominatim]) {
    try {
      const r = await source(lat, lon, signal)
      if (r) {
        return r
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        throw e
      }
    }
  }
  return null
}

/** Coordinates → a place with the city name. */
export async function placeAt(latitude: number, longitude: number): Promise<Place> {
  const lat = Math.round(latitude * 1000) / 1000
  const lon = Math.round(longitude * 1000) / 1000
  const city = await cityNameAt(lat, lon).catch(() => null)
  return {
    id: HERE_ID,
    name: city?.name ?? 'Minha localização',
    region: city?.region,
    latitude: lat,
    longitude: lon,
  }
}

/** Asks for the position and returns the city where the user is. */
export async function locateUser(): Promise<Place> {
  const pos = await getPosition()
  return placeAt(pos.coords.latitude, pos.coords.longitude)
}

/** Distance in km between two points (haversine). */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Follows the position in real time. Calls `onMove` only when the person actually
 * moves (avoids changing city because of GPS jitter).
 */
export function watchUser(
  from: () => { latitude: number; longitude: number } | null,
  onMove: (latitude: number, longitude: number) => void,
  minKm = 1.5,
): () => void {
  if (!('geolocation' in navigator)) {
    return () => {}
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      const prev = from()
      if (!prev || distanceKm(prev, next) >= minKm) {
        onMove(next.latitude, next.longitude)
      }
    },
    () => {},
    { enableHighAccuracy: false, maximumAge: 60 * 1000, timeout: 30 * 1000 },
  )
  return () => navigator.geolocation.clearWatch(id)
}
