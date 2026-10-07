import './globals.css'

import { fontVariables } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import { Providers } from '@/providers/Providers'

export { metadata, viewport } from './metadata'

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
