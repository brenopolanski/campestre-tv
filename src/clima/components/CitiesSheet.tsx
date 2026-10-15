import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import type { PanInfo } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { WeatherIcon } from '../icons/WeatherIcon'
import { UiIcon } from '../icons/UiIcon'
import { motionTokens } from '../theme/motion'
import { getTheme } from '../theme/weatherThemes'
import { conditionLabel } from '../weather/format'
import { CLUB_PLACE } from '../weather/location'
import { searchPlaces } from '../weather/openMeteo'
import { toUnit } from '../weather/store'
import type { ForecastEntry, TemperatureUnit } from '../weather/store'
import type { Place } from '../weather/types'

interface Props {
  open: boolean
  /** abre já com a busca em foco (botão de busca da barra) */
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

/** Bottom sheet de cidades: busca + lista com mini atmosfera. */
export function CitiesSheet(props: Props) {
  return props.open ? <Sheet {...props} /> : null
}

function Sheet({
  searchFirst,
  onClose,
  places,
  entries,
  unit,
  currentId,
  onSelect,
  onAdd,
  onRemove,
}: Props) {
  const reduced = useReducedMotion() ?? false
  const sheetRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(() => sheetHeight())
  const positions = { full: 0, medium: Math.round(height * 0.38), closed: height + 40 }
  // Busca: o sheet já abre na posição final, com o campo visível. No iOS o teclado só
  // abre com foco dentro do gesto, e focar um campo fora da tela faz o Safari rolar a página.
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
    // projeção com velocidade: o sheet "continua" o gesto antes de escolher o ponto
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
        onClick={close}
        aria-hidden="true"
      />
      <motion.div
        ref={sheetRef}
        className="sheet glass"
        role="dialog"
        aria-modal="true"
        aria-label="Cidades"
        tabIndex={-1}
        style={{ y, height }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: positions.closed }}
        dragElastic={{ top: 0.08, bottom: 0.6 }}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        <div className="sheet__grabber" aria-hidden="true" onPointerDown={startDrag} />
        <div className="sheet__header" onPointerDown={startDrag}>
          <h2 className="sheet__title">Cidades</h2>
          <button type="button" className="text-button" onClick={() => setEditing((e) => !e)}>
            {editing ? 'OK' : 'Editar'}
          </button>
          <button type="button" className="plain-icon-button" aria-label="Fechar" onClick={close}>
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
                <motion.li key={p.id} layout={!reduced} className="city-list__item">
                  <button
                    type="button"
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
                            kind={data.current.kind}
                            isDay={data.current.isDay}
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
                        type="button"
                        className="city-row__remove"
                        aria-label={`Remover ${p.name}`}
                        onClick={() => onRemove(p.id)}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={motionTokens.system.fast}
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

function SearchPanel({
  children,
  onPick,
  onExpand,
  autoFocus,
}: {
  autoFocus?: boolean
  children: React.ReactNode
  onPick: (p: Place) => void
  onExpand: () => void
}) {
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
    const controller = new AbortController()
    const t = window.setTimeout(() => {
      setStatus('loading')
      searchPlaces(q, controller.signal)
        .then((r) => {
          setResults(r)
          setActive(0)
          setStatus('idle')
        })
        .catch((e: Error) => {
          if (e.name !== 'AbortError') setStatus('error')
        })
    }, 220)
    return () => {
      controller.abort()
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

  // foco no mesmo ciclo do toque (abre o teclado no iPhone), sem rolar a página
  const inputRef = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true })
  }, [autoFocus])

  return (
    <div className="sheet__body">
      <label className="search">
        <UiIcon name="search" size={18} />
        <input
          type="search"
          placeholder="Buscar cidade"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onExpand}
          ref={inputRef}
          onKeyDown={onKeyDown}
          aria-label="Buscar cidade"
          aria-controls="search-results"
          aria-activedescendant={results.length ? `result-${active}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
      <div className="sheet__scroll">
        {searching ? (
          <ul className="results" id="search-results" role="listbox" aria-label="Resultados">
            {status === 'error' && <li className="results__empty">Não consegui buscar agora.</li>}
            {status === 'idle' && results.length === 0 && (
              <li className="results__empty">Nenhuma cidade encontrada.</li>
            )}
            {results.map((r, i) => (
              <motion.li
                key={r.id}
                id={`result-${i}`}
                role="option"
                aria-selected={i === active}
                className="results__item"
                data-active={i === active || undefined}
                onClick={() => onPick(r)}
                onPointerEnter={() => setActive(i)}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...motionTokens.system.default, delay: i * 0.03 }}
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
