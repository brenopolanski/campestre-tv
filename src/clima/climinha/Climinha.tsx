import {
  motion,
  useAnimationControls,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Transition,
} from 'motion/react'
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { motionTokens } from '../theme/motion'
import { STATIC_BODY_PATH, eyeLeanOffset, fluidBodyPath } from './fluidBody'
import {
  NEUTRAL_STATE,
  drowsyEyes,
  eyesFor,
  type CliminhaState,
  type EyeShape,
  type Mood,
} from './states'
import './climinha.css'

/**
 * Climinha provisório em SVG + Motion.
 * A API (state, phase, look, onTap) é a mesma que o futuro componente Rive vai expor.
 */

// Silhueta: domo central alto, lóbulos laterais baixos, base larga levemente ondulada.
// Com movimento, o contorno é recalculado a cada quadro (fluidBody.ts).
const BODY_PATH = STATIC_BODY_PATH

/** quanto tempo ele olha para o céu antes de reagir ao clima (ms) */
const PERCEIVE_MS = 1300

const EYE_LEFT = { x: 114, y: 86 }
const EYE_RIGHT = { x: 158, y: 86 }
const LOOK_RANGE = { x: 8, y: 6 }

export type CliminhaPhase = 'scanning' | 'awake'

export interface CliminhaProps {
  state: CliminhaState
  /** largura CSS do personagem */
  size?: CSSProperties['width']
  /** scanning: olhos varrem o ambiente (carregando). awake: percebeu o usuário. */
  phase?: CliminhaPhase
  /** direção do olhar externa, -1…1 */
  lookX?: MotionValue<number>
  lookY?: MotionValue<number>
  /** flutuação, piscadas, gotas */
  ambient?: boolean
  /** humor temporário sobrepondo o do clima (reações) */
  moodOverride?: Mood
  /** -1…1: inércia lateral — o corpo "fica para trás" como gelatina */
  lean?: MotionValue<number>
  /** contorno ondulando a cada quadro (desligado no close-up da intro: caro em tamanho gigante) */
  fluid?: boolean
  /** chega neutro, olha para o céu e só então reage ao clima (e de novo a cada mudança) */
  perceive?: boolean
  /** transição dos olhos (ex.: piscadinha lenta e suave da intro) */
  eyeTransition?: Transition
  onTap?: () => void
  className?: string
  style?: CSSProperties
}

