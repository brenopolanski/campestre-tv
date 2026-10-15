import './environment.css'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { memo, useEffect, useRef } from 'react'
import { motionTokens } from '../theme/motion'
import type { WeatherTheme } from '../theme/weatherThemes'
import { RainCanvas } from './RainCanvas'

/**
 * Edge-to-edge weather environment, behind everything.
 * Layers: sky → sun/moon/stars → far/mid/near clouds → fog → rain → lightning.
 * Sky colors interpolate via @property; the rest fades in and out by opacity.
 */

interface CloudSpec {
  top: number // vh
  width: number // vw
  delay: number // fraction of the crossing
  scale: number
}

// deterministic positions: no Math.random during render
// a few large clouds per layer: each one is a GPU layer stacked on the sky,
// and on a phone the cost grows with the overlap (8 in total)
const FAR: CloudSpec[] = [
  { top: 6, width: 62, delay: 0.1, scale: 1 },
  { top: 30, width: 70, delay: 0.6, scale: 1.1 },
  { top: 16, width: 50, delay: 0.35, scale: 0.85 },
]
const MID: CloudSpec[] = [
  { top: 4, width: 78, delay: 0.2, scale: 1 },
  { top: 46, width: 84, delay: 0.7, scale: 1.1 },
  { top: 24, width: 60, delay: 0.45, scale: 0.9 },
]
const NEAR: CloudSpec[] = [
  { top: -6, width: 96, delay: 0.05, scale: 1.1 },
  { top: 58, width: 100, delay: 0.55, scale: 1 },
]

const STARS = Array.from({ length: 70 }, (_, i) => {
  // stable pseudo-random
  const r = (n: number) => {
    const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453
    return x - Math.floor(x)
  }
  return {
    left: r(1) * 100,
    top: r(2) * 62,
    size: r(3) < 0.85 ? 1.5 : 2.5,
    opacity: 0.35 + r(4) * 0.6,
    twinkle: r(5) < 0.18,
    delay: r(6) * 6,
  }
})

interface Props {
  theme: WeatherTheme
  onLightning?: () => void
}

