import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchForecast } from './openMeteo'
import type { Forecast, Place } from './types'

// Versioned keys: changing the format or the defaults invalidates what was saved.
// v2 has no default cities (the first city is the user's) and uses Celsius.
const PLACES_KEY = 'climinha:places:v2'
const HERE_KEY = 'climinha:here'
const CACHE_KEY = 'climinha:forecasts'
const UNIT_KEY = 'climinha:unit:v2'
const STALE_MS = 10 * 60 * 1000
/** while the app is open, looks for fresh data on this interval */
const REFRESH_MS = 60 * 1000

/** away longer than this: on return, start fresh at the current location */
const SESSION_GAP_MS = 30 * 60 * 1000
const LAST_SEEN_KEY = 'climinha:last-seen'

/**
 * Called before the first render: if the person was away for a while, forget the
 * added cities and the last location — the app opens again where they are.
 */
export function resetIfAway() {
  const last = read<number>(LAST_SEEN_KEY, 0)
  if (Date.now() - last > SESSION_GAP_MS) {
    try {
      localStorage.removeItem(PLACES_KEY)
      localStorage.removeItem(HERE_KEY)
    } catch {
      // storage unavailable: nothing to forget
    }
  }
  markSeen()
}

/** marks that the app is in use (called periodically and on leave) */
export function markSeen() {
  write(LAST_SEEN_KEY, Date.now())
}

export function readHere(): Place | null {
  return read<Place | null>(HERE_KEY, null)
}

export function writeHere(place: Place | null) {
  write(HERE_KEY, place)
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable: continue in memory only
  }
}

export function usePlaces() {
  // only the cities the user added; their city comes from location
  const [places, setPlaces] = useState<Place[]>(() => read<Place[]>(PLACES_KEY, []))

  useEffect(() => write(PLACES_KEY, places), [places])

  const addPlace = useCallback((place: Place) => {
    setPlaces((list) => (list.some((p) => p.id === place.id) ? list : [...list, place]))
  }, [])

  const removePlace = useCallback((id: string) => {
    setPlaces((list) => list.filter((p) => p.id !== id))
  }, [])

  return { places, addPlace, removePlace }
}

export interface ForecastEntry {
  data?: Forecast
  status: 'loading' | 'ready' | 'error'
}

export function useForecasts(places: Place[]) {
  const [entries, setEntries] = useState<Record<string, ForecastEntry>>(() => {
    const cache = read<Record<string, Forecast>>(CACHE_KEY, {})
    const initial: Record<string, ForecastEntry> = {}
    for (const [id, data] of Object.entries(cache)) initial[id] = { data, status: 'loading' }
    return initial
  })
  const inflight = useRef(new Map<string, AbortController>())
  const entriesRef = useRef(entries)
  useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  const load = useCallback(async (place: Place, force = false) => {
    const existing = entriesRef.current[place.id]
    if (
      !force &&
      existing?.status === 'ready' &&
      existing.data &&
      Date.now() - existing.data.fetchedAt < STALE_MS
    )
      return
    if (inflight.current.has(place.id)) return
    const controller = new AbortController()
    inflight.current.set(place.id, controller)
    setEntries((e) => ({ ...e, [place.id]: { data: e[place.id]?.data, status: 'loading' } }))
    try {
      const data = await fetchForecast(place, controller.signal)
      setEntries((e) => {
        const next = { ...e, [place.id]: { data, status: 'ready' as const } }
        const cache: Record<string, Forecast> = {}
        for (const [id, entry] of Object.entries(next)) if (entry.data) cache[id] = entry.data
        write(CACHE_KEY, cache)
        return next
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      // keep the last good data
      setEntries((e) => ({ ...e, [place.id]: { data: e[place.id]?.data, status: 'error' } }))
    } finally {
      inflight.current.delete(place.id)
    }
  }, [])

  useEffect(() => {
    for (const p of places) void load(p)
  }, [places, load])

  // live: while the app is open it refreshes on its own; also when returning to the tab,
  // focusing the window, or when the connection comes back (load skips what is still fresh)
  useEffect(() => {
    const refreshStale = () => {
      if (!document.hidden) for (const p of places) void load(p)
    }
    const id = window.setInterval(refreshStale, REFRESH_MS)
    document.addEventListener('visibilitychange', refreshStale)
    window.addEventListener('focus', refreshStale)
    window.addEventListener('online', refreshStale)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', refreshStale)
      window.removeEventListener('focus', refreshStale)
      window.removeEventListener('online', refreshStale)
    }
  }, [places, load])

  const refresh = useCallback((place: Place) => load(place, true), [load])

  return { entries, refresh }
}

export type TemperatureUnit = 'c' | 'f'

export function useUnit() {
  const [unit, setUnit] = useState<TemperatureUnit>(() => read<TemperatureUnit>(UNIT_KEY, 'c'))
  useEffect(() => write(UNIT_KEY, unit), [unit])
  return [unit, setUnit] as const
}

export function toUnit(celsius: number, unit: TemperatureUnit) {
  return Math.round(unit === 'f' ? (celsius * 9) / 5 + 32 : celsius)
}
