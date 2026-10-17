import type { PanInfo } from 'motion/react'
import {
  animate,
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { UiIcon } from '@/clima/icons/UiIcon'
import { WeatherIcon } from '@/clima/icons/WeatherIcon'
import { motionTokens } from '@/clima/theme/motion'
import { getTheme } from '@/clima/theme/weatherThemes'
import { conditionLabel } from '@/clima/weather/format'
import { CLUB_PLACE } from '@/clima/weather/location'
import { searchPlaces } from '@/clima/weather/openMeteo'
import type { ForecastEntry, TemperatureUnit } from '@/clima/weather/store'
import { toUnit } from '@/clima/weather/store'
import type { Place } from '@/clima/weather/types'

interface CitiesSheetProps {
  open: boolean
  /** opens with search already focused (search button on the bar) */
  searchFirst?: boolean
  onClose: () => void
  places: Place[]
  entries: Record<string, ForecastEntry>
  unit: TemperatureUnit
  currentId: string
  onSelect: (place: Place) => void
  onAdd: (place: Place) => void
  onRemove: (id: string) => void
}

type Snap = 'medium' | 'full'

/** City bottom sheet: search + a list with a mini atmosphere. */
export const CitiesSheet = (props: CitiesSheetProps) => {
  return props.open ? <Sheet {...props} /> : null
}

const Sheet = ({
  searchFirst,
  onClose,
  places,
  entries,
  unit,
  currentId,
  onSelect,
  onAdd,
  onRemove,
}: CitiesSheetProps) => {
  const reduced = useReducedMotion() ?? false
  const sheetRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(() => sheetHeight())
  const positions = { full: 0, medium: Math.round(height * 0.38), closed: height + 40 }
  // Search: the sheet already opens at its final position, with the field visible. On iOS the keyboard
  // only opens with focus inside the gesture, and focusing a field off screen makes Safari scroll the page.
  const y = useMotionValue(searchFirst ? positions.full : positions.closed)
  const backdrop = useTransform(y, [positions.closed, positions.medium], [0, 1])
  const [snap, setSnap] = useState<Snap>(searchFirst ? 'full' : 'medium')
  const [editing, setEditing] = useState(false)
  const dragControls = useDragControls()
  const startDrag = (e: React.PointerEvent) => dragControls.start(e)

  useEffect(() => {
    const onResize = () => setHeight(sheetHeight())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const target = snap === 'full' ? 0 : Math.round(height * 0.38)
    const ctrl = animate(y, target, reduced ? { duration: 0 } : motionTokens.system.sheet)
    return () => ctrl.stop()
  }, [snap, height, y, reduced])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    if (!searchFirst) sheetRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    document.body.dataset.sheetOpen = 'true'
    return () => {
      document.removeEventListener('keydown', onKey)
      delete document.body.dataset.sheetOpen
      previous?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function close() {
    animate(
      y,
      positions.closed,
      reduced ? { duration: 0 } : { ...motionTokens.system.sheet, restDelta: 1 },
    ).then(onClose)
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    const v = info.velocity.y
    const current = y.get()
    // projection with velocity: the sheet "continues" the gesture before choosing the snap point
    const projected = current + v * 0.18
    if (projected > positions.medium + height * 0.22 || (snap === 'medium' && v > 700))
      return close()
    const next: Snap = projected < positions.medium / 2 || v < -500 ? 'full' : 'medium'
    if (next === snap) {
      animate(y, positions[next], { ...motionTokens.system.sheet, velocity: v })
    } else {
      setSnap(next)
    }
  }

  return (
    <>
      <motion.div
        className="sheet-backdrop"
        style={{ opacity: backdrop }}
        aria-hidden
        onClick={close}
      />
      <motion.div
        ref={sheetRef}
        aria-label="Cidades"
        aria-modal="true"
        className="sheet glass"
        drag="y"
        dragConstraints={{ top: 0, bottom: positions.closed }}
        dragControls={dragControls}
        dragElastic={{ top: 0.08, bottom: 0.6 }}
        dragListener={false}
        dragMomentum={false}
        role="dialog"
        style={{ y, height }}
        tabIndex={-1}
        onDragEnd={onDragEnd}
      >
        <div className="sheet__grabber" aria-hidden onPointerDown={startDrag} />
        <div className="sheet__header" onPointerDown={startDrag}>
          <h2 className="sheet__title">Cidades</h2>
          <button className="text-button" type="button" onClick={() => setEditing((e) => !e)}>
            {editing ? 'OK' : 'Editar'}
          </button>
          <button aria-label="Fechar" className="plain-icon-button" type="button" onClick={close}>
            <UiIcon name="close" size={20} />
          </button>
        </div>
        <SearchPanel
          autoFocus={searchFirst}
          onExpand={() => setSnap('full')}
          onPick={(p) => {
            onAdd(p)
            onSelect(p)
            close()
          }}
        >
          <ul className="city-list">
            {places.map((p) => {
              const data = entries[p.id]?.data
              const theme = data ? getTheme(data.current.kind, data.current.isDay) : null
              return (
                <motion.li key={p.id} className="city-list__item" layout={!reduced}>
                  <button
                    className="city-row"
                    data-current={p.id === currentId || undefined}
                    data-scheme={theme?.scheme}
                    style={
                      theme
                        ? {
                            backgroundImage: `linear-gradient(160deg, ${theme.skyTop}, ${theme.skyMid} 60%, ${theme.skyBottom})`,
                          }
                        : undefined
                    }
                    type="button"
                    onClick={() => {
                      onSelect(p)
                      close()
                    }}
                  >
                    <span className="city-row__main">
                      <span className="city-row__name">{p.name}</span>
                      <span className="city-row__region">{p.region}</span>
                      <span className="city-row__condition">
                        {data ? conditionLabel(data) : 'Carregando…'}
                      </span>
                    </span>
                    <span className="city-row__side">
                      <span className="city-row__temp">
                        {data ? `${toUnit(data.current.temperature, unit)}°` : '--'}
                      </span>
                      {data && (
                        <span className="city-row__range">
                          <WeatherIcon
                            isDay={data.current.isDay}
                            kind={data.current.kind}
                            size={18}
                          />
                          {toUnit(data.daily[0].max, unit)}° · {toUnit(data.daily[0].min, unit)}°
                        </span>
                      )}
                    </span>
                  </button>
                  <AnimatePresence>
                    {editing && places.length > 1 && p.id !== CLUB_PLACE.id && (
                      <motion.button
                        animate={{ opacity: 1, scale: 1 }}
                        aria-label={`Remover ${p.name}`}
                        className="city-row__remove"
                        exit={{ opacity: 0, scale: 0.6 }}
                        initial={{ opacity: 0, scale: 0.6 }}
                        transition={motionTokens.system.fast}
                        type="button"
                        onClick={() => onRemove(p.id)}
                      >
                        <UiIcon name="minus" size={16} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.li>
              )
            })}
          </ul>
        </SearchPanel>
      </motion.div>
    </>
  )
}

interface SearchPanelProps {
  autoFocus?: boolean
  children: React.ReactNode
  onPick: (p: Place) => void
  onExpand: () => void
}

const SearchPanel = ({ children, onPick, onExpand, autoFocus }: SearchPanelProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setStatus('idle')
      return
    }
    let ignore = false
    const t = window.setTimeout(() => {
      setStatus('loading')
      searchPlaces(q)
        .then((r) => {
          if (ignore) return
          setResults(r)
          setActive(0)
          setStatus('idle')
        })
        .catch(() => {
          if (!ignore) setStatus('error')
        })
    }, 220)
    return () => {
      ignore = true
      window.clearTimeout(t)
    }
  }, [query])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onPick(results[active])
    }
  }

  const searching = query.trim().length >= 2

  // focus in the same turn as the tap (opens the keyboard on iPhone), without scrolling the page
  const inputRef = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true })
  }, [autoFocus])

  return (
    <div className="sheet__body">
      <label className="search">
        <UiIcon name="search" size={18} />
        <input
          ref={inputRef}
          aria-activedescendant={results.length ? `result-${active}` : undefined}
          aria-controls="search-results"
          aria-label="Buscar cidade"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Buscar cidade"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onExpand}
          onKeyDown={onKeyDown}
        />
      </label>
      <div className="sheet__scroll">
        {searching ? (
          <ul aria-label="Resultados" className="results" id="search-results" role="listbox">
            {status === 'error' && <li className="results__empty">Não consegui buscar agora.</li>}
            {status === 'idle' && results.length === 0 && (
              <li className="results__empty">Nenhuma cidade encontrada.</li>
            )}
            {results.map((r, i) => (
              <motion.li
                key={r.id}
                animate={{ opacity: 1, y: 0 }}
                aria-selected={i === active}
                className="results__item"
                data-active={i === active || undefined}
                id={`result-${i}`}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                role="option"
                transition={{ ...motionTokens.system.default, delay: i * 0.03 }}
                onClick={() => onPick(r)}
                onPointerEnter={() => setActive(i)}
              >
                <span className="results__name">{r.name}</span>
                <span className="results__region">{r.region}</span>
              </motion.li>
            ))}
          </ul>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function sheetHeight() {
  return Math.round(Math.min(window.innerHeight * 0.92, window.innerHeight - 40))
}
