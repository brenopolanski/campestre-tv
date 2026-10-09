import '@/styles/globals.css'

import { Analytics } from '@vercel/analytics/next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { JsonLd } from '@/components/shared/JsonLd'
import { SplashScreenWrapper } from '@/components/splashscreen/SplashScreenWrapper'
import { fontVariables } from '@/lib/fonts'
import { getSiteJsonLd } from '@/lib/jsonld'
import { cn } from '@/lib/utils'

import { metadata, viewport } from './metadata'

export { metadata, viewport }

interface RootLayoutProps {
  children: React.ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html
      className={cn('font-sans text-base antialiased', fontVariables)}
      lang="pt-BR"
      suppressHydrationWarning
    >
      <body>
        <SplashScreenWrapper>
          <NuqsAdapter>{children}</NuqsAdapter>
        </SplashScreenWrapper>
        <JsonLd data={getSiteJsonLd()} />
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
