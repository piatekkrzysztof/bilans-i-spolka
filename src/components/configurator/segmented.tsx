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
        className="flex flex-wrap gap-px overflow-hidden rounded-[3px] border border-rule bg-rule"
      >
        {options.map(option => (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              'num group relative flex-1 bg-surface px-2 text-center leading-tight text-ink-muted transition-colors duration-300 ease-calm sm:px-3',
              // Długie etykiety (formy działalności) mogą się zawinąć; krótkie (przedziały) - nigdy w połowie „41–100”.
              wrap ? 'min-w-[calc(50%-1px)] sm:min-w-0' : 'min-w-0 whitespace-nowrap',
              size === 'sm' ? 'min-h-10 text-[0.8125rem]' : 'min-h-12 text-sm',
              'hover:text-ink',
              'focus-visible:z-10 focus-visible:outline-offset-[-2px]',
              'data-[state=checked]:bg-ledger-soft data-[state=checked]:font-medium data-[state=checked]:text-ledger-deep',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {option.label}
            <span
              aria-hidden="true"
              className="absolute inset-x-3 bottom-0 h-px origin-center scale-x-0 bg-ledger transition-transform duration-500 ease-calm group-data-[state=checked]:scale-x-100"
            />
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  )
}
