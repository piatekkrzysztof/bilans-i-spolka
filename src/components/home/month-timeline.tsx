'use client'

/**
 * Kalendarz miesiąca księgowego: pozioma oś 1-31, terminy podświetlane kolejno przy przewijaniu.
 * Pokazuje, ile pracy zdejmujemy z klienta: jego są dwa punkty na osi, reszta należy do biura.
 *
 * Bez biblioteki animacji - IntersectionObserver na znacznikach kroków i przejścia CSS.
 * Przy prefers-reduced-motion i bez JS to zwykła, w pełni czytelna lista.
 */
import { useEffect, useRef, useState } from 'react'
import type { MonthEvent } from '@/content/types'
import { cn } from '@/lib/cn'

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export function MonthTimeline({ events }: { events: MonthEvent[] }) {
  const [active, setActive] = useState(0)
  const stepRefs = useRef<Array<HTMLLIElement | null>>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const first = visible[0]
        if (first) setActive(Number((first.target as HTMLElement).dataset.index))
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const el of stepRefs.current) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const current = events[active]
  const clientCount = events.filter(e => e.who === 'client').length

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
      {/* Oś - przyklejona, żeby przy przewijaniu listy było widać, gdzie jesteśmy w miesiącu. */}
      <div className="order-2 min-w-0 lg:order-1">
        <div className="lg:sticky lg:top-32" aria-hidden="true">
          <div className="relative overflow-x-auto pb-4">
            <div className="relative min-w-[40rem]">
              <div className="grid grid-cols-31 border-b border-ink/70">
                {DAYS.map(day => {
                  const event = events.find(e => e.day === day)
                  const isActive = current?.day === day
                  return (
                    <div key={day} className="relative flex h-40 flex-col justify-end">
                      {event && (
                        <span
                          className={cn(
                            'absolute bottom-0 left-1/2 w-px origin-bottom -translate-x-1/2 transition-all duration-700 ease-calm',
                            event.who === 'client' ? 'bg-brass' : 'bg-ledger',
                            isActive ? 'h-full opacity-100' : 'h-1/3 opacity-40',
                          )}
                        />
                      )}
                      {event && (
                        <span
                          className={cn(
                            'absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full border transition-all duration-700 ease-calm',
                            event.who === 'client' ? 'border-brass bg-paper' : 'border-ledger bg-ledger',
                            isActive ? 'top-0 scale-125' : 'top-2/3 opacity-60',
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-31 pt-2">
                {DAYS.map(day => (
                  <span
                    key={day}
                    className={cn(
                      'num text-center text-[0.6875rem] transition-colors duration-500',
                      current?.day === day ? 'font-medium text-ink' : events.some(e => e.day === day) ? 'text-ledger' : 'text-ink-muted',
                    )}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full border border-brass" /> Ty - {clientCount} razy w miesiącu</span>
            <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-ledger" /> Biuro - cała reszta</span>
          </div>
        </div>
      </div>

      <ol className="order-1 grid min-w-0 gap-0 lg:order-2" aria-label="Terminy w miesiącu">
        {events.map((event, index) => (
          <li
            key={`${event.day}-${event.title}`}
            ref={el => { stepRefs.current[index] = el }}
            data-index={index}
            className={cn(
              // Aktywny krok wyróżnia linia w kolorze księgi, nie przygaszanie reszty - tekst zawsze trzyma kontrast AA.
              'relative grid grid-cols-[3.5rem_1fr] gap-4 border-t border-rule py-6 lg:min-h-[40vh] lg:py-10',
              'before:absolute before:-top-px before:left-0 before:h-px before:w-full before:origin-left before:scale-x-0 before:bg-ledger before:transition-transform before:duration-700 before:ease-calm',
              active === index && 'lg:before:scale-x-100',
            )}
          >
            <p className={cn('num font-serif text-2xl leading-none transition-colors duration-500', active === index ? 'text-ledger' : 'text-ink')}>
              {event.day}.<span className="sr-only"> dzień miesiąca</span>
            </p>
            <div>
              <p className={cn('eyebrow', event.who === 'client' ? '!text-ink' : '!text-ledger')}>
                {event.who === 'client' ? 'Ty' : 'Biuro'}
                {event.appliesTo && <span className="normal-case tracking-normal text-ink-muted"> · {event.appliesTo}</span>}
              </p>
              <h3 className="mt-1.5 font-serif text-xl text-ink">{event.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{event.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
