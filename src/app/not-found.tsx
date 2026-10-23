import Link from 'next/link'
import { LinkButton } from '@/components/ui/button'

export default function NotFound() {
  return (
    <section className="container-page grid min-h-[60vh] content-center gap-6 py-24">
      <p className="num font-serif text-[5rem] leading-none text-ledger/40">404</p>
      <h1 className="text-[2.5rem] leading-tight">Ta pozycja nie figuruje w księdze.</h1>
      <p className="max-w-xl text-lg text-ink-muted">Strona mogła zmienić adres. Najczęściej ludzie szukają tutaj ceny - ta jest zawsze pod ręką.</p>
      <div className="flex flex-wrap gap-6">
        <LinkButton href="/wycena" arrow>Sprawdź cenę</LinkButton>
        <Link href="/" className="link-underline self-center text-sm text-ledger">Strona główna</Link>
      </div>
    </section>
  )
}
