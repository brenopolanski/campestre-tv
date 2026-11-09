import { describe, expect, it } from 'vitest'

import { liveForecast } from './live'
import { forecastEntryFromCache } from './store'
import type { Forecast } from './types'

const now = new Date('2026-11-09T15:30:00Z')

const forecast = (fetchedAt: number): Forecast => ({
  place: {
    id: 'campestre',
    name: 'Clube Campestre',
    latitude: -7.248611,
    longitude: -35.874167,
  },
  fetchedAt,
  timezone: 'America/Fortaleza',
  current: {
    time: '2026-11-09T12:00',
    temperature: 31,
    apparent: 33,
    humidity: 40,
    dewPoint: 18,
    windSpeed: 10,
    windGusts: 20,
    windDirection: 90,
    precipitation: 0,
    code: 0,
    kind: 'sunny',
    isDay: true,
    uv: 9,
  },
  hourly: [
    {
      time: '2026-11-09T12:00',
      temperature: 28,
      code: 3,
      kind: 'cloudy',
      isDay: true,
      precipProbability: 20,
    },
  ],
  daily: [
    {
      date: '2026-11-09',
      min: 21,
      max: 33,
      code: 3,
      kind: 'cloudy',
      precipProbability: 20,
      precipSum: 0,
      sunrise: '2026-11-09T05:01',
      sunset: '2026-11-09T17:17',
      uvMax: 9,
    },
  ],
  nowcast: [],
})

describe('forecastEntryFromCache', () => {
  it('shows a forecast saved within the last 10 minutes', () => {
    const entry = forecastEntryFromCache(forecast(now.getTime() - 9 * 60 * 1000), now.getTime())

    expect(entry.status).toBe('ready')
    expect(entry.data?.current.code).toBe(0)
  })

  it('keeps a forecast older than 10 minutes off the first paint', () => {
    const entry = forecastEntryFromCache(forecast(now.getTime() - 11 * 60 * 1000), now.getTime())

    expect(entry).toEqual({ status: 'loading' })
  })
})

describe('liveForecast', () => {
  it('keeps the fetched observation when the hourly code is different', () => {
    const live = liveForecast(forecast(now.getTime() - 30 * 60 * 1000), now)

    expect(live.current.code).toBe(0)
    expect(live.current.kind).toBe('sunny')
    expect(live.current.temperature).toBe(31)
    expect(live.hourly[0]?.code).toBe(3)
  })
})
