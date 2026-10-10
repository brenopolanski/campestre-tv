import { searchPlaces } from './openMeteo'
import type { Place } from './types'

/**
 * Localização do usuário.
 *  - ao entrar, o app pede a localização e mostra a cidade de verdade
 *  - enquanto a resposta não vem (ou se for negada), usa a cidade do fuso do aparelho
 */

export const HERE_ID = 'here'

// fusos do Brasil → capital / cidade de referência
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

// fuso de fora do Brasil → cidade encontrada pela busca (guardada para a próxima visita)
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

/** Cidade aproximada pelo fuso do aparelho — aparece na hora, sem pedir nada. */
export function timezonePlace(): Place {
  const tz = deviceTimezone()
  const city = TIMEZONE_CITIES[tz]
  if (city) return { id: `tz-${tz}`, ...city }
  return readTimezonePlace(tz) ?? { id: 'tz-default', ...TIMEZONE_CITIES['America/Sao_Paulo'] }
}

/**
 * Fuso de fora do Brasil (ex.: America/Los_Angeles): procura a cidade que dá nome ao fuso.
 * Devolve null quando a cidade do fuso já é conhecida ou a busca não encontra nada.
 */
export async function resolveTimezonePlace(): Promise<Place | null> {
  const tz = deviceTimezone()
  if (!tz || TIMEZONE_CITIES[tz] || readTimezonePlace(tz)) return null
  const name = tz.split('/').pop()?.replace(/_/g, ' ')
  if (!name || !tz.includes('/')) return null
  const [found] = await searchPlaces(name)
  if (!found) return null
  const place = { ...found, id: `tz-${tz}` }
  try {
    localStorage.setItem(TZ_PLACE_KEY, JSON.stringify({ tz, place }))
  } catch {
    // sem armazenamento: busca de novo na próxima visita
  }
  return place
}

export function getPosition(timeout = 12000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('sem geolocalização'))
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout,
      maximumAge: 15 * 60 * 1000,
    })
  })
}

/** Já tem permissão? (para pedir a posição sem mostrar o aviso de novo) */
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
  if (!res.ok) return null
  const d = (await res.json()) as {
    city?: string
    locality?: string
    principalSubdivision?: string
    countryName?: string
  }
  // em capitais o "city" às vezes vem como a região metropolitana: aí o município é o "locality"
  const regional = /regi[aã]o|metropolitana|microrregi/i
  const name = d.city && !regional.test(d.city) ? d.city : d.locality || d.city
  if (!name) return null
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
  if (!res.ok) return null
  const d = (await res.json()) as { address?: Record<string, string> }
  const a = d.address ?? {}
  const name = a.city || a.town || a.municipality || a.village || a.county
  if (!name) return null
  return { name, region: [a.state, a.country].filter(Boolean).join(', ') }
}

/** Coordenadas → nome da cidade (dois serviços gratuitos, um de reserva). */
export async function cityNameAt(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<CityName | null> {
  for (const source of [fromBigDataCloud, fromNominatim]) {
    try {
      const r = await source(lat, lon, signal)
      if (r) return r
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
    }
  }
  return null
}

/** Coordenadas → lugar com o nome da cidade. */
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

/** Pede a posição e devolve a cidade onde o usuário está. */
export async function locateUser(): Promise<Place> {
  const pos = await getPosition()
  return placeAt(pos.coords.latitude, pos.coords.longitude)
}

/** Distância em km entre dois pontos (haversine). */
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
 * Acompanha a posição em tempo real. Só chama `onMove` quando a pessoa se desloca
 * de verdade (evita trocar de cidade por oscilação do GPS).
 */
export function watchUser(
  from: () => { latitude: number; longitude: number } | null,
  onMove: (latitude: number, longitude: number) => void,
  minKm = 1.5,
): () => void {
  if (!('geolocation' in navigator)) return () => {}
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      const prev = from()
      if (!prev || distanceKm(prev, next) >= minKm) onMove(next.latitude, next.longitude)
    },
    () => {},
    { enableHighAccuracy: false, maximumAge: 60 * 1000, timeout: 30 * 1000 },
  )
  return () => navigator.geolocation.clearWatch(id)
}
