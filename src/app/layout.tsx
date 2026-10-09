import '@/styles/globals.css'

import { Analytics } from '@vercel/analytics/next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { SplashScreenWrapper } from '@/components/splashscreen/SplashScreenWrapper'
import { fontVariables } from '@/lib/fonts'
import { cn } from '@/lib/utils'

export { metadata, viewport } from './metadata'

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
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
