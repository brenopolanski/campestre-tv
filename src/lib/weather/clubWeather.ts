import { kindFromCode, labelFromCode } from '@/clima/weather/conditions'
import { CLUB_PLACE } from '@/clima/weather/location'
import type { WeatherKind } from '@/clima/weather/types'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const REVALIDATE_SECONDS = 600

export interface ClubWeather {
  isDay: boolean
  kind: WeatherKind
  label: string
  place: string
  temperature: number
}

interface CurrentResponse {
  current?: {
    is_day?: unknown
    temperature_2m?: unknown
    weather_code?: unknown
  }
}

export const fetchClubWeather = async (): Promise<ClubWeather | null> => {
  const params = new URLSearchParams({
    current: 'temperature_2m,weather_code,is_day',
    latitude: String(CLUB_PLACE.latitude),
    longitude: String(CLUB_PLACE.longitude),
    timezone: 'auto',
  })

  try {
    const response = await fetch(`${FORECAST_URL}?${params}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    })

    if (!response.ok) {
      return null
    }

    const { current } = (await response.json()) as CurrentResponse
    const temperature = Number(current?.temperature_2m)
    const code = Number(current?.weather_code)

    if (!Number.isFinite(temperature) || !Number.isFinite(code)) {
      return null
    }

    const isDay = Number(current?.is_day) === 1

    return {
      isDay,
      kind: kindFromCode(code),
      label: labelFromCode(code, isDay),
      place: CLUB_PLACE.name,
      temperature: Math.round(temperature),
    }
  } catch {
    return null
  }
}
