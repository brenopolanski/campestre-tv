import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchForecast } from './openMeteo'
import type { Forecast, Place } from './types'

// Chaves versionadas: mudar o formato ou os padrões invalida o que estava salvo.
// v2 não tem cidades padrão (a primeira cidade é a do usuário) e usa Celsius.
const PLACES_KEY = 'climinha:places:v2'
const HERE_KEY = 'climinha:here'
const CACHE_KEY = 'climinha:forecasts'
const UNIT_KEY = 'climinha:unit:v2'
const STALE_MS = 10 * 60 * 1000
/** com o app aberto, procura dados novos neste intervalo */
const REFRESH_MS = 60 * 1000

/** fora do app por mais que isso: ao voltar, começa do zero na localização atual */
const SESSION_GAP_MS = 30 * 60 * 1000
const LAST_SEEN_KEY = 'climinha:last-seen'

/**
 * Chamado antes do primeiro render: se a pessoa ficou um tempo fora, esquece as
 * cidades adicionadas e a última localização — o app volta a abrir onde ela está.
 */
export function resetIfAway() {
  const last = read<number>(LAST_SEEN_KEY, 0)
  if (Date.now() - last > SESSION_GAP_MS) {
    try {
      localStorage.removeItem(PLACES_KEY)
      localStorage.removeItem(HERE_KEY)
    } catch {
      // armazenamento indisponível: nada a esquecer
    }
  }
  markSeen()
}

/** marca que o app está em uso (chamado periodicamente e ao sair) */
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
    // armazenamento indisponível: segue só em memória
  }
}

export function usePlaces() {
  // só as cidades que o usuário adicionou; a cidade dele vem da localização
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
      // mantém o último dado bom
      setEntries((e) => ({ ...e, [place.id]: { data: e[place.id]?.data, status: 'error' } }))
    } finally {
      inflight.current.delete(place.id)
    }
  }, [])

  useEffect(() => {
    for (const p of places) void load(p)
  }, [places, load])

  // tempo real: com o app aberto, atualiza sozinho; e também ao voltar para a aba,
  // ao focar a janela ou quando a conexão volta (load ignora o que ainda está fresco)
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
