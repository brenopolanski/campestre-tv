import { DM_Sans, Inter } from 'next/font/google'

import { cn } from './utils'

export const fontSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })

export const fontInter = Inter({ subsets: ['latin'] })

export const fontVariables = cn(fontSans.variable)
