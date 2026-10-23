import { cn } from '@/lib/cn'

/** Oznaczenie „projekt koncepcyjny” - wymagane przy danych, zespole, formularzu i w stopce. */
export function ConceptNote({ children = 'Dane przykładowe - projekt koncepcyjny', className }: { children?: string; className?: string }) {
  return (
    <p className={cn('inline-flex items-center gap-2 text-xs text-ink-muted', className)}>
      <span aria-hidden="true" className="inline-block size-1.5 rounded-full border border-brass" />
      {children}
    </p>
  )
}
