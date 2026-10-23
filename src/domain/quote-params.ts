/**
 * Kodek parametrów wyceny w adresie URL.
 *
 *   /wycena?forma=jdg&podatek=skala&dok=11-20&vat=1&prac=2&dodatki=ksef
 *
 * Parsowanie jest tolerancyjne: nieznana wartość wraca do domyślnej, zamiast psuć całą wycenę.
 */
import {
  DEFAULT_QUOTE,
  DOC_BRACKETS,
  type DocBracket,
  LEGAL_FORMS,
  type LegalForm,
  normalizeQuote,
  type QuoteInput,
  TAX_FORMS,
  type TaxForm,
} from './quote'

const ADDON_ID = /^[a-z0-9-]{1,40}$/

type RawParams =URLSearchParams | Record<string, string | string[] | undefined>

function read(params: RawParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

function oneOf<T extends string>(values: readonly T[], value: string | undefined, fallback: T): T {
  return value !== undefined && (values as readonly string[]).includes(value) ? (value as T) : fallback
}

function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === '1' || value === 'tak') return true
  if (value === '0' || value === 'nie') return false
  return fallback
}

function count(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export function parseQuoteParams(params: RawParams, knownAddons?: readonly string[]): QuoteInput {
  const legalForm = oneOf<LegalForm>(LEGAL_FORMS, read(params, 'forma'), DEFAULT_QUOTE.legalForm)
  return normalizeQuote(
    {
      legalForm,
      // Spółka z o.o. bez podanego podatku to zawsze CIT - normalizacja to poprawi.
      taxForm: oneOf<TaxForm>(TAX_FORMS, read(params, 'podatek'), DEFAULT_QUOTE.taxForm),
      docs: oneOf<DocBracket>(DOC_BRACKETS, read(params, 'dok'), DEFAULT_QUOTE.docs),
      vat: flag(read(params, 'vat'), DEFAULT_QUOTE.vat),
      foreign: flag(read(params, 'zagr'), DEFAULT_QUOTE.foreign),
      employees: count(read(params, 'prac')),
      contracts: count(read(params, 'umowy')),
      addons: (read(params, 'dodatki') ?? '').split(',').filter(id => ADDON_ID.test(id)).slice(0, 10),
    },
    knownAddons,
  )
}

/**
 * Parametry podstawowe zapisujemy zawsze (link ma być czytelny dla człowieka),
 * a dodatkowe tylko wtedy, gdy różnią się od domyślnych.
 */
export function serializeQuoteParams(input: QuoteInput): URLSearchParams {
  const params = new URLSearchParams()
  params.set('forma', input.legalForm)
  params.set('podatek', input.taxForm)
  params.set('dok', input.docs)
  params.set('vat', input.vat ? '1' : '0')
  if (input.foreign) params.set('zagr', '1')
  if (input.employees > 0) params.set('prac', String(input.employees))
  if (input.contracts > 0) params.set('umowy', String(input.contracts))
  if (input.addons.length > 0) params.set('dodatki', [...input.addons].sort().join(','))
  return params
}

export function quoteHref(input: QuoteInput, pathname = '/wycena'): string {
  return `${pathname}?${serializeQuoteParams(input).toString()}`
}
