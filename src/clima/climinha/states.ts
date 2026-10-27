import type { WeatherKind } from '@/clima/weather/types'

export type Mood =
  | 'neutral'
  | 'happy'
  | 'curious'
  | 'sleepy'
  | 'bored'
  | 'irritated'
  | 'surprised'
  | 'confused'
  | 'sleeping'
  | 'scared'
  | 'wink'
  | 'hot'
  | 'cold'
  | 'freezing'

export interface BodyColors {
  light: string
  mid: string
  shade: string
  /** rim light — separates dark bodies from dark skies, without an outline */
  rim: string
  /** atmospheric halo behind the character */
  halo: string
  contactShadow: string
}

export interface CliminhaState {
  mood: Mood
  body: BodyColors
  /** amplitude (viewBox units) and period (s) of the float */
  float: { amplitude: number; period: number }
  /** 0 none · 1 a few drops · 2 many */
  drops: 0 | 1 | 2
  heavy: boolean
  /** temperature feel: changes the color, the expression, and the effects (sweat, shiver) */
  temp?: TempFeel
  /** storm: a yellow glow inside and lightning leaving the body */
  storm?: boolean
}

/** above 34° hot · below 16° cold · below 5° very cold */
export type TempFeel = 'hot' | 'cold' | 'freezing'

export function tempFeelFor(celsius: number): TempFeel | undefined {
  if (celsius > 34) {
    return 'hot'
  }
  if (celsius < 5) {
    return 'freezing'
  }
  if (celsius < 16) {
    return 'cold'
  }
  return undefined
}

/**
 * Body color communicates the weather:
 * clear sky cold-white → sunny vivid blue → cloudy blue-gray →
 * rain medium gray → heavy rain graphite → storm almost black.
 */
const BODY: Record<WeatherKind | 'night', BodyColors> = {
  clear: {
    light: '#fbfdff',
    mid: '#e4edfa',
    shade: '#a8c5ee',
    rim: 'rgba(255, 255, 255, 0)',
    halo: 'rgba(255, 255, 255, 0.10)',
    contactShadow: 'rgba(40, 90, 170, 0.32)',
  },
  sunny: {
    light: '#f1f8ff',
    mid: '#cde4fd',
    shade: '#78b0f3',
    rim: 'rgba(255, 255, 255, 0)',
    halo: 'rgba(255, 250, 235, 0.12)',
    contactShadow: 'rgba(30, 90, 180, 0.34)',
  },
  partly: {
    light: '#fbfdff',
    mid: '#e2ebf8',
    shade: '#a3bfe6',
    rim: 'rgba(255, 255, 255, 0)',
    halo: 'rgba(255, 255, 255, 0.10)',
    contactShadow: 'rgba(40, 80, 150, 0.32)',
  },
  cloudy: {
    light: '#e4e7eb',
    mid: '#b8bec7',
    shade: '#7c8591',
    rim: 'rgba(255, 255, 255, 0.16)',
    halo: 'rgba(235, 240, 248, 0.10)',
    contactShadow: 'rgba(30, 40, 60, 0.3)',
  },
  fog: {
    light: '#f6f7f9',
    mid: '#dfe4ea',
    shade: '#aab5c3',
    rim: 'rgba(255, 255, 255, 0)',
    halo: 'rgba(255, 255, 255, 0.14)',
    contactShadow: 'rgba(40, 50, 65, 0.22)',
  },
  rain: {
    light: '#c3c9d2',
    mid: '#9ba3af',
    shade: '#5f6977',
    rim: 'rgba(225, 235, 250, 0.32)',
    halo: 'rgba(190, 210, 235, 0.12)',
    contactShadow: 'rgba(5, 10, 20, 0.38)',
  },
  heavyRain: {
    light: '#9aa1ac',
    mid: '#727a86',
    shade: '#3d444f',
    rim: 'rgba(215, 228, 248, 0.38)',
    halo: 'rgba(175, 195, 225, 0.13)',
    contactShadow: 'rgba(0, 4, 12, 0.42)',
  },
  storm: {
    light: '#5d6370',
    mid: '#393e49',
    shade: '#171a21',
    rim: 'rgba(200, 216, 245, 0.42)',
    halo: 'rgba(150, 170, 215, 0.14)',
    contactShadow: 'rgba(0, 0, 0, 0.5)',
  },
  night: {
    light: '#f0f3fd',
    mid: '#c8d3ef',
    shade: '#7a8fc6',
    rim: 'rgba(200, 215, 255, 0.12)',
    halo: 'rgba(150, 175, 255, 0.10)',
    contactShadow: 'rgba(0, 6, 30, 0.45)',
  },
}

