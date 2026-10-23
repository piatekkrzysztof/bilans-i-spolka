const dateFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' })

/** „22 października 2026” z daty ISO. Strefa ustalona, żeby SSR i przeglądarka dawały ten sam tekst. */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(`${iso.slice(0, 10)}T12:00:00Z`))
}

/** Polska odmiana liczebników: 1 dzień, 2 dni, 5 dni / 1 dokument, 3 dokumenty, 12 dokumentów. */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one
  const lastTwo = n % 100
  const last = n % 10
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few
  return many
}
