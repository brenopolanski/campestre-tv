import type { MotionValue } from 'motion/react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import type { CliminhaPhase } from '@/clima/climinha/Climinha'
import { Climinha } from '@/clima/climinha/Climinha'
import type { CliminhaState, Mood } from '@/clima/climinha/states'
import { motionTokens } from '@/clima/theme/motion'

/**
 * The Climinha that follows the interface.
 *  - top: occupies the spot reserved in the hero
 *  - scrolling: lets go and lands on top of the navigation bar, centered
 *  - dragging between cities: stays centered, follows the gesture only slightly, and
 *    tilts his body with the inertia (the screen is what moves sideways)
 * Scroll speed tilts and stretches the body; springs give the cloud-like lag.
 */

const RATIO = 182 / 240
const DOCK_TRAVEL = 0.6 // fraction of the screen height until he lands on the bar
const SWIPE_FOLLOW = 0.18 // how much of the drag he follows (the rest becomes tilt)

interface Geometry {
  // anchor in the document (scroll = 0, page with no sideways offset)
  anchorX: number
  anchorY: number
  anchorW: number
  vw: number
  vh: number
  navTop: number
}

interface TravelingCliminhaProps {
  anchorRef: React.RefObject<HTMLDivElement | null>
  state: CliminhaState
  phase: CliminhaPhase
  moodOverride?: Mood
  /** city change: remeasure the anchor */
  layoutKey: string
  /** told when he is already positioned — the intro can release its character */
  onReady?: () => void
  /** intro character: the flight starts exactly where he is */
  fromRef?: React.RefObject<HTMLDivElement | null>
  /** offset of the drag between cities */
  swipeX?: MotionValue<number>
}

