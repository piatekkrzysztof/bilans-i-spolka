/**
 * Kwoty w całej domenie są liczbami całkowitymi w groszach. Ułamki pojawiają się tylko w mnożnikach
 * i są zaokrąglane w jednym miejscu, więc suma pozycji zawsze równa się sumie wyceny.
 */
export type Grosze = number

export const zl = (amount: number): Grosze => Math.round(amount * 100)

/** Zaokrąglenie do pełnych złotych - biura podają ceny miesięczne bez groszy. */
export const roundToZloty = (value: Grosze): Grosze => Math.round(value / 100) * 100

export function grossFromNet(net: Grosze, vatRate: number): Grosze {
  return Math.round(net * (1 + vatRate))
}

const formatters = new Map<string, Intl.NumberFormat>()

function formatter(fractionDigits: number) {
  const key = String(fractionDigits)
  let instance = formatters.get(key)
  if (!instance) {
    instance = new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping: true,
    })
    formatters.set(key, instance)
  }
  return instance
}

/**
 * „1 290 zł”, a dla kwot z groszami „93,30 zł”. Intl w pl-PL nie grupuje liczb czterocyfrowych
 * (1290), więc separator tysięcy wstawiamy sami - w tabelach kolumny muszą się zgadzać.
 */
export function formatAmount(value: Grosze, { forceDecimals = false } = {}): string {
  const hasGrosze = value % 100 !== 0
  const digits = hasGrosze || forceDecimals ? 2 : 0
  const formatted = formatter(digits).format(value / 100)
  return formatted.replace(/^(-?\d)(\d{3})(?=,|$)/, '$1 $2').replace(/ |\s/g, ' ')
}

export function formatPLN(value: Grosze, options?: { forceDecimals?: boolean }): string {
  return `${formatAmount(value, options)} zł`
}
