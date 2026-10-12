'use client'

import '@/clima/index.css'

import dynamic from 'next/dynamic'
import { Fredoka } from 'next/font/google'
import { useEffect } from 'react'

import { resetIfAway } from '@/clima/weather/store'
import { cn } from '@/lib/utils'

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka' })

const App = dynamic(
  () =>
    import('@/clima/App').then((mod) => {
      resetIfAway()
      return mod
    }),
  { ssr: false },
)

interface ClimaRootProps {
  header: React.ReactNode
}

export const ClimaRoot = ({ header }: ClimaRootProps) => {
  useEffect(
    () => () => {
      document.documentElement.style.removeProperty('background-color')
      document.body.style.removeProperty('background-color')
      delete document.body.dataset.sheetOpen
    },
    [],
  )

  return (
    // `clima` scopes the Climinha stylesheets in src/clima
    // eslint-disable-next-line shadcn/no-unknown-classes
    <div className={cn('clima', fredoka.variable)}>
      <App header={header} />
    </div>
  )
}
