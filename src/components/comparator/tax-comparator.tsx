'use client'

/**
 * Porównywarka form opodatkowania: skala, liniowy i ryczałt obok siebie, w widełkach.
 *
 * Liczby zostają w pamięci przeglądarki - nie trafiają do URL ani na serwer, dopóki użytkownik
 * sam nie wyśle formularza (wymóg RODO z planu).
 */
import { useId, useMemo, useState } from 'react'
import { Segmented } from '@/components/configurator/segmented'
import { formatAmount, formatPLN, zl } from '@/domain/money'
import { type ComparedForm, compareTaxForms, type TaxYear, type ZusStage } from '@/domain/tax-comparison'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

const FORM_LABELS: Record<ComparedForm, string> = { skala: 'Skala podatkowa', liniowy: 'Podatek liniowy', ryczalt: 'Ryczałt' }

const stageOptions = [
  { value: 'start', label: 'Ulga na start' },
  { value: 'preferencyjny', label: 'Preferencyjny' },
  { value: 'pelny', label: 'Pełny ZUS' },
] as const satisfies readonly { value: ZusStage; label: string }[]

function MoneyField({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (v: number) => void }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
      <p id={`${id}-hint`} className="mb-2 text-xs text-ink-muted">{hint}</p>
      <div className="flex items-center rounded-[3px] border border-rule bg-surface focus-within:border-ledger">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          value={Number.isFinite(value) ? value : ''}
          aria-describedby={`${id}-hint`}
          onChange={event => onChange(Math.max(0, event.target.valueAsNumber || 0))}
          className="num h-12 w-full bg-transparent px-4 text-right text-lg text-ink focus-visible:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="whitespace-nowrap pr-4 font-mono text-xs uppercase text-ink-muted">zł / rok</span>
      </div>
    </div>
  )
}

export function TaxComparator({
  taxYear,
  onChoose,
  headingLevel = 'h2',
}: {
  taxYear: TaxYear
  /** W konfiguratorze: wybór formy wraca do wyceny. */
  onChoose?: (form: ComparedForm) => void
  headingLevel?: 'h2' | 'h3'
}) {
  const [revenue, setRevenue] = useState(180000)
  const [costs, setCosts] = useState(30000)
  const [flatRateId, setFlatRateId] = useState(taxYear.flatRates[0]?.id ?? '')
  const [stage, setStage] = useState<ZusStage>('pelny')
  const [sickness, setSickness] = useState(true)
  const sicknessId = useId()
  const branchId = useId()

  const result = useMemo(
    () => compareTaxForms({ annualRevenue: zl(revenue), annualCosts: zl(costs), flatRateId, zusStage: stage, sickness }, taxYear),
    [revenue, costs, flatRateId, stage, sickness, taxYear],
  )
  const Heading = headingLevel

  return (
    <div className="grid gap-10 lg:grid-cols-[22rem_1fr]">
      <form className="grid content-start gap-6" onSubmit={event => event.preventDefault()} aria-label="Dane do porównania">
        <MoneyField label="Przewidywany przychód" hint="Suma faktur netto w roku" value={revenue} onChange={setRevenue} />
        <MoneyField label="Koszty firmy" hint="Sprzęt, podwykonawcy, samochód, biuro" value={costs} onChange={setCosts} />
        <div>
          <label htmlFor={branchId} className="block text-sm font-medium text-ink">Branża (stawka ryczałtu)</label>
          <select
            id={branchId}
            value={flatRateId}
            onChange={event => setFlatRateId(event.target.value)}
            className="mt-2 h-12 w-full rounded-[3px] border border-rule bg-surface px-3 text-sm text-ink"
          >
            {taxYear.flatRates.map(rate => (
              <option key={rate.id} value={rate.id}>{rate.label} - {String(rate.rate * 100).replace('.', ',')}%</option>
            ))}
          </select>
        </div>
        <Segmented label="Etap ZUS" options={stageOptions} value={stage} onChange={setStage} size="sm" />
        <label htmlFor={sicknessId} className="flex items-start gap-3 text-sm text-ink">
          <input id={sicknessId} type="checkbox" checked={sickness} onChange={e => setSickness(e.target.checked)} className="mt-1 size-4 accent-ledger" />
          <span>Dobrowolne ubezpieczenie chorobowe <span className="block text-xs text-ink-muted">Daje prawo do L4 i zasiłku macierzyńskiego</span></span>
        </label>
        <p className="text-xs text-ink-muted">Nie zapisujemy tych liczb. Zostają w Twojej przeglądarce, dopóki sam nie wyślesz formularza.</p>
      </form>

      <div>
        <div className="grid gap-px overflow-hidden rounded-[3px] border border-rule bg-rule md:grid-cols-3">
          {result.results.map(r => {
            const best = r.form === result.best
            return (
              <article key={r.form} className={cn('flex flex-col p-6', best ? 'bg-ledger-soft' : 'bg-surface')} aria-label={FORM_LABELS[r.form]}>
                <div className="flex flex-col-reverse gap-2">
                  <Heading className="font-display text-xl text-ink uppercase tracking-[-0.02em]">{FORM_LABELS[r.form]}</Heading>
                  {/* Plakietka nad nazwą: obok niej nie mieści się w trzech kolumnach. */}
                  <span className={cn('eyebrow flex items-center gap-2', !best && 'invisible')} aria-hidden={!best}>
                    <span className="marker" />Najkorzystniej
                  </span>
                </div>
                <p className="mt-5 text-xs text-ink-muted">Na rękę miesięcznie</p>
                <p className="num font-serif text-[2.25rem] leading-tight text-ink">
                  {formatAmount(Math.max(0, r.monthlyNet))}<span className="ml-1 text-base text-ink-muted">zł</span>
                </p>
                {best && <span key={result.best} className="double-rule mt-1 w-2/3" />}
                <dl className="mt-5 grid gap-1.5 text-sm">
                  {[
                    ['Podatek', r.tax],
                    ['Składka zdrowotna', r.health],
                    ['ZUS społeczny', r.social],
                  ].map(([label, amount]) => (
                    <div key={label as string} className="flex justify-between gap-3 border-b border-rule/80 pb-1.5">
                      <dt className="text-ink-muted">{label}</dt>
                      <dd className="num text-ink">{formatPLN(amount as number)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3 pt-1 font-medium">
                    <dt>Razem rocznie</dt>
                    <dd className="num">{formatPLN(r.burden)}</dd>
                  </div>
                </dl>
                <p className="num mt-3 text-xs text-ink-muted">
                  Widełki: {formatAmount(r.burdenRange[0])}–{formatAmount(r.burdenRange[1])} zł przy przychodzie ±10%
                </p>
                {onChoose && (
                  <button type="button" onClick={() => onChoose(r.form)} className="link-underline mt-auto self-start pt-5 text-sm text-ledger">
                    Wybieram {FORM_LABELS[r.form].toLowerCase()}
                  </button>
                )}
              </article>
            )
          })}
        </div>
        <p className="mt-5 max-w-prose border-l-2 border-brass pl-4 text-sm text-ink">
          To szacunek, decyzję podejmiemy razem na konsultacji. Nie uwzględniamy ulg (na dzieci, IP Box), wspólnego rozliczenia
          ani nierównych miesięcy.
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          Stawki {taxYear.year}: ZUS, składka zdrowotna i PIT, zweryfikowane {formatDate(taxYear.verifiedAt)}. Ryczałt: {result.flatRate.label.toLowerCase()}.
        </p>
      </div>
    </div>
  )
}
