import './globals.css'

import type { Metadata } from 'next'

import { fontVariables } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import { Providers } from '@/providers/Providers'

export const metadata: Metadata = {
  title: 'campestre.tv — Tênis ao vivo das quadras do clube',
  description:
    'Assista às partidas das quadras do Campestre ao vivo, 24 horas por dia. Três quadras, transmissão contínua e gratuita.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'campestre.tv — Tênis ao vivo',
    description: 'Transmissão ao vivo das quadras de tênis do Campestre.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html
      className={cn('font-sans text-base antialiased', fontVariables)}
      data-court="saibro"
      lang="pt-BR"
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout
