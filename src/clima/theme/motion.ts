import type { Transition } from 'motion/react'

/**
 * Três personalidades de movimento — nunca a mesma curva para as três.
 *  system   → UI: sutil, rápido, sem bounce perceptível
 *  weather  → ambiente: lento, atmosférico
 *  climinha → personagem: orgânico, com mola
 */
export const motionTokens = {
  system: {
    fast: { type: 'spring', stiffness: 700, damping: 45, mass: 0.6 },
    default: { type: 'spring', stiffness: 420, damping: 38 },
    press: { type: 'spring', stiffness: 900, damping: 50 },
    fade: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] },
    menu: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
    sheet: { type: 'spring', stiffness: 380, damping: 40, mass: 0.9 },
    /** card entrando na tela ao rolar */
    reveal: { type: 'spring', stiffness: 170, damping: 26, mass: 0.9 },
    /** página entrando / voltando ao lugar depois do arraste */
    page: { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 },
  },
  weather: {
    transition: { duration: 1.4, ease: [0.4, 0, 0.2, 1] },
    content: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
    /** segundos por travessia de nuvem (camada far); mid/near dividem por 1.4 / 1.8 */
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
    /** piscadinha da intro: a pálpebra desce e sobe suave, sem mola */
    wink: { duration: 0.3, ease: [0.45, 0, 0.2, 1] },
    /** pálpebras de sono: descem devagar, sem mola */
    drowsy: { duration: 1.4, ease: [0.4, 0, 0.2, 1] },
    /** intro → hero: encolhe devagar, quase sem quique */
    landing: { type: 'spring', duration: 1.25, bounce: 0.1 },
    /** inércia do corpo: pouco amortecida, balança depois de parar */
    jelly: { stiffness: 170, damping: 9, mass: 0.8 },
    /** acompanha o scroll com atraso de nuvem */
    follow: { stiffness: 120, damping: 22, mass: 0.9 },
  },
} as const satisfies Record<string, Record<string, Transition | number>>

/** Sequência de entrada da Home (segundos). */
export const entrance = {
  location: 0.1,
  climinha: 0.18,
  temperature: 0.26,
  condition: 0.34,
  meta: 0.4,
  firstCard: 0.45,
  cardStep: 0.06,
} as const

/** Pressão em controles: escala curta, sem bounce. */
export const pressScale = 0.96
