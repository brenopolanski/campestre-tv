import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from '@/components/shared/ExternalLink'
import { UiIcon } from '../icons/UiIcon'
import { motionTokens } from '../theme/motion'
import type { TemperatureUnit } from '../weather/store'
import { WEATHER_KINDS } from '../weather/types'
import type { WeatherKind } from '../weather/types'
import type { Simulation } from '../weather/simulate'
import { PlainIconButton } from './primitives'

const KIND_LABEL: Record<WeatherKind, string> = {
  sunny: 'Ensolarado',
  clear: 'Céu limpo',
  partly: 'Parcialmente nublado',
  cloudy: 'Nublado',
  fog: 'Neblina',
  rain: 'Chuva',
  heavyRain: 'Chuva forte',
  storm: 'Tempestade',
}

interface Props {
  unit: TemperatureUnit
  onUnitChange: (u: TemperatureUnit) => void
  onRefresh: () => void
  debug: boolean
  simulation: Simulation | null
  onSimulate: (s: Simulation | null) => void
}

/** Settings: a glass popover that opens upward from the navigation bar. */
export function SettingsMenu({
  unit,
  onUnitChange,
  onRefresh,
  debug,
  simulation,
  onSimulate,
}: Props) {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    menuRef.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus()
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [],
    )
    const i = items.indexOf(document.activeElement as HTMLElement)
    const next =
      e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
    items[next]?.focus()
  }

  const choose = (fn: () => void) => () => {
    fn()
    setOpen(false)
  }

  return (
    <div className="menu-anchor">
      <PlainIconButton
        ref={buttonRef}
        icon="settings"
        label="Ajustes"
        pressed={open}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      />
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            className="menu glass"
            role="menu"
            aria-label="Ajustes"
            onKeyDown={onMenuKey}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 4 }}
            transition={motionTokens.system.menu}
            style={{ originX: 1, originY: 1 }}
          >
            <p className="menu__label">Unidade</p>
            <MenuItem checked={unit === 'c'} onSelect={choose(() => onUnitChange('c'))}>
              Celsius
            </MenuItem>
            <MenuItem checked={unit === 'f'} onSelect={choose(() => onUnitChange('f'))}>
              Fahrenheit
            </MenuItem>
            <div className="menu__separator" />
            <MenuItem icon="refresh" onSelect={choose(onRefresh)}>
              Atualizar
            </MenuItem>
            {debug && (
              <>
                <div className="menu__separator" />
                <p className="menu__label">Simular clima</p>
                <MenuItem checked={!simulation} onSelect={choose(() => onSimulate(null))}>
                  Real
                </MenuItem>
                {WEATHER_KINDS.map((k) => (
                  <MenuItem
                    key={k}
                    checked={simulation?.kind === k && simulation.isDay}
                    onSelect={choose(() => onSimulate({ kind: k, isDay: true }))}
                  >
                    {KIND_LABEL[k]}
                  </MenuItem>
                ))}
                <MenuItem
                  checked={!!simulation && !simulation.isDay}
                  onSelect={choose(() =>
                    onSimulate({
                      kind: simulation?.kind ?? 'clear',
                      isDay: !(simulation?.isDay ?? true),
                    }),
                  )}
                >
                  Noite
                </MenuItem>
              </>
            )}
            <div className="menu__separator" />
            <p className="menu__footnote">
              Dados meteorológicos:{' '}
              <ExternalLink href="https://open-meteo.com">Open-Meteo</ExternalLink>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuItem({
  children,
  checked,
  icon,
  onSelect,
}: {
  children: React.ReactNode
  checked?: boolean
  icon?: 'refresh'
  onSelect: () => void
}) {
  const isCheck = checked !== undefined
  return (
    <button
      type="button"
      className="menu__item"
      role={isCheck ? 'menuitemradio' : 'menuitem'}
      aria-checked={isCheck ? checked : undefined}
      onClick={onSelect}
    >
      <span className="menu__check">{checked && <UiIcon name="check" size={16} />}</span>
      <span className="menu__text">{children}</span>
      {icon && <UiIcon name={icon} size={17} />}
    </button>
  )
}
