'use client'

import { useEffect, useRef } from 'react'
import { turnstileSiteKey } from '@/lib/site'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
    }
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
  return new Promise((resolve, reject) => {
    const script = existing ?? Object.assign(document.createElement('script'), { src: SCRIPT_SRC, async: true, defer: true })
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Turnstile niedostępny')), { once: true })
    if (!existing) document.head.append(script)
  })
}

/**
 * Cloudflare Turnstile w trybie „managed” - zwykle bez żadnej interakcji użytkownika.
 * Skrypt ładowany dopiero przy otwarciu formularza. Bez klucza (lokalnie, e2e) nic nie renderuje.
 */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!turnstileSiteKey || !ref.current) return
    let widgetId: string | undefined
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return
        widgetId = window.turnstile.render(ref.current, {
          'sitekey': turnstileSiteKey,
          'language': 'pl',
          'appearance': 'interaction-only',
          'callback': onToken,
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        })
      })
      .catch(() => onToken(''))
    return () => {
      cancelled = true
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [onToken])

  if (!turnstileSiteKey) return null
  return <div ref={ref} className="min-h-0" />
}
