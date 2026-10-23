'use client'

import Link from 'next/link'
import { buttonClass } from '@/components/ui/button'
import type { PriceList } from '@/domain/pricing'
import { DEFAULT_QUOTE, DOC_BRACKET_LABELS, DOC_BRACKETS, LEGAL_FORM_LABELS, LEGAL_FORMS } from '@/domain/quote'
import { quoteHref } from '@/domain/quote-params'
import { QuoteProvider, useQuote } from './quote-store'
import { QuoteSheet } from './quote-sheet'
import { Segmented } from './segmented'

const legalOptions = LEGAL_FORMS.map(value => ({ value, label: LEGAL_FORM_LABELS[value] }))
const docOptions = DOC_BRACKETS.map(value => ({ value, label: DOC_BRACKET_LABELS[value] }))
const vatOptions = [
  { value: 'tak', label: 'Tak' },
  { value: 'nie', label: 'Nie' },
] as const

function HeroQuestions() {
  const input = useQuote(s => s.input)
  const update = useQuote(s => s.update)

  return (
    <QuoteSheet
      compact
      title="Wycena w 3 pytaniach"
      footer={
        <Link href={quoteHref(input)} className={buttonClass('primary', 'mt-5 w-full')}>
          Rozpisz pełną wycenę <span aria-hidden="true">→</span>
        </Link>
      }
    >
      <fieldset className="grid gap-4 border-b border-rule pb-5 pt-4">
        <legend className="sr-only">Parametry firmy</legend>
        <Segmented size="sm" label="Forma działalności" options={legalOptions} value={input.legalForm} onChange={legalForm => update({ legalForm })} wrap />
        <Segmented size="sm" label="Dokumenty miesięcznie" options={docOptions} value={input.docs} onChange={docs => update({ docs })} />
        <Segmented size="sm" label="Płacisz VAT?" options={vatOptions} value={input.vat ? 'tak' : 'nie'} onChange={v => update({ vat: v === 'tak' })} />
      </fieldset>
    </QuoteSheet>
  )
}

/** Skrócony konfigurator w hero: 3 pytania, cena na żywo, przejście do pełnej wyceny z tymi samymi parametrami. */
export function HeroConfigurator({ priceList }: { priceList: PriceList }) {
  return (
    <QuoteProvider initial={DEFAULT_QUOTE} priceList={priceList}>
      <HeroQuestions />
    </QuoteProvider>
  )
}
