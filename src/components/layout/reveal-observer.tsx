'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const STAGGER_MS = 80

/**
 * Wejście elementów `[data-reveal]` przy przewijaniu (style w globals.css). Elementy widoczne od razu dostają
 * `is-revealed` przed włączeniem ukrywania, więc pierwszy ekran nie mruga. Kolejne elementy jednej sekcji
 * wchodzą co 80 ms. Po zmianie strony obserwujemy nowe elementy.
 */
export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const elements = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)')]
    const viewport = window.innerHeight
    for (const el of elements) {
      if (el.getBoundingClientRect().top < viewport) el.classList.add('is-revealed')
    }
    document.documentElement.classList.add('reveal-ready')

    const observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting).map(entry => entry.target as HTMLElement)
      entering.forEach((el, index) => {
        el.style.setProperty('--reveal-delay', `${index * STAGGER_MS}ms`)
        el.classList.add('is-revealed')
        observer.unobserve(el)
      })
    }, { rootMargin: '0px 0px -10% 0px' })

    for (const el of elements) {
      if (!el.classList.contains('is-revealed')) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [pathname])

  return null
}
