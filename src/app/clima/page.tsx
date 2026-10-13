import type { Metadata, Viewport } from 'next'

import { CLUB_PLACE } from '@/clima/weather/location'
import { ClimaRoot } from '@/components/clima/ClimaRoot'
import { Header } from '@/components/navigation/Header'
import { paths } from '@/config/paths'
import { siteConfig } from '@/config/site'

const title = 'Clima'
const description =
  'Previsão do tempo no Clube Campestre, em Campina Grande. Veja a temperatura, a condição do céu e os próximos dias com o Climinha.'
const socialTitle = `${title} · ${siteConfig.name}`

const ogImage = {
  url: '/og.jpg',
  width: 1200,
  height: 630,
  alt: socialTitle,
  type: 'image/jpeg',
} as const

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: paths.clima,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: siteConfig.name,
    url: paths.clima,
    title: socialTitle,
    description,
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.author.x,
    title: socialTitle,
    description,
    images: [ogImage.url],
  },
  other: { 'darkreader-lock': '' },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#2a6fc2',
  colorScheme: 'dark light',
}

const ClimaPage = () => (
  <>
    <h1 className="sr-only">Clima no {CLUB_PLACE.name}</h1>
    <ClimaRoot header={<Header />} />
  </>
)

export default ClimaPage
