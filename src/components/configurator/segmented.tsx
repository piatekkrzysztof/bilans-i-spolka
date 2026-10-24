'use client'

import * as RadioGroup from '@radix-ui/react-radio-group'
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

/**
 * Segmentowy przełącznik = grupa radio (WCAG): jedna pozycja w kolejności Tab,
 * strzałki zmieniają wybór, etykieta grupy czytana przez czytnik ekranu.
 */
export function Segmented<T extends string>({
  label,
  description,
  options,
  value,
  onChange,
  size = 'md',
  className,
  trailing,
  wrap = false,
}: {
  /** Na wąskim ekranie układ 2×2 zamiast jednego ciasnego rzędu (długie etykiety). */
  wrap?: boolean
  label: string
  description?: string
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
  trailing?: ReactNode
}) {
  const id = useId()
  return (
    <div className={className}>
      <div className="mb-2.5 flex items-baseline justify-between gap-4">
        <span id={`${id}-label`} className="text-sm font-medium text-ink">{label}</span>
        {trailing}
      </div>
      {description && <p id={`${id}-desc`} className="-mt-1.5 mb-2.5 text-xs text-ink-muted">{description}</p>}
      <RadioGroup.Root
        value={value}
        onValueChange={next => onChange(next as T)}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        orientation="horizontal"
        loop
        className="flex flex-wrap gap-px overflow-hidden border-2 border-ink bg-ink"
      >
        {options.map(option => (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              'group relative flex-1 bg-paper px-2 text-center font-mono uppercase leading-tight tracking-[0.04em] text-ink transition-colors duration-150 sm:px-3',
              // Długie etykiety (formy działalności) mogą się zawinąć; krótkie (przedziały) - nigdy w połowie „41–100”.
              wrap ? 'min-w-[calc(50%-1px)] sm:min-w-0' : 'min-w-0 whitespace-nowrap',
              size === 'sm' ? 'min-h-10 text-[0.75rem]' : 'min-h-12 text-[0.8125rem]',
              'hover:bg-ledger-soft',
              'focus-visible:z-10 focus-visible:outline-offset-[-2px]',
              // Wybrana opcja: odwrócenie kolorów - czytelne bez koloru, jak wciśnięty klawisz na panelu.
              'data-[state=checked]:bg-ink data-[state=checked]:font-bold data-[state=checked]:text-paper',
              'disabled:cursor-not-allowed disabled:bg-ledger-soft disabled:text-ink-muted disabled:line-through',
            )}
          >
            {option.label}
            <span aria-hidden="true" className="absolute right-1 top-1 hidden size-1.5 bg-signal group-data-[state=checked]:block" />
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  )
}
