import '@/styles/globals.css'

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
        <SplashScreenWrapper>{children}</SplashScreenWrapper>
      </body>
    </html>
  )
}

export default RootLayout
