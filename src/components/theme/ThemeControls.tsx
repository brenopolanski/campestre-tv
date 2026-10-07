'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type ColorMode = 'dark' | 'light'

const ThemeControls = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const mode: ColorMode = isClient && resolvedTheme === 'dark' ? 'dark' : 'light'

  const handleModeChange = (value: string[]) => {
    const next = value[0]

    if (next === 'light' || next === 'dark') {
      setTheme(next)
    }
  }

  return (
    <ToggleGroup className="gap-2" value={[mode]} onValueChange={handleModeChange}>
      <ToggleGroupItem
        className="h-auto gap-2 rounded-none border border-border px-3 py-2 font-normal aria-pressed:border-foreground/50 aria-pressed:bg-muted"
        value="light"
      >
        <Sun className="size-4" /> Claro
      </ToggleGroupItem>
      <ToggleGroupItem
        className="h-auto gap-2 rounded-none border border-border px-3 py-2 font-normal aria-pressed:border-foreground/50 aria-pressed:bg-muted"
        value="dark"
      >
        <Moon className="size-4" /> Escuro
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

export { ThemeControls }
