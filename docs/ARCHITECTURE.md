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
Pierwsza wersja (Newsreader zmienny z osią `opsz` i kursywą, Inter z `latin-ext`) preloadowała 6 plików, ok. 590 kB.
Druga (statyczne wagi z Google Fonts) zeszła do 85 kB preloadu, ale polskie znaki siedziały w osobnych plikach
`latin-ext`, które przeglądarka odkrywa dopiero po sparsowaniu CSS - druga runda pobrań, a symulacja Lighthouse
(Lantern, ta sama co w PageSpeed Insights) liczyła ją do LCP: 3,5 s przy obserwowanym LCP 86 ms.

Teraz `scripts/build-fonts.py` robi z plików google/fonts (OFL, licencje w `src/app/fonts`) statyczne instancje
i podzbiory: łacina + polskie znaki + typografia strony, jeden plik na krój. Po zmianie stylu (ADR-012) są to
trzy pliki, 97 kB, wszystkie preloadowane równolegle z CSS: Inter tekstowy (oś `wght` zawężona do 400-500),
Inter Display 900 (statyczna instancja, `opsz` 32) i JetBrains Mono (`wght` 400-700). Zawężony zakres osi daje
kilka wag z jednego pliku zamiast osobnego pobrania na każdą.
Znak spoza podzbioru (np. z przyszłej treści w CMS) wyrenderuje się fontem zapasowym - wtedy dopisać go do listy.

Pomiar lokalny na maszynie z antywirusem przechwytującym HTTP (wstrzyknięty skrypt, zdjęta kompresja) jest
niemiarodajny - wiążący jest Lighthouse CI na GitHub Actions (ADR-011).

### ADR-011: LCP mierzony z rzeczywistym dławieniem, wynik PSI znany i opisany
Lighthouse ma dwie metody dławienia. **Symulacja (Lantern)** - domyślna, ta sama co w PageSpeed Insights - mierzy
stronę bez dławienia i przelicza wynik na wolne łącze z modelu zależności. **Devtools** naprawdę spowalnia
łącze (slow 4G: 150 ms RTT, 1,6 Mb/s) i CPU (×4) i mierzy to, co się wydarzyło.

Elementem LCP jest akapit w hero, malowany w tej samej klatce co FCP. Na szybkim runnerze ta klatka przychodzi po
pobraniu skryptów (obserwowane FCP = LCP = 100 ms, skrypty gotowe w 58 ms), więc Lantern wlicza do szacowanego LCP
cały JavaScript pobrany przed nią - ok. 166 kB, z czego ~135 kB to React DOM i runtime Next 16. Tekstu do
wyświetlenia ten JS nie potrzebuje: HTML jest prerenderowany, CSS i fonty przychodzą równolegle.

| CI, mobile, mediana z 5 przebiegów | `/` | `/wycena` | `/ksef` |
| --- | --- | --- | --- |
| LCP, symulacja (jak w PSI) | 2,9 s | 2,6 s | 2,7 s |
| FCP, symulacja | 0,9 s | - | - |
| Wydajność, symulacja | 95 | ≥ 95 | ≥ 95 |
| LCP, rzeczywiste dławienie (bramka CI) | 1,6 s | 1,6 s | 1,6 s |
| Wydajność, rzeczywiste dławienie | 99 | 99 | 99 |

Decyzja (z właścicielem projektu): bramka CI mierzy LCP z rzeczywistym dławieniem, cel 1,8 s z planu zostaje.
PageSpeed Insights pokazuje wyższe LCP w danych laboratoryjnych - to oczekiwane i opisane tutaj, nie regresja.

