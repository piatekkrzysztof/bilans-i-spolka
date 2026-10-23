import type { Faq } from '@/content/types'

/**
 * FAQ na natywnym <details name> - akordeon „jeden otwarty naraz” bez JavaScriptu (ADR-007).
 * Przeglądarka sama obsługuje klawiaturę i stan rozwinięcia, treść jest w HTML dla wyszukiwarek.
 */
export function FaqList({ items, name = 'faq' }: { items: Faq[]; name?: string }) {
  return (
    <div className="border-t border-ink/70">
      {items.map(item => (
        <details key={item.question} name={name} className="group border-b border-rule">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 font-serif text-lg text-ink hover:text-ledger md:text-xl [&::-webkit-details-marker]:hidden">
            {item.question}
            <span aria-hidden="true" className="relative size-4 shrink-0">
              <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
              <span className="absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-500 ease-calm group-open:scale-y-0" />
            </span>
          </summary>
          <p className="max-w-prose pb-6 text-ink-muted group-open:animate-fade-up">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
