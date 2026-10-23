/** Łączenie klas bez zależności - w tym projekcie nie nadpisujemy klas Tailwinda warunkowo. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