/**
 * Mood rules:
 *  - night: sleeps (a storm wakes him — then he is scared)
 *  - sun (clear / sunny / partly cloudy by day): always happy
 *  - rain: annoyed (and gray)
 *  - lightning: scared
 *  - the rest: a normal mood
 */
function moodFor(kind: WeatherKind, isDay: boolean, temp?: TempFeel): Mood {
  // priority: fear of lightning > sleep > what the temperature feels like > the weather
  if (kind === 'storm') {
    return 'scared'
  }
  if (!isDay) {
    return 'sleeping'
  }
  if (temp === 'freezing') {
    return 'freezing'
  }
  if (temp === 'hot') {
    return 'hot'
  }
  if (kind === 'rain' || kind === 'heavyRain' || kind === 'cloudy') {
    return 'bored'
  }
  if (temp === 'cold') {
    return 'cold'
  }
  if (kind === 'sunny' || kind === 'clear' || kind === 'partly') {
    return 'happy'
  }
  return 'neutral'
}

// temperature tints mixed into the weather color
const TINT: Record<
  TempFeel,
  {
    light: string
    mid: string
    shade: string
    amount: [number, number, number]
    rim?: string
    halo: string
  }
> = {
  hot: {
    light: '#ffe6da',
    mid: '#ffb9a1',
    shade: '#ec7f68',
    amount: [0.5, 0.5, 0.48],
    halo: 'rgba(255, 170, 130, 0.16)',
  },
  cold: {
    light: '#eef7ff',
    mid: '#c4e2fb',
    shade: '#80b6ea',
    amount: [0.45, 0.42, 0.42],
    halo: 'rgba(170, 215, 255, 0.12)',
  },
  freezing: {
    light: '#f4fbff',
    mid: '#d2ecff',
    shade: '#8fc4f0',
    amount: [0.7, 0.62, 0.6],
    rim: 'rgba(225, 242, 255, 0.5)',
    halo: 'rgba(200, 232, 255, 0.18)',
  },
}

