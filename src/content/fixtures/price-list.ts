import type { PriceList } from '@/domain/pricing'
import { zl } from '@/domain/money'

/**
 * Cennik startowy. Punkt odniesienia: średnie ceny netto biur w Krakowie, kwiecień 2026 (kb.pl).
 * Fikcyjne biuro jest ok. 8-10% tańsze od średniej; ryczałt ustawiony poniżej KPiR.
 * Na produkcji te wartości edytuje się w Sanity (dokument `priceList`).
 */
export const priceListFixture: PriceList = {
  version: '2026-10',
  validFrom: '2026-10-01',
  vatRate: 0.23,
  base: {
    ewidencja: { '1-10': zl(279), '11-20': zl(349), '21-40': zl(449), '41-100': zl(849) },
    kpir: { '1-10': zl(359), '11-20': zl(469), '21-40': zl(599), '41-100': zl(1290) },
    ksiegi: { '1-10': zl(1390), '11-20': zl(1690), '21-40': zl(2090), '41-100': zl(3590) },
  },
  partnershipMultiplier: 1.2,
  vatSurcharge: 0.15,
  foreignSurcharge: 0.15,
  perEmployee: zl(119),
  perCivilContract: zl(69),
  startupSetup: { label: 'Rejestracja firmy i wybór formy opodatkowania', price: 0 },
  addons: [
    {
      id: 'ksef',
      label: 'Wdrożenie KSeF',
      description: 'Uprawnienia, połączenie programu do faktur z KSeF, procedura na awarię i 45 minut szkolenia.',
      price: zl(490),
      billing: 'one-off',
      appliesTo: [],
    },
    {
      id: 'raport',
      label: 'Raport zarządczy co miesiąc',
      description: 'Wynik, płynność i podatki do zapłaty na jednej stronie - do 10. dnia miesiąca.',
      price: zl(149),
      billing: 'monthly',
      appliesTo: ['spolka-zoo', 'spolka-osobowa'],
    },
    {
      id: 'pit-roczny',
      label: 'Roczne zeznanie PIT właściciela',
      description: 'PIT-36, PIT-36L lub PIT-28 z ulgami - rozliczany raz w roku, płatny miesięcznie.',
      price: zl(19),
      billing: 'monthly',
      appliesTo: ['zakladam', 'jdg', 'spolka-osobowa'],
    },
  ],
}
