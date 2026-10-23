'use client'

import { Minus, Plus } from 'lucide-react'
import { useId } from 'react'
import { MAX_PEOPLE } from '@/domain/quote'

/** Licznik osób: przyciski −/+ i pole liczbowe do wpisania wartości z klawiatury. */
export function Counter({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: number
  onChange: (value: number) => void
}) {
  const id = useId()
  const clamp = (n: number) => Math.min(MAX_PEOPLE, Math.max(0, Number.isFinite(n) ? Math.trunc(n) : 0))
  const buttonClass =
    'grid size-11 place-items-center text-ink-muted transition-colors hover:bg-ledger-soft hover:text-ledger disabled:pointer-events-none disabled:opacity-40'

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
      <p id={`${id}-hint`} className="mb-2.5 text-xs text-ink-muted">{hint}</p>
      <div className="inline-flex items-center rounded-[3px] border border-rule bg-surface">
        <button type="button" className={buttonClass} onClick={() => onChange(clamp(value - 1))} disabled={value <= 0} aria-label={`${label}: mniej`}>
          <Minus className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_PEOPLE}
          value={value}
          aria-describedby={`${id}-hint`}
          onChange={event => onChange(clamp(event.target.valueAsNumber))}
          className="num h-11 w-14 border-x border-rule bg-transparent text-center text-base text-ink [appearance:textfield] focus-visible:outline-offset-[-2px] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button type="button" className={buttonClass} onClick={() => onChange(clamp(value + 1))} disabled={value >= MAX_PEOPLE} aria-label={`${label}: więcej`}>
          <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
