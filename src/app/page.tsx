import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroConfigurator } from '@/components/configurator/hero-configurator'
import { MonthTimeline } from '@/components/home/month-timeline'
import { KsefDays } from '@/components/ksef/ksef-countdown'
import { KsefQuizTrigger } from '@/components/ksef/ksef-quiz-trigger'
import { Portrait } from '@/components/team/portrait'
import { LinkButton } from '@/components/ui/button'
import { ConceptNote } from '@/components/ui/concept-note'
import { FaqList } from '@/components/ui/faq'
import { SectionHeading } from '@/components/ui/section-heading'
import { getMonthEvents, getPriceList, getSiteSettings, getTeam, getTestimonials } from '@/content/repository'
import { formatDate } from '@/lib/format'
import { accountingService, faqPage, JsonLd } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const AUDIENCES = [
  { n: '01', title: 'Zakładam firmę', text: 'Pomożemy wybrać formę opodatkowania i zarejestrujemy firmę bez opłat.', href: '/wycena?forma=zakladam&podatek=ryczalt&dok=1-10&vat=0' },
  { n: '02', title: 'Mam JDG', text: 'Ryczałt, skala albo liniowy - z księgową, która odpisuje tego samego dnia.', href: '/wycena?forma=jdg&podatek=skala&dok=11-20&vat=1' },
  { n: '03', title: 'Mam spółkę', text: 'Pełna księgowość, CIT i raport dla zarządu do 10. dnia miesiąca.', href: '/wycena?forma=spolka-zoo&podatek=cit&dok=21-40&vat=1' },
  { n: '04', title: 'Zmieniam biuro', text: 'Przejmujemy dokumenty od poprzedniego biura. Ty podpisujesz pełnomocnictwa.', href: '/zmiana-ksiegowej' },
]

