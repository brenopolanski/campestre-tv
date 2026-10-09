import type { Metadata, Viewport } from 'next'

import { paths } from '@/config/paths'
import { siteConfig } from '@/config/site'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: siteConfig.themeColor.light },
    { media: '(prefers-color-scheme: dark)', color: siteConfig.themeColor.dark },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: paths.home,
  },
  appleWebApp: {
    title: siteConfig.name,
    capable: true,
    statusBarStyle: 'default',
  },
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: siteConfig.title,
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.author.x,
    title: siteConfig.title,
    description: siteConfig.description,
    images: ['/og.jpg'],
  },
}
