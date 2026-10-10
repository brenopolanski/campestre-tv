import type { WeatherKind } from '../weather/types'

export type EnvironmentId =
  | 'sunny'
  | 'clear'
  | 'partly'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'heavyRain'
  | 'storm'
  | 'night'
  | 'nightPartly'
  | 'nightCloudy'
  | 'nightFog'
  | 'nightRain'
  | 'nightStorm'

export interface AtmosphereSpec {
  /** 0–1: quantas nuvens e quão densas */
  clouds: number
  cloudColor: string
  cloudShade: string
  sun: 'none' | 'glow' | 'disc'
  stars: boolean
  moon: boolean
  fog: boolean
  /** 0 nenhuma · 1 chuva · 2 chuva forte */
  rain: 0 | 1 | 2
  lightning: boolean
}

export interface WeatherTheme {
  id: EnvironmentId
  skyTop: string
  skyMid: string
  skyBottom: string
  horizonGlow: string

  foreground: string
  secondaryForeground: string
  tertiaryForeground: string
  textShadow: string

  cardBackground: string
  cardBorder: string
  separator: string

  glassBackground: string
  glassBorder: string
  glassHighlight: string
  glassShadow: string
  glassBlur: number

  accent: string
  /** cor do browser chrome (meta theme-color) */
  metaColor: string
  /** esquema da camada de conteúdo — fog diurno usa texto escuro */
  scheme: 'light-on-dark' | 'dark-on-light'

  atmosphere: AtmosphereSpec
}

type ThemeInput = Omit<WeatherTheme, 'id'>

const LIGHT_TEXT = {
  foreground: '#ffffff',
  secondaryForeground: 'rgba(255, 255, 255, 0.84)',
  tertiaryForeground: 'rgba(255, 255, 255, 0.66)',
  separator: 'rgba(255, 255, 255, 0.16)',
  scheme: 'light-on-dark',
} as const

const NO_ATMOSPHERE: AtmosphereSpec = {
  clouds: 0,
  cloudColor: '#ffffff',
  cloudShade: '#dfe9f5',
  sun: 'none',
  stars: false,
  moon: false,
  fog: false,
  rain: 0,
  lightning: false,
}