function mixHex(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return (
    '#' +
    pa
      .map((v, i) =>
        Math.round(v + (pb[i] - v) * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

function tinted(body: BodyColors, temp?: TempFeel): BodyColors {
  if (!temp) {
    return body
  }
  const t = TINT[temp]
  return {
    ...body,
    light: mixHex(body.light, t.light, t.amount[0]),
    mid: mixHex(body.mid, t.mid, t.amount[1]),
    shade: mixHex(body.shade, t.shade, t.amount[2]),
    rim: t.rim ?? body.rim,
    halo: t.halo,
  }
}

export function climinhaFor(kind: WeatherKind, isDay: boolean, celsius?: number): CliminhaState {
  const nightCalm = !isDay && (kind === 'sunny' || kind === 'clear' || kind === 'partly')
  const temp = celsius === undefined ? undefined : tempFeelFor(celsius)
  const body = tinted(nightCalm ? BODY.night : BODY[kind], temp)
  const mood = moodFor(kind, isDay, temp)
  return { ...baseFor(kind, nightCalm, mood, body), temp, storm: kind === 'storm' }
}

function baseFor(
  kind: WeatherKind,
  nightCalm: boolean,
  mood: Mood,
  body: BodyColors,
): CliminhaState {
  switch (kind) {
    case 'storm':
      return { mood, body, float: { amplitude: 1.6, period: 4.6 }, drops: 2, heavy: true }
    case 'heavyRain':
      return { mood, body, float: { amplitude: 2.2, period: 4.2 }, drops: 2, heavy: true }
    case 'rain':
      return { mood, body, float: { amplitude: 3, period: 3.8 }, drops: 1, heavy: true }
    case 'fog':
    case 'cloudy':
      return { mood, body, float: { amplitude: 4, period: 3.8 }, drops: 0, heavy: false }
    default:
      return {
        mood,
        body,
        // sleeping: slow, low breathing
        float: nightCalm ? { amplitude: 2.5, period: 5.2 } : { amplitude: 5.5, period: 3.2 },
        drops: 0,
        heavy: false,
      }
  }
}

/** Neutral, used while loading and on error. */
export const NEUTRAL_STATE: CliminhaState = {
  mood: 'neutral',
  body: BODY.clear,
  float: { amplitude: 4, period: 3.6 },
  drops: 0,
  heavy: false,
}

export interface EyeShape {
  rx: number
  ry: number
  /** vertical offset of the eye */
  dy: number
  /** eyelid height (local y); above -ry = eye open */
  lid: number
  /** eyelid tilt; positive lowers the inner side */
  lidTilt: number
  arc: boolean
  /** downward arc: eye closed, sleeping */
  closed?: boolean
  /** eyelid curve (positive = heavy, rounded eyelid) */
  curve?: number
  /** hides the eyelid stroke (sleep is not irritation) */
  noLine?: boolean
}

/**
 * Sleepy: heavy, rounded eyelids, drooping outward (tired, not irritated).
 * level 0 → quase aberto; 1 → fechado.
 */
export function drowsyEyes(level: number): [EyeShape, EyeShape] {
  const lid = -8 + level * 21
  const eye = { rx: 10, ry: 12.5, dy: 0, arc: false, lid, lidTilt: -2.5, curve: 3.5, noLine: true }
  return [eye, { ...eye }]
}

const OPEN = { lid: -30, lidTilt: 0, arc: false, dy: 0 }

/** Shape of each eye [left, right] by mood. */
export function eyesFor(mood: Mood): [EyeShape, EyeShape] {
  switch (mood) {
    case 'happy':
      return [
        { rx: 9.5, ry: 12.5, ...OPEN, arc: true },
        { rx: 9.5, ry: 12.5, ...OPEN, arc: true },
      ]
    case 'curious':
      // curious: eyes a bit larger and raised, the same on both sides
      return [
        { rx: 10, ry: 13.5, ...OPEN, dy: -2 },
        { rx: 10, ry: 13.5, ...OPEN, dy: -2 },
      ]
    case 'confused':
      // confused: inner eyelids raised, the same on both sides
      return [
        { rx: 9, ry: 12, ...OPEN, lid: -8, lidTilt: -6 },
        { rx: 9, ry: 12, ...OPEN, lid: -8, lidTilt: -6 },
      ]
    case 'sleepy':
      return [
        { rx: 9.5, ry: 11, ...OPEN, lid: 1.5, lidTilt: 0 },
        { rx: 9.5, ry: 11, ...OPEN, lid: 1.5, lidTilt: 0 },
      ]
    case 'bored':
      return [
        { rx: 9.5, ry: 12, ...OPEN, lid: -2.5, lidTilt: 0 },
        { rx: 9.5, ry: 12, ...OPEN, lid: -2.5, lidTilt: 0 },
      ]
    case 'irritated':
      return [
        { rx: 9.5, ry: 11.5, ...OPEN, lid: -1.5, lidTilt: 3.5 },
        { rx: 9.5, ry: 11.5, ...OPEN, lid: -1.5, lidTilt: 3.5 },
      ]
    case 'wink':
      // wink (the only exception to symmetry): the right eyelid drops and becomes ∩
      return [
        { rx: 10, ry: 12.5, ...OPEN },
        { rx: 10, ry: 12.5, ...OPEN, lid: 14, lidTilt: 0, curve: 2, noLine: true, arc: true },
      ]
    case 'sleeping':
      // eyes closed in a downward arc (‿)
      return [
        { rx: 9.5, ry: 12.5, ...OPEN, arc: true, closed: true },
        { rx: 9.5, ry: 12.5, ...OPEN, arc: true, closed: true },
      ]
    case 'scared':
      // wide eyes, inner eyelid raised (worried)
      return [
        { rx: 9, ry: 14.5, ...OPEN, lid: -10.5, lidTilt: -6, dy: -1 },
        { rx: 9, ry: 14.5, ...OPEN, lid: -10.5, lidTilt: -6, dy: -1 },
      ]
    case 'hot':
      // heat: heavy, drooping eyelids, tired (no stroke — this is not irritation)
      return [
        { rx: 10, ry: 12.5, dy: 1, arc: false, lid: -4, lidTilt: -3, curve: 3.5, noLine: true },
        { rx: 10, ry: 12.5, dy: 1, arc: false, lid: -4, lidTilt: -3, curve: 3.5, noLine: true },
      ]
    case 'cold':
      // cold: smaller, slightly worried eyes
      return [
        { rx: 8.5, ry: 11.5, dy: 1, arc: false, lid: -8, lidTilt: -5, curve: 0, noLine: false },
        { rx: 8.5, ry: 11.5, dy: 1, arc: false, lid: -8, lidTilt: -5, curve: 0, noLine: false },
      ]
    case 'freezing':
      // very cold: squinted, tense eyes
      return [
        { rx: 9, ry: 11, dy: 2, arc: false, lid: 1.5, lidTilt: -6, curve: -1.5, noLine: false },
        { rx: 9, ry: 11, dy: 2, arc: false, lid: 1.5, lidTilt: -6, curve: -1.5, noLine: false },
      ]
    case 'surprised':
      return [
        { rx: 10.5, ry: 15, ...OPEN },
        { rx: 10.5, ry: 15, ...OPEN },
      ]
    default:
      return [
        { rx: 10, ry: 12.5, ...OPEN },
        { rx: 10, ry: 12.5, ...OPEN },
      ]
  }
}
