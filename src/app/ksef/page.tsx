import type { Metadata } from 'next'
import { ReadinessQuiz } from '@/components/ksef/readiness-quiz'
import { KsefDays } from '@/components/ksef/ksef-countdown'
import { PageHeader } from '@/components/layout/page-header'
import { LinkButton } from '@/components/ui/button'
import { FaqList } from '@/components/ui/faq'
import { SectionHeading } from '@/components/ui/section-heading'
import { getPriceList, getSiteSettings } from '@/content/repository'
import { formatPLN } from '@/domain/money'
import { formatDate } from '@/lib/format'
import { faqPage, JsonLd } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'Gotowy na KSeF? Wdrożenie KSeF dla małej firmy w tydzień',
  description: 'Od 1 stycznia 2027 KSeF jest obowiązkowy dla wszystkich firm. Sprawdź gotowość w 5 pytaniach i zleć wdrożenie: uprawnienia, program do faktur, procedura awaryjna.',
  alternates: { canonical: '/ksef' },
}

const STEPS = [
  { title: 'Uprawnienia', text: 'Nadajemy dostęp Tobie, nam i osobie, która wystawia faktury. Bez tego nikt nie wyśle faktury w Twoim imieniu.' },
  { title: 'Program do faktur', text: 'Łączymy Twój program z KSeF tokenem albo certyfikatem. Jeśli go nie masz, podpowiadamy jeden z trzech, które znamy.' },
  { title: 'Faktury kosztowe', text: 'Ustawiamy pobieranie faktur od dostawców prosto z KSeF. Koniec z przesyłaniem PDF-ów mailem.' },
  { title: 'Procedura awaryjna', text: 'Jedna strona: co robić, gdy KSeF nie działa, kto dosyła faktury w trybie offline24 i do kiedy.' },
  { title: 'Szkolenie 45 minut', text: 'Wystawiasz pierwszą fakturę przy nas. Potem już wiesz, gdzie klikać.' },
]

const FAQ = [
  { question: 'Czy mała firma musi korzystać z KSeF?', answer: 'Tak, od 1 stycznia 2027 roku. Do końca 2026 r. firmy z miesięczną sprzedażą B2B do 10 000 zł brutto mogą jeszcze wystawiać faktury poza systemem.' },
  { question: 'Czy KSeF dotyczy faktur dla osób prywatnych?', answer: 'Fakturę dla konsumenta też można wystawić w KSeF, ale klientowi przekazujesz ją w inny sposób - np. jako PDF z kodem QR.' },
  { question: 'Co jeśli KSeF nie działa?', answer: 'Przepisy przewidują tryb offline24 i tryb awaryjny. Faktura wystawiona w takim trybie musi potem trafić do systemu w określonym terminie.' },
  { question: 'Czy muszę zmieniać program do faktur?', answer: 'Nie zawsze. Większość popularnych programów ma już integrację z KSeF - wystarczy ją skonfigurować.' },
]

export default async function KsefPage() {
  const [site, priceList] = await Promise.all([getSiteSettings(), getPriceList()])
  const implementation = priceList.addons.find(a => a.id === 'ksef')

  return (
    <>
      <JsonLd data={faqPage(FAQ)} />
      <PageHeader
        crumbs={[{ name: 'KSeF', path: '/ksef' }]}
        eyebrow={`KSeF obowiązkowy od ${formatDate(site.ksef.mandatoryFrom)}`}
        title={<>Gotowy na KSeF? Zostało <KsefDays mandatoryFrom={site.ksef.mandatoryFrom} />.</>}
        lead={
          <p>
            Od 1 stycznia 2027 roku każda faktura dla firmy przechodzi przez Krajowy System e-Faktur. Sprawdź, czego brakuje Twojej
            firmie - pięć pytań, wynik od razu.
          </p>
        }
      />

      <section className="container-page grid gap-16 pb-24 lg:grid-cols-[1fr_24rem]" aria-labelledby="test">
        <div className="rounded-[3px] border border-rule bg-surface p-6 sm:p-10">
          <h2 id="test" className="font-serif text-2xl">Test gotowości</h2>
          <p className="mb-8 mt-2 text-sm text-ink-muted">Bez e-maila. Odpowiedzi nie są nigdzie zapisywane.</p>
          <ReadinessQuiz />
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="ledger-margin rounded-[3px] border border-rule bg-surface py-7 pl-12 pr-7">
            <p className="eyebrow">Wdrożenie KSeF</p>
            <p className="num mt-3 font-serif text-[2.5rem] leading-none">{implementation ? formatPLN(implementation.price) : '-'}</p>
            <span className="double-rule mt-2 w-36" />
            <p className="mt-3 text-sm text-ink-muted">netto, jednorazowo · zwykle tydzień</p>
            <LinkButton href="/wycena?dodatki=ksef" className="mt-6 w-full" arrow>Dodaj do wyceny</LinkButton>
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Źródło dat: <a href={site.ksef.sourceUrl} className="link-underline" rel="noopener">{site.ksef.sourceLabel}</a>. Zweryfikowano {formatDate(site.contentVerifiedAt)}.
          </p>
        </aside>
      </section>

      <section className="border-t border-rule bg-surface" aria-labelledby="wdrozenie">
        <div className="container-page section-space">
          <SectionHeading id="wdrozenie" index="KSeF" eyebrow="Co robimy" title="Wdrożenie w pięciu krokach, z czego Twój jest jeden." />
          <ol className="mt-14 grid gap-px bg-rule md:grid-cols-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="bg-surface p-6 md:first:pl-0">
                <span aria-hidden="true" className="num font-serif text-3xl text-ledger/60">{i + 1}</span>
                <h3 className="mt-6 font-serif text-xl">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page section-space grid gap-12 lg:grid-cols-[1fr_1.6fr]" aria-labelledby="faq-ksef">
        <SectionHeading id="faq-ksef" eyebrow="Pytania" title="KSeF w pytaniach." className="md:grid-cols-1" />
        <FaqList items={FAQ} />
      </section>
    </>
  )
}
