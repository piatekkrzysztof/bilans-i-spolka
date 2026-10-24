import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { CHECKLIST } from '@/components/switching/checklist-items'
import { SwitchChecklist } from '@/components/switching/switch-checklist'
import { LinkButton } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/section-heading'

export const metadata: Metadata = {
  title: 'Zmiana biura rachunkowego w 7 dni - krok po kroku',
  description: 'Jak przenieść księgowość do nowego biura bez przerwy w rozliczeniach. Przejmujemy dokumenty od poprzedniego biura, Ty podpisujesz pełnomocnictwa.',
  alternates: { canonical: '/zmiana-ksiegowej' },
}

const DAYS = [
  { day: '1', who: 'Ty', title: 'Rozmowa i umowa', text: '20 minut wideo, wycena i umowa podpisana online. Od tej chwili resztę prowadzimy my.' },
  { day: '2', who: 'Biuro', title: 'Wypowiedzenie i pełnomocnictwa', text: 'Przygotowujemy wypowiedzenie dla obecnego biura oraz UPL-1 i PEL. Podpisujesz je profilem zaufanym.' },
  { day: '3', who: 'Biuro', title: 'Kontakt z poprzednim biurem', text: 'Ustalamy termin i zakres przekazania dokumentów. Ty nie musisz do nich dzwonić.' },
  { day: '4–5', who: 'Biuro', title: 'Przejęcie dokumentów', text: 'Odbieramy dokumenty i podpisujemy protokół przekazania - z listą tego, co rozlicza jeszcze poprzednie biuro.' },
  { day: '6', who: 'Biuro', title: 'Sprawdzenie ksiąg', text: 'Weryfikujemy salda, środki trwałe i ostatnie deklaracje. Jeśli coś się nie zgadza, mówimy od razu.' },
  { day: '7', who: 'Ty', title: 'Pierwsze dokumenty w aplikacji', text: 'Dostajesz login i krótką instrukcję. Od kolejnego miesiąca wrzucasz dokumenty do 5. dnia.' },
]

export default function SwitchPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ name: 'Zmiana księgowej', path: '/zmiana-ksiegowej' }]}
        eyebrow="Zmiana biura rachunkowego"
        title="Nowa księgowa w 7 dni. Twoja rola: dwa podpisy."
        lead={<p>Najczęstszy powód zmiany biura to brak kontaktu. Najczęstszy powód zwlekania - obawa, że coś zginie. Dlatego przekazanie dokumentów bierzemy na siebie.</p>}
      >
        <LinkButton href="/wycena" className="mt-8" arrow>Sprawdź cenę przed zmianą</LinkButton>
      </PageHeader>

      <section className="border-t border-rule bg-surface" aria-labelledby="plan">
        <div className="container-page section-space">
          <SectionHeading id="plan" index="7 dni" eyebrow="Krok po kroku" title="Tydzień od rozmowy do pierwszych dokumentów." />
          <ol className="mt-14 border-t border-ink/70">
            {DAYS.map(step => (
              <li key={step.day} className="grid gap-4 border-b border-rule py-7 md:grid-cols-[7rem_6rem_1fr]">
                <p className="num font-serif text-2xl text-ink">Dzień {step.day}</p>
                <p className={step.who === 'Ty' ? 'eyebrow !text-ink md:pt-2' : 'eyebrow !text-ledger md:pt-2'}>{step.who}</p>
                <div>
                  <h3 className="font-display text-xl uppercase tracking-[-0.02em]">{step.title}</h3>
                  <p className="mt-1 max-w-2xl text-ink-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page section-space grid gap-12 lg:grid-cols-[1fr_1.2fr]" aria-labelledby="lista">
        <SectionHeading
          id="lista"
          eyebrow="Lista"
          title="Co przygotować przy zmianie biura."
          lead="Odhaczaj na bieżąco - postęp zapisuje się w adresie strony, więc możesz go zapisać w zakładkach albo wysłać wspólnikowi."
          stacked
        />
        {/* Bez parametrów z URL (prerender, brak JS) lista renderuje się jako zwykłe wypunktowanie. */}
        <Suspense fallback={<ul className="grid list-[square] gap-2 pl-5 text-sm marker:text-brass">{CHECKLIST.map(item => <li key={item}>{item}</li>)}</ul>}>
          <SwitchChecklist />
        </Suspense>
      </section>
    </>
  )
}
