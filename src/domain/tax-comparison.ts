/**
 * Porównywarka form opodatkowania JDG: skala, liniowy, ryczałt.
 *
 * To szacunek roczny, nie rozliczenie. Świadome uproszczenia (opisane na stronie i w ADR-004):
 * - przychód i koszty rozkładają się równo na 12 miesięcy,
 * - składka zdrowotna liczona od rocznego dochodu, z miesięcznym minimum,
 * - bez ulg (IP Box, ulga na dzieci, wspólne rozliczenie) i bez przekroczenia limitu 2 mln euro na ryczałcie.
 *
 * Wszystkie stawki pochodzą z obiektu `TaxYear` (Sanity, z datą obowiązywania), a nie z kodu.
 */
import type { Grosze } from './money'

export type ZusStage = 'start' | 'preferencyjny' | 'pelny'
export type ComparedForm = 'skala' | 'liniowy' | 'ryczalt'

export interface FlatRateOption {
  id: string
  label: string
  rate: number
}

export interface TaxYear {
  year: number
  validFrom: string
  /** Data ostatniej weryfikacji stawek - pokazywana pod wynikiem. */
  verifiedAt: string
  minimumWage: Grosze
  zus: {
    fullBase: Grosze
    preferentialBase: Grosze
    rates: { pension: number; disability: number; sickness: number; accident: number; labourFund: number }
  }
  health: {
    scaleRate: number
    linearRate: number
    monthlyMinimum: Grosze
    linearAnnualDeductionLimit: Grosze
    /** Progi rocznego przychodu dla ryczałtu; ostatni próg ma `upTo: null`. */
    flatRateTiers: { upTo: Grosze | null; monthly: Grosze }[]
    flatRateDeductibleShare: number
  }
  pit: {
    scaleThreshold: Grosze
    scaleLowRate: number
    scaleHighRate: number
    taxReducingAmount: Grosze
    linearRate: number
    solidarityThreshold: Grosze
    solidarityRate: number
  }
  flatRates: FlatRateOption[]
}

export interface ComparisonInput {
  annualRevenue: Grosze
  annualCosts: Grosze
  flatRateId: string
  zusStage: ZusStage
  sickness: boolean
}

export interface FormResult {
  form: ComparedForm
  social: Grosze
  health: Grosze
  tax: Grosze
  /** Podatek + ZUS społeczny + zdrowotna. */
  burden: Grosze
  netIncome: Grosze
  monthlyNet: Grosze
  /** Widełki obciążeń przy przychodzie i kosztach ±10%. */
  burdenRange: [Grosze, Grosze]
}

export interface ComparisonResult {
  results: FormResult[]
  best: ComparedForm
  flatRate: FlatRateOption
}

export const RANGE_SPREAD = 0.1

const roundZl = (value: number) => Math.round(value / 100) * 100

/** Miesięczne składki społeczne dla danej podstawy (każda składka zaokrąglana osobno, jak w ZUS). */
export function monthlySocial(base: Grosze, year: TaxYear, { sickness, labourFund }: { sickness: boolean; labourFund: boolean }): Grosze {
  const r = year.zus.rates
  const parts = [r.pension, r.disability, r.accident, sickness ? r.sickness : 0, labourFund ? r.labourFund : 0]
  return parts.reduce((sum, rate) => sum + Math.round(base * rate), 0)
}

/** Składki społeczne za pierwszy rok w danym etapie. Ulga na start: 6 mies. bez składek, potem preferencyjny. */
export function annualSocial(stage: ZusStage, sickness: boolean, year: TaxYear): Grosze {
  const preferential = monthlySocial(year.zus.preferentialBase, year, { sickness, labourFund: false })
  const full = monthlySocial(year.zus.fullBase, year, { sickness, labourFund: true })
  switch (stage) {
    case 'start':
      return 6 * preferential
    case 'preferencyjny':
      return 12 * preferential
    case 'pelny':
      return 12 * full
  }
}

function solidarity(income: Grosze, year: TaxYear): Grosze {
  return Math.max(0, income - year.pit.solidarityThreshold) * year.pit.solidarityRate
}

function scale(revenue: Grosze, costs: Grosze, social: Grosze, year: TaxYear) {
  const income = Math.max(0, revenue - costs - social)
  const health = Math.max(income * year.health.scaleRate, 12 * year.health.monthlyMinimum)
  const { scaleThreshold, scaleLowRate, scaleHighRate, taxReducingAmount } = year.pit
  const base = roundZl(income)
  const gross = Math.min(base, scaleThreshold) * scaleLowRate + Math.max(0, base - scaleThreshold) * scaleHighRate
  const tax = Math.max(0, gross - taxReducingAmount) + solidarity(base, year)
  return { health: Math.round(health), tax: roundZl(tax) }
}

function linear(revenue: Grosze, costs: Grosze, social: Grosze, year: TaxYear) {
  const income = Math.max(0, revenue - costs - social)
  const health = Math.max(income * year.health.linearRate, 12 * year.health.monthlyMinimum)
  const deductible = Math.min(health, year.health.linearAnnualDeductionLimit)
  const base = roundZl(Math.max(0, income - deductible))
  const tax = base * year.pit.linearRate + solidarity(base, year)
  return { health: Math.round(health), tax: roundZl(tax) }
}

export function flatRateHealthMonthly(revenue: Grosze, year: TaxYear): Grosze {
  const tier = year.health.flatRateTiers.find(t => t.upTo === null || revenue <= t.upTo)
  return (tier ?? year.health.flatRateTiers.at(-1)!).monthly
}

function flat(revenue: Grosze, social: Grosze, rate: number, year: TaxYear) {
  const health = 12 * flatRateHealthMonthly(revenue, year)
  const base = roundZl(Math.max(0, revenue - social - health * year.health.flatRateDeductibleShare))
  return { health, tax: roundZl(base * rate) }
}

function burdenFor(form: ComparedForm, revenue: Grosze, costs: Grosze, social: Grosze, rate: number, year: TaxYear) {
  const { health, tax } = form === 'skala'
    ? scale(revenue, costs, social, year)
    : form === 'liniowy'
      ? linear(revenue, costs, social, year)
      : flat(revenue, social, rate, year)
  return { health, tax, burden: social + health + tax }
}

export function compareTaxForms(input: ComparisonInput, year: TaxYear): ComparisonResult {
  const flatRate = year.flatRates.find(r => r.id === input.flatRateId) ?? year.flatRates[0]!
  const revenue = Math.max(0, input.annualRevenue)
  const costs = Math.min(Math.max(0, input.annualCosts), revenue)
  const social = annualSocial(input.zusStage, input.sickness, year)

  const forms: ComparedForm[] = ['skala', 'liniowy', 'ryczalt']
  const results = forms.map((form): FormResult => {
    const central = burdenFor(form, revenue, costs, social, flatRate.rate, year)
    const low = burdenFor(form, revenue * (1 - RANGE_SPREAD), costs * (1 - RANGE_SPREAD), social, flatRate.rate, year)
    const high = burdenFor(form, revenue * (1 + RANGE_SPREAD), costs * (1 + RANGE_SPREAD), social, flatRate.rate, year)
    const netIncome = revenue - costs - central.burden
    return {
      form,
      social,
      health: central.health,
      tax: central.tax,
      burden: central.burden,
      netIncome,
      monthlyNet: Math.round(netIncome / 12),
      burdenRange: [Math.min(low.burden, high.burden), Math.max(low.burden, high.burden)],
    }
  })

  const best = results.reduce((a, b) => (b.netIncome > a.netIncome ? b : a)).form
  return { results, best, flatRate }
}