export default async function HomePage() {
  const [priceList, site, team, testimonials, events] = await Promise.all([
    getPriceList(),
    getSiteSettings(),
    getTeam(),
    getTestimonials(),
    getMonthEvents(),
  ])

  return (
    <>
      <JsonLd data={accountingService(site)} />
      <JsonLd data={faqPage(site.homeFaq)} />

      {/* 1. Hero - konfigurator jest bohaterem strony */}
      <section className="container-page grid items-start gap-12 pb-20 pt-12 md:pt-16 lg:grid-cols-[1fr_29rem] lg:gap-16 lg:pb-28 lg:pt-24">
        <div className="lg:pt-6">
          <p className="eyebrow">Biuro rachunkowe · Kraków i zdalnie w całej Polsce</p>
          <h1 className="mt-6 text-[2.75rem] leading-[1.02] text-ink sm:text-[3.5rem] lg:text-[4.25rem]">
            Księgowość z&nbsp;ceną znaną z&nbsp;góry.
          </h1>
          <p className="mt-7 max-w-[34rem] text-lg text-ink-muted">
            Sprawdź cenę w trzech pytaniach, zanim do kogokolwiek zadzwonisz. Twoją firmę poprowadzi jedna księgowa
            z imienia i nazwiska, która odpisuje zwykle w dwie godziny.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <LinkButton href="/wycena" arrow>Pełna wycena</LinkButton>
            <LinkButton href="/kontakt#konsultacja" variant="text">Umów bezpłatną konsultację (20 min)</LinkButton>
          </div>
          <dl className="mt-14 grid max-w-[34rem] grid-cols-3 border-t border-ink/70 text-sm">
            {[
              ['od 279 zł', 'netto miesięcznie'],
              ['2 h', 'na odpowiedź'],
              ['7 dni', 'na zmianę biura'],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-rule py-4 pr-4 last:border-r-0 [&:not(:first-child)]:pl-4">
                <dt className="sr-only">{label}</dt>
                <dd className="num whitespace-nowrap font-serif text-[1.375rem] text-ink sm:text-2xl">{value}</dd>
                <dd className="text-xs text-ink-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroConfigurator priceList={priceList} />
      </section>

      {/* 2. Pasek zaufania */}
      <section aria-label="Biuro w liczbach" className="border-y border-rule bg-surface">
        <div className="container-page">
          <dl className="grid grid-cols-2 gap-px bg-rule md:grid-cols-4">
            {site.trust.map(stat => (
              <div key={stat.label} className="bg-surface px-1 py-8 md:px-6 md:first:pl-0">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="num font-serif text-[2rem] leading-none text-ink">{stat.value}</dd>
                <dd className="mt-2 text-sm text-ink-muted">{stat.label}</dd>
              </div>
            ))}
          </dl>
          <ConceptNote className="pb-5" />
        </div>
      </section>

      {/* 3. Dla kogo */}
      <section className="container-page section-space" aria-labelledby="dla-kogo">
        <SectionHeading id="dla-kogo" index="101" eyebrow="Dla kogo" title="Cztery sytuacje, z którymi przychodzą do nas klienci." />
        <ul className="mt-14 grid gap-px overflow-hidden border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map(item => (
            <li key={item.n} className="bg-paper">
              <Link href={item.href} className="group flex h-full flex-col p-7 transition-colors duration-500 hover:bg-surface">
                <span aria-hidden="true" className="num font-serif text-sm text-ink-muted">{item.n}</span>
                <span className="mt-10 font-serif text-2xl text-ink group-hover:text-ledger">{item.title}</span>
                <span className="mt-3 text-sm text-ink-muted">{item.text}</span>
                <span aria-hidden="true" className="mt-auto pt-8 text-sm text-ledger transition-transform duration-500 group-hover:translate-x-1">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Jak wygląda współpraca */}
      <section className="border-t border-rule bg-surface" aria-labelledby="miesiac">
        <div className="container-page section-space">
          <SectionHeading
            id="miesiac"
            index="202"
            eyebrow="Jak wygląda współpraca"
            title="Miesiąc księgowy: Twoje 5 minut i nasza cała reszta."
            lead="Terminy są ustawowe i takie same dla wszystkich. Różnica polega na tym, kto ich pilnuje."
          />
          <div className="mt-16">
            <MonthTimeline events={events} />
          </div>
        </div>
      </section>

      {/* 5. KSeF */}
      <section className="bg-ledger text-paper" aria-labelledby="ksef">
        <div className="container-page grid items-center gap-10 py-20 lg:grid-cols-[1fr_auto] lg:py-24">
          <div>
            <p className="eyebrow !text-paper/70">KSeF obowiązkowy dla wszystkich firm</p>
            <h2 id="ksef" className="mt-4 max-w-2xl text-[2rem] leading-tight md:text-2xl">
              Do 1 stycznia 2027 zostało <KsefDays mandatoryFrom={site.ksef.mandatoryFrom} />.
            </h2>
            <p className="mt-5 max-w-xl text-paper/80">
              Do końca 2026 roku najmniejsze firmy mogą wystawiać faktury poza KSeF, jeśli ich miesięczna sprzedaż B2B nie
              przekracza {site.ksef.smallBusinessLimit}. Potem każda faktura dla firmy przechodzi przez system.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4">
            <KsefQuizTrigger />
            <Link href="/ksef" className="link-underline text-sm text-paper">Wszystko o KSeF dla małej firmy →</Link>
          </div>
        </div>
      </section>

      {/* 6. Zespół */}
      <section className="container-page section-space" aria-labelledby="zespol">
        <SectionHeading
          id="zespol"
          index="303"
          eyebrow="Zespół"
          title="Księgowa znana z imienia."
          lead="Po podpisaniu umowy wiesz, kto prowadzi Twoją firmę, i masz do tej osoby bezpośredni numer."
        />
        <ul className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {team.map(member => (
            <li key={member.slug}>
              <Link href={`/zespol/${member.slug}`} className="group block">
                <Portrait name={member.name} photo={member.photo} />
                <p className="mt-5 font-serif text-xl text-ink group-hover:text-ledger">{member.name}</p>
                <p className="text-sm text-ink-muted">{member.role}</p>
                <p className="mt-3 border-t border-rule pt-3 text-sm text-ink">{member.specialization}</p>
                <p className="mt-2 text-xs text-ledger">{member.responseTime}</p>
              </Link>
            </li>
          ))}
        </ul>
        <ConceptNote className="mt-10">Zespół fikcyjny, portrety przykładowe - projekt koncepcyjny</ConceptNote>
      </section>

      {/* 7. Opinie */}
      <section className="border-y border-rule bg-surface" aria-labelledby="opinie">
        <div className="container-page section-space">
          <SectionHeading id="opinie" index="404" eyebrow="Opinie" title="Co mówią klienci po pierwszym roku." />
          <ul className="mt-14 grid gap-px bg-rule md:grid-cols-3">
            {testimonials.map(t => (
              <li key={t.author} className="flex bg-surface md:px-8 md:first:pl-0 md:last:pr-0">
                <figure className="flex flex-1 flex-col py-6 md:py-0">
                  <blockquote className="font-serif text-xl leading-snug text-ink">„{t.quote}”</blockquote>
                  <figcaption className="mt-auto pt-8 text-sm">
                    <span className="block font-medium text-ink">{t.author}</span>
                    <span className="block text-ink-muted">{t.business} · {t.legalForm}</span>
                    <span className="block text-xs text-ink-muted">{t.since}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <ConceptNote className="mt-10">Opinie przykładowe - projekt koncepcyjny</ConceptNote>
        </div>
      </section>

      {/* 8. Porównanie */}
      <section className="container-page section-space" aria-labelledby="porownanie">
        <SectionHeading id="porownanie" index="505" eyebrow="Porównanie" title="Bilans & Spółka kontra typowe biuro." />
        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <caption className="sr-only">Porównanie Bilans &amp; Spółka z typowym biurem rachunkowym</caption>
            <thead>
              <tr className="border-b border-ink/70">
                <th scope="col" className="w-[22%] py-4 pr-6 font-normal text-ink-muted">&nbsp;</th>
                <th scope="col" className="py-4 pr-6 font-serif text-lg font-medium text-ledger">Bilans &amp; Spółka</th>
                <th scope="col" className="py-4 font-serif text-lg font-normal text-ink-muted">Typowe biuro</th>
              </tr>
            </thead>
            <tbody>
              {site.comparison.map(row => (
                <tr key={row.aspect} className="border-b border-rule align-top">
                  <th scope="row" className="py-5 pr-6 font-medium text-ink">{row.aspect}</th>
                  <td className="bg-ledger-soft/50 px-4 py-5 text-ink">{row.us}</td>
                  <td className="py-5 pl-4 text-ink-muted">{row.typical}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="border-t border-rule bg-surface" aria-labelledby="faq">
        <div className="container-page section-space grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading id="faq" index="606" eyebrow="Pytania" title="Zanim zapytasz o to przez telefon." className="md:grid-cols-1" />
          <FaqList items={site.homeFaq} />
        </div>
      </section>

      {/* 10. Końcowe CTA */}
      <section className="container-page section-space" aria-labelledby="cta">
        <div className="grid gap-10 border-t border-ink/70 pt-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 id="cta" className="text-[2.25rem] leading-tight text-ink md:text-3xl">Porozmawiajmy o Twojej firmie.</h2>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">
              Dwadzieścia minut wideo, bez zobowiązań. Sprawdzimy formę opodatkowania i powiemy, ile dokładnie zapłacisz.
            </p>
          </div>
          <div className="flex flex-col justify-end gap-4 sm:flex-row lg:flex-col lg:items-stretch">
            <LinkButton href="/kontakt#konsultacja">Umów bezpłatną konsultację (20 min)</LinkButton>
            <LinkButton href="/wycena#pdf" variant="secondary">Pobierz wycenę PDF</LinkButton>
            <p className="text-xs text-ink-muted">Cennik zweryfikowany {formatDate(site.contentVerifiedAt)}.</p>
          </div>
        </div>
      </section>
    </>
  )
}
