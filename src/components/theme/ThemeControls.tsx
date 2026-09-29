'use client'

import { ChevronDown, Moon, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type CourtThemeId, courtThemes } from '@/lib/courts'
import { cn } from '@/lib/utils'

type ColorMode = 'dark' | 'light'

const CourtIcon = ({ swatch }: { swatch: string }) => {
  return (
    <span aria-hidden="true" className={cn('relative block h-16 w-full', swatch)}>
      <span className="absolute inset-2 border border-white/70" />
      <span className="absolute inset-x-2 top-1/2 h-px bg-white/70" />
      <span className="absolute inset-y-2 left-1/2 w-px bg-white/70" />
    </span>
  )
}

const ThemeControls = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const [court, setCourt] = useState<CourtThemeId>('saibro')
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const mode: ColorMode = isClient && resolvedTheme === 'dark' ? 'dark' : 'light'
  const active = courtThemes.find((item) => item.id === court) ?? courtThemes[0]

  useEffect(() => {
    document.documentElement.dataset.court = court
  }, [court])

  const handleCourtChange = (value: string[]) => {
    const next = courtThemes.find((item) => item.id === value[0])

    if (next) {
      setCourt(next.id)
    }
  }

  const handleModeChange = (value: string[]) => {
    const next = value[0]

    if (next === 'light' || next === 'dark') {
      setTheme(next)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        aria-label={mode === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        aria-pressed={mode === 'dark'}
        className="size-9 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground"
        size="icon"
        variant="ghost"
        onClick={() => setTheme(mode === 'dark' ? 'light' : 'dark')}
      >
        {mode === 'dark' ? <Moon className="size-5" /> : <Sun className="size-5" />}
      </Button>

      <Drawer swipeDirection="right">
        <DrawerTrigger
          render={
            <Button
              className="h-auto gap-3 rounded-full border-border px-3 py-2 hover:border-foreground/40"
              variant="outline"
            />
          }
        >
          <span aria-hidden="true" className={cn('size-6 rounded-full', active.swatch)} />
          <span>{active.name}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </DrawerTrigger>
        <DrawerContent className="rounded-none border-border bg-background text-foreground [--drawer-content-width:18rem] data-[swipe-direction=right]:rounded-none">
          <DrawerHeader className="flex-row items-center justify-between p-6 text-left">
            <DrawerTitle className="label-caps font-normal">Tema</DrawerTitle>
            <DrawerDescription className="sr-only">
              Escolha a superfície da quadra e o modo de cor.
            </DrawerDescription>
            <DrawerClose
              aria-label="Fechar"
              render={<Button className="text-muted-foreground" size="icon" variant="ghost" />}
            >
              <X className="size-4" />
            </DrawerClose>
          </DrawerHeader>

          <div className="px-6">
            <ToggleGroup
              className="w-full flex-col items-stretch gap-3"
              orientation="vertical"
              value={[court]}
              onValueChange={handleCourtChange}
            >
              {courtThemes.map((item) => (
                <ToggleGroupItem
                  key={item.id}
                  className="h-auto w-full flex-col items-stretch rounded-none border border-border p-3 text-left hover:border-foreground/30 aria-pressed:border-foreground/50 aria-pressed:bg-muted"
                  value={item.id}
                >
                  <CourtIcon swatch={item.swatch} />
                  <span className="mt-2 block text-sm font-normal">{item.name}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="mt-6 border-t border-border px-6 pt-6">
            <p className="mb-3 label-caps text-muted-foreground">Modo</p>
            <ToggleGroup
              className="w-full flex-col items-stretch gap-2"
              orientation="vertical"
              value={[mode]}
              onValueChange={handleModeChange}
            >
              <ToggleGroupItem
                className="h-auto w-full justify-start gap-3 rounded-none border border-border px-3 py-2 font-normal aria-pressed:border-foreground/50 aria-pressed:bg-muted"
                value="light"
              >
                <Sun className="size-4" /> Claro
              </ToggleGroupItem>
              <ToggleGroupItem
                className="h-auto w-full justify-start gap-3 rounded-none border border-border px-3 py-2 font-normal aria-pressed:border-foreground/50 aria-pressed:bg-muted"
                value="dark"
              >
                <Moon className="size-4" /> Escuro
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export { ThemeControls }
