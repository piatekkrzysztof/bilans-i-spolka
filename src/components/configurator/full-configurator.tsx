'use client'

/**
 * Pełny konfigurator na /wycena: 5 kroków, przyklejone podsumowanie, stan w URL.
 * E-mail jest potrzebny dopiero do wyceny PDF albo konsultacji - cena jest widoczna od razu.
 */
import * as Dialog from '@radix-ui/react-dialog'
import { Check, Link2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { type ReactNode, useEffect, useState } from 'react'
import { Button, buttonClass } from '@/components/ui/button'
import { formatPLN } from '@/domain/money'
import { availableAddons, type PriceList } from '@/domain/pricing'
import {
  allowedTaxForms,
  DOC_BRACKET_LABELS,
  DOC_BRACKETS,
  LEGAL_FORM_LABELS,
  LEGAL_FORMS,
  type QuoteInput,
  TAX_FORM_LABELS,
  TAX_FORMS,
} from '@/domain/quote'
import type { TaxYear } from '@/domain/tax-comparison'
import type { LeadIntent } from '@/lib/schemas/lead'
import { cn } from '@/lib/cn'
import { AdvisorCard, type AdvisorSummary } from './advisor-card'
import { Counter } from './counter'
import { MotionLines, MotionProvider } from './motion-lines'
import { QuoteProvider, useQuote } from './quote-store'
import { QuoteSheet } from './quote-sheet'
import { Segmented } from './segmented'

const LeadDialog = dynamic(() => import('@/components/lead/lead-dialog'), { ssr: false })
const TaxComparator = dynamic(() => import('@/components/comparator/tax-comparator').then(m => m.TaxComparator), {
  ssr: false,
  loading: () => <p className="py-16 text-center text-sm text-ink-muted">Wczytuję porównywarkę…</p>,
})

const yesNo = [
  { value: 'tak', label: 'Tak' },
  { value: 'nie', label: 'Nie' },
] as const

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`krok-${n}`} className="grid gap-5 border-t border-rule py-8 md:grid-cols-[4.5rem_1fr]">
      <p aria-hidden="true" className="num font-serif text-xl text-ledger/70">{n}<span className="text-ink-muted">/5</span></p>
      <div className="grid gap-5">
        <h2 id={`krok-${n}`} className="font-serif text-xl text-ink">{title}</h2>
        {children}
      </div>
    </section>
  )
}

