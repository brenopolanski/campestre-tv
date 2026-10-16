import './climinha.css'

import type { MotionValue, Transition } from 'motion/react'
import {
  motion,
  useAnimationControls,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'

import { motionTokens } from '@/clima/theme/motion'

import { eyeLeanOffset, fluidBodyPath, STATIC_BODY_PATH } from './fluidBody'
import type { CliminhaState, EyeShape, Mood } from './states'
import { drowsyEyes, eyesFor, NEUTRAL_STATE } from './states'

/**
 * Provisional Climinha in SVG + Motion.
 * The API (state, phase, look, onTap) is the same one the future Rive component will expose.
 */

// Silhouette: a tall central dome, low side lobes, a wide slightly wavy base.
// While moving, the outline is recalculated every frame (fluidBody.ts).
const BODY_PATH = STATIC_BODY_PATH

/** how long he looks at the sky before reacting to the weather (ms) */
const PERCEIVE_MS = 1300

const EYE_LEFT = { x: 114, y: 86 }
const EYE_RIGHT = { x: 158, y: 86 }
const LOOK_RANGE = { x: 8, y: 6 }

export type CliminhaPhase = 'scanning' | 'awake'

export interface CliminhaProps {
  state: CliminhaState
  /** CSS width of the character */
  size?: React.CSSProperties['width']
  /** scanning: eyes sweep the environment (loading). awake: he noticed the user. */
  phase?: CliminhaPhase
  /** external look direction, -1…1 */
  lookX?: MotionValue<number>
  lookY?: MotionValue<number>
  /** float, blinks, drops */
  ambient?: boolean
  /** temporary mood on top of the weather's (reactions) */
  moodOverride?: Mood
  /** -1…1: sideways inertia — the body "lags behind" like jelly */
  lean?: MotionValue<number>
  /** outline waving every frame (off in the intro close-up: expensive at huge size) */
  fluid?: boolean
  /** arrives neutral, looks at the sky, and only then reacts to the weather (and again on every change) */
  perceive?: boolean
  /** eye transition (e.g. the intro's slow, soft wink) */
  eyeTransition?: Transition
  onTap?: () => void
  className?: string
  style?: React.CSSProperties
}

export const Climinha = ({
  state: target,
  size = 120,
  phase = 'awake',
  lookX,
  lookY,
  ambient = true,
  moodOverride,
  lean,
  fluid = true,
  perceive = false,
  eyeTransition,
  onTap,
  className,
  style,
}: CliminhaProps) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const reduced = useReducedMotion() ?? false
  const live = ambient && !reduced

  // --- noticing the weather ---------------------------------------------------
  // shows the previous state (or neutral, on arrival) while he looks at the sky;
  // after a moment he takes on the new weather — color, mood, and effects.
  const keyOf = (c: CliminhaState) => `${c.mood}|${c.body.light}|${c.temp ?? ''}`
  const [shown, setShown] = useState<CliminhaState>(() =>
    perceive && !reduced ? NEUTRAL_STATE : target,
  )
  const perceiving = perceive && !reduced && keyOf(shown) !== keyOf(target)
  const state = perceiving ? shown : target
  useEffect(() => {
    if (!perceiving) return
    const t = window.setTimeout(() => setShown(target), PERCEIVE_MS)
    return () => window.clearTimeout(t)
  }, [perceiving, target])

  const [reaction, setReaction] = useState<Mood | null>(null)

  // sleeping: a tap wakes him. 10 s with no interaction → sleepy (blinks slowly);
  // 20 s with no interaction → he goes back to sleep.
  const [wake, setWake] = useState<'asleep' | 'awake' | 'drowsy'>('asleep')
  const wakeTimers = useRef<number[]>([])
  const clearWakeTimers = () => {
    wakeTimers.current.forEach((t) => window.clearTimeout(t))
    wakeTimers.current = []
  }
  useEffect(() => clearWakeTimers, [])
  // the weather changed or day broke: the cycle starts over from zero
  const [sleepKey, setSleepKey] = useState(state.mood)
  if (sleepKey !== state.mood) {
    setSleepKey(state.mood)
    setWake('asleep')
  }
  const sleepingMood: Mood | null =
    state.mood !== 'sleeping'
      ? null
      : wake === 'awake'
        ? 'neutral'
        : wake === 'drowsy'
          ? 'sleepy'
          : null

  const mood =
    reaction ?? moodOverride ?? (perceiving ? 'neutral' : null) ?? sleepingMood ?? state.mood

  // sleepy: the eyelids lower gradually over the 10 s
  const [drowse, setDrowse] = useState(0)
  useEffect(() => {
    if (wake !== 'drowsy') return
    setDrowse(0.1)
    const id = window.setInterval(() => setDrowse((d) => Math.min(0.86, d + 0.1)), 1100)
    return () => window.clearInterval(id)
  }, [wake])
  const drowsy = mood === 'sleepy' && wake === 'drowsy'
  // just fell asleep: the transition to closed eyes is slow too
  const [justSlept, setJustSlept] = useState(false)
  const [prevWake, setPrevWake] = useState(wake)
  if (prevWake !== wake) {
    setPrevWake(wake)
    setJustSlept(prevWake === 'drowsy' && wake === 'asleep')
  }
  const [leftEye, rightEye] = drowsy ? drowsyEyes(drowse) : eyesFor(mood)
  const slowEyes = drowsy || justSlept

  // --- look -------------------------------------------------------------------
  const fallbackX = useMotionValue(0)
  const fallbackY = useMotionValue(0)
  const extX = lookX ?? fallbackX
  const extY = lookY ?? fallbackY
  const innerX = useMotionValue(0)
  const innerY = useMotionValue(0)
  const sumX = useTransform(() => clamp(innerX.get() + extX.get(), -1, 1) * LOOK_RANGE.x)
  const sumY = useTransform(() => clamp(innerY.get() + extY.get(), -1, 1) * LOOK_RANGE.y)
  const eyeX = useSpring(sumX, motionTokens.climinha.eyes)
  const eyeY = useSpring(sumY, motionTokens.climinha.eyes)

  // --- body: reactions (notice, tap, weather change) --------------------------
  const body = useAnimationControls()
  const prevPhase = useRef(phase)
  const prevMood = useRef(state.mood)

  // loading: eyes sweep slowly from one side to the other
  useEffect(() => {
    if (phase !== 'scanning') return
    if (reduced) {
      innerX.set(-0.5)
      return
    }
    let side = -1
    innerX.set(side * 0.85)
    innerY.set(0.15)
    const id = window.setInterval(() => {
      side *= -1
      innerX.set(side * 0.85)
    }, 1400)
    return () => window.clearInterval(id)
  }, [phase, reduced, innerX, innerY])

  // scanning → awake: "notice-user" — looks at the user, a little hop, a blink
  useEffect(() => {
    const was = prevPhase.current
    prevPhase.current = phase
    if (phase !== 'awake') return
    innerX.set(0)
    innerY.set(0)
    if (reduced || was === 'awake') return
    void body.start({
      y: [0, -9, 0, 0],
      scaleX: [1, 0.95, 1.06, 1],
      scaleY: [1, 1.07, 0.92, 1],
      transition: { duration: 0.75, times: [0, 0.35, 0.7, 1], ease: 'easeOut' },
    })
    setReaction('surprised')
    const t = window.setTimeout(() => setReaction(null), 520)
    return () => window.clearTimeout(t)
  }, [phase, reduced, body, innerX, innerY])

  // noticing: looks up and runs his eyes across the sky
  useEffect(() => {
    if (!perceiving) return
    innerY.set(-0.9)
    innerX.set(-0.45)
    const t1 = window.setTimeout(() => innerX.set(0.45), PERCEIVE_MS * 0.4)
    const t2 = window.setTimeout(() => {
      innerX.set(0)
      innerY.set(0)
    }, PERCEIVE_MS * 0.85)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      innerX.set(0)
      innerY.set(0)
    }
  }, [perceiving, innerX, innerY])

  // weather changed: a reaction proportional to the weight of the new weather
  useEffect(() => {
    if (prevMood.current === state.mood) return
    prevMood.current = state.mood
    if (reduced) return
    if (state.heavy) {
      void body.start({
        y: [0, 5, 0],
        scaleX: [1, 1.07, 1],
        scaleY: [1, 0.9, 1],
        transition: { duration: 0.9, ease: [0.3, 0, 0.2, 1] },
      })
    } else {
      void body.start({
        y: [0, -10, 0],
        scaleX: [1, 0.96, 1.04, 1],
        scaleY: [1, 1.05, 0.95, 1],
        transition: { duration: 0.7, ease: 'easeOut' },
      })
    }
  }, [state.mood, state.heavy, reduced, body])

  // tap: a reaction in place — nothing moves, only the body squashes and returns
  function handleTap() {
    onTap?.()
    if (!reduced) {
      void body.start({
        scaleX: [1, 1.08, 0.97, 1],
        scaleY: [1, 0.9, 1.04, 1],
        transition: { duration: 0.5, times: [0, 0.3, 0.65, 1], ease: 'easeOut' },
      })
    }
    if (state.mood === 'sleeping') {
      // wakes (surprised for a moment) and restarts the countdown back to sleep
      if (wake === 'asleep') setReaction('surprised')
      setWake('awake')
      clearWakeTimers()
      wakeTimers.current.push(
        window.setTimeout(() => setWake('drowsy'), 10_000),
        window.setTimeout(() => setWake('asleep'), 20_000),
      )
      window.setTimeout(() => setReaction(null), 700)
      return
    }
    setReaction('happy')
    window.setTimeout(() => setReaction(null), 1000)
  }

  // --- blink ------------------------------------------------------------------
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    if (!live || phase === 'scanning') return
    let timer = 0
    if (drowsy) {
      // heavy eyelids: closes slowly, takes a while to open
      const heavy = () => {
        timer = window.setTimeout(
          () => {
            setBlink(true)
            window.setTimeout(() => setBlink(false), 900 + Math.random() * 600)
            heavy()
          },
          1800 + Math.random() * 1400,
        )
      }
      heavy()
      return () => window.clearTimeout(timer)
    }
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setBlink(true)
          window.setTimeout(() => setBlink(false), 110)
          // sometimes blinks twice
          if (Math.random() < 0.22) {
            window.setTimeout(() => setBlink(true), 240)
            window.setTimeout(() => setBlink(false), 350)
          }
          schedule()
        },
        2600 + Math.random() * 3600,
      )
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [live, phase, drowsy])

  // --- fluid body -------------------------------------------------------------
  const bodyRefs = useRef<(SVGPathElement | null)[]>([])
  const setBodyRef = (i: number) => (el: SVGPathElement | null) => {
    bodyRefs.current[i] = el
  }
  const fallbackLean = useMotionValue(0)
  const leanSource = lean ?? fallbackLean
  const idleLean = useMotionValue(0)
  const totalLean = useTransform(() => leanSource.get() + idleLean.get())
  const eyeShift = useTransform(totalLean, eyeLeanOffset)
  const waveAmp = state.heavy ? 1.3 : 2.1
  const lastFluid = useRef(0)
  useAnimationFrame((ms) => {
    if (!live || !fluid) return
    // slow wave: ~30 fps is enough and saves half the repaints (phones)
    if (ms - lastFluid.current < 32) return
    lastFluid.current = ms
    const t = ms / 1000
    // a slow sway even when still: a cloud is never rigid
    idleLean.set(Math.sin(t * 0.55) * 0.12)
    const d = fluidBodyPath(t, waveAmp, totalLean.get())
    for (const el of bodyRefs.current) el?.setAttribute('d', d)
  })

  const shiver = !live
    ? null
    : mood === 'scared'
      ? { x: [0, -1.2, 1.2, -1, 1, 0], duration: 0.45, repeatDelay: 1.6 }
      : state.temp === 'freezing'
        ? { x: [0, -1.5, 1.5, -1.3, 1.3, -1.1, 1.1, 0], duration: 0.5, repeatDelay: 0.12 }
        : state.temp === 'cold'
          ? { x: [0, -0.9, 0.9, -0.7, 0.7, 0], duration: 0.42, repeatDelay: 1.9 }
          : null

  const vars = {
    '--cl-light': state.body.light,
    '--cl-mid': state.body.mid,
    '--cl-shade': state.body.shade,
    '--cl-rim': state.body.rim,
    '--cl-halo': state.body.halo,
    '--cl-contact': state.body.contactShadow,
    width: size,
    ...style,
  } as React.CSSProperties

  const { amplitude, period } = state.float
  const floatTransition = { duration: period, repeat: Infinity, ease: 'easeInOut' as const }

  const content = (
    <svg className="climinha__svg" focusable="false" viewBox="0 0 240 182" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" x2="0" y1="0" y2="1">
          <stop className="climinha__stop" offset="0" style={{ stopColor: 'var(--cl-light)' }} />
          <stop className="climinha__stop" offset="0.55" style={{ stopColor: 'var(--cl-mid)' }} />
          <stop className="climinha__stop" offset="1" style={{ stopColor: 'var(--cl-shade)' }} />
        </linearGradient>
        <radialGradient cx="0.3" cy="0.22" id={`${uid}-warm`} r="0.62">
          <stop
            className="climinha__stop"
            offset="0"
            style={{ stopColor: 'var(--cl-light)', stopOpacity: 0.95 }}
          />
          <stop
            className="climinha__stop"
            offset="1"
            style={{ stopColor: 'var(--cl-light)', stopOpacity: 0 }}
          />
        </radialGradient>
        <radialGradient cx="0.8" cy="0.95" id={`${uid}-cool`} r="0.6">
          <stop
            className="climinha__stop"
            offset="0"
            style={{ stopColor: 'var(--cl-shade)', stopOpacity: 0.7 }}
          />
          <stop
            className="climinha__stop"
            offset="1"
            style={{ stopColor: 'var(--cl-shade)', stopOpacity: 0 }}
          />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1="0" x2="0" y1="0" y2="1">
          <stop className="climinha__stop" offset="0" style={{ stopColor: 'var(--cl-rim)' }} />
          <stop
            className="climinha__stop"
            offset="0.6"
            style={{ stopColor: 'var(--cl-rim)', stopOpacity: 0 }}
          />
        </linearGradient>
        <radialGradient cx="0.5" cy="0.5" id={`${uid}-halo`} r="0.5">
          <stop className="climinha__stop" offset="0" style={{ stopColor: 'var(--cl-halo)' }} />
          <stop
            className="climinha__stop"
            offset="1"
            style={{ stopColor: 'var(--cl-halo)', stopOpacity: 0 }}
          />
        </radialGradient>
        <radialGradient cx="0.5" cy="0.5" id={`${uid}-contact`} r="0.5">
          <stop className="climinha__stop" offset="0" style={{ stopColor: 'var(--cl-contact)' }} />
          <stop
            className="climinha__stop"
            offset="1"
            style={{ stopColor: 'var(--cl-contact)', stopOpacity: 0 }}
          />
        </radialGradient>
        <radialGradient cx="0.35" cy="0.6" id={`${uid}-drop`} r="0.7">
          <stop offset="0" stopColor="#f2f8ff" />
          <stop offset="1" stopColor="#8dbcf2" />
        </radialGradient>
        <radialGradient cx="0.5" cy="0.62" id={`${uid}-storm`} r="0.5">
          <stop offset="0" stopColor="#ffe27a" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#ffc93d" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffc93d" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <path ref={setBodyRef(0)} d={BODY_PATH} />
        </clipPath>
      </defs>

      {/* atmospheric halo: separates the body from the sky without an outline */}
      <ellipse cx="120" cy="88" fill={`url(#${uid}-halo)`} rx="120" ry="88" />

      {/* contact shadow — shrinks when he rises */}
      <motion.ellipse
        animate={
          live ? { scaleX: [1, 0.86, 1], opacity: [0.9, 0.6, 0.9] } : { scaleX: 1, opacity: 0.9 }
        }
        cx="120"
        cy="166"
        fill={`url(#${uid}-contact)`}
        rx="84"
        ry="8"
        transition={live ? floatTransition : undefined}
      />

      <motion.g
        animate={live ? { y: [0, -amplitude, 0] } : { y: 0 }}
        transition={live ? floatTransition : undefined}
      >
        {/* shiver: fear of lightning (now and then), cold (sometimes), very cold (nonstop, hunched) */}
        <motion.g
          animate={{
            x: shiver ? shiver.x : 0,
            scaleY: live && state.temp === 'freezing' ? 0.95 : 1,
            scaleX: live && state.temp === 'freezing' ? 1.03 : 1,
          }}
          style={{ originX: '50%', originY: '100%' }}
          transition={{
            x: shiver
              ? { duration: shiver.duration, repeat: Infinity, repeatDelay: shiver.repeatDelay }
              : { duration: 0.2 },
            scaleY: motionTokens.climinha.soft,
            scaleX: motionTokens.climinha.soft,
          }}
        >
          <motion.g animate={body} style={{ originX: '50%', originY: '100%' }}>
            <path ref={setBodyRef(1)} d={BODY_PATH} fill={`url(#${uid}-body)`} />
            <path ref={setBodyRef(2)} d={BODY_PATH} fill={`url(#${uid}-warm)`} />
            <path ref={setBodyRef(3)} d={BODY_PATH} fill={`url(#${uid}-cool)`} />
            {state.storm && (
              <g clipPath={`url(#${uid}-clip)`}>
                <motion.ellipse
                  animate={
                    live ? { opacity: [0.25, 0.5, 0.3, 0.85, 0.3, 0.45, 0.25] } : { opacity: 0.35 }
                  }
                  cx="124"
                  cy="104"
                  fill={`url(#${uid}-storm)`}
                  initial={{ opacity: 0 }}
                  rx="92"
                  ry="46"
                  transition={
                    live
                      ? {
                          duration: 3.2,
                          times: [0, 0.25, 0.4, 0.46, 0.55, 0.8, 1],
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }
                      : undefined
                  }
                />
              </g>
            )}
            <g clipPath={`url(#${uid}-clip)`}>
              <path
                ref={setBodyRef(4)}
                d={BODY_PATH}
                fill="none"
                stroke={`url(#${uid}-rim)`}
                strokeOpacity="0.8"
                strokeWidth="3.5"
              />
            </g>

            <motion.g style={{ x: eyeShift }}>
              <Eye
                blink={blink}
                cx={EYE_LEFT.x}
                cy={EYE_LEFT.y}
                shape={leftEye}
                side="left"
                slow={slowEyes}
                transition={eyeTransition}
                x={eyeX}
                y={eyeY}
              />
              <Eye
                blink={blink}
                cx={EYE_RIGHT.x}
                cy={EYE_RIGHT.y}
                shape={rightEye}
                side="right"
                slow={slowEyes}
                transition={eyeTransition}
                x={eyeX}
                y={eyeY}
              />
            </motion.g>
            {live && state.temp === 'hot' && <Sweat fill={`url(#${uid}-drop)`} />}
          </motion.g>
        </motion.g>

        {state.storm && <Zaps live={live} />}
        {live && state.drops > 0 && (
          <Drops count={state.drops === 2 ? 5 : 3} fill={`url(#${uid}-drop)`} />
        )}
      </motion.g>
    </svg>
  )

  const classes = ['climinha', className].filter(Boolean).join(' ')

  if (onTap) {
    return (
      <button
        aria-label="Climinha"
        className={`${classes} climinha--interactive`}
        style={vars}
        type="button"
        onClick={handleTap}
      >
        {content}
      </button>
    )
  }
  return (
    <div aria-label="Climinha" className={classes} role="img" style={vars}>
      {content}
    </div>
  )
}

