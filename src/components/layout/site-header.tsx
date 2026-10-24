import { LinkButton } from '@/components/ui/button'
import { Logo } from './logo'
import { NavLinks } from './nav-links'

export function SiteHeader() {
  return (
    // Bez backdrop-filter: tworzyłby blok zawierający dla `position: fixed` i menu mobilne liczyłoby się od nagłówka.
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper print:hidden">
      <div className="container-page flex h-16 items-stretch justify-between gap-6">
        <div className="flex items-center">
          <Logo />
        </div>
        <nav aria-label="Główna" className="hidden lg:flex">
          <NavLinks variant="bar" />
        </nav>
        <div className="hidden items-center lg:flex">
          <LinkButton href="/kontakt#konsultacja" className="min-h-10 px-4">Umów konsultację</LinkButton>
        </div>
        {/* Menu mobilne na <details> - działa bez JavaScriptu i nie dokłada nic do bundla. */}
        <details className="group flex items-center lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 border-2 border-ink px-3 font-mono text-xs uppercase tracking-[0.08em] text-ink [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Zamknij</span>
            <span aria-hidden="true" className="grid gap-[5px]">
              <span className="block h-0.5 w-5 bg-ink transition-transform group-open:translate-y-[3.5px] group-open:rotate-45" />
              <span className="block h-0.5 w-5 bg-ink transition-transform group-open:-translate-y-[3.5px] group-open:-rotate-45" />
            </span>
          </summary>
          <div className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-paper px-5 pb-10 pt-6">
            <nav aria-label="Główna (mobilna)">
              <NavLinks variant="sheet" />
            </nav>
            <LinkButton href="/kontakt#konsultacja" className="mt-8 w-full">Umów bezpłatną konsultację</LinkButton>
          </div>
        </details>
      </div>
    </header>
  )
}
