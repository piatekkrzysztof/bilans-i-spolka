'use client'

/**
 * Lista „Co przygotować przy zmianie biura” z odhaczaniem. Stan w URL (?gotowe=1,3),
 * więc listę można zapisać w zakładkach albo wysłać wspólnikowi - bez konta i bez e-maila.
 */
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'
import { CHECKLIST } from './checklist-items'

function parseDone(raw: string | null): number[] {
  return (raw ?? '').split(',').map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= CHECKLIST.length)
}

export function SwitchChecklist() {
  // URL jest jedynym źródłem stanu: history.replaceState aktualizuje useSearchParams w Next.js.
  const searchParams = useSearchParams()
  const done = parseDone(searchParams.get('gotowe'))

  const toggle = (n: number) => {
    const next = done.includes(n) ? done.filter(x => x !== n) : [...done, n].sort((a, b) => a - b)
    const params = new URLSearchParams(window.location.search)
    if (next.length) params.set('gotowe', next.join(','))
    else params.delete('gotowe')
    const query = params.toString()
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
  }

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <p className="num text-sm text-ink-muted" aria-live="polite">{done.length} z {CHECKLIST.length} gotowe</p>
        <div className="h-px flex-1 translate-y-[-4px] bg-rule mx-4" aria-hidden="true">
          <div className="h-px bg-ledger transition-[width] duration-700 ease-calm" style={{ width: `${(done.length / CHECKLIST.length) * 100}%` }} />
        </div>
      </div>
      <ul className="grid gap-2">
        {CHECKLIST.map((item, index) => {
          const n = index + 1
          const checked = done.includes(n)
          return (
            <li key={item}>
              <label className={cn('flex min-h-12 cursor-pointer items-center gap-4 rounded-[3px] border bg-surface px-4 py-3 text-sm transition-colors', checked ? 'border-ledger/40 text-ink-muted' : 'border-rule text-ink')}>
                <input type="checkbox" checked={checked} onChange={() => toggle(n)} className="size-4 shrink-0 accent-ledger" />
                <span className={cn(checked && 'line-through decoration-brass')}>{item}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