export function Climinha({
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
}: CliminhaProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const reduced = useReducedMotion() ?? false
  const live = ambient && !reduced

  // --- perceber o clima ------------------------------------------------------
  // mostra o estado anterior (ou neutro, na chegada) enquanto olha para o céu;
  // depois de um instante assume o clima novo — cor, humor e efeitos.
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

  // dormindo: o toque acorda. 10 s sem interação → sonolento (pisca devagar);
  // 20 s sem interação → volta a dormir.
  const [wake, setWake] = useState<'asleep' | 'awake' | 'drowsy'>('asleep')
  const wakeTimers = useRef<number[]>([])
  const clearWakeTimers = () => {
    wakeTimers.current.forEach((t) => window.clearTimeout(t))
    wakeTimers.current = []
  }
  useEffect(() => clearWakeTimers, [])
  // mudou o clima ou amanheceu: o ciclo recomeça do zero
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

  // sonolento: as pálpebras descem aos poucos ao longo dos 10 s
  const [drowse, setDrowse] = useState(0)
  useEffect(() => {
    if (wake !== 'drowsy') return
    setDrowse(0.1)
    const id = window.setInterval(() => setDrowse((d) => Math.min(0.86, d + 0.1)), 1100)
    return () => window.clearInterval(id)
  }, [wake])
  const drowsy = mood === 'sleepy' && wake === 'drowsy'
  // acabou de cair no sono: a transição para os olhos fechados também é lenta
  const [justSlept, setJustSlept] = useState(false)
  const [prevWake, setPrevWake] = useState(wake)
  if (prevWake !== wake) {
    setPrevWake(wake)
    setJustSlept(prevWake === 'drowsy' && wake === 'asleep')
  }
  const [leftEye, rightEye] = drowsy ? drowsyEyes(drowse) : eyesFor(mood)
  const slowEyes = drowsy || justSlept

  // --- olhar -------------------------------------------------------------
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

  // --- corpo: reações (notice, tap, mudança de clima) ---------------------
  const body = useAnimationControls()
  const prevPhase = useRef(phase)
  const prevMood = useRef(state.mood)

  // carregando: olhos varrem devagar de um lado para o outro
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

  // scanning → awake: "notice-user" — olha para o usuário, pulinho, pisca
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

  // percebendo: olha para cima e corre os olhos pelo céu
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

  // clima mudou: reação proporcional ao peso do novo clima
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

  // toque: reação no lugar — nada se desloca, só o corpo amassa e volta
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
      // acorda (um instante surpreso) e reinicia a contagem para voltar a dormir
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

  // --- piscar -------------------------------------------------------------
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    if (!live || phase === 'scanning') return
    let timer = 0
    if (drowsy) {
      // pálpebras pesadas: fecha devagar, demora a abrir
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
          // às vezes pisca duas vezes
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

  // --- corpo fluido ----------------------------------------------------------
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
    // ondulação lenta: ~30 fps bastam e economizam metade das repinturas (celulares)
    if (ms - lastFluid.current < 32) return
    lastFluid.current = ms
    const t = ms / 1000
    // balanço lento mesmo parado: nuvem nunca fica rígida
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
  } as CSSProperties

  const { amplitude, period } = state.float
  const floatTransition = { duration: period, repeat: Infinity, ease: 'easeInOut' as const }

  const content = (
    <svg viewBox="0 0 240 182" className="climinha__svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="climinha__stop" style={{ stopColor: 'var(--cl-light)' }} />
          <stop offset="0.55" className="climinha__stop" style={{ stopColor: 'var(--cl-mid)' }} />
          <stop offset="1" className="climinha__stop" style={{ stopColor: 'var(--cl-shade)' }} />
        </linearGradient>
        <radialGradient id={`${uid}-warm`} cx="0.3" cy="0.22" r="0.62">
          <stop
            offset="0"
            className="climinha__stop"
            style={{ stopColor: 'var(--cl-light)', stopOpacity: 0.95 }}
          />
          <stop
            offset="1"
            className="climinha__stop"
            style={{ stopColor: 'var(--cl-light)', stopOpacity: 0 }}
          />
        </radialGradient>
        <radialGradient id={`${uid}-cool`} cx="0.8" cy="0.95" r="0.6">
          <stop
            offset="0"
            className="climinha__stop"
            style={{ stopColor: 'var(--cl-shade)', stopOpacity: 0.7 }}
          />
          <stop
            offset="1"
            className="climinha__stop"
            style={{ stopColor: 'var(--cl-shade)', stopOpacity: 0 }}
          />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="climinha__stop" style={{ stopColor: 'var(--cl-rim)' }} />
          <stop
            offset="0.6"
            className="climinha__stop"
            style={{ stopColor: 'var(--cl-rim)', stopOpacity: 0 }}
          />
        </linearGradient>
        <radialGradient id={`${uid}-halo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" className="climinha__stop" style={{ stopColor: 'var(--cl-halo)' }} />
          <stop
            offset="1"
            className="climinha__stop"
            style={{ stopColor: 'var(--cl-halo)', stopOpacity: 0 }}
          />
        </radialGradient>
        <radialGradient id={`${uid}-contact`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" className="climinha__stop" style={{ stopColor: 'var(--cl-contact)' }} />
          <stop
            offset="1"
            className="climinha__stop"
            style={{ stopColor: 'var(--cl-contact)', stopOpacity: 0 }}
          />
        </radialGradient>
        <radialGradient id={`${uid}-drop`} cx="0.35" cy="0.6" r="0.7">
          <stop offset="0" stopColor="#f2f8ff" />
          <stop offset="1" stopColor="#8dbcf2" />
        </radialGradient>
        <radialGradient id={`${uid}-storm`} cx="0.5" cy="0.62" r="0.5">
          <stop offset="0" stopColor="#ffe27a" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#ffc93d" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffc93d" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <path ref={setBodyRef(0)} d={BODY_PATH} />
        </clipPath>
      </defs>

      {/* halo atmosférico: separa o corpo do céu sem outline */}
      <ellipse cx="120" cy="88" rx="120" ry="88" fill={`url(#${uid}-halo)`} />

      {/* sombra de contato — encolhe quando ele sobe */}
      <motion.ellipse
        cx="120"
        cy="166"
        rx="84"
        ry="8"
        fill={`url(#${uid}-contact)`}
        animate={
          live ? { scaleX: [1, 0.86, 1], opacity: [0.9, 0.6, 0.9] } : { scaleX: 1, opacity: 0.9 }
        }
        transition={live ? floatTransition : undefined}
      />

      <motion.g
        animate={live ? { y: [0, -amplitude, 0] } : { y: 0 }}
        transition={live ? floatTransition : undefined}
      >
        {/* tremor: medo do raio (de tempos em tempos), frio (às vezes), muito frio (sem parar, encolhido) */}
        <motion.g
          style={{ originX: '50%', originY: '100%' }}
          animate={{
            x: shiver ? shiver.x : 0,
            scaleY: live && state.temp === 'freezing' ? 0.95 : 1,
            scaleX: live && state.temp === 'freezing' ? 1.03 : 1,
          }}
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
                  cx="124"
                  cy="104"
                  rx="92"
                  ry="46"
                  fill={`url(#${uid}-storm)`}
                  initial={{ opacity: 0 }}
                  animate={
                    live ? { opacity: [0.25, 0.5, 0.3, 0.85, 0.3, 0.45, 0.25] } : { opacity: 0.35 }
                  }
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
                strokeWidth="3.5"
                strokeOpacity="0.8"
              />
            </g>

            <motion.g style={{ x: eyeShift }}>
              <Eye
                cx={EYE_LEFT.x}
                cy={EYE_LEFT.y}
                shape={leftEye}
                side="left"
                blink={blink}
                slow={slowEyes}
                transition={eyeTransition}
                x={eyeX}
                y={eyeY}
              />
              <Eye
                cx={EYE_RIGHT.x}
                cy={EYE_RIGHT.y}
                shape={rightEye}
                side="right"
                blink={blink}
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
        type="button"
        className={`${classes} climinha--interactive`}
        style={vars}
        onClick={handleTap}
        aria-label="Climinha"
      >
        {content}
      </button>
    )
  }
  return (
    <div className={classes} style={vars} role="img" aria-label="Climinha">
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
  /** piscada lenta de sono */
  slow?: boolean
  transition?: Transition
  x: MotionValue<number>
  y: MotionValue<number>
}

function Eye({ cx, cy, shape, side, blink, slow, transition, x, y }: EyeProps) {
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
  // sono: tudo devagar e contínuo; o resto usa a mola dos olhos
  const t = transition ?? (slow ? motionTokens.climinha.drowsy : motionTokens.climinha.eyes)

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <motion.g style={{ x, y }}>
        <motion.g initial={false} animate={{ y: shape.dy }} transition={t}>
          <clipPath id={`${id}-lid`}>
            <motion.path initial={false} animate={{ d: lidClip }} transition={t} />
          </clipPath>
          <motion.g
            initial={false}
            animate={{ scaleY: blink && !shape.arc ? 0.1 : 1 }}
            transition={slow ? motionTokens.climinha.drowsyBlink : motionTokens.climinha.blink}
          >
            <motion.ellipse
              cx="0"
              cy="0"
              fill="#000000"
              clipPath={`url(#${id}-lid)`}
              initial={false}
              animate={{ rx: shape.rx, ry: shape.ry, opacity: shape.arc && shape.lid <= 0 ? 0 : 1 }}
              transition={t}
            />
          </motion.g>
          <motion.path
            d={lidLine}
            stroke="#000000"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            initial={false}
            animate={{ d: lidLine, opacity: lidded && !shape.arc && !shape.noLine ? 1 : 0 }}
            transition={t}
          />
          {/* feliz: ∩ */}
          <motion.path
            d="M -9 5 C -9 -11 9 -11 9 5"
            stroke="#000000"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
            initial={false}
            animate={{
              opacity: shape.arc && !shape.closed ? 1 : 0,
              scaleY: shape.arc && !shape.closed ? 1 : 0.4,
            }}
            transition={shape.lid > 0 && shape.arc ? { ...t, delay: 0.12 } : t}
          />
          {/* dormindo: ‿ */}
          <motion.path
            d="M -9 -1 C -8 8 8 8 9 -1"
            stroke="#000000"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            initial={false}
            animate={{ opacity: shape.closed ? 1 : 0, scaleY: shape.closed ? 1 : 0.4 }}
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

/** Tempestade: raiozinhos estalando para fora do corpo, de tempos em tempos. */
function Zaps({ live }: { live: boolean }) {
  return (
    <g>
      {ZAPS.map((z, i) => (
        <g key={i} transform={`translate(${z.x} ${z.y}) rotate(${z.rotate}) scale(1.7)`}>
          <motion.path
            d={ZAP_PATH}
            fill="#ffd84f"
            stroke="#b9780a"
            strokeWidth="1"
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={
              live
                ? { opacity: [0, 1, 0.2, 1, 0], scale: [0.4, 1.1, 0.9, 1.05, 0.6] }
                : { opacity: 0.8, scale: 1 }
            }
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

/** Suor: gotinhas escorrendo pelos lados do corpo quando faz calor. */
function Sweat({ fill }: { fill: string }) {
  return (
    <g>
      {SWEAT_SLOTS.map((d, i) => (
        <motion.path
          key={i}
          d={DROP_PATH}
          fill={fill}
          style={{ x: d.x, y: d.y, scale: 0.8 }}
          initial={{ opacity: 0 }}
          animate={{ y: [d.y - 2, d.y + 3, d.y + 16], opacity: [0, 1, 0], scale: [0.4, 0.85, 0.7] }}
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

/** Gotas surgindo do próprio corpo — responsabilidade do personagem, não do ambiente. */
function Drops({ count, fill }: { count: number; fill: string }) {
  return (
    <g>
      {DROP_SLOTS.slice(0, count).map((d, i) => (
        <motion.path
          key={i}
          d={DROP_PATH}
          fill={fill}
          style={{ x: d.x, y: d.y }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ y: [d.y - 2, d.y + 4, d.y + 30], opacity: [0, 1, 0], scale: [0.3, 1, 0.85] }}
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
