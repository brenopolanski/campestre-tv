import type { Forecast } from './types'

/** mm per 15 min from which we count it as rain */
export const RAIN_THRESHOLD = 0.1

export interface PrecipitationOutlook {
  steps: Forecast['nowcast']
  text: string
}

/** Rain in the next 3 h (15-minute steps). Null when there is nothing to show. */
export function precipitationOutlook(forecast: Forecast): PrecipitationOutlook | null {
  const steps = forecast.nowcast.slice(0, 12)
  if (!steps.some((s) => s.precipitation >= RAIN_THRESHOLD)) {
    return null
  }
  const rainingNow =
    steps[0].precipitation >= RAIN_THRESHOLD || forecast.current.precipitation >= RAIN_THRESHOLD
  if (rainingNow) {
    const stop = steps.findIndex((s) => s.precipitation < RAIN_THRESHOLD)
    return {
      steps,
      text: stop > 0 ? `Chuva para em ~${stop * 15} min.` : 'Chuva nas próximas 3 h.',
    }
  }
  const start = steps.findIndex((s) => s.precipitation >= RAIN_THRESHOLD)
  return { steps, text: `Chuva em ~${start * 15} min.` }
}
