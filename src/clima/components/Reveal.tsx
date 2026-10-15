import { motion, useReducedMotion } from 'motion/react'
import { motionTokens } from '../theme/motion'

interface Props {
  children: React.ReactNode
  className?: string
  /** relative delay within a row (0…1): items on the right arrive a little later */
  lag?: number
}

/**
 * The block starts invisible below the fold and appears when it enters the screen.
 * Scroll stays 1:1 with the finger: the entrance is a short animation of its own
 * (opacity and transform only, which the GPU composites without repainting), not tied to scroll.
 */
export const Reveal = ({ children, className, lag = 0 }: Props) => {
  const reduced = useReducedMotion() ?? false
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 36, scale: reduced ? 1 : 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -8% 0px' }}
      transition={
        reduced ? { duration: 0.2 } : { ...motionTokens.system.reveal, delay: lag * 0.08 }
      }
    >
      {children}
    </motion.div>
  )
}