interface EyeProps {
  cx: number
  cy: number
  shape: EyeShape
  side: 'left' | 'right'
  blink: boolean
  /** slow sleepy blink */
  slow?: boolean
  transition?: Transition
  x: MotionValue<number>
  y: MotionValue<number>
}

const Eye = ({ cx, cy, shape, side, blink, slow, transition, x, y }: EyeProps) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const inward = side === 'left' ? 1 : -1
  const half = shape.rx + 4.5
  const yLeft = shape.lid - (inward * shape.lidTilt) / 2
  const yRight = shape.lid + (inward * shape.lidTilt) / 2
  const lidded = shape.lid > -shape.ry
  const curve = shape.curve ?? 0
  const mid = (yLeft + yRight) / 2 + curve * 2
  const lidClip = `M ${-half - 2} ${yLeft} Q 0 ${mid} ${half + 2} ${yRight} L ${half + 2} 40 L ${-half - 2} 40 Z`
  const lidLine = `M ${-half} ${yLeft} Q 0 ${mid} ${half} ${yRight}`
  // sleep: everything slow and continuous; the rest uses the eye spring
  const t = transition ?? (slow ? motionTokens.climinha.drowsy : motionTokens.climinha.eyes)

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <motion.g style={{ x, y }}>
        <motion.g animate={{ y: shape.dy }} initial={false} transition={t}>
          <clipPath id={`${id}-lid`}>
            <motion.path animate={{ d: lidClip }} initial={false} transition={t} />
          </clipPath>
          <motion.g
            animate={{ scaleY: blink && !shape.arc ? 0.1 : 1 }}
            initial={false}
            transition={slow ? motionTokens.climinha.drowsyBlink : motionTokens.climinha.blink}
          >
            <motion.ellipse
              animate={{ rx: shape.rx, ry: shape.ry, opacity: shape.arc && shape.lid <= 0 ? 0 : 1 }}
              clipPath={`url(#${id}-lid)`}
              cx="0"
              cy="0"
              fill="#000000"
              initial={false}
              transition={t}
            />
          </motion.g>
          <motion.path
            animate={{ d: lidLine, opacity: lidded && !shape.arc && !shape.noLine ? 1 : 0 }}
            d={lidLine}
            fill="none"
            initial={false}
            stroke="#000000"
            strokeLinecap="round"
            strokeWidth="2.4"
            transition={t}
          />
          {/* happy: ∩ */}
          <motion.path
            animate={{
              opacity: shape.arc && !shape.closed ? 1 : 0,
              scaleY: shape.arc && !shape.closed ? 1 : 0.4,
            }}
            d="M -9 5 C -9 -11 9 -11 9 5"
            fill="none"
            initial={false}
            stroke="#000000"
            strokeLinecap="round"
            strokeWidth="5.5"
            transition={shape.lid > 0 && shape.arc ? { ...t, delay: 0.12 } : t}
          />
          {/* sleeping: ‿ */}
          <motion.path
            animate={{ opacity: shape.closed ? 1 : 0, scaleY: shape.closed ? 1 : 0.4 }}
            d="M -9 -1 C -8 8 8 8 9 -1"
            fill="none"
            initial={false}
            stroke="#000000"
            strokeLinecap="round"
            strokeWidth="4.5"
            transition={t}
          />
        </motion.g>
      </motion.g>
    </g>
  )
}

