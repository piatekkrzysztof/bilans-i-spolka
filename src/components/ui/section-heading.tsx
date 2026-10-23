import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Nagłówek sekcji z numerem konta w marginesie - jak pozycja w planie kont.
 * Numer jest dekoracją, więc czytniki ekranu go pomijają.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  lead,
  className,
  as: Tag = 'h2',
  id,
}: {
  index?: string
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  className?: string
  as?: 'h1' | 'h2'
  id?: string
}) {
  return (
    <header className={cn('grid gap-4 md:grid-cols-[7rem_1fr]', className)}>
      <div className="flex items-baseline gap-3 md:block">
        {index && <span aria-hidden="true" className="num font-serif text-xl text-ledger/70 md:block">{index}</span>}
        <p className="eyebrow md:mt-3">{eyebrow}</p>
      </div>
      <div className="max-w-3xl">
        <Tag id={id} className={cn('text-ink', Tag === 'h1' ? 'text-[2.5rem] leading-[1.05] md:text-3xl' : 'text-[1.875rem] leading-tight md:text-2xl')}>
          {title}
        </Tag>
        {lead && <div className="mt-5 max-w-prose text-lg text-ink-muted">{lead}</div>}
      </div>
    </header>
  )
}
