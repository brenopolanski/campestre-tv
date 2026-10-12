import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchClubWeather } from './clubWeather'

const respondWith = (body: unknown, status = 200) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )

describe('fetchClubWeather', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads the current condition at the club', async () => {
    const fetchMock = respondWith({
      current: { is_day: 0, temperature_2m: 22.6, weather_code: 2 },
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchClubWeather()).resolves.toEqual({
      isDay: false,
      kind: 'partly',
      label: 'Parcialmente nublado',
      place: 'Campina Grande',
      temperature: 23,
    })

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.searchParams.get('latitude')).toBe('-7.248611')
    expect(url.searchParams.get('longitude')).toBe('-35.874167')
    expect(url.searchParams.get('current')).toBe('temperature_2m,weather_code,is_day')
  })

  it('returns null when Open-Meteo fails', async () => {
    vi.stubGlobal('fetch', respondWith({}, 503))
    await expect(fetchClubWeather()).resolves.toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(fetchClubWeather()).resolves.toBeNull()

    vi.stubGlobal('fetch', respondWith({ current: {} }))
    await expect(fetchClubWeather()).resolves.toBeNull()
  })
})
