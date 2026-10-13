const siteName = 'Campestre TV'
const siteTagline = 'Tênis ao vivo das quadras do clube'

export const siteConfig = {
  name: siteName,
  tagline: siteTagline,
  title: `${siteName} - ${siteTagline}`,
  description:
    'Assista às partidas de tênis das quadras do Campestre ao vivo, 24 horas por dia. Três quadras, transmissão contínua e gratuita.',
  url: 'https://www.campestre.tv',
  themeColor: {
    light: '#FFFFFF',
    dark: '#242424',
  },
  email: 'breno.polanski@gmail.com',
  links: {
    clubecampestre: 'https://clubecampestrecg.com.br',
    youtube: 'https://www.youtube.com/@campestre-tv',
    youtubeChannelId: 'UCdWZMGfre33FZdDgcd1dz-A',
  },
  author: {
    name: siteName,
    x: '@brenopolanski',
    url: 'https://brenopolanski.com',
    emails: {
      personal: 'breno.polanski@gmail.com',
    },
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