export const Environment = memo(function Environment({ theme, onLightning }: Props) {
  const reduced = useReducedMotion() ?? false
  const a = theme.atmosphere
  const { scrollY } = useScroll()
  const farY = useTransform(scrollY, (v) => v * -0.025)
  const midY = useTransform(scrollY, (v) => v * -0.05)
  const nearY = useTransform(scrollY, (v) => v * -0.09)
  const sunY = useTransform(scrollY, (v) => v * -0.06)

  // how many clouds in each layer stay visible
  const farCount = Math.round(a.clouds * FAR.length)
  const midCount = Math.round(Math.max(0, a.clouds - 0.25) * 1.34 * MID.length)
  const nearCount = Math.round(Math.max(0, a.clouds - 0.55) * 2.2 * NEAR.length)

  const sunOpacity = a.sun === 'disc' ? 1 : a.sun === 'glow' ? 0.5 : 0
  const fade = motionTokens.weather.transition

  const style = {
    '--cloud-color': a.cloudColor,
    '--cloud-shade': a.cloudShade,
    '--horizon-glow': theme.horizonGlow,
    '--cloud-seconds': `${motionTokens.weather.ambientCloudSeconds}s`,
  } as React.CSSProperties

  return (
    <div className="env" style={style} aria-hidden="true" data-reduced={reduced || undefined}>
      <div
        className="env__sky"
        style={
          {
            '--sky-top': theme.skyTop,
            '--sky-mid': theme.skyMid,
            '--sky-bottom': theme.skyBottom,
          } as React.CSSProperties
        }
      />
      <div className="env__horizon" />

      {/* sun: a soft disc off center, partly hidden by the clouds */}
      <motion.div
        className="env__sun"
        style={{ y: sunY }}
        initial={false}
        animate={layer(sunOpacity)}
        transition={fade}
      >
        <div className="env__sun-glow" />
        <motion.div
          className="env__sun-disc"
          initial={false}
          animate={{ opacity: a.sun === 'disc' ? 1 : 0, scale: a.sun === 'disc' ? 1 : 0.8 }}
          transition={fade}
        />
      </motion.div>

      <motion.div
        className="env__night"
        initial={false}
        animate={layer(a.stars ? 1 : 0)}
        transition={fade}
      >
        {STARS.map((s, i) => (
          <span
            key={i}
            className={s.twinkle ? 'env__star env__star--twinkle' : 'env__star'}
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
        <motion.div
          className="env__moon"
          style={{ y: sunY }}
          initial={false}
          animate={{ opacity: a.moon ? 1 : 0 }}
          transition={fade}
        />
      </motion.div>

      <CloudLayer specs={FAR} visible={farCount} depth="far" y={farY} />
      <CloudLayer specs={MID} visible={midCount} depth="mid" y={midY} />

      <motion.div
        className="env__fog"
        initial={false}
        animate={layer(a.fog ? 1 : 0)}
        transition={fade}
      >
        <div className="env__fog-band env__fog-band--1" />
        <div className="env__fog-band env__fog-band--2" />
        <div className="env__fog-band env__fog-band--3" />
      </motion.div>

      <RainCanvas intensity={a.rain} reduced={reduced} />

      <CloudLayer specs={NEAR} visible={nearCount} depth="near" y={nearY} />

      {/* dynamic contrast: the sky itself darkens slightly behind the hero */}
      <div className="env__scrim" />

      {/* paper grain over the sky: static, gives a printed-illustration texture */}
      <div className="env__grain" />

      {a.lightning && !reduced && <Lightning active onFlash={onLightning} />}
    </div>
  )
})

/**
 * Opacity of a sky layer. At zero it becomes `visibility: hidden`:
 * the browser stops compositing the layer (and its animations) until it returns.
 */
function layer(opacity: number) {
  return opacity > 0
    ? { opacity, visibility: 'visible' as const }
    : { opacity: 0, transitionEnd: { visibility: 'hidden' as const } }
}

function CloudLayer({
  specs,
  visible,
  depth,
  y,
}: {
  specs: CloudSpec[]
  visible: number
  depth: 'far' | 'mid' | 'near'
  y: MotionValue<number>
}) {
  return (
    <motion.div className={`env__clouds env__clouds--${depth}`} style={{ y }}>
      {specs.map((c, i) => (
        <div
          key={i}
          className="env__cloud-track"
          style={
            {
              top: `${c.top}vh`,
              '--w': `max(${c.width}vw, ${Math.round(c.width * 5.2)}px)`,
              '--delay': c.delay,
              opacity: i < visible ? 1 : 0,
              // outside the current sky: stop animating and leave the composite after it fades
              ...(i < visible ? null : { visibility: 'hidden', animationPlayState: 'paused' }),
            } as React.CSSProperties
          }
        >
          <div className="env__cloud" style={{ transform: `scale(${c.scale})` }} />
        </div>
      ))}
    </motion.div>
  )
}

/** A short atmospheric light — not a full-screen white flash. */
function Lightning({ active, onFlash }: { active: boolean; onFlash?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const flashRef = useRef(onFlash)
  useEffect(() => {
    flashRef.current = onFlash
  }, [onFlash])

  useEffect(() => {
    if (!active) return
    let timer = 0
    const schedule = (first: boolean) => {
      timer = window.setTimeout(
        () => {
          const el = ref.current
          if (el && !document.hidden) {
            el.style.setProperty('--flash-x', `${15 + Math.random() * 70}%`)
            el.animate(
              [
                { opacity: 0 },
                { opacity: 0.55, offset: 0.08 },
                { opacity: 0.12, offset: 0.22 },
                { opacity: 0.38, offset: 0.34 },
                { opacity: 0 },
              ],
              { duration: 620, easing: 'ease-out' },
            )
            flashRef.current?.()
          }
          schedule(false)
        },
        first ? 2600 : 9000 + Math.random() * 11000,
      )
    }
    schedule(true)
    return () => window.clearTimeout(timer)
  }, [active])

  return <div ref={ref} className="env__lightning" />
}