export const TravelingCliminha = ({
  anchorRef,
  state,
  phase,
  moodOverride,
  layoutKey,
  onReady,
  fromRef,
  swipeX,
}: TravelingCliminhaProps) => {
  const reduced = useReducedMotion() ?? false
  const [bounce, setBounce] = useState(0)
  const { scrollY } = useScroll()
  const [geo, setGeo] = useState<Geometry | null>(null)

  const fallbackSwipe = useMotionValue(0)
  const swipe = swipeX ?? fallbackSwipe

  // --- measurements ----------------------------------------------------------
  useLayoutEffect(() => {
    const measure = () => {
      const el = anchorRef.current
      if (!el) {
        return
      }
      // layout position (offsetLeft/Top ignore transforms): the page may be
      // shifted by the drag or mid-animation when we measure
      let left = 0
      let top = 0
      for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
        left += n.offsetLeft
        top += n.offsetTop
      }
      const nav = document.querySelector('.floatnav')?.getBoundingClientRect()
      setGeo({
        anchorX: left,
        anchorY: top,
        anchorW: el.offsetWidth,
        vw: window.innerWidth,
        vh: window.innerHeight,
        navTop: nav ? nav.top : window.innerHeight - 80,
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (anchorRef.current) {
      ro.observe(anchorRef.current)
    }
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [anchorRef, layoutKey])

  // --- target position from scroll -------------------------------------------
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rawScale = useMotionValue(1)
  const progress = useMotionValue(0)

  const landed = useRef(false)
  const [landing, setLanding] = useState(false)
  const x = useSpring(rawX, motionTokens.climinha.follow)
  const y = useSpring(rawY, motionTokens.climinha.follow)
  const scale = useSpring(rawScale, motionTokens.climinha.follow)

  useLayoutEffect(() => {
    if (!geo) {
      return
    }
    const heroW = geo.anchorW
    const travel = Math.max(1, geo.vh * DOCK_TRAVEL)
    // landed on top of the bar, centered
    const dw = geo.vw >= 1024 ? 76 : 58
    const dx = geo.vw / 2 - dw / 2
    const dy = geo.navTop - dw * RATIO + 10

    const place = (s: number, first: boolean) => {
      const p = Math.min(1, Math.max(0, s / travel))
      const e = p * p * (3 - 2 * p) // smoothstep
      const hx = geo.anchorX
      const hy = geo.anchorY - s
      const tx = hx + (dx - hx) * e
      const ty = hy + (dy - hy) * e
      const ts = (heroW + (dw - heroW) * e) / heroW

      rawX.set(tx)
      rawY.set(ty)
      rawScale.set(ts)
      progress.set(e)

      if (reduced) {
        x.jump(tx)
        y.jump(ty)
        scale.jump(ts)
        return
      }
      if (!first || landed.current) {
        return
      }
      landed.current = true
      // coming from the intro: starts at the close-up size/position and shrinks slowly to the hero
      const from = fromRef?.current?.getBoundingClientRect()
      if (from && from.width > 0) {
        x.jump(from.left)
        y.jump(from.top)
        scale.jump(from.width / heroW)
        const t = motionTokens.climinha.landing
        void animate(x, tx, t)
        void animate(y, ty, t)
        void animate(scale, ts, t)
        setLanding(true)
        // the high layer lasts only during the flight — by time, without waiting for the animation to end
        window.setTimeout(() => setLanding(false), 1600)
      } else {
        x.jump(tx)
        y.jump(ty)
        scale.jump(ts)
      }
    }

    place(window.scrollY, true)
    return scrollY.on('change', (s) => place(s, false))
  }, [geo, scrollY, reduced, rawX, rawY, rawScale, progress, x, y, scale, fromRef])

  // --- drag: follows only slightly; gesture speed becomes inertia in the body ---
  const screenX = useTransform(() => x.get() + swipe.get() * SWIPE_FOLLOW)
  const swipeVelocity = useVelocity(swipe)
  const leanRaw = useTransform(swipeVelocity, [-2200, 0, 2200], [-1, 0, 1], { clamp: true })
  // lightly damped spring: after stopping he still sways a little, like jelly
  const lean = useSpring(leanRaw, motionTokens.climinha.jelly)

  // --- tilt and stretch from scroll speed ------------------------------------
  const velocity = useVelocity(scrollY)
  const tiltRaw = useTransform(velocity, [-2400, 0, 2400], [7, 0, -7], { clamp: true })
  const stretchRaw = useTransform(velocity, [-2400, 0, 2400], [1.06, 1, 1.06], { clamp: true })
  const rotate = useSpring(tiltRaw, motionTokens.climinha.soft)
  const scaleY = useSpring(stretchRaw, motionTokens.climinha.soft)
  const scaleX = useTransform(scaleY, (v) => 2 - v)

  // --- look: cursor at the top; landed on the bar, he looks at the content above -----
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) {
      return
    }
    const onMove = (e: PointerEvent) => {
      pointerX.set(Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2)) * 0.8)
      pointerY.set(Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.35) * 2)) * 0.5)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduced, pointerX, pointerY])

  const lookX = useTransform(() => {
    const e = progress.get()
    // while dragging, he looks where the screen is going
    const drag = Math.max(-1, Math.min(1, -swipe.get() / 300))
    return pointerX.get() * (1 - e) * 0.6 + drag * 0.8 + pointerX.get() * 0.4
  })
  const lookY = useTransform(() => {
    const e = progress.get()
    const dir = Math.max(-0.4, Math.min(0.4, velocity.get() / 3000))
    return pointerY.get() * (1 - e) + (-0.45 + dir) * e
  })

  const ready = !!geo
  useEffect(() => {
    if (ready) {
      onReady?.()
    }
  }, [ready, onReady])

  if (!geo) {
    return null
  }

  return (
    <motion.div
      className="traveler"
      // landing: above the intro sky (which is still fading); then he goes back under the bar
      style={{
        x: screenX,
        y,
        scale,
        width: geo.anchorW,
        originX: 0,
        originY: 0,
        zIndex: landing ? 101 : 15,
      }}
    >
      <motion.div style={reduced ? undefined : { rotate, scaleY, scaleX, originY: 1 }}>
        <motion.div
          animate={landing ? { scaleY: [1, 1.06, 0.93, 1], scaleX: [1, 0.96, 1.05, 1] } : undefined}
          initial={false}
          style={{ originY: 1 }}
          transition={{ duration: 1.3, times: [0, 0.45, 0.82, 1], ease: 'easeInOut' }}
          onAnimationComplete={() => setLanding(false)}
        >
          <Climinha
            lean={lean}
            lookX={lookX}
            lookY={lookY}
            moodOverride={moodOverride}
            phase={phase}
            size="100%"
            state={state}
            perceive
            onTap={() => {
              if (!reduced) {
                setBounce((n) => n + 1)
              }
            }}
          />
          <div className="tennis-ball" aria-hidden>
            <div key={bounce} className={bounce ? 'is-bouncing' : undefined}>
              <div className="tennis-ball__shadow" />
              <div className="tennis-ball__body" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
