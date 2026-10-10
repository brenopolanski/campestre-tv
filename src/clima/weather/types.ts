/** Condição meteorológica normalizada usada por ambiente, Climinha e ícones. */
export type WeatherKind =
  'sunny' | 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'heavyRain' | 'storm'

export const WEATHER_KINDS: WeatherKind[] = [
  'sunny',
  'clear',
  'partly',
  'cloudy',
  'fog',
  'rain',
  'heavyRain',
  'storm',
]

export interface Place {
  id: string
  name: string
  region?: string
  latitude: number
  longitude: number
}

export interface CurrentWeather {
  /** horário local do local, ISO sem offset ("2026-10-01T14:15") */
  time: string
  temperature: number
  apparent: number
  humidity: number
  dewPoint: number
  windSpeed: number
  windGusts: number
  windDirection: number
  precipitation: number
  code: number
  kind: WeatherKind
  isDay: boolean
  uv: number
}

export interface HourPoint {
  time: string
  temperature: number
  code: number
  kind: WeatherKind
  isDay: boolean
  precipProbability: number
}

export interface DayPoint {
  date: string
  min: number
  max: number
  code: number
  kind: WeatherKind
  precipProbability: number
  precipSum: number
  sunrise: string
  sunset: string
  uvMax: number
}

export interface Forecast {
  place: Place
  fetchedAt: number
  timezone: string
  current: CurrentWeather
  hourly: HourPoint[]
  daily: DayPoint[]
  /** precipitação (mm) em passos de 15 min, a partir de agora */
  nowcast: { time: string; precipitation: number }[]
}
