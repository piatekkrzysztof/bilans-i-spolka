# Architektura i decyzje

## Przegląd

```
                    ┌────────────────────────── Next.js 16 (App Router, Cache Components) ──────────────────────────┐
 Przeglądarka ────► │  Server Components (statyczna powłoka, PPR)        Client Components (tylko interakcja)        │
                    │   strony, SEO, JSON-LD  ◄── src/content/repository ─►  konfigurator, porównywarka, test KSeF    │
                    │                               'use cache' + cacheTag          │                                │
                    │                                      │                       ▼                                │
                    │                         Sanity (GROQ) albo fixtures     src/domain  ◄── te same czyste funkcje  │
                    │                                                            ▲            na serwerze i w kliencie │
                    │  /api/lead ─► src/server/lead-intake ─────────────────────┘                                    │
                    │  /api/revalidate ◄── webhook Sanity (revalidateTag po typie dokumentu)                          │
                    └──────────────┬───────────────────────────────────────────────────────────────────────────────┘
                                   ▼
                     Supabase (Postgres + RLS, outbox) ──► n8n (HMAC) ──► Claude · Gotenberg · Resend · Cal.com · Documenso
```

| Warstwa | Katalog | Zależy od |
| --- | --- | --- |
| Domena: cennik, porównywarka, scoring, przydział, KSeF | `src/domain` | nic (czysty TypeScript) |
| Treści: typy, zapytania GROQ, dane lokalne | `src/content` | domena (typy) |
| Serwer: przyjęcie leada, repozytorium, webhook | `src/server` | domena, treści |
| UI | `src/components`, `src/app` | wszystko powyżej |

## ADR

### ADR-001: Next.js 16 zamiast 15
Plan zakładał Next.js 15. W październiku 2026 aktualna linia to 16.4, a 15 dostaje już tylko backporty.
Szesnastka daje Cache Components (`'use cache'`, `cacheTag`, Partial Prerendering), które zastępują ISR:
strona główna jest statyczna, a `/wycena` ma statyczną powłokę i strumieniuje tylko część zależną od URL.
Koszt: `searchParams` i `new Date()` muszą żyć w `<Suspense>` albo w funkcji buforowanej - wymusza to dyscyplinę,
którą build sprawdza.

### ADR-002: Cena liczona dwa razy tą samą funkcją
`calculateQuote` działa w przeglądarce (cena na żywo) i na serwerze (zapis leada). Serwer nigdy nie czyta ceny
z formularza - tylko parametry. Kwoty są liczbami całkowitymi w groszach, każda pozycja zaokrąglana osobno,
więc suma zawsze równa się sumie wierszy (test niezmiennika na wszystkich 320 kombinacjach).

### ADR-003: Sanity jako źródło treści, lokalne dane jako zapasowe
Biuro zmienia cennik i stawki kilka razy w roku - edycja bez programisty to argument sprzedażowy. Edytor wpisuje
złote i procenty, zapytanie GROQ przelicza je na grosze i ułamki w jednym miejscu (`src/content/sanity.ts`).
Bez `SANITY_PROJECT_ID` aplikacja działa na `src/content/fixtures` (podglądy PR, testy, praca offline).
Webhook Sanity rewaliduje tylko zmieniony typ (`revalidateTag(type, 'max')`), np. zmiana stawki nie przebudowuje artykułów.

### ADR-004: Porównywarka form opodatkowania jako szacunek w widełkach
Liczymy rok w uproszczeniu (równe miesiące, bez ulg) i pokazujemy widełki przy przychodzie ±10%, z zastrzeżeniem
„decyzję podejmiemy razem na konsultacji”. Stawki 2026 pochodzą z dokumentu `taxYear` z datą weryfikacji.
Przykład wzorcowy z testu (100 tys. zł przychodu, bez kosztów, pełny ZUS bez chorobowego):
skala 34 353,13 zł obciążeń, liniowy 40 586,96 zł, ryczałt IT 40 253,44 zł.

### ADR-005: Outbox zamiast „fire and forget”
Lead trafia do Supabase w jednej transakcji ze zdarzeniem `lead.created`, dopiero potem idzie webhook do n8n.
Awaria n8n zostawia status `pending_delivery`, który cron dociąga. Bez Supabase `next dev` trzyma leady w pamięci,
a build produkcyjny zwraca 503 - nie udaje, że przyjął zgłoszenie. Limiter jest w pamięci instancji (druga linia
za Turnstile); przy większym ruchu do przeniesienia na Upstash.

### ADR-006: Płaskie adresy landingów lokalnych
`/biuro-rachunkowe-krowodrza` to fraza z wyszukiwarki. App Router nie obsługuje segmentu z prefiksem, więc
rewrite kieruje na `/lokalnie/[dzielnica]`, a adres wewnętrzny ma przekierowanie 308 na publiczny i canonical.

### ADR-007: Mniej JavaScriptu tam, gdzie HTML wystarcza
FAQ to natywne `<details name>` (akordeon bez JS), menu mobilne to `<details>`, licznik dni do KSeF to komponent
serwerowy buforowany na godzinę. Radix zostaje tam, gdzie daje realną dostępność: grupa radio (strzałki, roving
tabindex) i dialogi (focus trap). Motion ładuje się tylko na `/wycena`, w hero wiersze wchodzą animacją CSS.

### ADR-008: Statystyki bez cookies
Umami nie używa cookies ani identyfikatorów, więc strona nie ma banera zgód. Formularz ma osobne, niezaznaczone
zgody i informację o administratorze, a dane z porównywarki nie opuszczają przeglądarki.

### ADR-009: Budżet JS liczony uczciwie
Plan zakładał < 110 kB gzip JS na stronie głównej. Sam runtime Next 16 + React 19 to ~138 kB gzip, więc ten próg
jest nieosiągalny bez zmiany frameworka. Budżet w CI (`scripts/check-bundle.mjs`) pilnuje całości
(170 kB dla `/`) i - co ważniejsze - kodu własnego: ~23 kB ponad framework na stronie głównej.

### ADR-010: Fonty pod LCP na mobile
Pierwsza wersja (Newsreader zmienny z osią `opsz` i kursywą, Inter z `latin-ext`) preloadowała 6 plików, ok. 590 kB -
na łączu mobilnym to sekundy przed pierwszym renderem. Teraz: Newsreader statyczny 500 (38 kB, latin + latin-ext),
kursywa (tylko „&” i monogramy) bez preloadu, Inter preloadowany tylko w podzbiorze łacińskim (48 kB);
polskie znaki z `latin-ext` dociągają się po `unicode-range` bez blokowania (`font-display: swap`,
metryki fallbacku trzymają CLS na 0). Preload fontów: 85 kB.

Pomiar lokalny na maszynie z antywirusem przechwytującym HTTP (wstrzyknięty skrypt, zdjęta kompresja) jest
niemiarodajny - wynik wiążący daje Lighthouse CI na GitHub Actions i PageSpeed Insights po wdrożeniu.
W czystym Chromium: FCP 184 ms, 71 ms wykonania skryptów na stronie głównej.

## Co zmienić przy wzroście

- Limiter i deduplikacja: Upstash Redis zamiast pamięci instancji.
- Wiele biur na jednym szkielecie (pakiet ofertowy): `siteSettings` i cennik per dataset Sanity.
- Wersja angielska: segment `[lang]` i `generateStaticParams` - treści już są w CMS.
