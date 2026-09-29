export interface Court {
  alt: string
  height: number
  id: number
  image: string
  name: string
  viewers: number
  width: number
}

export const featuredCourt: Court = {
  alt: 'Transmissão ao vivo da Quadra 1 do Campestre Tênis Clube',
  height: 864,
  id: 1,
  image: '/court-1.jpg',
  name: 'Quadra 1',
  viewers: 124,
  width: 1536,
}

export const courts: Court[] = [
  {
    alt: 'Transmissão da Quadra 2',
    height: 640,
    id: 2,
    image: '/court-2.jpg',
    name: 'Quadra 2',
    viewers: 98,
    width: 1024,
  },
  {
    alt: 'Transmissão da Quadra 3',
    height: 640,
    id: 3,
    image: '/court-3.jpg',
    name: 'Quadra 3',
    viewers: 76,
    width: 1024,
  },
]

export const courtThemes = [
  { id: 'saibro', name: 'Saibro', swatch: 'bg-court-clay' },
  { id: 'rapida', name: 'Quadra Rápida', swatch: 'bg-court-hard' },
  { id: 'grama', name: 'Grama', swatch: 'bg-court-grass' },
  { id: 'wimbledon', name: 'Wimbledon', swatch: 'bg-court-wimbledon' },
] as const

export type CourtThemeId = (typeof courtThemes)[number]['id']
