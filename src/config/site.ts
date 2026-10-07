const siteName = 'Campestre TV'
const siteTagline = 'Tênis ao vivo das quadras do clube'

export const siteConfig = {
  name: siteName,
  tagline: siteTagline,
  title: `${siteName} - ${siteTagline}`,
  description:
    'Assista às partidas das quadras do Campestre ao vivo, 24 horas por dia. Três quadras, transmissão contínua e gratuita.',
  shortDescription: 'Transmissão ao vivo das quadras de tênis do Campestre.',
  url: 'https://campestre.tv',
  themeColor: {
    light: '#FFFFFF',
    dark: '#17211C',
  },
  email: '', // TODO: add email
  links: {
    youtube: 'https://youtube.com/@campestre-tv',
  },
  keywords: [
    siteName,
    'campestre',
    'campina grande',
    'clube campestre',
    'live',
    'paraíba',
    'streaming',
    'tennis',
    'transmissões',
    'vídeo',
    'vídeo ao vivo',
    'vídeo ao vivo online',
    'vídeo ao vivo online youtube',
    'vídeo ao vivo streaming',
    'vídeo ao vivo streaming youtube',
    'vídeo ao vivo youtube',
    'youtube',
  ],
} as const
