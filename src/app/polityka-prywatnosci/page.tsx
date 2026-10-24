import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'

export const metadata: Metadata = {
  title: 'Polityka prywatności',
  description: 'Jakie dane zbiera Bilans & Spółka, w jakim celu, jak długo je przechowujemy i jakie masz prawa.',
  alternates: { canonical: '/polityka-prywatnosci' },
}

const SECTIONS = [
  {
    title: 'Administrator',
    text: 'Administratorem danych jest Bilans & Spółka. To projekt koncepcyjny agencji SM-art - w trybie demo zgłoszenia trafiają do testowej skrzynki agencji i są usuwane po zakończeniu testów.',
  },
  {
    title: 'Jakie dane i po co',
    text: 'Z formularza wyceny: imię, e-mail, opcjonalnie telefon, parametry wyceny i odpowiedzi o Twojej sytuacji. Używamy ich, żeby wysłać wycenę, umówić konsultację i przygotować umowę (art. 6 ust. 1 lit. b RODO - działania przed zawarciem umowy). Zgoda marketingowa jest osobna, niezaznaczona domyślnie i możesz ją wycofać w każdej chwili.',
  },
  {
    title: 'Czego nie zbieramy',
    text: 'Konfigurator i porównywarka liczą w Twojej przeglądarce. Kwoty przychodu i kosztów z porównywarki nie są nigdzie zapisywane, dopóki sam nie wyślesz formularza. Test gotowości KSeF nie zapisuje odpowiedzi.',
  },
  {
    title: 'Jak długo',
    text: 'Wyceny i dane z formularza przechowujemy 12 miesięcy, potem automat w systemie biura usuwa je bez udziału człowieka. Po podpisaniu umowy dane klienta przechowujemy przez okres wymagany przepisami podatkowymi.',
  },
  {
    title: 'Komu przekazujemy dane',
    text: 'Dostawcom, bez których formularz nie działa: hosting (Vercel), baza danych (Supabase, UE), wysyłka e-maili (Resend), kalendarz konsultacji (Cal.com), podpis umowy (Documenso), ochrona przed spamem (Cloudflare Turnstile). Do notki w wycenie używamy modelu językowego - przekazujemy mu wyłącznie parametry wyceny, bez imienia i e-maila.',
  },
  {
    title: 'Statystyki bez cookies',
    text: 'Ruch mierzymy narzędziem Umami, które nie używa plików cookies i nie identyfikuje osób - dlatego na stronie nie ma banera zgód.',
  },
  {
    title: 'Twoje prawa',
    text: 'Masz prawo do dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia i sprzeciwu, a także do skargi do Prezesa UODO. Napisz do nas - odpowiemy w ciągu 30 dni.',
  },
]

export default function PrivacyPage() {
  return (
    <>
      <PageHeader crumbs={[{ name: 'Polityka prywatności', path: '/polityka-prywatnosci' }]} title="Polityka prywatności" lead={<p>Krótko i bez prawniczego żargonu.</p>} />
      <div className="container-page pb-24 lg:pb-32">
        <ol className="max-w-3xl border-t border-ink/70">
          {SECTIONS.map((section, index) => (
            <li key={section.title} className="grid gap-3 border-b border-rule py-8 md:grid-cols-[3rem_1fr]">
              <span aria-hidden="true" className="num font-serif text-xl text-ledger/60">{index + 1}</span>
              <div>
                <h2 className="font-display text-xl uppercase tracking-[-0.02em]">{section.title}</h2>
                <p className="mt-2 text-ink-muted">{section.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}
