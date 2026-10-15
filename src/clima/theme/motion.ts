import type { Transition } from 'motion/react'

/**
 * Three motion personalities — never the same curve for all three.
 *  system   → UI: subtle, fast, no perceptible bounce
 *  weather  → environment: slow, atmospheric
 *  climinha → character: organic, with a spring
 */
export const motionTokens = {
  system: {
    fast: { type: 'spring', stiffness: 700, damping: 45, mass: 0.6 },
    default: { type: 'spring', stiffness: 420, damping: 38 },
    press: { type: 'spring', stiffness: 900, damping: 50 },
    fade: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] },
    menu: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
    sheet: { type: 'spring', stiffness: 380, damping: 40, mass: 0.9 },
    /** card entering the screen on scroll */
    reveal: { type: 'spring', stiffness: 170, damping: 26, mass: 0.9 },
    /** page entering / settling back into place after a drag */
    page: { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 },
  },
  weather: {
    transition: { duration: 1.4, ease: [0.4, 0, 0.2, 1] },
    content: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
    /** seconds per cloud crossing (far layer); mid/near divide by 1.4 / 1.8 */
    ambientCloudSeconds: 240,
  },
  climinha: {
    soft: { type: 'spring', stiffness: 140, damping: 14 },
    gooey: { type: 'spring', stiffness: 280, damping: 11, mass: 0.9 },
    heavy: { type: 'spring', stiffness: 90, damping: 18, mass: 1.6 },
    snappy: { type: 'spring', stiffness: 560, damping: 24 },
    eyes: { type: 'spring', stiffness: 320, damping: 26 },
    blink: { duration: 0.09, ease: 'easeIn' },
    drowsyBlink: { duration: 0.55, ease: [0.45, 0, 0.25, 1] },
    /** intro wink: the eyelid goes down and up smoothly, without a spring */
    wink: { duration: 0.3, ease: [0.45, 0, 0.2, 1] },
    /** sleepy eyelids: they lower slowly, without a spring */
    drowsy: { duration: 1.4, ease: [0.4, 0, 0.2, 1] },
    /** intro → hero: shrinks slowly, almost no bounce */
    landing: { type: 'spring', duration: 1.25, bounce: 0.1 },
    /** body inertia: lightly damped, it still sways after stopping */
    jelly: { stiffness: 170, damping: 9, mass: 0.8 },
    /** follows the scroll with a cloud-like lag */
    follow: { stiffness: 120, damping: 22, mass: 0.9 },
  },
} as const satisfies Record<string, Record<string, Transition | number>>

/** Home entrance sequence (seconds). */
export const entrance = {
  location: 0.1,
  climinha: 0.18,
  temperature: 0.26,
  condition: 0.34,
  meta: 0.4,
  firstCard: 0.45,
  cardStep: 0.06,
} as const

/** Press on controls: a short scale, no bounce. */
export const pressScale = 0.96
