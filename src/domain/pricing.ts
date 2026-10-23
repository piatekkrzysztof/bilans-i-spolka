/**
 * Silnik wyceny - czysta funkcja, wspólna dla przeglądarki (cena na żywo) i serwera (zapis leada).
 *
 *   cena = baza(forma, dokumenty) · m_VAT + p · c_pracownik + u · c_umowa + dodatki
 *
 * Cennik to dane (Sanity), nie kod. Ten moduł zna tylko kształt cennika, nie jego wartości.
 */
import { type Grosze, grossFromNet, roundToZloty } from './money'
import {
  DOC_BRACKET_LABELS,
  LEDGER_LABELS,
  type Ledger,
  ledgerFor,
  normalizeQuote,
  type PricedBracket,
  type QuoteInput,
} from './quote'

export interface PriceListAddon {
  id: string
  label: string
  description: string
  price: Grosze
  billing: 'monthly' | 'one-off'
  /** Puste = dostępny dla wszystkich form działalności. */
  appliesTo: QuoteInput['legalForm'][]
}

export interface PriceList {
  /** Identyfikator wersji zapisywany przy każdej wycenie - wiadomo, z którego cennika powstała. */
  version: string
  validFrom: string
  vatRate: number
  base: Record<Ledger, Record<PricedBracket, Grosze>>
  /** Rozliczenie wspólników w spółce osobowej - mnożnik na bazie. */
  partnershipMultiplier: number
  vatSurcharge: number
  foreignSurcharge: number
  perEmployee: Grosze
  perCivilContract: Grosze
  /** Rejestracja firmy dla osób, które dopiero ją zakładają - dodawana automatycznie. */
  startupSetup: { label: string; price: Grosze }
  addons: PriceListAddon[]
}

export type LineKind = 'base' | 'partnership' | 'vat' | 'foreign' | 'employees' | 'contracts' | 'addon'

export interface QuoteLine {
  id: string
  kind: LineKind
  label: string
  detail?: string
  quantity?: number
  unitPrice?: Grosze
  amount: Grosze
}

export interface Quote {
  input: QuoteInput
  ledger: Ledger
  monthly: QuoteLine[]
  oneOff: QuoteLine[]
  monthlyNet: Grosze
  monthlyGross: Grosze
  oneOffNet: Grosze
  oneOffGross: Grosze
  /** Powyżej 100 dokumentów pokazujemy cenę „od” i zapraszamy do rozmowy. */
  isFromPrice: boolean
  priceListVersion: string
}

const pct = (value: number) => `+${Math.round(value * 100)}%`

export function availableAddons(priceList: PriceList, legalForm: QuoteInput['legalForm']): PriceListAddon[] {
  return priceList.addons.filter(a => a.appliesTo.length === 0 || a.appliesTo.includes(legalForm))
}

export function calculateQuote(rawInput: QuoteInput, priceList: PriceList): Quote {
  const normalized = normalizeQuote(rawInput, priceList.addons.map(a => a.id))
  const offered = availableAddons(priceList, normalized.legalForm)
  // Dodatek wybrany przy innej formie działalności (np. raport dla spółki, potem zmiana na JDG) wypada z wyceny.
  const input: QuoteInput = { ...normalized, addons: normalized.addons.filter(id => offered.some(a => a.id === id)) }
  const ledger = ledgerFor(input.taxForm)
  const isFromPrice = input.docs === '100+'
  const bracket: PricedBracket = input.docs === '100+' ? '41-100' : input.docs

  const monthly: QuoteLine[] = []
  const tableBase = priceList.base[ledger][bracket]

  monthly.push({
    id: 'base',
    kind: 'base',
    label: `${LEDGER_LABELS[ledger]}, ${DOC_BRACKET_LABELS[input.docs]} dok.`,
    detail: isFromPrice ? 'cena od - powyżej 100 dokumentów wyceniamy indywidualnie' : undefined,
    amount: roundToZloty(tableBase),
  })

  // Mnożniki liczymy od bazy z cennika, a każdą pozycję zaokrąglamy osobno -
  // dzięki temu suma zawsze równa się sumie wierszy, jak na prawdziwej fakturze.
  let base = tableBase
  if (input.legalForm === 'spolka-osobowa' && priceList.partnershipMultiplier > 1) {
    const surcharge = tableBase * (priceList.partnershipMultiplier - 1)
    base = tableBase * priceList.partnershipMultiplier
    monthly.push({
      id: 'partnership',
      kind: 'partnership',
      label: 'Rozliczenie wspólników',
      detail: pct(priceList.partnershipMultiplier - 1),
      amount: roundToZloty(surcharge),
    })
  }

  if (input.vat) {
    monthly.push({
      id: 'vat',
      kind: 'vat',
      label: 'Rozliczenie VAT i JPK',
      detail: pct(priceList.vatSurcharge),
      amount: roundToZloty(base * priceList.vatSurcharge),
    })
  }

  if (input.foreign) {
    monthly.push({
      id: 'foreign',
      kind: 'foreign',
      label: 'Transakcje zagraniczne',
      detail: pct(priceList.foreignSurcharge),
      amount: roundToZloty(base * priceList.foreignSurcharge),
    })
  }

  if (input.employees > 0) {
    monthly.push({
      id: 'employees',
      kind: 'employees',
      label: 'Kadry i płace',
      quantity: input.employees,
      unitPrice: priceList.perEmployee,
      amount: roundToZloty(priceList.perEmployee * input.employees),
    })
  }

  if (input.contracts > 0) {
    monthly.push({
      id: 'contracts',
      kind: 'contracts',
      label: 'Umowy cywilnoprawne',
      quantity: input.contracts,
      unitPrice: priceList.perCivilContract,
      amount: roundToZloty(priceList.perCivilContract * input.contracts),
    })
  }

  const oneOff: QuoteLine[] = []
  if (input.legalForm === 'zakladam') {
    oneOff.push({
      id: 'startup',
      kind: 'addon',
      label: priceList.startupSetup.label,
      amount: roundToZloty(priceList.startupSetup.price),
    })
  }
  for (const addon of offered) {
    if (!input.addons.includes(addon.id)) continue
    const line: QuoteLine = {
      id: `addon:${addon.id}`,
      kind: 'addon',
      label: addon.label,
      amount: roundToZloty(addon.price),
    }
    if (addon.billing === 'monthly') monthly.push(line)
    else oneOff.push(line)
  }

  const sum = (lines: QuoteLine[]) => lines.reduce((total, line) => total + line.amount, 0)
  const monthlyNet = sum(monthly)
  const oneOffNet = sum(oneOff)

  return {
    input,
    ledger,
    monthly,
    oneOff,
    monthlyNet,
    monthlyGross: grossFromNet(monthlyNet, priceList.vatRate),
    oneOffNet,
    oneOffGross: grossFromNet(oneOffNet, priceList.vatRate),
    isFromPrice,
    priceListVersion: priceList.version,
  }
}