const DROP_PATH = 'M 0 -6 C 2.4 -2.4 4 0 4 2.4 A 4 4 0 0 1 -4 2.4 C -4 0 -2.4 -2.4 0 -6 Z'
const DROP_SLOTS = [
  { x: 82, y: 140, delay: 0 },
  { x: 168, y: 140, delay: 0.7 },
  { x: 126, y: 144, delay: 1.3 },
  { x: 102, y: 143, delay: 1.9 },
  { x: 190, y: 136, delay: 2.4 },
]

const ZAP_PATH = 'M 0 0 L 5 -7 L 2 -7 L 6 -14 L -1 -5 L 2 -5 Z'
const ZAPS = [
  { x: 34, y: 76, rotate: -38, delay: 0.3 },
  { x: 206, y: 70, rotate: 32, delay: 1.4 },
  { x: 132, y: 18, rotate: 4, delay: 2.3 },
  { x: 222, y: 118, rotate: 78, delay: 3.1 },
]

/** Storm: little bolts cracking out of the body, from time to time. */
interface ZapsProps {
  live: boolean
}

const Zaps = ({ live }: ZapsProps) => {
  return (
    <g>
      {ZAPS.map((z, i) => (
        <g key={i} transform={`translate(${z.x} ${z.y}) rotate(${z.rotate}) scale(1.7)`}>
          <motion.path
            animate={
              live
                ? { opacity: [0, 1, 0.2, 1, 0], scale: [0.4, 1.1, 0.9, 1.05, 0.6] }
                : { opacity: 0.8, scale: 1 }
            }
            d={ZAP_PATH}
            fill="#ffd84f"
            initial={{ opacity: 0, scale: 0.4 }}
            stroke="#b9780a"
            strokeLinejoin="round"
            strokeWidth="1"
            transition={
              live
                ? {
                    duration: 0.55,
                    times: [0, 0.2, 0.4, 0.6, 1],
                    repeat: Infinity,
                    repeatDelay: 3.4,
                    delay: z.delay,
                  }
                : undefined
            }
          />
        </g>
      ))}
    </g>
  )
}

