import { describe, expect, it } from 'vitest'
import { priceListFixture as priceList } from '@/content/fixtures/price-list'
import { calculateQuote } from './pricing'
import { DEFAULT_QUOTE, DOC_BRACKETS, LEGAL_FORMS, type QuoteInput, TAX_FORMS } from './quote'
import { zl } from './money'

const quote = (overrides: Partial<QuoteInput>) => calculateQuote({ ...DEFAULT_QUOTE, ...overrides }, priceList)

describe('calculateQuote - kombinacje z cennika', () => {
  // Oczekiwane kwoty policzone ręcznie z cennika startowego (src/content/fixtures/price-list.ts).
  const cases: Array<[string, Partial<QuoteInput>, number]> = [
    ['JDG, skala, 11-20, VAT', { legalForm: 'jdg', taxForm: 'skala', docs: '11-20', vat: true }, 469 + 70],
    ['JDG, ryczałt, 1-10, bez VAT', { legalForm: 'jdg', taxForm: 'ryczalt', docs: '1-10', vat: false }, 279],
    ['JDG, liniowy, 21-40, bez VAT', { legalForm: 'jdg', taxForm: 'liniowy', docs: '21-40', vat: false }, 599],
    ['JDG, ryczałt, 41-100, VAT', { legalForm: 'jdg', taxForm: 'ryczalt', docs: '41-100', vat: true }, 849 + 127],
    ['Spółka z o.o., 1-10, bez VAT', { legalForm: 'spolka-zoo', taxForm: 'cit', docs: '1-10', vat: false }, 1390],
    ['Spółka z o.o., 11-20, VAT', { legalForm: 'spolka-zoo', taxForm: 'cit', docs: '11-20', vat: true }, 1690 + 254],
    ['Spółka z o.o., 21-40, VAT + zagranica', { legalForm: 'spolka-zoo', taxForm: 'cit', docs: '21-40', vat: true, foreign: true }, 2090 + 314 + 314],
    ['Spółka z o.o., 41-100, bez VAT', { legalForm: 'spolka-zoo', taxForm: 'cit', docs: '41-100', vat: false }, 3590],
    ['Spółka osobowa, liniowy, 11-20, VAT', { legalForm: 'spolka-osobowa', taxForm: 'liniowy', docs: '11-20', vat: true }, 469 + 94 + 84],
    ['Spółka osobowa, CIT, 1-10, bez VAT', { legalForm: 'spolka-osobowa', taxForm: 'cit', docs: '1-10', vat: false }, 1390 + 278],
    ['JDG, 3 pracowników i 2 umowy', { legalForm: 'jdg', taxForm: 'skala', docs: '1-10', vat: false, employees: 3, contracts: 2 }, 359 + 357 + 138],
    ['JDG, zagranica bez VAT', { legalForm: 'jdg', taxForm: 'skala', docs: '1-10', vat: false, foreign: true }, 359 + 54],
    ['Zakładam firmę, ryczałt, 1-10', { legalForm: 'zakladam', taxForm: 'ryczalt', docs: '1-10', vat: false }, 279],
    ['Spółka z o.o. z raportem zarządczym', { legalForm: 'spolka-zoo', taxForm: 'cit', docs: '1-10', vat: false, addons: ['raport'] }, 1390 + 149],
  ]

  it.each(cases)('%s', (_label, input, expected) => {
    expect(quote(input).monthlyNet).toBe(zl(expected))
  })

  it('powyżej 100 dokumentów liczy cenę „od” z najwyższego przedziału', () => {
    const result = quote({ legalForm: 'jdg', taxForm: 'skala', docs: '100+', vat: true })
    expect(result.isFromPrice).toBe(true)
    expect(result.monthlyNet).toBe(zl(1290 + 194))
    expect(result.monthly[0]!.detail).toMatch(/indywidualnie/)
  })

  it('brzegi przedziałów dokumentów dają kolejne stawki cennika', () => {
    const prices = (['1-10', '11-20', '21-40', '41-100'] as const).map(docs => quote({ legalForm: 'spolka-zoo', taxForm: 'cit', docs, vat: false }).monthlyNet)
    expect(prices).toEqual([zl(1390), zl(1690), zl(2090), zl(3590)])
  })

  it('brutto to netto + 23% VAT', () => {
    const result = quote({ legalForm: 'jdg', taxForm: 'skala', docs: '11-20', vat: true })
    expect(result.monthlyGross).toBe(Math.round(zl(539) * 1.23))
  })

  it('zakładanie firmy dodaje bezpłatną rejestrację, a KSeF jest jednorazowy', () => {
    const result = quote({ legalForm: 'zakladam', taxForm: 'ryczalt', docs: '1-10', vat: false, addons: ['ksef'] })
    expect(result.oneOff.map(l => l.id)).toEqual(['startup', 'addon:ksef'])
    expect(result.oneOffNet).toBe(zl(490))
    expect(result.monthlyNet).toBe(zl(279))
  })
})

describe('calculateQuote - normalizacja wejścia', () => {
  it('JDG nie może mieć CIT - wraca do skali', () => {
    expect(quote({ legalForm: 'jdg', taxForm: 'cit' }).input.taxForm).toBe('skala')
  })

  it('spółka z o.o. zawsze rozlicza się w CIT i pełnej księgowości', () => {
    const result = quote({ legalForm: 'spolka-zoo', taxForm: 'ryczalt' })
    expect(result.input.taxForm).toBe('cit')
    expect(result.ledger).toBe('ksiegi')
  })

  it('dodatek niedostępny dla formy działalności wypada z wyceny', () => {
    const result = quote({ legalForm: 'jdg', addons: ['raport', 'nieznany'] })
    expect(result.input.addons).toEqual([])
    expect(result.monthly.some(l => l.kind === 'addon')).toBe(false)
  })

  it('liczba osób jest obcinana do 0-50', () => {
    expect(quote({ employees: 999, contracts: -4 }).input).toMatchObject({ employees: 50, contracts: 0 })
  })
})

describe('calculateQuote - niezmienniki dla wszystkich kombinacji', () => {
  const combos = LEGAL_FORMS.flatMap(legalForm => TAX_FORMS.flatMap(taxForm => DOC_BRACKETS.flatMap(docs =>
    [false, true].flatMap(vat => [false, true].map(foreign => ({ legalForm, taxForm, docs, vat, foreign, employees: 2, contracts: 1 })))),
  ))

  it(`suma = suma pozycji, kwoty w pełnych złotych (${combos.length} kombinacji)`, () => {
    for (const input of combos) {
      const result = quote(input)
      expect(result.monthlyNet).toBe(result.monthly.reduce((sum, line) => sum + line.amount, 0))
      expect(result.monthly.every(line => line.amount % 100 === 0)).toBe(true)
      expect(result.monthlyNet).toBeGreaterThan(0)
    }
  })

  it('VAT i zagranica nigdy nie obniżają ceny', () => {
    for (const input of combos.filter(c => !c.vat && !c.foreign)) {
      const plain = quote(input).monthlyNet
      expect(quote({ ...input, vat: true }).monthlyNet).toBeGreaterThanOrEqual(plain)
      expect(quote({ ...input, vat: true, foreign: true }).monthlyNet).toBeGreaterThan(plain)
    }
  })
})
