export interface BroadcastCourt {
  alt: string
  height: number
  image: string
  name: string
  viewers?: number
  width: number
}

export interface Court extends BroadcastCourt {
  id: number
  viewers: number
}

const mainCourt = {
  alt: 'Transmissão da Quadra 5',
  id: 1,
  image: '/no-thumb.png',
  name: 'Quadra 5',
  viewers: 98,
}

export const featuredCourt: Court = {
  height: 864,
  width: 1536,
  ...mainCourt,
}

export const courts: Court[] = [
  {
    height: 640,
    width: 1024,
    ...mainCourt,
  },
  {
    alt: 'Transmissão da Quadra 6',
    height: 640,
    id: 2,
    image: '/no-thumb.png',
    name: 'Quadra 6',
    viewers: 98,
    width: 1024,
  },
  {
    alt: 'Transmissão da Quadra 8',
    height: 640,
    id: 3,
    image: '/no-thumb.png',
    name: 'Quadra 8',
    viewers: 76,
    width: 1024,
  },
]
