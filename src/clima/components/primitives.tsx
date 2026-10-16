import type { HTMLMotionProps } from 'motion/react'
import { motion, useReducedMotion } from 'motion/react'
import { forwardRef, useContext } from 'react'

import type { UiIconName } from '@/clima/icons/UiIcon'
import { UiIcon } from '@/clima/icons/UiIcon'
import { entrance, motionTokens, pressScale } from '@/clima/theme/motion'

import { FirstRunContext } from './firstRun'
import { Reveal } from './Reveal'

interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: UiIconName
  label: string
  size?: number
}

/** Floating circular control (UI layer). Minimum 44px target. */
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { icon, label, size = 44, className, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      aria-label={label}
      className={['glass glass-button', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      transition={motionTokens.system.press}
      type="button"
      whileTap={{ scale: pressScale }}
      {...rest}
    >
      <UiIcon name={icon} size={20} />
    </motion.button>
  )
})

interface PlainIconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: UiIconName
  label: string
  pressed?: boolean
}

/** Flat button inside a glass container (no glass inside glass). */
export const PlainIconButton = forwardRef<HTMLButtonElement, PlainIconButtonProps>(
  function PlainIconButton({ icon, label, pressed, className, ...rest }, ref) {
    return (
      <motion.button
        ref={ref}
        aria-label={label}
        aria-pressed={pressed}
        className={['plain-icon-button', className].filter(Boolean).join(' ')}
        title={label}
        transition={motionTokens.system.press}
        type="button"
        whileTap={{ scale: pressScale }}
        {...rest}
      >
        <UiIcon name={icon} size={21} />
      </motion.button>
    )
  },
)

interface CardProps {
  title: string
  icon?: UiIconName
  children: React.ReactNode
  className?: string
  /** entrance order on the first open */
  order?: number
  /** appears with scroll instead of entering on mount */
  reveal?: boolean
  /** relative delay in the row (0…1), for cards side by side */
  lag?: number
}

/** Data card: a simple material (no blur), card radius, a quiet title. */
export const Card = ({ title, icon, children, className, order = 0, reveal, lag }: CardProps) => {
  const reduced = useReducedMotion()
  const firstRun = useContext(FirstRunContext)
  const delay = firstRun ? entrance.firstCard + order * entrance.cardStep : order * 0.025
  const classes = ['card', className].filter(Boolean).join(' ')
  const header = (
    <header className="card__header">
      {icon && <UiIcon name={icon} size={14} />}
      <h2 className="card__title">{title}</h2>
    </header>
  )
  if (reveal) {
    return (
      <Reveal className="reveal" lag={lag}>
        <section aria-label={title} className={classes}>
          {header}
          {children}
        </section>
      </Reveal>
    )
  }
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      aria-label={title}
      className={['card', className].filter(Boolean).join(' ')}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      transition={{ ...motionTokens.system.default, delay }}
    >
      {header}
      {children}
    </motion.section>
  )
}
