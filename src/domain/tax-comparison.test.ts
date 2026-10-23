import { describe, expect, it } from 'vitest'
import { taxYear2026 as year } from '@/content/fixtures/tax-year'
import { annualSocial, compareTaxForms, flatRateHealthMonthly, monthlySocial } from './tax-comparison'
import { zl } from './money'

describe('składki ZUS 2026', () => {
  it('pełny ZUS: 1 926,76 zł z chorobowym, 1 788,29 zł bez', () => {
    expect(monthlySocial(year.zus.fullBase, year, { sickness: true, labourFund: true })).toBe(zl(1926.76))
    expect(monthlySocial(year.zus.fullBase, year, { sickness: false, labourFund: true })).toBe(zl(1788.29))
  })

  it('preferencyjny ZUS bez Funduszu Pracy: 456,18 zł z chorobowym', () => {
    expect(monthlySocial(year.zus.preferentialBase, year, { sickness: true, labourFund: false })).toBe(zl(456.18))
  })

  it('ulga na start to 6 miesięcy bez składek społecznych', () => {
    expect(annualSocial('start', true, year)).toBe(6 * zl(456.18))
  })

  it('zdrowotna na ryczałcie zależy od progu przychodu', () => {
    expect(flatRateHealthMonthly(zl(60000), year)).toBe(zl(498.35))
    expect(flatRateHealthMonthly(zl(60000.01), year)).toBe(zl(830.58))
    expect(flatRateHealthMonthly(zl(300000.01), year)).toBe(zl(1495.04))
  })
})

describe('compareTaxForms', () => {
  const base = { annualCosts: 0, flatRateId: 'it', zusStage: 'pelny' as const, sickness: false }

  it('liczy dokładnie przypadek wzorcowy: 100 tys. przychodu, bez kosztów, IT 12%', () => {
    const { results } = compareTaxForms({ ...base, annualRevenue: zl(100000) }, year)
    const byForm = Object.fromEntries(results.map(r => [r.form, r]))
    // Wyliczenia krok po kroku: docs/ADR.md, ADR-004.
    expect(byForm.skala).toMatchObject({ social: 2145948, health: 706865, tax: 582500, burden: 3435313 })
    expect(byForm.liniowy).toMatchObject({ health: 519048, tax: 1393700, burden: 4058696 })
    expect(byForm.ryczalt).toMatchObject({ health: 996696, tax: 882700, burden: 4025344 })
  })

  it('przy niskim dochodzie wygrywa skala (kwota wolna)', () => {
    const { best } = compareTaxForms({ ...base, annualRevenue: zl(70000), annualCosts: zl(20000) }, year)
    expect(best).toBe('skala')
  })

  it('przy wysokim przychodzie i niskich kosztach IT wygrywa ryczałt 12%', () => {
    const { best } = compareTaxForms({ ...base, annualRevenue: zl(300000), annualCosts: zl(15000) }, year)
    expect(best).toBe('ryczalt')
  })

  it('przy wysokich kosztach ryczałt przestaje się opłacać', () => {
    const { best } = compareTaxForms({ ...base, annualRevenue: zl(400000), annualCosts: zl(250000) }, year)
    expect(best).not.toBe('ryczalt')
  })

  it('widełki obejmują wynik centralny', () => {
    const { results } = compareTaxForms({ ...base, annualRevenue: zl(180000), annualCosts: zl(40000) }, year)
    for (const r of results) {
      expect(r.burdenRange[0]).toBeLessThanOrEqual(r.burden)
      expect(r.burdenRange[1]).toBeGreaterThanOrEqual(r.burden)
    }
  })

  it('koszty większe niż przychód są obcinane, a nieznana branża wraca do pierwszej', () => {
    const result = compareTaxForms({ ...base, annualRevenue: zl(10000), annualCosts: zl(50000), flatRateId: 'nie-ma' }, year)
    expect(result.flatRate.id).toBe('it')
    expect(result.results.every(r => Number.isFinite(r.netIncome))).toBe(true)
  })
})
