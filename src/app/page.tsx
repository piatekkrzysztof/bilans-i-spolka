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
      <section className="border-b-2 border-ink">
        {/* Pasek metadanych jak nagłówek arkusza technicznego. */}
        <div className="border-b border-ink">
          <div className="container-page flex flex-wrap items-center gap-x-8 gap-y-1 py-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink">
            <span className="font-bold">[ Biuro rachunkowe ]</span>
            <span>Kraków / Krowodrza</span>
            <span className="hidden sm:inline">Obsługa zdalna: cała Polska</span>
            <span className="ml-auto hidden md:inline">Cennik rev. {priceList.version}</span>
          </div>
        </div>
        <div className="container-page grid items-start gap-12 pb-16 pt-10 md:pt-14 lg:grid-cols-[1fr_28rem] lg:gap-14 lg:pb-20">
          <div>
            <h1 className="text-macro text-ink">
              Księgowość z&nbsp;ceną znaną z&nbsp;góry<span className="text-signal">.</span>
            </h1>
            <p className="mt-8 max-w-[34rem] text-lg text-ink">
              Sprawdź cenę w trzech pytaniach, zanim do kogokolwiek zadzwonisz. Twoją firmę poprowadzi jedna księgowa
              z imienia i nazwiska, która odpisuje zwykle w dwie godziny.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <LinkButton href="/wycena" arrow>Pełna wycena</LinkButton>
              <LinkButton href="/kontakt#konsultacja" variant="text">Umów bezpłatną konsultację (20 min)</LinkButton>
            </div>
            <dl className="mt-12 grid max-w-[36rem] grid-cols-3 gap-px border-2 border-ink bg-ink">
              {[
                ['od 279 zł', 'netto / mies.'],
                ['2 h', 'na odpowiedź'],
                ['7 dni', 'na zmianę biura'],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col-reverse bg-paper p-3 sm:p-4">
                  <dt className="eyebrow mt-1 !text-[0.625rem] text-ink-muted">{label}</dt>
                  <dd className="num whitespace-nowrap text-base font-bold leading-none text-ink sm:text-xl">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroConfigurator priceList={priceList} />
        </div>
      </section>

      {/* 2. Pasek zaufania */}
      <section aria-label="Biuro w liczbach" className="border-b-2 border-ink bg-surface">
        <div className="container-page">
          <dl className="grid grid-cols-2 gap-px bg-ink md:grid-cols-4">
            {site.trust.map((stat, index) => (
              <div key={stat.label} className="flex flex-col-reverse bg-surface px-4 py-7 md:px-6">
                <dt className="eyebrow mt-3 text-ink-muted">{String(index + 1).padStart(2, '0')} / {stat.label}</dt>
                <dd className="font-display text-[2.25rem] font-black uppercase leading-none tracking-[-0.03em] text-ink md:text-[2.75rem]">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <ConceptNote className="py-3" />
        </div>
      </section>

      {/* 3. Dla kogo */}
      <section className="container-page section-space" aria-labelledby="dla-kogo">
        <SectionHeading id="dla-kogo" index="101" eyebrow="Dla kogo" title="Cztery sytuacje, z którymi przychodzą do nas klienci." />
        <ul className="mt-12 grid gap-px border-2 border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map(item => (
            <li key={item.n} className="bg-paper">
              <Link href={item.href} className="group flex h-full flex-col p-6 transition-colors duration-150 hover:bg-ink hover:text-paper">
                <span aria-hidden="true" className="num text-sm font-bold text-alert group-hover:text-paper">{item.n}</span>
                <span className="mt-10 font-display text-[1.75rem] font-black uppercase leading-[0.95] tracking-[-0.03em]">{item.title}</span>
                <span className="mt-4 text-sm text-ink-muted group-hover:text-paper/80">{item.text}</span>
                <span aria-hidden="true" className="mt-auto pt-8 font-mono text-sm">&gt;&gt;&gt;</span>
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

      {/* 5. KSeF - termin ustawowy, więc jedyne miejsce z taśmą ostrzegawczą. */}
      <section className="bg-ink text-paper" aria-labelledby="ksef">
        <div aria-hidden="true" className="hazard h-3" />
        <div className="container-page grid items-end gap-10 py-16 lg:grid-cols-[1fr_auto] lg:py-20">
          <div>
            <p className="eyebrow !text-paper">[ KSeF ] Obowiązkowy dla wszystkich firm od 1.01.2027</p>
            <h2 id="ksef" className="mt-5 max-w-3xl text-[2.25rem] leading-[0.95] md:text-[3.25rem]">
              Zostało <KsefDays mandatoryFrom={site.ksef.mandatoryFrom} />.
            </h2>
            <p className="mt-6 max-w-xl text-paper/85">
              Do końca 2026 roku najmniejsze firmy mogą wystawiać faktury poza KSeF, jeśli ich miesięczna sprzedaż B2B nie
              przekracza {site.ksef.smallBusinessLimit}. Potem każda faktura dla firmy przechodzi przez system.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4">
            <KsefQuizTrigger variant="outline-inverse" />
            <Link href="/ksef" className="link-underline text-sm text-paper">Wszystko o KSeF dla małej firmy →</Link>
          </div>
        </div>
        <div aria-hidden="true" className="hazard h-3" />
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
        <ul className="mt-12 grid gap-px border-2 border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, index) => (
            <li key={member.slug} className="bg-paper">
              <Link href={`/zespol/${member.slug}`} className="group flex h-full flex-col">
                <Portrait name={member.name} photo={member.photo} code={`K-0${index + 1}`} />
                <div className="flex flex-1 flex-col border-t-2 border-ink p-5 transition-colors duration-150 group-hover:bg-ink group-hover:text-paper">
                  <p className="font-display text-xl font-black uppercase leading-[0.95] tracking-[-0.02em]">{member.name}</p>
                  <p className="eyebrow mt-2 text-ink-muted group-hover:!text-paper/80">{member.role}</p>
                  <p className="mt-4 text-sm">{member.specialization}</p>
                  <p className="mt-auto pt-4 font-mono text-xs uppercase tracking-[0.06em]"><span aria-hidden="true" className="marker mr-2" />{member.responseTime}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <ConceptNote className="mt-6">Zespół fikcyjny, portrety przykładowe - projekt koncepcyjny</ConceptNote>
      </section>

      {/* 7. Opinie */}
      <section className="border-y-2 border-ink bg-surface" aria-labelledby="opinie">
        <div className="container-page section-space">
          <SectionHeading id="opinie" index="404" eyebrow="Opinie" title="Co mówią klienci po pierwszym roku." />
          <ul className="mt-12 grid gap-px border-2 border-ink bg-ink md:grid-cols-3">
            {testimonials.map(t => (
              <li key={t.author} className="flex bg-surface">
                <figure className="flex flex-1 flex-col p-6">
                  <span aria-hidden="true" className="font-display text-6xl font-black leading-[0.6] text-signal">„</span>
                  <blockquote className="mt-4 text-lg leading-snug text-ink">{t.quote}</blockquote>
                  <figcaption className="mt-auto border-t border-ink pt-4 font-mono text-xs uppercase tracking-[0.06em]">
                    <span className="block font-bold text-ink">{t.author}</span>
                    <span className="mt-1 block text-ink-muted">{t.business} / {t.legalForm}</span>
                    <span className="block text-ink-muted">{t.since}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <ConceptNote className="mt-6">Opinie przykładowe - projekt koncepcyjny</ConceptNote>
        </div>
      </section>

      {/* 8. Porównanie */}
      <section className="container-page section-space" aria-labelledby="porownanie">
        <SectionHeading id="porownanie" index="505" eyebrow="Porównanie" title="Bilans & Spółka kontra typowe biuro." />
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse border-2 border-ink text-left text-sm">
            <caption className="sr-only">Porównanie Bilans &amp; Spółka z typowym biurem rachunkowym</caption>
            <thead className="bg-ink font-mono text-xs uppercase tracking-[0.08em] text-paper">
              <tr>
                <th scope="col" className="w-[22%] px-4 py-3 font-normal">Pozycja</th>
                <th scope="col" className="border-l border-paper/40 px-4 py-3 font-bold">Bilans &amp; Spółka</th>
                <th scope="col" className="border-l border-paper/40 px-4 py-3 font-normal">Typowe biuro</th>
              </tr>
            </thead>
            <tbody>
              {site.comparison.map(row => (
                <tr key={row.aspect} className="border-b border-ink align-top last:border-b-0">
                  <th scope="row" className="px-4 py-4 font-mono text-xs font-bold uppercase tracking-[0.06em] text-ink">{row.aspect}</th>
                  <td className="border-l border-ink bg-surface px-4 py-4 font-medium text-ink">
                    <span aria-hidden="true" className="marker mr-2" />{row.us}
                  </td>
                  <td className="border-l border-ink px-4 py-4 text-ink-muted">{row.typical}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="border-t-2 border-ink bg-surface" aria-labelledby="faq">
        <div className="container-page section-space grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading id="faq" index="606" eyebrow="Pytania" title="Zanim zapytasz o to przez telefon." stacked />
          <FaqList items={site.homeFaq} />
        </div>
      </section>

      {/* 10. Końcowe CTA */}
      <section className="bg-ink text-paper" aria-labelledby="cta">
        <div className="container-page grid gap-10 py-20 lg:grid-cols-[1.5fr_1fr] lg:py-24">
          <div>
            <p className="eyebrow !text-paper">[ 20 min / wideo / bez zobowiązań ]</p>
            <h2 id="cta" className="mt-5 text-[2.75rem] leading-[0.92] md:text-[4.5rem]">Porozmawiajmy o Twojej firmie<span className="text-signal">.</span></h2>
            <p className="mt-6 max-w-xl text-lg text-paper/85">
              Sprawdzimy formę opodatkowania i powiemy, ile dokładnie zapłacisz.
            </p>
          </div>
          <div className="flex flex-col justify-end gap-4 sm:flex-row lg:flex-col lg:items-stretch">
            <LinkButton href="/kontakt#konsultacja" variant="inverse">Umów bezpłatną konsultację</LinkButton>
            <LinkButton href="/wycena#pdf" variant="outline-inverse">Pobierz wycenę PDF</LinkButton>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-paper/70">Cennik zweryfikowany {formatDate(site.contentVerifiedAt)}</p>
          </div>
        </div>
      </section>
    </>
  )
}
