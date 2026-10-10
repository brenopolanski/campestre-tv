import { kindFromCode } from './conditions'
import type { Forecast, Place } from './types'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

const CURRENT = [
  'temperature_2m',
  'relative_humidity_2m',
  'dew_point_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'uv_index',
]
const HOURLY = ['temperature_2m', 'weather_code', 'precipitation_probability', 'is_day']
const DAILY = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_probability_max',
  'precipitation_sum',
]

interface ForecastResponse {
  timezone: string
  current: Record<string, number | string>
  hourly: Record<string, (number | string)[]>
  daily: Record<string, (number | string)[]>
  minutely_15?: { time: string[]; precipitation: number[] }
}

export async function fetchForecast(place: Place, signal?: AbortSignal): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: CURRENT.join(','),
    hourly: HOURLY.join(','),
    daily: DAILY.join(','),
    minutely_15: 'precipitation',
    forecast_days: '10',
    forecast_minutely_15: '12',
    timezone: 'auto',
  })
  const res = await fetch(`${FORECAST_URL}?${params}`, { signal })
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const data = (await res.json()) as ForecastResponse

  const c = data.current
  const currentTime = String(c.time)
  const code = Number(c.weather_code)

  const hourTimes = data.hourly.time as string[]
  // primeira hora cheia que contém "agora"
  const nowHour = currentTime.slice(0, 13)
  const start = Math.max(
    0,
    hourTimes.findIndex((t) => t.slice(0, 13) === nowHour),
  )
  const hourly = hourTimes.slice(start, start + 25).map((time, i) => {
    const j = start + i
    const hc = Number(data.hourly.weather_code[j])
    return {
      time,
      temperature: Number(data.hourly.temperature_2m[j]),
      code: hc,
      kind: kindFromCode(hc),
      isDay: Number(data.hourly.is_day[j]) === 1,
      precipProbability: Number(data.hourly.precipitation_probability[j] ?? 0),
    }
  })

  const d = data.daily
  const daily = (d.time as string[]).map((date, i) => {
    const dc = Number(d.weather_code[i])
    return {
      date,
      min: Number(d.temperature_2m_min[i]),
      max: Number(d.temperature_2m_max[i]),
      code: dc,
      kind: kindFromCode(dc),
      precipProbability: Number(d.precipitation_probability_max[i] ?? 0),
      precipSum: Number(d.precipitation_sum[i] ?? 0),
      sunrise: String(d.sunrise[i]),
      sunset: String(d.sunset[i]),
      uvMax: Number(d.uv_index_max[i] ?? 0),
    }
  })

  const m = data.minutely_15
  const nowcast = m
    ? m.time.map((time, i) => ({ time, precipitation: m.precipitation[i] ?? 0 }))
    : []

  return {
    place,
    fetchedAt: Date.now(),
    timezone: data.timezone,
    current: {
      time: currentTime,
      temperature: Number(c.temperature_2m),
      apparent: Number(c.apparent_temperature),
      humidity: Number(c.relative_humidity_2m),
      dewPoint: Number(c.dew_point_2m),
      windSpeed: Number(c.wind_speed_10m),
      windGusts: Number(c.wind_gusts_10m),
      windDirection: Number(c.wind_direction_10m),
      precipitation: Number(c.precipitation),
      code,
      kind: kindFromCode(code),
      isDay: Number(c.is_day) === 1,
      uv: Number(c.uv_index ?? 0),
    },
    hourly,
    daily,
    nowcast,
  }
}

interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  admin1?: string
  country?: string
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ name: query, count: '8', language: 'pt', format: 'json' })
  const res = await fetch(`${GEOCODING_URL}?${params}`, { signal })
  if (!res.ok) throw new Error(`Geocoding ${res.status}`)
  const data = (await res.json()) as { results?: GeocodingResult[] }
  return (data.results ?? []).map((r) => ({
    id: `geo-${r.id}`,
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
  }))
}
