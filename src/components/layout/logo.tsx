import Link from 'next/link'

/**
 * Znak: konto teowe (Wn | Ma) z podwójnym podkreśleniem - najprostszy symbol księgowości,
 * który księgowy rozpozna od razu.
 */
export function LogoMark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true" fill="none">
      <path d="M4 7.5h20M14 7.5V21" stroke="var(--color-ledger)" strokeWidth="1.75" strokeLinecap="square" />
      <path d="M5 24h18M5 26.5h18" stroke="var(--color-brass)" strokeWidth="1" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 text-ink" aria-label="Bilans & Spółka - strona główna">
      <LogoMark />
      <span className="font-serif text-[1.375rem] leading-none tracking-tight">
        Bilans <span className="italic text-ledger">&amp;</span> Spółka
      </span>
    </Link>
  )
}
