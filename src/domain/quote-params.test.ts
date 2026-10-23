import { describe, expect, it } from 'vitest'
import { parseQuoteParams, quoteHref, serializeQuoteParams } from './quote-params'
import { DEFAULT_QUOTE, type QuoteInput } from './quote'

describe('parametry wyceny w URL', () => {
  it('czyta przykład z planu: /wycena?forma=jdg&dok=11-20&vat=1', () => {
    const input = parseQuoteParams(new URLSearchParams('forma=jdg&dok=11-20&vat=1'))
    expect(input).toMatchObject({ legalForm: 'jdg', docs: '11-20', vat: true, taxForm: 'skala' })
  })

  it('przyjmuje obiekt searchParams z Next.js (wartości tablicowe)', () => {
    const input = parseQuoteParams({ forma: ['spolka-zoo', 'jdg'], dok: '41-100' })
    expect(input).toMatchObject({ legalForm: 'spolka-zoo', taxForm: 'cit', docs: '41-100' })
  })

  it('śmieci w adresie wracają do wartości domyślnych', () => {
    const input = parseQuoteParams(new URLSearchParams('forma=lol&dok=7&vat=może&prac=abc&dodatki=<script>'))
    expect(input).toEqual({ ...DEFAULT_QUOTE, addons: [] })
  })

  it('odfiltrowuje nieznane dodatki, gdy zna listę z cennika', () => {
    const input = parseQuoteParams(new URLSearchParams('dodatki=ksef,raport,xyz'), ['ksef', 'raport'])
    expect(input.addons).toEqual(['ksef', 'raport'])
  })

  it('serializacja i odczyt dają ten sam stan', () => {
    const input: QuoteInput = {
      legalForm: 'spolka-osobowa',
      taxForm: 'liniowy',
      docs: '21-40',
      vat: true,
      foreign: true,
      employees: 4,
      contracts: 2,
      addons: ['raport', 'ksef'],
    }
    const roundTrip = parseQuoteParams(serializeQuoteParams(input))
    expect(roundTrip).toEqual({ ...input, addons: ['ksef', 'raport'] })
  })

  it('pomija w linku parametry równe domyślnym', () => {
    expect(quoteHref(DEFAULT_QUOTE)).toBe('/wycena?forma=jdg&podatek=skala&dok=11-20&vat=1')
  })
})