const THEMES: Record<EnvironmentId, ThemeInput> = {
  sunny: {
    skyTop: '#1f69c4',
    skyMid: '#3f8ddf',
    skyBottom: '#94c8f3',
    horizonGlow: 'rgba(255, 232, 196, 0.38)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(8, 42, 96, 0.22)',
    cardBackground: 'rgba(14, 62, 138, 0.24)',
    cardBorder: 'rgba(255, 255, 255, 0.14)',
    glassBackground: 'rgba(255, 255, 255, 0.18)',
    glassBorder: 'rgba(255, 255, 255, 0.28)',
    glassHighlight: 'rgba(255, 255, 255, 0.5)',
    glassShadow: 'rgba(10, 40, 90, 0.14)',
    glassBlur: 22,
    accent: '#ffd36b',
    metaColor: '#1f69c4',
    atmosphere: { ...NO_ATMOSPHERE, clouds: 0.18, sun: 'disc' },
  },
  clear: {
    skyTop: '#2a6fc2',
    skyMid: '#4e93da',
    skyBottom: '#a2cdf1',
    horizonGlow: 'rgba(255, 240, 220, 0.26)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(8, 42, 96, 0.22)',
    cardBackground: 'rgba(16, 62, 132, 0.24)',
    cardBorder: 'rgba(255, 255, 255, 0.14)',
    glassBackground: 'rgba(255, 255, 255, 0.17)',
    glassBorder: 'rgba(255, 255, 255, 0.26)',
    glassHighlight: 'rgba(255, 255, 255, 0.45)',
    glassShadow: 'rgba(10, 40, 90, 0.14)',
    glassBlur: 22,
    accent: '#ffd36b',
    metaColor: '#2a6fc2',
    atmosphere: { ...NO_ATMOSPHERE, clouds: 0.32, sun: 'glow' },
  },
  partly: {
    skyTop: '#3170bb',
    skyMid: '#5c97d3',
    skyBottom: '#a9cbe9',
    horizonGlow: 'rgba(255, 244, 228, 0.2)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(10, 40, 90, 0.26)',
    cardBackground: 'rgba(20, 60, 120, 0.25)',
    cardBorder: 'rgba(255, 255, 255, 0.14)',
    glassBackground: 'rgba(255, 255, 255, 0.17)',
    glassBorder: 'rgba(255, 255, 255, 0.26)',
    glassHighlight: 'rgba(255, 255, 255, 0.42)',
    glassShadow: 'rgba(10, 40, 90, 0.14)',
    glassBlur: 24,
    accent: '#ffd36b',
    metaColor: '#3170bb',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 0.62,
      cloudColor: '#ffffff',
      cloudShade: '#d4e2f2',
      sun: 'glow',
    },
  },
  cloudy: {
    skyTop: '#55667c',
    skyMid: '#73849a',
    skyBottom: '#a3b0bf',
    horizonGlow: 'rgba(230, 236, 244, 0.18)',
    ...LIGHT_TEXT,
    secondaryForeground: 'rgba(255, 255, 255, 0.9)',
    tertiaryForeground: 'rgba(255, 255, 255, 0.74)',
    textShadow: 'rgba(20, 30, 45, 0.5)',
    cardBackground: 'rgba(28, 40, 58, 0.3)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    glassBackground: 'rgba(235, 240, 248, 0.16)',
    glassBorder: 'rgba(255, 255, 255, 0.22)',
    glassHighlight: 'rgba(255, 255, 255, 0.34)',
    glassShadow: 'rgba(20, 30, 45, 0.16)',
    glassBlur: 24,
    accent: '#b9d4ff',
    metaColor: '#55667c',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 1,
      cloudColor: '#bcc6d3',
      cloudShade: '#8494a8',
    },
  },
  fog: {
    skyTop: '#9aa5b1',
    skyMid: '#b9c1ca',
    skyBottom: '#d9dee4',
    horizonGlow: 'rgba(255, 255, 255, 0.3)',
    foreground: '#18212c',
    secondaryForeground: 'rgba(24, 33, 44, 0.78)',
    tertiaryForeground: 'rgba(24, 33, 44, 0.6)',
    separator: 'rgba(24, 33, 44, 0.12)',
    scheme: 'dark-on-light',
    textShadow: 'rgba(255, 255, 255, 0.2)',
    cardBackground: 'rgba(255, 255, 255, 0.34)',
    cardBorder: 'rgba(255, 255, 255, 0.46)',
    glassBackground: 'rgba(255, 255, 255, 0.42)',
    glassBorder: 'rgba(255, 255, 255, 0.6)',
    glassHighlight: 'rgba(255, 255, 255, 0.7)',
    glassShadow: 'rgba(30, 40, 55, 0.1)',
    glassBlur: 26,
    accent: '#3f6fb0',
    metaColor: '#9aa5b1',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 0.5,
      cloudColor: '#eef1f4',
      cloudShade: '#c4ccd6',
      fog: true,
    },
  },
  rain: {
    skyTop: '#2d3e54',
    skyMid: '#43566d',
    skyBottom: '#687a8f',
    horizonGlow: 'rgba(170, 190, 215, 0.14)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(8, 14, 24, 0.3)',
    cardBackground: 'rgba(14, 24, 38, 0.3)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    glassBackground: 'rgba(196, 214, 238, 0.15)',
    glassBorder: 'rgba(214, 228, 248, 0.2)',
    glassHighlight: 'rgba(225, 236, 252, 0.3)',
    glassShadow: 'rgba(5, 12, 24, 0.22)',
    glassBlur: 26,
    accent: '#8fc3ff',
    metaColor: '#2d3e54',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 1,
      cloudColor: '#8794a6',
      cloudShade: '#4c5a6c',
      rain: 1,
    },
  },
  heavyRain: {
    skyTop: '#212d3d',
    skyMid: '#324254',
    skyBottom: '#536376',
    horizonGlow: 'rgba(150, 170, 195, 0.12)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(5, 10, 18, 0.34)',
    cardBackground: 'rgba(10, 18, 30, 0.34)',
    cardBorder: 'rgba(255, 255, 255, 0.09)',
    glassBackground: 'rgba(180, 200, 228, 0.14)',
    glassBorder: 'rgba(200, 218, 242, 0.18)',
    glassHighlight: 'rgba(214, 228, 248, 0.26)',
    glassShadow: 'rgba(4, 10, 20, 0.26)',
    glassBlur: 26,
    accent: '#8fc3ff',
    metaColor: '#212d3d',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 1,
      cloudColor: '#6c788a',
      cloudShade: '#3a4554',
      rain: 2,
    },
  },
  storm: {
    skyTop: '#121823',
    skyMid: '#1f2735',
    skyBottom: '#384354',
    horizonGlow: 'rgba(120, 140, 175, 0.12)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(0, 0, 0, 0.36)',
    cardBackground: 'rgba(6, 10, 18, 0.38)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    glassBackground: 'rgba(28, 34, 46, 0.42)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassHighlight: 'rgba(255, 255, 255, 0.16)',
    glassShadow: 'rgba(0, 0, 0, 0.32)',
    glassBlur: 28,
    accent: '#b6c8ff',
    metaColor: '#121823',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 1,
      cloudColor: '#4b5566',
      cloudShade: '#1d232e',
      rain: 2,
      lightning: true,
    },
  },
  night: {
    skyTop: '#060c20',
    skyMid: '#0f1f47',
    skyBottom: '#253b6e',
    horizonGlow: 'rgba(110, 140, 220, 0.16)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(0, 4, 20, 0.3)',
    cardBackground: 'rgba(8, 16, 44, 0.36)',
    cardBorder: 'rgba(170, 190, 255, 0.1)',
    glassBackground: 'rgba(60, 80, 150, 0.2)',
    glassBorder: 'rgba(170, 190, 255, 0.18)',
    glassHighlight: 'rgba(200, 215, 255, 0.24)',
    glassShadow: 'rgba(0, 4, 20, 0.3)',
    glassBlur: 24,
    accent: '#c9d6ff',
    metaColor: '#060c20',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 0.12,
      cloudColor: '#4a5a86',
      cloudShade: '#25325a',
      stars: true,
      moon: true,
    },
  },
  nightPartly: {
    skyTop: '#091127',
    skyMid: '#152650',
    skyBottom: '#2c4272',
    horizonGlow: 'rgba(110, 140, 220, 0.14)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(0, 4, 20, 0.3)',
    cardBackground: 'rgba(10, 18, 44, 0.36)',
    cardBorder: 'rgba(170, 190, 255, 0.1)',
    glassBackground: 'rgba(60, 80, 150, 0.2)',
    glassBorder: 'rgba(170, 190, 255, 0.18)',
    glassHighlight: 'rgba(200, 215, 255, 0.24)',
    glassShadow: 'rgba(0, 4, 20, 0.3)',
    glassBlur: 24,
    accent: '#c9d6ff',
    metaColor: '#091127',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 0.6,
      cloudColor: '#56658e',
      cloudShade: '#26335a',
      stars: true,
      moon: true,
    },
  },
  nightCloudy: {
    skyTop: '#121a29',
    skyMid: '#1f2a3e',
    skyBottom: '#364358',
    horizonGlow: 'rgba(120, 140, 180, 0.12)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(0, 4, 14, 0.32)',
    cardBackground: 'rgba(8, 14, 26, 0.36)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    glassBackground: 'rgba(70, 85, 115, 0.22)',
    glassBorder: 'rgba(200, 212, 240, 0.14)',
    glassHighlight: 'rgba(210, 220, 245, 0.2)',
    glassShadow: 'rgba(0, 4, 14, 0.3)',
    glassBlur: 26,
    accent: '#b9cbf5',
    metaColor: '#121a29',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 1,
      cloudColor: '#4c586e',
      cloudShade: '#222b3b',
    },
  },
  nightFog: {
    skyTop: '#2a323e',
    skyMid: '#3b4451',
    skyBottom: '#58616e',
    horizonGlow: 'rgba(200, 210, 225, 0.14)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(0, 0, 0, 0.3)',
    cardBackground: 'rgba(20, 26, 34, 0.32)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    glassBackground: 'rgba(120, 132, 150, 0.2)',
    glassBorder: 'rgba(255, 255, 255, 0.16)',
    glassHighlight: 'rgba(255, 255, 255, 0.22)',
    glassShadow: 'rgba(0, 0, 0, 0.26)',
    glassBlur: 26,
    accent: '#c6d4ea',
    metaColor: '#2a323e',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 0.5,
      cloudColor: '#6c7584',
      cloudShade: '#3d4552',
      fog: true,
    },
  },
  nightRain: {
    skyTop: '#0c1422',
    skyMid: '#182335',
    skyBottom: '#2c394d',
    horizonGlow: 'rgba(110, 130, 170, 0.12)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(0, 4, 12, 0.34)',
    cardBackground: 'rgba(6, 12, 22, 0.38)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    glassBackground: 'rgba(80, 100, 140, 0.2)',
    glassBorder: 'rgba(190, 208, 240, 0.14)',
    glassHighlight: 'rgba(200, 215, 245, 0.2)',
    glassShadow: 'rgba(0, 4, 12, 0.32)',
    glassBlur: 26,
    accent: '#8fc3ff',
    metaColor: '#0c1422',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 1,
      cloudColor: '#465267',
      cloudShade: '#1c2433',
      rain: 1,
    },
  },
  nightStorm: {
    skyTop: '#06080e',
    skyMid: '#111620',
    skyBottom: '#232a37',
    horizonGlow: 'rgba(100, 120, 160, 0.1)',
    ...LIGHT_TEXT,
    textShadow: 'rgba(0, 0, 0, 0.4)',
    cardBackground: 'rgba(4, 6, 12, 0.42)',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    glassBackground: 'rgba(24, 28, 38, 0.46)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassHighlight: 'rgba(255, 255, 255, 0.14)',
    glassShadow: 'rgba(0, 0, 0, 0.38)',
    glassBlur: 28,
    accent: '#b6c8ff',
    metaColor: '#06080e',
    atmosphere: {
      ...NO_ATMOSPHERE,
      clouds: 1,
      cloudColor: '#3a4352',
      cloudShade: '#141921',
      rain: 2,
      lightning: true,
    },
  },
}

