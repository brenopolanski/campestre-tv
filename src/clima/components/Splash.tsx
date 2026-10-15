import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { Climinha } from '../climinha/Climinha'
import { NEUTRAL_STATE } from '../climinha/states'
import type { Mood } from '../climinha/states'
import { motionTokens } from '../theme/motion'

/**
 * Intro: Climinha passes very close to the screen, huge, like a cloud crossing
 * the sky — eyes open. Then he winks one eye and flies to his place
 * in the interface (TravelingCliminha starts the flight from the position measured here).
 */

/** minimum intro duration before releasing the interface (ms) */
export const SPLASH_MIN_MS = 2700

interface Props {
  visible: boolean
  /** the intro character leaves only when the Home one can receive him */
  characterVisible: boolean
  /** measured by the Home Climinha so the flight can start from here */
  characterRef: RefObject<HTMLDivElement | null>
}

export function Splash({ visible, characterVisible, characterRef }: Props) {
  const reduced = useReducedMotion() ?? false

  // eyes open while he passes → a one-eye wink → opens again and goes to the screen
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
            {/* the intro sky leaves quickly: the flight to Home stays visible */}
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
          {/* sideways drift: he crosses the screen slowly, like a cloud */}
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
              {/* float via transform on the wrapper: the huge SVG is not repainted every frame */}
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
