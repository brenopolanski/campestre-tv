import '@/styles/globals.css'

import { Analytics } from '@vercel/analytics/next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { JsonLd } from '@/components/shared/JsonLd'
import { SplashScreenWrapper } from '@/components/splashscreen/SplashScreenWrapper'
import { fontVariables } from '@/lib/fonts'
import { getSiteJsonLd } from '@/lib/jsonld'
import { cn } from '@/lib/utils'
import { Providers } from '@/providers/Providers'

import { metadata, viewport } from './metadata'

export { metadata, viewport }

interface RootLayoutProps {
  children: React.ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html
      className={cn('dark font-sans text-base antialiased', fontVariables)}
      lang="pt-BR"
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <SplashScreenWrapper>
            <NuqsAdapter>{children}</NuqsAdapter>
          </SplashScreenWrapper>
        </Providers>
        <JsonLd data={getSiteJsonLd()} />
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
