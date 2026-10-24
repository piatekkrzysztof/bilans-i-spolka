import Link from 'next/link'

/**
 * Znak: konto teowe (Wn | Ma) z podwójnym podkreśleniem - najprostszy symbol księgowości.
 * W wersji „druk techniczny”: gruby tusz i czerwona podwójna linia sumy.
 */
export function LogoMark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true" fill="none">
      <path d="M3 7h22M14 7v14" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="square" />
      <path d="M4 23.5h20M4 26.5h20" stroke="var(--color-signal)" strokeWidth="1.5" />
    </svg>
  )
}

export function Wordmark({ className = 'text-[1.05rem]' }: { className?: string }) {
  return (
    <span className={`font-display font-black uppercase leading-none tracking-[-0.03em] ${className}`}>
      Bilans&nbsp;&amp;&nbsp;Spółka<sup className="ml-0.5 align-super font-mono text-[0.5em] font-normal tracking-normal">®</sup>
    </span>
  )
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-ink" aria-label="Bilans & Spółka - strona główna">
      <LogoMark />
      <Wordmark />
    </Link>
  )
}
