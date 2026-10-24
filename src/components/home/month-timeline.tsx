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
              <div className="grid grid-cols-31 border-b-2 border-ink">
                {DAYS.map(day => {
                  const event = events.find(e => e.day === day)
                  const isActive = current?.day === day
                  return (
                    <div key={day} className="relative flex h-40 flex-col justify-end border-l border-rule first:border-l-0">
                      {event && (
                        <span
                          className={cn(
                            'absolute bottom-0 left-1/2 w-0.5 origin-bottom -translate-x-1/2 transition-all duration-300 ease-calm',
                            event.who === 'client' ? 'bg-signal' : 'bg-ink',
                            isActive ? 'h-full opacity-100' : 'h-1/3 opacity-40',
                          )}
                        />
                      )}
                      {event && (
                        <span
                          className={cn(
                            'absolute left-1/2 size-3 -translate-x-1/2 transition-all duration-300 ease-calm',
                            event.who === 'client' ? 'bg-signal' : 'bg-ink',
                            isActive ? 'top-0 scale-125' : 'top-2/3 opacity-50',
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
                      'num text-center text-[0.6875rem] transition-colors duration-300',
                      current?.day === day ? 'bg-ink font-bold text-paper' : events.some(e => e.day === day) ? 'font-bold text-ink' : 'text-ink-muted',
                    )}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 font-mono text-xs uppercase tracking-[0.06em] text-ink">
            <span className="inline-flex items-center gap-2"><span className="size-3 bg-signal" /> Ty - {clientCount} razy w miesiącu</span>
            <span className="inline-flex items-center gap-2"><span className="size-3 bg-ink" /> Biuro - cała reszta</span>
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
              // Aktywny krok wyróżnia gruba czerwona linia, nie przygaszanie reszty - tekst zawsze trzyma kontrast AA.
              'relative grid grid-cols-[4rem_1fr] gap-4 border-t-2 border-ink py-6 lg:min-h-[40vh] lg:py-10',
              'before:absolute before:-top-0.5 before:left-0 before:h-1.5 before:w-full before:origin-left before:scale-x-0 before:bg-signal before:transition-transform before:duration-300 before:ease-calm',
              active === index && 'lg:before:scale-x-100',
            )}
          >
            <p className="num text-[2rem] font-bold leading-none tracking-[-0.04em] text-ink">
              {String(event.day).padStart(2, '0')}<span className="sr-only"> dzień miesiąca</span>
            </p>
            <div>
              <p className="eyebrow inline-flex items-center gap-2">
                <span aria-hidden="true" className={cn('size-2.5', event.who === 'client' ? 'bg-signal' : 'bg-ink')} />
                {event.who === 'client' ? 'Ty' : 'Biuro'}
                {event.appliesTo && <span className="text-ink-muted"> / {event.appliesTo}</span>}
              </p>
              <h3 className="mt-2 text-xl uppercase leading-[0.95] text-ink">{event.title}</h3>
              <p className="mt-2 text-sm text-ink">{event.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
