'use client'

/**
 * Arkusz wyceny - podsumowanie w formie faktury. Suma liczy się w RollingNumber, a pod nią mosiężne
 * podwójne podkreślenie rysuje się od nowa.
 *
 * Sam arkusz nie zależy od Motion: na stronie głównej wiersze wchodzą animacją CSS, a pełny
 * konfigurator podstawia `MotionLines` (wejście i wyjście wierszy) - Motion ładuje się tylko na /wycena.
 */
import type { ComponentType, ReactNode } from 'react'
import { formatAmount, formatPLN, grossFromNet } from '@/domain/money'
import type { QuoteLine } from '@/domain/pricing'
import { cn } from '@/lib/cn'
import { useQuote } from './quote-store'
import { RollingNumber, RollingSuffix } from './rolling-number'

export const lineClass = 'grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-dashed border-ink/35 py-2.5 text-sm'

export function LineContent({ line }: { line: QuoteLine }) {
  const qty = line.quantity && line.unitPrice ? `${line.quantity} × ${formatPLN(line.unitPrice)}` : line.detail
  return (
    <>
      <span className="text-ink">
        {line.label}
        {qty && <span className="num ml-2 text-xs text-ink-muted">{qty}</span>}
      </span>
      <span className="num text-right text-ink">{line.amount === 0 ? 'w cenie' : formatPLN(line.amount)}</span>
    </>
  )
}

export type LinesComponent = ComponentType<{ lines: QuoteLine[]; label: string }>

/** Wiersze bez biblioteki animacji: nowy wiersz montuje się z krótkim fade-up (CSS, kompozytor). */
function CssLines({ lines, label }: { lines: QuoteLine[]; label: string }) {
  return (
    <ul className="mt-1" aria-label={label}>
      {lines.map(line => (
        <li key={line.id} className={cn(lineClass, 'animate-fade-up')}>
          <LineContent line={line} />
        </li>
      ))}
    </ul>
  )
}

export function QuoteSheet({
  compact = false,
  title = 'Wycena',
  footer,
  className,
  children,
  Lines = CssLines,
}: {
  compact?: boolean
  title?: string
  footer?: ReactNode
  className?: string
  /** Pytania wewnątrz arkusza (hero) - między nagłówkiem a pozycjami. */
  children?: ReactNode
  Lines?: LinesComponent
}) {
  const quote = useQuote(s => s.quote)
  const display = useQuote(s => s.display)
  const setDisplay = useQuote(s => s.setDisplay)
  const vatRate = useQuote(s => s.priceList.vatRate)

  const gross = display === 'gross'
  const total = gross ? quote.monthlyGross : quote.monthlyNet
  const monthlyLines: QuoteLine[] = gross
    ? [...quote.monthly, { id: 'vat-tax', kind: 'vat', label: `Podatek VAT ${Math.round(vatRate * 100)}%`, amount: quote.monthlyGross - quote.monthlyNet }]
    : quote.monthly
  const oneOffLines = gross ? quote.oneOff.map(line => ({ ...line, amount: grossFromNet(line.amount, vatRate) })) : quote.oneOff
  const announce = `${quote.isFromPrice ? 'Od ' : ''}${formatPLN(total)} ${gross ? 'brutto' : 'netto'} miesięcznie`

  return (
    <section
      aria-label="Podsumowanie wyceny"
      className={cn('ledger-margin border-2 border-ink bg-surface', className)}
    >
      {/* Pasek formularza: odwrócone kolory, tytuł i przełącznik jak na druku urzędowym. */}
      <header className="relative z-10 flex items-center justify-between gap-4 bg-ink py-2 pl-4 pr-2 text-paper">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.1em]">{title}</p>
        <div role="group" aria-label="Pokaż ceny" className="flex border border-paper/60 font-mono text-[0.6875rem] uppercase tracking-[0.08em]">
          {(['net', 'gross'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              aria-pressed={display === mode}
              onClick={() => setDisplay(mode)}
              className={cn('min-h-8 px-2.5 transition-colors', display === mode ? 'bg-paper text-ink' : 'text-paper hover:bg-paper/15')}
            >
              {mode === 'net' ? 'netto' : 'brutto'}
            </button>
          ))}
        </div>
      </header>
      <div className={cn('pl-10 pr-5 sm:pl-12 sm:pr-6', compact ? 'pb-5 pt-3' : 'pb-7 pt-4')}>

        {children}

        <Lines lines={monthlyLines} label="Pozycje miesięczne" />

        <div className="mt-5 flex items-end justify-between gap-4">
          <p className="eyebrow pb-2">
            {quote.isFromPrice ? 'Miesięcznie od' : 'Razem / mies.'}
            <span className="block text-ink-muted">{gross ? 'brutto' : 'netto'}</span>
          </p>
          <div className="text-right">
            <p className={cn('flex items-end justify-end font-mono font-bold leading-none tracking-[-0.04em] text-ink', compact ? 'text-[2.5rem]' : 'text-[2.75rem] sm:text-[3.5rem]')}>
              <RollingNumber value={formatAmount(total)} />
              <RollingSuffix className="ml-1.5 text-[0.45em] text-ink-muted">zł</RollingSuffix>
            </p>
            <span key={total} className="double-rule mt-2" />
          </div>
        </div>
        <p aria-live="polite" aria-atomic="true" className="sr-only">{announce}</p>

        {!gross && <p className="num mt-2 text-right text-xs text-ink-muted">{formatPLN(quote.monthlyGross)} brutto</p>}

        {oneOffLines.length > 0 && (
          <div className="mt-6 animate-fade-up">
            <p className="eyebrow">Jednorazowo</p>
            <Lines lines={oneOffLines} label="Pozycje jednorazowe" />
          </div>
        )}

        <p className="mt-6 text-sm text-ink-muted">Cena ostateczna po bezpłatnej konsultacji, bez ukrytych opłat.</p>
        {footer}
      </div>
    </section>
  )
}
