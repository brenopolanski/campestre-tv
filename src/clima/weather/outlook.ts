import type { Forecast } from './types'

/** mm por 15 min a partir do qual consideramos chuva */
export const RAIN_THRESHOLD = 0.1

export interface PrecipitationOutlook {
  steps: Forecast['nowcast']
  text: string
}

/** Chuva nas próximas 3 h (passos de 15 min). Null quando não há nada a mostrar. */
export function precipitationOutlook(forecast: Forecast): PrecipitationOutlook | null {
  const steps = forecast.nowcast.slice(0, 12)
  if (!steps.some((s) => s.precipitation >= RAIN_THRESHOLD)) return null
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
