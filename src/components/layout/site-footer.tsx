import Link from 'next/link'
import { getDistricts, getServices, getSiteSettings } from '@/content/repository'
import { formatDate } from '@/lib/format'
import { LogoMark } from './logo'

export async function SiteFooter() {
  const [site, services, districts] = await Promise.all([getSiteSettings(), getServices(), getDistricts()])
  const columns = [
    { title: 'Usługi', links: services.map(s => ({ href: `/uslugi/${s.slug}`, label: s.title })) },
    {
      title: 'Biuro',
      links: [
        { href: '/wycena', label: 'Wycena online' },
        { href: '/porownywarka', label: 'Porównywarka form opodatkowania' },
        { href: '/zmiana-ksiegowej', label: 'Zmiana księgowej w 7 dni' },
        { href: '/ksef', label: 'Gotowy na KSeF?' },
        { href: '/zespol', label: 'Zespół' },
        { href: '/wiedza', label: 'Baza wiedzy' },
      ],
    },
    { title: 'Kraków', links: districts.map(d => ({ href: `/biuro-rachunkowe-${d.slug}`, label: `Biuro rachunkowe ${d.name}` })) },
  ]

  return (
    <footer className="mt-auto border-t-2 border-ink bg-paper print:hidden">
      <div className="container-page">
        <div className="grid gap-px border-x-2 border-b-2 border-ink bg-ink md:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div className="bg-paper p-6">
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <p className="eyebrow">[ Kontakt ]</p>
            </div>
            <address className="mt-6 text-sm not-italic leading-7 text-ink">
              {site.address.street}<br />
              {site.address.postalCode} {site.address.city}<br />
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="link-underline num">{site.phone}</a><br />
              <a href={`mailto:${site.email}`} className="link-underline">{site.email}</a>
            </address>
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 font-mono text-xs uppercase tracking-[0.04em] text-ink">
              {site.openingHours.map(h => (
                <div key={h.days} className="contents">
                  <dt>{h.days}</dt>
                  <dd className="num text-right">{h.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
          {columns.map(column => (
            <nav key={column.title} aria-label={column.title} className="bg-paper p-6">
              <h2 className="font-mono text-xs font-medium tracking-[0.08em]">[ {column.title} ]</h2>
              <ul className="mt-5 grid gap-2.5 text-sm">
                {column.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-ink hover:underline hover:decoration-signal hover:decoration-2 hover:underline-offset-4">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Znak firmy na całą szerokość - makrotypografia jako konstrukcja, nie ozdoba. */}
        <p aria-hidden="true" className="select-none overflow-hidden whitespace-nowrap pb-1 pt-10 font-display text-[10.6vw] font-black uppercase leading-[0.9] tracking-[-0.06em] text-ink xl:text-[8.5rem]">
          Bilans&amp;Spółka<span className="text-signal">.</span>
        </p>

        <div className="flex flex-col gap-3 border-t-2 border-ink py-5 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-ink md:flex-row md:items-center md:justify-between">
          <p>
            <span className="marker mr-2" aria-hidden="true" />
            <strong className="font-bold">Projekt koncepcyjny.</strong> Firma, zespół, opinie i liczby są fikcyjne.
            Projekt i wykonanie: <a className="link-underline" href="https://agencjasm-art.pl">SM-art</a>
          </p>
          <p className="flex flex-wrap gap-5">
            <Link href="/polityka-prywatnosci" className="link-underline">Polityka prywatności</Link>
            <span>Treści zweryfikowane: <time dateTime={site.contentVerifiedAt}>{formatDate(site.contentVerifiedAt)}</time></span>
          </p>
        </div>
      </div>
    </footer>
  )
}
