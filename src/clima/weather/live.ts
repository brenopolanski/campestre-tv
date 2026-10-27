import type { Forecast } from './types'

/** after this, the "now" condition comes from the forecast for the current hour */
const CURRENT_STALE_MS = 20 * 60 * 1000

const formatters = new Map<string, Intl.DateTimeFormat>()

/** "YYYY-MM-DDTHH:MM" in the city's timezone — same format as Open-Meteo times. */
export function localTimeIn(timezone: string, now: Date): string {
  let f = formatters.get(timezone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    formatters.set(timezone, f)
  }
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/**
 * Adjusts the forecast to the city's real clock, even between fetches:
 *  - day/night from today's sunrise and sunset
 *  - "Agora" and the hourly list start at the current hour
 *  - "Hoje" is today in the city's timezone
 *  - stale data: temperature and condition come from the forecast for this hour
 */
export function liveForecast(f: Forecast, now: Date): Forecast {
  const local = localTimeIn(f.timezone, now)
  const today = local.slice(0, 10)
  const hourKey = local.slice(0, 13)

  const dayIdx = f.daily.findIndex((d) => d.date === today)
  const daily = dayIdx > 0 ? f.daily.slice(dayIdx) : f.daily
  const day = daily[0]
  const isDay = day
    ? local >= day.sunrise.slice(0, 16) && local < day.sunset.slice(0, 16)
    : f.current.isDay

  const hourIdx = f.hourly.findIndex((h) => h.time.slice(0, 13) === hourKey)
  const hourly = f.hourly.slice(Math.max(0, hourIdx))

  let current = { ...f.current, time: local, isDay }
  if (now.getTime() - f.fetchedAt > CURRENT_STALE_MS && hourIdx >= 0) {
    const h = f.hourly[hourIdx]
    current = { ...current, temperature: h.temperature, code: h.code, kind: h.kind }
  }
  if (hourly[0]) {
    hourly[0] = { ...hourly[0], isDay }
  }

  return { ...f, current, hourly, daily }
}
