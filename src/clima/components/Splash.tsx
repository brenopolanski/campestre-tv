import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { Climinha } from '../climinha/Climinha'
import { NEUTRAL_STATE } from '../climinha/states'
import type { Mood } from '../climinha/states'
import { motionTokens } from '../theme/motion'

/**
 * Intro: o Climinha passa bem perto da tela, enorme, como uma nuvem atravessando
 * o céu — olhos abertos. Depois dá uma piscadinha de um olho só e voa até o lugar dele
 * na interface (o TravelingCliminha começa o voo da posição medida aqui).
 */

/** duração mínima da intro antes de liberar a interface (ms) */
export const SPLASH_MIN_MS = 2700

interface Props {
  visible: boolean
  /** o personagem da intro só sai quando o da Home já pode recebê-lo */
  characterVisible: boolean
  /** medido pelo Climinha da Home para começar o voo daqui */
  characterRef: RefObject<HTMLDivElement | null>
}

export function Splash({ visible, characterVisible, characterRef }: Props) {
  const reduced = useReducedMotion() ?? false

  // olhos abertos enquanto passa → piscadinha de um olho só → abre de novo e vai para a tela
  const [mood, setMood] = useState<Mood>('neutral')
  useEffect(() => {
    if (reduced) return
    const close = window.setTimeout(() => setMood('wink'), 1650)
    const open = window.setTimeout(() => setMood('neutral'), 2250)
    return () => {
      window.clearTimeout(close)
      window.clearTimeout(open)
    }
  }, [reduced])

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="splash"
            className="splash"
            aria-hidden="true"
            initial={false}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.25 : 0.5, delay: reduced ? 0 : 0.6 }}
          >
            {/* o céu da intro sai rápido: o voo até a Home fica visível */}
            <motion.div
              className="splash__sky"
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.2 : 0.35 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {characterVisible && (
        <div className="splash__stage">
          {/* deriva lateral: ele atravessa a tela devagar, como nuvem */}
          <motion.div
            className="splash__drift"
            initial={reduced ? false : { x: '26vw', y: '3vh', rotate: 3 }}
            animate={{ x: '0vw', y: '0vh', rotate: 0 }}
            transition={{ duration: 2.2, ease: [0.16, 0.84, 0.3, 1] }}
          >
            <motion.div
              ref={characterRef}
              className="splash__character"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* flutuação por transform no wrapper: o SVG gigante não é repintado a cada quadro */}
              <motion.div
                className="splash__float"
                animate={reduced ? undefined : { y: ['0%', '-1.6%', '0%'] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Climinha
                  state={NEUTRAL_STATE}
                  moodOverride={mood}
                  size="100%"
                  ambient={false}
                  fluid={false}
                  eyeTransition={motionTokens.climinha.wink}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </>
  )
}
