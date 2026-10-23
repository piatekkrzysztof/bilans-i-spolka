import type { TaxYear } from '@/domain/tax-comparison'
import { zl } from '@/domain/money'

/**
 * Stawki 2026. Źródła: komunikaty ZUS, obwieszczenie MF z 17.12.2025 (limit odliczenia zdrowotnej
 * na liniowym), ustawa o zryczałtowanym podatku dochodowym. Na produkcji - dokument `taxYear` w Sanity.
 */
export const taxYear2026: TaxYear = {
  year: 2026,
  validFrom: '2026-01-01',
  verifiedAt: '2026-10-22',
  minimumWage: zl(4806),
  zus: {
    // 60% prognozowanego przeciętnego wynagrodzenia (9 420 zł) i 30% płacy minimalnej.
    fullBase: zl(5652),
    preferentialBase: zl(1441.8),
    rates: { pension: 0.1952, disability: 0.08, sickness: 0.0245, accident: 0.0167, labourFund: 0.0245 },
  },
  health: {
    scaleRate: 0.09,
    linearRate: 0.049,
    monthlyMinimum: zl(432.54),
    linearAnnualDeductionLimit: zl(14100),
    flatRateTiers: [
      { upTo: zl(60000), monthly: zl(498.35) },
      { upTo: zl(300000), monthly: zl(830.58) },
      { upTo: null, monthly: zl(1495.04) },
    ],
    flatRateDeductibleShare: 0.5,
  },
  pit: {
    scaleThreshold: zl(120000),
    scaleLowRate: 0.12,
    scaleHighRate: 0.32,
    taxReducingAmount: zl(3600),
    linearRate: 0.19,
    solidarityThreshold: zl(1000000),
    solidarityRate: 0.04,
  },
  flatRates: [
    { id: 'it', label: 'Programowanie i usługi IT', rate: 0.12 },
    { id: 'uslugi', label: 'Usługi ogólne (np. naprawy, transport, szkolenia)', rate: 0.085 },
    { id: 'reklama', label: 'Reklama i pośrednictwo', rate: 0.15 },
    { id: 'budowlane', label: 'Budowlanka i remonty', rate: 0.055 },
    { id: 'handel', label: 'Handel i produkcja', rate: 0.03 },
    { id: 'zdrowie', label: 'Usługi medyczne, architekci, inżynierowie', rate: 0.14 },
  ],
}
