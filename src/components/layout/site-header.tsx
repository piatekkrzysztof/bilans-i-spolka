import { LinkButton } from '@/components/ui/button'
import { Logo } from './logo'
import { NavLinks } from './nav-links'

export function SiteHeader() {
  return (
    // Bez backdrop-filter: tworzyłby blok zawierający dla `position: fixed` i menu mobilne liczyłoby się od nagłówka.
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 print:hidden">
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Główna" className="hidden lg:block">
          <NavLinks variant="bar" />
        </nav>
        <div className="hidden lg:block">
          <LinkButton href="/kontakt#konsultacja" className="min-h-10 px-5">Umów konsultację</LinkButton>
        </div>
        {/* Menu mobilne na <details> - działa bez JavaScriptu i nie dokłada nic do bundla. */}
        <details className="group lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm text-ink [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Menu</span>
            <span className="hidden group-open:inline">Zamknij</span>
            <span aria-hidden="true" className="grid gap-[5px]">
              <span className="block h-px w-5 bg-ink transition-transform group-open:translate-y-[3px] group-open:rotate-45" />
              <span className="block h-px w-5 bg-ink transition-transform group-open:-translate-y-[3px] group-open:-rotate-45" />
            </span>
          </summary>
          <div className="fixed inset-x-0 top-[4.5rem] bottom-0 overflow-y-auto border-t border-rule bg-paper px-5 pb-10 pt-4">
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