const SWEAT_SLOTS = [
  { x: 60, y: 66, delay: 0.2 },
  { x: 188, y: 70, delay: 1.1 },
  { x: 96, y: 40, delay: 1.9 },
]

/** Sweat: little drops running down the sides of the body when it is hot. */
interface SweatProps {
  fill: string
}

const Sweat = ({ fill }: SweatProps) => {
  return (
    <g>
      {SWEAT_SLOTS.map((d, i) => (
        <motion.path
          key={i}
          animate={{ y: [d.y - 2, d.y + 3, d.y + 16], opacity: [0, 1, 0], scale: [0.4, 0.85, 0.7] }}
          d={DROP_PATH}
          fill={fill}
          initial={{ opacity: 0 }}
          style={{ x: d.x, y: d.y, scale: 0.8 }}
          transition={{
            duration: 1.6,
            times: [0, 0.3, 1],
            ease: 'easeIn',
            repeat: Infinity,
            repeatDelay: 1.4,
            delay: d.delay,
          }}
        />
      ))}
    </g>
  )
}

/** Drops coming out of the body itself — the character's job, not the environment's. */
interface DropsProps {
  count: number
  fill: string
}

const Drops = ({ count, fill }: DropsProps) => {
  return (
    <g>
      {DROP_SLOTS.slice(0, count).map((d, i) => (
        <motion.path
          key={i}
          animate={{ y: [d.y - 2, d.y + 4, d.y + 30], opacity: [0, 1, 0], scale: [0.3, 1, 0.85] }}
          d={DROP_PATH}
          fill={fill}
          initial={{ opacity: 0, scale: 0.3 }}
          style={{ x: d.x, y: d.y }}
          transition={{
            duration: 1.3,
            times: [0, 0.35, 1],
            ease: 'easeIn',
            repeat: Infinity,
            repeatDelay: count > 3 ? 1.2 : 2.2,
            delay: d.delay,
          }}
        />
      ))}
    </g>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