function Questions({ taxYear }: { taxYear: TaxYear }) {
  const input = useQuote(s => s.input)
  const update = useQuote(s => s.update)
  const toggleAddon = useQuote(s => s.toggleAddon)
  const priceList = useQuote(s => s.priceList)
  const [comparatorOpen, setComparatorOpen] = useState(false)

  const allowed = allowedTaxForms(input.legalForm)
  const taxOptions = TAX_FORMS.map(value => ({ value, label: TAX_FORM_LABELS[value], disabled: !allowed.includes(value) }))
  const addons = availableAddons(priceList, input.legalForm)
  const jdgLike = input.legalForm === 'jdg' || input.legalForm === 'zakladam'

  return (
    <div>
      <Step n={1} title="Forma działalności">
        <Segmented
          label="Jaką firmę prowadzisz?"
          options={LEGAL_FORMS.map(value => ({ value, label: LEGAL_FORM_LABELS[value] }))}
          value={input.legalForm}
          onChange={legalForm => update({ legalForm })}
          wrap
        />
      </Step>

      <Step n={2} title="Forma opodatkowania">
        <Segmented
          label="Jak rozliczasz podatek dochodowy?"
          description={input.legalForm === 'spolka-zoo' ? 'Spółka z o.o. zawsze płaci CIT i prowadzi pełną księgowość.' : undefined}
          options={taxOptions}
          value={input.taxForm}
          onChange={taxForm => update({ taxForm })}
          trailing={jdgLike && (
            <button type="button" onClick={() => setComparatorOpen(true)} className="link-underline text-sm text-ledger">
              Nie wiem - porównaj
            </button>
          )}
        />
      </Step>

      <Step n={3} title="Dokumenty w miesiącu">
        <Segmented
          label="Ile faktur, rachunków i wyciągów miesięcznie?"
          description="Faktury z KSeF też się liczą, ale pobieramy je sami."
          options={DOC_BRACKETS.map(value => ({ value, label: DOC_BRACKET_LABELS[value] }))}
          value={input.docs}
          onChange={docs => update({ docs })}
        />
      </Step>

      <Step n={4} title="VAT">
        <div className="grid gap-5 sm:grid-cols-2">
          <Segmented label="Jesteś czynnym podatnikiem VAT?" options={yesNo} value={input.vat ? 'tak' : 'nie'} onChange={v => update({ vat: v === 'tak' })} />
          <Segmented label="Transakcje zagraniczne?" description="Import usług, WNT, WDT, eksport" options={yesNo} value={input.foreign ? 'tak' : 'nie'} onChange={v => update({ foreign: v === 'tak' })} />
        </div>
      </Step>

      <Step n={5} title="Pracownicy i umowy">
        <div className="grid gap-6 sm:grid-cols-2">
          <Counter label="Pracownicy na etacie" hint={`${formatPLN(priceList.perEmployee)} za osobę`} value={input.employees} onChange={employees => update({ employees })} />
          <Counter label="Umowy zlecenia i o dzieło" hint={`${formatPLN(priceList.perCivilContract)} za umowę`} value={input.contracts} onChange={contracts => update({ contracts })} />
        </div>
      </Step>

      {addons.length > 0 && (
        <section aria-labelledby="dodatki" className="grid gap-5 border-t border-rule py-8 md:grid-cols-[4.5rem_1fr]">
          <span aria-hidden="true" />
          <div>
            <h2 id="dodatki" className="font-serif text-xl text-ink">Dodatkowo</h2>
            <ul className="mt-5 grid gap-3">
              {addons.map(addon => {
                const checked = input.addons.includes(addon.id)
                return (
                  <li key={addon.id}>
                    <label className={cn('flex cursor-pointer items-start gap-4 rounded-[3px] border bg-surface p-4 transition-colors', checked ? 'border-ledger bg-ledger-soft/60' : 'border-rule hover:border-rule-strong')}>
                      <input type="checkbox" checked={checked} onChange={() => toggleAddon(addon.id)} className="mt-1 size-4 shrink-0 accent-ledger" />
                      <span className="grid flex-1 gap-1 text-sm">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                          <span className="font-medium text-ink">{addon.label}</span>
                          <span className="num text-ink">{formatPLN(addon.price)}{addon.billing === 'monthly' ? ' / mies.' : ' jednorazowo'}</span>
                        </span>
                        <span className="text-ink-muted">{addon.description}</span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      <Dialog.Root open={comparatorOpen} onOpenChange={setComparatorOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/30" />
          <Dialog.Content className="fixed inset-2 z-50 overflow-y-auto rounded-[4px] bg-paper p-6 shadow-2xl focus:outline-none sm:inset-8 lg:inset-x-[max(2rem,calc(50%-36rem))] lg:p-10" aria-describedby={undefined}>
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <p className="eyebrow">Porównywarka form opodatkowania</p>
                <Dialog.Title className="mt-2 font-serif text-2xl text-ink">Skala, liniowy czy ryczałt?</Dialog.Title>
              </div>
              <Dialog.Close className="grid size-11 place-items-center text-ink-muted hover:text-ink" aria-label="Zamknij">
                <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </Dialog.Close>
            </div>
            <TaxComparator
              taxYear={taxYear}
              headingLevel="h3"
              onChoose={form => {
                update({ taxForm: form })
                setComparatorOpen(false)
              }}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

function CopyLink() {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={buttonClass('text', 'mt-1')}
      onClick={async () => {
        await navigator.clipboard?.writeText(window.location.href).catch(() => undefined)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }}
    >
      {copied ? <Check className="size-4" strokeWidth={1.5} aria-hidden="true" /> : <Link2 className="size-4" strokeWidth={1.5} aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Link skopiowany' : 'Kopiuj link do wyceny - np. dla wspólnika'}</span>
    </button>
  )
}

function Summary({ team }: { team: AdvisorSummary[] }) {
  const quote = useQuote(s => s.quote)
  // Dialog zostaje zamontowany po pierwszym otwarciu: zamknięcie nie gubi wpisanych danych.
  const [dialog, setDialog] = useState<{ intent: LeadIntent; open: boolean } | null>(null)
  const open = (intent: LeadIntent) => setDialog({ intent, open: true })

  return (
    <div className="grid gap-6 lg:sticky lg:top-24">
      <QuoteSheet
        Lines={MotionLines}
        footer={
          <div className="mt-6 grid gap-3">
            <Button onClick={() => open('consultation')} className="w-full">Umów bezpłatną konsultację (20 min)</Button>
            <Button variant="secondary" onClick={() => open('pdf')} className="w-full" id="pdf">Pobierz wycenę PDF</Button>
            <CopyLink />
          </div>
        }
      />
      <AdvisorCard team={team} />
      {dialog && (
        <LeadDialog intent={dialog.intent} quote={quote} open={dialog.open} onOpenChange={isOpen => setDialog({ ...dialog, open: isOpen })} />
      )}
    </div>
  )
}

/** Pasek z ceną na telefonie - podsumowanie jest pod pytaniami, więc cena musi być widoczna cały czas. */
function MobileBar() {
  const quote = useQuote(s => s.quote)
  const [hidden, setHidden] = useState(false)

  // Pasek znika, gdy podsumowanie jest na ekranie albo już nad nim - nie zasłania wtedy stopki.
  useEffect(() => {
    const summary = document.getElementById('podsumowanie')
    if (!summary) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setHidden(entry.isIntersecting || entry.boundingClientRect.top < 0)
    })
    observer.observe(summary)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      aria-hidden={hidden}
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-surface/95 px-5 py-3 transition-transform duration-500 ease-calm lg:hidden',
        hidden && 'pointer-events-none translate-y-full',
      )}
    >
      <a href="#podsumowanie" className="flex items-center justify-between gap-4">
        <span className="text-sm text-ink-muted">{quote.isFromPrice ? 'Od' : 'Miesięcznie'} netto</span>
        <span className="num font-serif text-2xl text-ink">{formatPLN(quote.monthlyNet)}</span>
        <span className="text-sm text-ledger">Podsumowanie ↓</span>
      </a>
    </div>
  )
}

export function FullConfigurator({
  initial,
  priceList,
  taxYear,
  team,
}: {
  initial: QuoteInput
  priceList: PriceList
  taxYear: TaxYear
  team: AdvisorSummary[]
}) {
  return (
    <QuoteProvider initial={initial} priceList={priceList} syncUrl>
      <MotionProvider>
        <div className="grid gap-x-16 pb-24 lg:grid-cols-[1fr_26rem] lg:pb-0">
          <Questions taxYear={taxYear} />
          <div id="podsumowanie" className="scroll-mt-24 pt-8">
            <Summary team={team} />
          </div>
        </div>
        <MobileBar />
      </MotionProvider>
    </QuoteProvider>
  )
}
