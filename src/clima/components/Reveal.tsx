import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { motionTokens } from '../theme/motion'

interface Props {
  children: ReactNode
  className?: string
  /** atraso relativo dentro de uma linha (0…1): itens à direita chegam um pouco depois */
  lag?: number
}

/**
 * O bloco começa invisível abaixo da dobra e aparece quando entra na tela.
 * O scroll continua 1:1 com o dedo: a entrada é uma animação curta e própria
 * (só opacidade e transform, que a GPU compõe sem redesenhar), não presa ao scroll.
 */
export function Reveal({ children, className, lag = 0 }: Props) {
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