PageSpeed Insights na produkcji (24.10.2026, mobile, https://bilans-i-spolka.vercel.app):

| | Wydajność | Dostępność | Best Practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 98 | 100 | 100 | 100 | 0,9 s | 2,4 s | 10 ms | 0 |
| `/wycena` | 94 | 100 | 100 | 100 | 0,9 s | 2,9 s | 40 ms | 0 |
| `/ksef` | 98 | 100 | 100 | 100 | 1,5 s | 2,2 s | 40 ms | 0 |

`/wycena` jest o punkt pod progiem 95: część zależna od parametrów w URL liczy się w funkcji serwera
(Partial Prerendering), a pierwszy pomiar był jeszcze przed przeniesieniem funkcji do Dublina. Sam framework to ~135 kB z tych 166 kB, więc zejście do 1,8 s w symulacji wymagałoby innego
frameworka niż Next.js. Kiedy strona zbierze ruch, rozstrzygające będą dane z terenu (CrUX), nie laboratorium.

### ADR-012: Styl „druk techniczny” - brutalizm, który dalej czyta klient
Pierwszy wygląd (szeryfowy Newsreader, zieleń i mosiądz) był poprawny, ale wyglądał jak każde „eleganckie”
biuro. Nowy kierunek bierze ze szwajcarskiego druku technicznego: papier `#f3f2ee`, tusz `#0d0d0d`, jedna
czerwień `#e61919`, kąty proste, widoczne siatki (`gap-px` na tle tuszu), nagłówki w Inter Display 900
wersalikami, dane i etykiety w JetBrains Mono.

Granice, żeby brutalizm nie odebrał przejrzystości:
- **Czerwień nigdy na kwotach.** W księgowości czerwona liczba to strata. Czerwień jest tylko na liniach,
  znacznikach i indeksach; kwoty są w tuszu. Komunikaty błędów mają ciemniejszą czerwień `#b0130b` (kontrast AA).
- **Wersaliki tylko w nagłówkach i etykietach.** Tekst ciągły, opisy usług i odpowiedzi w FAQ zostają zwykłym
  zdaniem w Interze - wersalikowy akapit czyta się wolniej.
- **Mono do liczb, grotesk do zdań.** Kwoty, daty, numery kroków i wycen są w mono z cyframi tabelarycznymi
  i przekreślonym zerem (kolumny się wyrównują, 0 nie myli się z O). Zdania i tytuły w mono wyglądały jak
  terminal, więc przeszły na grotesk.
- **Interlinia 1, nie 0,9.** Przy 0,9 ogonki i kreski polskich liter (Ą, Ę, Ó, Ś) nachodziły na sąsiednią linię.
  Ciężki krój z ujemnym trackingiem zjada też spacje - `word-spacing` je oddaje.
- **Bez miękkich cieni i zaokrągleń.** Głębię dają ramki 2 px i odwrócenie kolorów (aktywny element = tusz
  na papierze odwrócony), nie cień.

Każda zmiana przeszła axe (WCAG 2.2 AA) w e2e i budżet JS - styl nie dodał ani jednego skryptu.

### ADR-013: n8n Cloud bez Variables - sekret w Header Auth, HMAC kluczem z nagłówka
Workflow n8n potrzebują sekretu webhooka w węźle Code (weryfikacja HMAC), a plan n8n Cloud nie ma Variables,
Cloud blokuje `$env`, a węzeł Code nie widzi poświadczeń. Ciepło Południa rozwiązało to self-hosted n8n
z `$env` - tu zostajemy na Cloud, bez serwera do utrzymania.

API wysyła sekret dodatkowo w nagłówku `x-bs-webhook-key`. Webhook w n8n sprawdza go poświadczeniem Header Auth
(zaszyfrowanym w n8n) i dopiero wtedy uruchamia workflow; węzeł Code liczy HMAC tym samym, już zweryfikowanym
kluczem. Sekret nie pojawia się w workflow ani w jego eksporcie, a podpis dalej chroni treść i okno czasowe
(5 minut). Koszt: sekret podróżuje w nagłówku, więc jego bezpieczeństwo opiera się na TLS - tak jak przy
każdym kluczu API. Jawne ustawienia (adres Supabase, skrzynka testowa, nadawca, czat) są w węźle
„Konfiguracja”. Przejście na self-hosted albo plan z Variables to zamiana jednego węzła, nie przebudowa.

## Co zmienić przy wzroście

- Limiter i deduplikacja: Upstash Redis zamiast pamięci instancji.
- Wiele biur na jednym szkielecie (pakiet ofertowy): `siteSettings` i cennik per dataset Sanity.
- Wersja angielska: segment `[lang]` i `generateStaticParams` - treści już są w CMS.
