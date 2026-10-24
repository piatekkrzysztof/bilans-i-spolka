import type { Faq } from '@/content/types'

/**
 * FAQ na natywnym <details name> - akordeon „jeden otwarty naraz” bez JavaScriptu (ADR-007).
 * Przeglądarka sama obsługuje klawiaturę i stan rozwinięcia, treść jest w HTML dla wyszukiwarek.
 * Otwarte pytanie odwraca kolory nagłówka - stan widać bez polegania na ikonie.
 */
export function FaqList({ items, name = 'faq' }: { items: Faq[]; name?: string }) {
  return (
    <div className="border-2 border-ink">
      {items.map((item, index) => (
        <details key={item.question} name={name} className="group border-b border-ink last:border-b-0">
          <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 px-4 py-4 text-base font-medium text-ink transition-colors duration-150 hover:bg-ledger-soft group-open:bg-ink group-open:text-paper md:text-lg [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="num w-8 shrink-0 text-xs font-bold text-alert group-open:text-paper">{String(index + 1).padStart(2, '0')}</span>
            <span className="flex-1">{item.question}</span>
            <span aria-hidden="true" className="relative size-4 shrink-0">
              <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-current" />
              <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-current transition-transform duration-200 group-open:scale-y-0" />
            </span>
          </summary>
          <p className="max-w-prose px-4 pb-6 pl-16 pt-4 text-ink group-open:animate-fade-up">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
