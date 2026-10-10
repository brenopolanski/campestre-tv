'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { paths } from '@/config/paths'
import { cn } from '@/lib/utils'

import { SplashScreen } from './SplashScreen'

const DEFAULT_DURATION_MS = 2_000
const DEFAULT_FADE_MS = 400

type SplashPhase = 'exiting' | 'hidden' | 'visible'

interface SplashScreenWrapperProps {
  children: React.ReactNode
  durationMs?: number
  fadeMs?: number
}

export const SplashScreenWrapper = ({
  children,
  durationMs = DEFAULT_DURATION_MS,
  fadeMs = DEFAULT_FADE_MS,
}: SplashScreenWrapperProps) => {
  const pathname = usePathname()
  const [phase, setPhase] = useState<SplashPhase>('visible')
  const showSplash = phase !== 'hidden' && pathname !== paths.clima

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase('exiting'), durationMs)
    const hideTimer = setTimeout(() => setPhase('hidden'), durationMs + fadeMs)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(hideTimer)
    }
  }, [durationMs, fadeMs])

  return (
    <>
      {children}
      {showSplash && (
        <div
          aria-hidden={phase === 'exiting'}
          className={cn(
            'transition-opacity ease-out motion-reduce:transition-none',
            phase === 'exiting' && 'pointer-events-none opacity-0',
          )}
          style={{ transitionDuration: `${fadeMs}ms` }}
        >
          <SplashScreen />
        </div>
      )}
    </>
  )
}
