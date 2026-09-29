import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

// Fades and lifts its content in the first time it scrolls into view.
// `MotionConfig reducedMotion="user"` on the landing root drops the lift for
// visitors who ask for reduced motion, leaving only the fade.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ type: 'spring', stiffness: 110, damping: 22, delay }}
    >
      {children}
    </motion.div>
  )
}
