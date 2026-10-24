import { cn } from '@/lib/cn'

/** Oznaczenie „projekt koncepcyjny” - wymagane przy danych, zespole, formularzu i w stopce. */
export function ConceptNote({ children = 'Dane przykładowe - projekt koncepcyjny', className }: { children?: string; className?: string }) {
  return (
    <p className={cn('inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-muted', className)}>
      <span aria-hidden="true" className="marker" />
      {children}
    </p>
  )
}
