import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Nagłówek sekcji jak karta w instrukcji technicznej: gruba linia nad sekcją, numer pozycji
 * w czerwieni sygnałowej, etykieta w mono i tytuł w ciężkim grotesku. Numer to dekoracja (aria-hidden).
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  lead,
  className,
  as: Tag = 'h2',
  id,
  stacked = false,
}: {
  index?: string
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  className?: string
  as?: 'h1' | 'h2'
  id?: string
  /** Wąska kolumna (FAQ, listy obok): etykieta nad tytułem zamiast w marginesie. */
  stacked?: boolean
}) {
  return (
    <header className={cn('grid gap-6 border-t-2 border-ink pt-5', !stacked && 'md:grid-cols-[10rem_1fr]', className)} data-reveal>
      <div className="flex items-baseline justify-between gap-3 md:block">
        <p className="eyebrow">{eyebrow}</p>
        {index && (
          <span aria-hidden="true" className="num text-sm font-bold text-alert md:mt-2 md:block">
            [{index}]
          </span>
        )}
      </div>
      <div className="max-w-4xl">
        <Tag id={id} className={cn('text-ink', Tag === 'h1' ? 'text-[2.75rem] leading-[0.92] md:text-3xl' : 'text-[2rem] leading-[0.95] md:text-2xl')}>
          {title}
        </Tag>
        {lead && <div className="mt-6 max-w-prose text-lg text-ink-muted">{lead}</div>}
      </div>
    </header>
  )
}
