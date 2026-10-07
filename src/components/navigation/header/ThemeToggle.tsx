'use client'

import { useTheme } from 'next-themes'
import { useCallback, useSyncExternalStore } from 'react'

import { MoonIcon, SunIcon } from '@/components/shared/Icons'
import { Button } from '@/components/ui/button'

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const isDark = isClient && resolvedTheme === 'dark'

  const switchTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark')
  }, [isDark, setTheme])

  return (
    <Button
      aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      aria-pressed={isDark}
      className="rounded-none border border-border"
      size="icon"
      variant="ghost"
      onClick={switchTheme}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </Button>
  )
}
