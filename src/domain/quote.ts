/**
 * Model wyceny: słownik parametrów konfiguratora i ich normalizacja.
 *
 * Parametry są jednocześnie stanem konfiguratora i adresem URL (/wycena?forma=jdg&dok=11-20&vat=1),
 * dlatego wszystkie wartości to krótkie, czytelne slugi.
 */
export const LEGAL_FORMS = ['zakladam', 'jdg', 'spolka-zoo', 'spolka-osobowa'] as const
export type LegalForm = (typeof LEGAL_FORMS)[number]

export const TAX_FORMS = ['ryczalt', 'skala', 'liniowy', 'cit'] as const
export type TaxForm = (typeof TAX_FORMS)[number]

export const DOC_BRACKETS = ['1-10', '11-20', '21-40', '41-100', '100+'] as const
export type DocBracket = (typeof DOC_BRACKETS)[number]
/** Przedziały z ceną w cenniku. Powyżej 100 dokumentów cena jest „od” (wycena indywidualna). */
export type PricedBracket = Exclude<DocBracket, '100+'>

export const LEDGERS = ['ewidencja', 'kpir', 'ksiegi'] as const
export type Ledger = (typeof LEDGERS)[number]

export const MAX_PEOPLE = 50

export interface QuoteInput {
  legalForm: LegalForm
  taxForm: TaxForm
  docs: DocBracket
  vat: boolean
  foreign: boolean
  employees: number
  contracts: number
  addons: string[]
}

export const DEFAULT_QUOTE: QuoteInput = {
  legalForm: 'jdg',
  taxForm: 'skala',
  docs: '11-20',
  vat: true,
  foreign: false,
  employees: 0,
  contracts: 0,
  addons: [],
}

export const LEGAL_FORM_LABELS: Record<LegalForm, string> = {
  'zakladam': 'Zakładam firmę',
  'jdg': 'JDG',
  'spolka-zoo': 'Spółka z o.o.',
  'spolka-osobowa': 'Spółka osobowa',
}

export const TAX_FORM_LABELS: Record<TaxForm, string> = {
  ryczalt: 'Ryczałt',
  skala: 'Skala',
  liniowy: 'Liniowy',
  cit: 'CIT',
}

export const DOC_BRACKET_LABELS: Record<DocBracket, string> = {
  '1-10': '1–10',
  '11-20': '11–20',
  '21-40': '21–40',
  '41-100': '41–100',
  '100+': 'więcej',
}

export const LEDGER_LABELS: Record<Ledger, string> = {
  ewidencja: 'Ewidencja przychodów',
  kpir: 'KPiR',
  ksiegi: 'Pełna księgowość',
}

/** Formy opodatkowania dostępne dla danej formy działalności. */
export function allowedTaxForms(legalForm: LegalForm): readonly TaxForm[] {
  switch (legalForm) {
    case 'spolka-zoo':
      return ['cit']
    case 'spolka-osobowa':
      return ['ryczalt', 'skala', 'liniowy', 'cit']
    default:
      return ['ryczalt', 'skala', 'liniowy']
  }
}

export function ledgerFor(taxForm: TaxForm): Ledger {
  if (taxForm === 'ryczalt') return 'ewidencja'
  if (taxForm === 'cit') return 'ksiegi'
  return 'kpir'
}

/**
 * Usuwa niemożliwe kombinacje, zamiast je odrzucać. Link wysłany wspólnikowi ma się zawsze otworzyć,
 * nawet jeśli ktoś ręcznie poprawi adres na „JDG + CIT”.
 */
export function normalizeQuote(input: QuoteInput, knownAddons?: readonly string[]): QuoteInput {
  const allowed = allowedTaxForms(input.legalForm)
  const taxForm = allowed.includes(input.taxForm) ? input.taxForm : (allowed.includes('skala') ? 'skala' : allowed[0]!)
  const clamp = (n: number) => Math.min(MAX_PEOPLE, Math.max(0, Math.trunc(Number.isFinite(n) ? n : 0)))
  const addons = [...new Set(input.addons)]
    .filter(id => !knownAddons || knownAddons.includes(id))
    .sort()
  return {
    ...input,
    taxForm,
    employees: clamp(input.employees),
    contracts: clamp(input.contracts),
    addons,
  }
}

