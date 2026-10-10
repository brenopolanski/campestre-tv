import type { WeatherKind } from './types'

/** Converte código WMO (Open-Meteo) para a condição do Climinha. */
export function kindFromCode(code: number): WeatherKind {
  if (code === 0) return 'sunny'
  if (code === 1) return 'clear'
  if (code === 2) return 'partly'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 95) return 'storm'
  if (code === 65 || code === 67 || code === 82) return 'heavyRain'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  // neve e granizo são raros no público principal — tratados como nublado
  return 'cloudy'
}

const CODE_LABELS: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Predominantemente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina',
  51: 'Garoa fraca',
  53: 'Garoa',
  55: 'Garoa forte',
  56: 'Garoa gelada',
  57: 'Garoa gelada',
  61: 'Chuva fraca',
  63: 'Chuva',
  65: 'Chuva forte',
  66: 'Chuva gelada',
  67: 'Chuva gelada',
  71: 'Neve fraca',
  73: 'Neve',
  75: 'Neve forte',
  77: 'Grãos de neve',
  80: 'Pancadas de chuva',
  81: 'Pancadas de chuva',
  82: 'Pancadas fortes',
  85: 'Neve',
  86: 'Neve forte',
  95: 'Tempestade',
  96: 'Tempestade com granizo',
  99: 'Tempestade com granizo',
}

export function labelFromCode(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? 'Ensolarado' : 'Céu limpo'
  return CODE_LABELS[code] ?? 'Nublado'
}

/** Código WMO representativo de cada condição — usado na simulação. */
export const REPRESENTATIVE_CODE: Record<WeatherKind, number> = {
  sunny: 0,
  clear: 1,
  partly: 2,
  cloudy: 3,
  fog: 45,
  rain: 63,
  heavyRain: 65,
  storm: 95,
}

export function isWet(kind: WeatherKind) {
  return kind === 'rain' || kind === 'heavyRain' || kind === 'storm'
}

export function uvCategory(uv: number): { label: string; advice: string } {
  if (uv < 3) return { label: 'Baixo', advice: 'Sem protetor.' }
  if (uv < 6) return { label: 'Moderado', advice: 'Protetor no sol.' }
  if (uv < 8) return { label: 'Alto', advice: 'Use protetor.' }
  if (uv < 11) return { label: 'Muito alto', advice: 'Evite o meio-dia.' }
  return { label: 'Extremo', advice: 'Fique na sombra.' }
}

const COMPASS = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO']
export function compassLabel(degrees: number) {
  return COMPASS[Math.round((((degrees % 360) + 360) % 360) / 45) % 8]
}
