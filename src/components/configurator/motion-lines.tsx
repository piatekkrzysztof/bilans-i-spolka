'use client'

/**
 * Wiersze wyceny na Motion - pozycje wchodzą i wychodzą jak wiersze faktury, a sąsiednie
 * przesuwają się płynnie (layout). Używane tylko w pełnym konfiguratorze; cechy ładowane leniwie.
 */
import { AnimatePresence, LazyMotion, MotionConfig } from 'motion/react'
import * as m from 'motion/react-m'
import type { ReactNode } from 'react'
import type { QuoteLine } from '@/domain/pricing'
import { LineContent, lineClass } from './quote-sheet'

const loadFeatures = () => import('./motion-features').then(mod => mod.default)
const ease = [0.22, 0.61, 0.36, 1] as const

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}

export function MotionLines({ lines, label }: { lines: QuoteLine[]; label: string }) {
  return (
    <ul className="mt-1" aria-label={label}>
      <AnimatePresence initial={false} mode="popLayout">
        {lines.map(line => (
          <m.li
            key={line.id}
            layout="position"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 0.45, ease }}
            className={lineClass}
          >
            <LineContent line={line} />
          </m.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}
