import { labelFromCode } from './conditions'
import type { Forecast, HourPoint } from './types'

const WEEKDAYS = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.']

export function hourOf(time: string) {
  return Number(time.slice(11, 13))
}

export function hourLabel(time: string) {
  return `${hourOf(time)}h`
}

/** "05:21" from a local ISO timestamp */
export function clockLabel(time: string) {
  return time.slice(11, 16)
}

export function dayLabel(date: string, index: number) {
  if (index === 0) return 'Hoje'
  const [y, m, d] = date.split('-').map(Number)
  return WEEKDAYS[new Date(y, m - 1, d).getDay()]
}

/** minutes since midnight of a local ISO timestamp */
export function minutesOf(time: string) {
  return Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16))
}

export function conditionLabel(f: Forecast) {
  return labelFromCode(f.current.code, f.current.isDay)
}

/** One-line summary for the hourly card — only when there is rain to mention. */
export function hourlySummary(hours: HourPoint[]): string | null {
  const next = hours.slice(0, 24)
  const wetIdx = next.findIndex((h) => h.precipProbability >= 50)
  if (wetIdx === 0) {
    const dryIdx = next.findIndex((h, i) => i > 0 && h.precipProbability < 30)
    return dryIdx > 0
      ? `Chuva até as ${hourLabel(next[dryIdx].time)}.`
      : 'Chuva nas próximas horas.'
  }
  if (wetIdx > 0) return `Chuva a partir das ${hourLabel(next[wetIdx].time)}.`
  return null
}
