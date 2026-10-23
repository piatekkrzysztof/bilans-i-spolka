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
    <footer className="mt-auto border-t border-rule bg-surface print:hidden">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-serif text-xl">Bilans <span className="italic text-ledger">&amp;</span> Spółka</span>
          </div>
          <address className="mt-6 text-sm not-italic leading-7 text-ink-muted">
            {site.address.street}<br />
            {site.address.postalCode} {site.address.city}<br />
            <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="link-underline">{site.phone}</a><br />
            <a href={`mailto:${site.email}`} className="link-underline">{site.email}</a>
          </address>
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 text-sm text-ink-muted">
            {site.openingHours.map(h => (
              <div key={h.days} className="contents">
                <dt>{h.days}</dt>
                <dd className="num text-right">{h.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
        {columns.map(column => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="eyebrow !font-sans">{column.title}</h2>
            <ul className="mt-5 grid gap-2.5 text-sm">
              {column.links.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ink hover:text-ledger">{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-rule">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>
            <strong className="font-medium text-ink">Projekt koncepcyjny.</strong> Bilans &amp; Spółka, zespół, opinie i liczby są fikcyjne.
            Projekt i wykonanie: <a className="link-underline" href="https://agencjasm-art.pl">SM-art</a>.
          </p>
          <p className="flex gap-5">
            <Link href="/polityka-prywatnosci" className="link-underline">Polityka prywatności</Link>
            <span>Treści zweryfikowane: <time dateTime={site.contentVerifiedAt} className="num">{formatDate(site.contentVerifiedAt)}</time></span>
          </p>
        </div>
      </div>
    </footer>
  )
}

