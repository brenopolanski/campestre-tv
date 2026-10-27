'use client'

import './app.css'

import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import {
  lazy,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { CliminhaPhase } from './climinha/Climinha'
import type { Mood } from './climinha/states'
import { climinhaFor, NEUTRAL_STATE } from './climinha/states'
import { DetailGrid } from './components/Details'
import { FirstRunContext } from './components/firstRun'
import { FloatingNav } from './components/FloatingNav'
import { DailyCard, HourlyCard, PrecipitationCard } from './components/Forecasts'
import type { HeroData } from './components/Hero'
import { Hero } from './components/Hero'
import { Splash, SPLASH_MIN_MS } from './components/Splash'
import { TravelingCliminha } from './components/TravelingCliminha'
import { Environment } from './environment/Environment'
import { motionTokens } from './theme/motion'
import { applyTheme, getTheme } from './theme/weatherThemes'
import { conditionLabel } from './weather/format'
import { liveForecast } from './weather/live'
import { CLUB_PLACE, HERE_ID, locateUser } from './weather/location'
import { precipitationOutlook } from './weather/outlook'
import type { Simulation } from './weather/simulate'
import { applySimulation, simulationFromUrl } from './weather/simulate'
import { markSeen, readHere, useForecasts, usePlaces, useUnit, writeHere } from './weather/store'
import type { Place } from './weather/types'

const LOADING_THEME = getTheme('clear', true)

// the city list (with search) is downloaded only the first time it opens
const CitiesSheet = lazy(() =>
  import('./components/CitiesSheet').then((mod) => ({ default: mod.CitiesSheet })),
)

/** weather simulator: local environment only */
const SIMULATOR = process.env.NODE_ENV === 'development'

/** Climinha intro: off for now */
const SHOW_SPLASH = false

/** Static, translucent placeholders with the cards' geometry. */
const SkeletonCards = () => {
  return (
    <div className="skeletons" aria-hidden>
      <div className="card skeleton-card" style={{ height: 168 }} />
      <div className="content__columns">
        <div className="card skeleton-card" style={{ height: 420 }} />
        <div className="details">
          <div className="card skeleton-card" style={{ height: 164 }} />
          <div className="card skeleton-card" style={{ height: 164 }} />
        </div>
      </div>
    </div>
  )
}

interface AppProps {
  header: React.ReactNode
}

const App = ({ header }: AppProps) => {
  const reduced = useReducedMotion() ?? false
  const { places: saved, addPlace, removePlace } = usePlaces()
  // device location, when the person asks; otherwise it opens at Clube Campestre
  const [here, setHere] = useState<Place | null>(readHere)
  const places = useMemo(() => {
    const extras = saved.filter((p) => p.id !== CLUB_PLACE.id && p.id !== here?.id)
    return here && here.id !== CLUB_PLACE.id
      ? [here, CLUB_PLACE, ...extras]
      : [CLUB_PLACE, ...extras]
  }, [here, saved])
  const { entries, refresh } = useForecasts(places)
  const [unit, setUnit] = useUnit()

  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const safeIndex = Math.min(index, places.length - 1)
  const place = places[safeIndex]
  const entry = entries[place.id]

  // weather simulator (?weather=, ?temp=, ?debug): local environment only, never on the published site
  const debug = useMemo(
    () => SIMULATOR && new URLSearchParams(window.location.search).has('debug'),
    [],
  )
  const [simulation, setSimulation] = useState<Simulation | null>(() =>
    SIMULATOR ? simulationFromUrl() : null,
  )
  // clock: every 30 s the forecast is adjusted to the city's real time (day/night, "Agora", "Hoje")
  // and the app marks that it is in use ("start from scratch" only applies after time away)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date())
      if (!document.hidden) {
        markSeen()
      }
    }, 30_000)
    const onHide = () => markSeen()
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])
  const forecast = useMemo(() => {
    if (!entry?.data) {
      return undefined
    }
    const live = liveForecast(entry.data, now)
    return simulation ? applySimulation(live, simulation) : live
  }, [entry?.data, simulation, now])

  // --- environment + character derived from the weather ----------------------
  const theme = useMemo(
    () => (forecast ? getTheme(forecast.current.kind, forecast.current.isDay) : LOADING_THEME),
    [forecast],
  )
  useLayoutEffect(() => applyTheme(theme), [theme])

  const climinha = useMemo(
    () =>
      forecast
        ? climinhaFor(forecast.current.kind, forecast.current.isDay, forecast.current.temperature)
        : NEUTRAL_STATE,
    [forecast],
  )

  // full-screen open: stays at least a moment and leaves when there is data
  // (or after a limit, so the user is not stuck without a connection)
  const [splash, setSplash] = useState(SHOW_SPLASH)
  const [splashMinDone, setSplashMinDone] = useState(false)
  useEffect(() => {
    const min = window.setTimeout(() => setSplashMinDone(true), reduced ? 500 : SPLASH_MIN_MS)
    const max = window.setTimeout(() => setSplash(false), 5200)
    return () => {
      window.clearTimeout(min)
      window.clearTimeout(max)
    }
  }, [reduced])
  const hasData = !!forecast || entry?.status === 'error'
  // the page with the data is mounted and settled (heavy layout) while the intro is still still;
  // the flight starts only after that, so it never fights this work for a frame
  const [dataSettled, setDataSettled] = useState(false)
  useEffect(() => {
    if (!hasData || dataSettled) {
      return
    }
    let raf = 0
    const t = window.setTimeout(() => {
      // two frames after layout: the page has already been painted
      raf = requestAnimationFrame(() => requestAnimationFrame(() => setDataSettled(true)))
    }, 350)
    return () => {
      window.clearTimeout(t)
      cancelAnimationFrame(raf)
    }
  }, [hasData, dataSettled])
  if (splash && splashMinDone && dataSettled) {
    setSplash(false)
  }

  // the intro is already the "notice-user": on Home he arrives awake
  const phase: CliminhaPhase = 'awake'

  // cards below the fold only appear on scroll: they do not need to exist at open.
  // Mounting them after landing (while the browser is idle) takes the biggest layout off the intro.
  const [mountRest, setMountRest] = useState(false)
  useEffect(() => {
    if (mountRest || splash) {
      return
    }
    const mount = () => startTransition(() => setMountRest(true))
    const onScroll = () => mount()
    window.addEventListener('scroll', onScroll, { once: true, passive: true })
    let idle = 0
    const t = window.setTimeout(() => {
      idle =
        typeof requestIdleCallback === 'function'
          ? requestIdleCallback(mount, { timeout: 800 })
          : window.setTimeout(mount, 0)
    }, 1500)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(t)
      if (typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idle)
      }
    }
  }, [mountRest, splash])

  const [firstRun, setFirstRun] = useState(true)
  useEffect(() => {
    if (splash) {
      return
    }
    const t = window.setTimeout(() => setFirstRun(false), 1600)
    return () => window.clearTimeout(t)
  }, [splash])

  // short reactions: lightning scares, an error confuses
  const [flash, setFlash] = useState<Mood | undefined>()
  const flashTimer = useRef(0)
  const react = useCallback((mood: Mood, ms = 700) => {
    window.clearTimeout(flashTimer.current)
    setFlash(mood)
    flashTimer.current = window.setTimeout(() => setFlash(undefined), ms)
  }, [])
  const noData = !forecast && entry?.status === 'error'
  const moodOverride = flash ?? (noData ? 'confused' : undefined)

  const heroData: HeroData | null = forecast
    ? {
        temperature: forecast.current.temperature,
        condition: conditionLabel(forecast),
        max: forecast.daily[0]?.max ?? forecast.current.temperature,
        min: forecast.daily[0]?.min ?? forecast.current.temperature,
      }
    : null

  // --- navigation between cities ---------------------------------------------
  // pages: the whole screen follows the drag (finger, mouse, trackpad) and snaps
  // by distance or speed. A change = the page leaves one side, the next enters from the other.
  const swipeX = useMotionValue(0)
  const pageOpacity = useTransform(
    swipeX,
    (v) => 1 - Math.min(0.5, Math.abs(v) / window.innerWidth),
  )
  const switching = useRef(false)
  const settle = useCallback(
    (velocity = 0) => void animate(swipeX, 0, { ...motionTokens.system.page, velocity }),
    [swipeX],
  )
  const goTo = useCallback(
    async (i: number, velocity = 0) => {
      const next = Math.max(0, Math.min(places.length - 1, i))
      if (next === safeIndex || switching.current) {
        settle(velocity)
        return
      }
      const dir = next > safeIndex ? 1 : -1
      if (reduced) {
        setDirection(dir)
        setIndex(next)
        window.scrollTo({ top: 0 })
        swipeX.set(0)
        return
      }
      switching.current = true
      const w = window.innerWidth
      await animate(swipeX, -dir * w * 0.9, { duration: 0.26, ease: [0.32, 0.72, 0, 1] })
      window.scrollTo({ top: 0 })
      setDirection(dir)
      setIndex(next)
      swipeX.jump(dir * w * 0.55)
      await animate(swipeX, 0, motionTokens.system.page)
      switching.current = false
    },
    [places.length, safeIndex, reduced, swipeX, settle],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, [role="menu"], [role="dialog"], [data-hscroll]')) {
        return
      }
      if (e.key === 'ArrowRight') {
        goTo(safeIndex + 1)
      }
      if (e.key === 'ArrowLeft') {
        goTo(safeIndex - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, safeIndex])

  const canSwipe = places.length > 1
  const canPrev = safeIndex > 0
  const canNext = safeIndex < places.length - 1
  const release = useCallback(
    (offset: number, velocity: number) => {
      const w = window.innerWidth
      const dir =
        offset < -w * 0.2 || velocity < -450 ? 1 : offset > w * 0.2 || velocity > 450 ? -1 : 0
      if (dir === 0 || (dir === 1 && !canNext) || (dir === -1 && !canPrev)) {
        settle(velocity)
      } else {
        void goTo(safeIndex + dir, velocity)
      }
    },
    [canNext, canPrev, goTo, safeIndex, settle],
  )

  // finger or mouse drag: lock the direction in the first pixels; vertical stays with native scroll
  const drag = useRef<{
    x0: number
    y0: number
    lock: 'x' | 'y' | null
    samples: [number, number][]
  } | null>(null)
  const dragged = useRef(false)
  const onPointerDown = (e: React.PointerEvent) => {
    // you can only drag sideways when there is another city to go to
    if (!canSwipe || switching.current || e.button !== 0) {
      return
    }
    if ((e.target as HTMLElement).closest('[data-hscroll], input, a')) {
      return
    }
    drag.current = { x0: e.clientX, y0: e.clientY, lock: null, samples: [[e.clientX, e.timeStamp]] }
    dragged.current = false
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) {
      return
    }
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!d.lock) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        d.lock = 'x'
        dragged.current = true
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } else if (Math.abs(dy) > 8) {
        drag.current = null
        return
      } else {
        return
      }
    }
    // edges: elastic resistance
    const edge = (dx > 0 && !canPrev) || (dx < 0 && !canNext)
    swipeX.set(edge ? dx * 0.22 : dx)
    d.samples.push([e.clientX, e.timeStamp])
    if (d.samples.length > 6) {
      d.samples.shift()
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d || d.lock !== 'x') {
      return
    }
    const [x0, t0] = d.samples[0]
    const dt = Math.max(1, e.timeStamp - t0)
    release(e.clientX - d.x0, ((e.clientX - x0) / dt) * 1000)
  }
  // after a drag, the "click" the browser fires must not activate anything
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragged.current) {
      e.stopPropagation()
      e.preventDefault()
      dragged.current = false
    }
  }

  // trackpad: a horizontal two-finger gesture
  useEffect(() => {
    let idle = 0
    let lockedUntil = 0
    const onWheel = (e: WheelEvent) => {
      if (!canSwipe || Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) {
        return
      }
      if ((e.target as HTMLElement).closest('[data-hscroll], [role="dialog"]')) {
        return
      }
      e.preventDefault()
      if (switching.current || performance.now() < lockedUntil) {
        return
      }
      const w = window.innerWidth
      let x = swipeX.get() - e.deltaX
      // at the edges, elastic resistance
      if ((x > 0 && !canPrev) || (x < 0 && !canNext)) {
        x = swipeX.get() - e.deltaX * 0.25
      }
      swipeX.set(Math.max(-w * 0.6, Math.min(w * 0.6, x)))
      window.clearTimeout(idle)
      const commit = () => {
        const v = swipeX.get()
        const dir = v < -w * 0.14 ? 1 : v > w * 0.14 ? -1 : 0
        lockedUntil = performance.now() + 700 // ignore trackpad inertia
        release(dir === 0 ? 0 : -dir * w, 0)
      }
      if (Math.abs(swipeX.get()) > w * 0.32) {
        commit()
      } else {
        idle = window.setTimeout(commit, 220)
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.clearTimeout(idle)
    }
  }, [swipeX, canPrev, canNext, canSwipe, release])

  // --- location --------------------------------------------------------------
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    if (!notice) {
      return
    }
    const t = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(t)
  }, [notice])

  const applyHere = useCallback(
    (place: Place, select: boolean) => {
      setHere(place)
      writeHere(place)
      void refresh(place)
      if (select) {
        setIndex(0)
      }
    },
    [refresh],
  )

  // location button: searches again and goes to the user's city
  const locate = async () => {
    setLocating(true)
    try {
      const place = await locateUser()
      setDirection(-1)
      applyHere(place, true)
      window.scrollTo({ top: 0 })
    } catch {
      setNotice('Não consegui acessar sua localização.')
    } finally {
      setLocating(false)
    }
  }

  const [listOpen, setListOpen] = useState(false)
  // after it has been opened once, the list stays mounted (it closes with an animation)
  const [sheetUsed, setSheetUsed] = useState(false)
  if (listOpen && !sheetUsed) {
    setSheetUsed(true)
  }
  const anchorRef = useRef<HTMLDivElement>(null)
  const splashCharacterRef = useRef<HTMLDivElement>(null)
  const [travelerReady, setTravelerReady] = useState(false)
  const onTravelerReady = useCallback(() => setTravelerReady(true), [])
  const [searchFirst, setSearchFirst] = useState(false)

  const selectPlace = (p: Place) => {
    const i = places.findIndex((x) => x.id === p.id)
    if (i >= 0) {
      goTo(i)
    } else {
      // a newly added city goes to the end of the list
      setDirection(1)
      setIndex(places.length)
    }
  }

  const outlook = forecast ? precipitationOutlook(forecast) : null
  const staleError = !!forecast && entry?.status === 'error'

  return (
    <FirstRunContext.Provider value={firstRun}>
      <div className="campestre-header sticky top-0 z-[16]">{header}</div>
      <Environment theme={theme} onLightning={() => react('surprised', 650)} />

      <motion.main
        className="page"
        data-swipe={canSwipe || undefined}
        style={{ x: swipeX, opacity: pageOpacity }}
        onClickCapture={onClickCapture}
        onPointerCancel={onPointerUp}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <Hero
          anchorRef={anchorRef}
          data={heroData}
          direction={direction}
          error={noData}
          place={place}
          revealed={!splash}
          unit={unit}
          onRetry={() => void refresh(place)}
        />

        {staleError && (
          <motion.button
            animate={{ opacity: 1, y: 0 }}
            className="stale-banner glass"
            initial={{ opacity: 0, y: -6 }}
            transition={motionTokens.system.default}
            type="button"
            onClick={() => void refresh(place)}
          >
            Não consegui atualizar agora · <strong>Tentar novamente</strong>
          </motion.button>
        )}

        {/* mounted behind the intro (no cost during the flight); appears when it leaves */}
        <motion.div
          key={place.id + (forecast ? '' : '-empty')}
          animate={splash ? { opacity: 0, y: 28 } : { opacity: 1, y: 0 }}
          className="content"
          initial={false}
          transition={
            splash || reduced ? { duration: 0 } : { ...motionTokens.system.page, delay: 0.45 }
          }
        >
          {forecast ? (
            <>
              {/* on screen first: only the hero and the 10 days. the rest appears on scroll */}
              <DailyCard forecast={forecast} order={0} unit={unit} />
              {mountRest && (
                <>
                  <div className="content__stack">
                    {outlook && <PrecipitationCard order={1} outlook={outlook} />}
                    <HourlyCard forecast={forecast} order={2} unit={unit} />
                  </div>
                  <DetailGrid forecast={forecast} order={3} unit={unit} />
                </>
              )}
            </>
          ) : noData ? null : (
            <SkeletonCards />
          )}
        </motion.div>
      </motion.main>

      <FloatingNav
        index={safeIndex}
        listOpen={listOpen}
        locating={locating}
        places={places}
        settings={{
          unit,
          onUnitChange: setUnit,
          onRefresh: () => void refresh(place),
          debug,
          simulation,
          onSimulate: setSimulation,
        }}
        onLocate={locate}
        onOpenList={() => {
          setSearchFirst(false)
          setListOpen(true)
        }}
        onSearch={() => {
          setSearchFirst(true)
          setListOpen(true)
        }}
        onSelect={goTo}
      />

      {!splash && (
        <TravelingCliminha
          anchorRef={anchorRef}
          fromRef={splashCharacterRef}
          layoutKey={`${place.id}-${forecast ? 1 : 0}-${noData ? 1 : 0}`}
          moodOverride={moodOverride}
          phase={phase}
          state={climinha}
          swipeX={swipeX}
          onReady={onTravelerReady}
        />
      )}

      <Splash
        characterRef={splashCharacterRef}
        characterVisible={SHOW_SPLASH && (splash || !travelerReady)}
        visible={splash}
      />

      <AnimatePresence>
        {notice && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="toast glass"
            exit={{ opacity: 0, y: 4 }}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            role="status"
            transition={motionTokens.system.default}
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      {sheetUsed && (
        <Suspense fallback={null}>
          <CitiesSheet
            currentId={place.id}
            entries={entries}
            open={listOpen}
            places={places}
            searchFirst={searchFirst}
            unit={unit}
            onAdd={addPlace}
            onClose={() => setListOpen(false)}
            onRemove={(id) => {
              if (id === CLUB_PLACE.id) {
                return
              }
              if (id === HERE_ID) {
                setHere(null)
                writeHere(null)
              } else {
                removePlace(id)
              }
              setIndex(0)
            }}
            onSelect={selectPlace}
          />
        </Suspense>
      )}
    </FirstRunContext.Provider>
  )
}

export default App
