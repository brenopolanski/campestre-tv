import { Inter } from 'next/font/google'

import { cn } from './utils'

export const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const fontVariables = cn(fontSans.variable)