export function environmentFor(kind: WeatherKind, isDay: boolean): EnvironmentId {
  if (isDay) return kind
  switch (kind) {
    case 'sunny':
    case 'clear':
      return 'night'
    case 'partly':
      return 'nightPartly'
    case 'cloudy':
      return 'nightCloudy'
    case 'fog':
      return 'nightFog'
    case 'rain':
    case 'heavyRain':
      return 'nightRain'
    case 'storm':
      return 'nightStorm'
  }
}

export function getTheme(kind: WeatherKind, isDay: boolean): WeatherTheme {
  const id = environmentFor(kind, isDay)
  const theme = { id, ...THEMES[id] }
  // chuva forte à noite mantém a intensidade de partículas
  if (!isDay && kind === 'heavyRain') {
    return { ...theme, atmosphere: { ...theme.atmosphere, rain: 2 } }
  }
  return theme
}

/** Aplica o tema como custom properties em .clima e atualiza o theme-color do browser. */
export function applyTheme(theme: WeatherTheme) {
  const root = document.querySelector<HTMLElement>('.clima')
  if (!root) return
  const vars: Record<string, string> = {
    '--sky-top': theme.skyTop,
    '--sky-mid': theme.skyMid,
    '--sky-bottom': theme.skyBottom,
    '--fg': theme.foreground,
    '--fg-2': theme.secondaryForeground,
    '--fg-3': theme.tertiaryForeground,
    '--text-shadow': theme.textShadow,
    '--card-bg': theme.cardBackground,
    '--card-border': theme.cardBorder,
    '--separator': theme.separator,
    '--glass-bg': theme.glassBackground,
    '--glass-border': theme.glassBorder,
    '--glass-highlight': theme.glassHighlight,
    '--glass-shadow': theme.glassShadow,
    '--glass-blur': `${theme.glassBlur}px`,
    '--accent': theme.accent,
  }
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  root.dataset.scheme = theme.scheme
  root.dataset.environment = theme.id

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = theme.metaColor
  // o Safari do iPhone pinta as faixas do topo e da barra de baixo com a cor de fundo
  // da página: acompanha o céu (topo = alto do céu, base = horizonte)
  document.documentElement.style.backgroundColor = theme.skyTop
  document.body.style.backgroundColor = theme.skyBottom
}
