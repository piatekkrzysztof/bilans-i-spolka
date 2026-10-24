# Bilans & Spółka

Koncepcyjna strona biura rachunkowego z Krakowa. **Cena znana z góry, księgowa znana z imienia.**
Projekt portfolio [SM-art](https://agencjasm-art.pl): firma, zespół, opinie i liczby są fikcyjne.

Strona odpowiada na pytanie „ile to kosztuje?”, zanim klient zadzwoni, i zamienia wycenę w umówioną konsultację.

## Co tu jest

- **Konfigurator wyceny** - 5 pytań, cena na żywo jak na fakturze: cyfry „księgują się” kolumna po kolumnie,
  suma dostaje podwójne podkreślenie. Netto/brutto, stan w URL (link można wysłać wspólnikowi), e-mail dopiero przy PDF.
- **Porównywarka form opodatkowania** - skala, liniowy i ryczałt obok siebie, na stawkach 2026, w widełkach.
- **Test gotowości KSeF** - 5 pytań, lista braków, bez e-maila. Licznik dni do 1 stycznia 2027.
- **Kalendarz miesiąca księgowego** - oś 1-31 pokazuje, co robi klient (5 minut), a co biuro.
- **Obieg od wyceny do umowy** - API z walidacją, antyspamem i outboxem, webhook HMAC do n8n,
  scoring i przydział opiekunki w kodzie ([automation/n8n](automation/n8n/README.md)).
- **SEO lokalne** - `/biuro-rachunkowe-[dzielnica]`, schema.org `AccountingService`, `Person`, `FAQPage`, `Article`
  z autorką i datą aktualizacji (E-E-A-T).

## Stos

Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS 4 (tokeny w `@theme`) · Radix UI ·
Motion · Zustand · React Hook Form + Zod · Sanity · Supabase (Postgres + RLS) · n8n · Cloudflare Turnstile ·
Vitest · Playwright + axe · Lighthouse CI.

Decyzje i ich uzasadnienie: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Uruchomienie

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

Bez kluczy Sanity i Supabase aplikacja działa w całości: treści z `src/content/fixtures`, leady w pamięci.

### Treści w Sanity

```bash
pnpm sanity:seed                       # fixtures → studio/seed/production.ndjson (ceny w zł, stawki w %)
cd studio && pnpm install --ignore-workspace
pnpm exec sanity login
pnpm exec sanity dataset import seed/production.ndjson production --replace
pnpm dev                               # Studio na http://localhost:3333
```

Test `tests/unit/sanity-seed.test.ts` przepuszcza seed przez te same zapytania GROQ co aplikacja (`groq-js`)
i sprawdza, że cennik i stawki wracają co do grosza.

| Polecenie | Co robi |
| --- | --- |
| `pnpm check` | ESLint, typy, testy jednostkowe |
| `pnpm test:e2e` | Playwright na buildzie produkcyjnym: konfigurator, formularz, KSeF, WCAG 2.2 AA, mobile |
| `pnpm check:bundle` | budżet JS kluczowych stron (po `pnpm build`) |
| `pnpm analyze` | bundle analyzer |

## Struktura

```
src/domain      cennik, porównywarka, scoring, przydział opiekunki, test KSeF - czysty TS z testami
src/content     typy treści, zapytania GROQ, dane lokalne, repozytorium z 'use cache'
src/server      przyjęcie leada, repozytorium Supabase/pamięć, webhook HMAC, Turnstile, rate limit
src/components  konfigurator, porównywarka, sekcje, UI
studio/         Sanity Studio: cennik, stawki podatkowe, zespół, usługi, baza wiedzy
supabase/       migracje: leady, outbox, idempotencja webhooków, retencja RODO
automation/n8n  projekt workflow i kod węzłów (weryfikacja podpisu, notka Claude bez kwot)
tests/          testy jednostkowe potoku leadów i e2e
```

## Wdrożenie

Vercel, projekt `bilans-i-spolka`, połączony z repo: każdy PR dostaje podgląd, merge do `main` wdraża produkcję.

- Funkcje serwera w Dublinie (`vercel.json`, `dub1`) - obok bazy Supabase w Irlandii i w UE ze względu na RODO.
- Produkcja: Sanity (token tylko do odczytu), Supabase (`service_role` tylko na serwerze), tryb demo.
- Podglądy PR: te same treści z Sanity, ale leady w pamięci (`LEAD_STORE=memory`) - nie piszą do produkcyjnej bazy.
- Turnstile: na razie klucze testowe Cloudflare; przed publikacją podmienić na klucze dla domeny.


- 66 testów jednostkowych: cennik (kombinacje, przedziały, niezmienniki na 320 kombinacjach), ZUS 2026 co do grosza,
  porównywarka, scoring, kodek URL, potok leadów (walidacja, duplikat, Turnstile, 429, podpis i awaria webhooka),
  seed Sanity sprawdzany przez zapytania GROQ aplikacji.
- 33 testy e2e, w tym axe (WCAG 2.2 AA) na 9 stronach i obsługa konfiguratora wyłącznie klawiaturą.
- Cena ogłaszana przez `aria-live`, segmentowe przyciski jako grupa radio ze strzałkami, widoczny focus.
- Lighthouse CI (mobile, rzeczywiste dławienie, mediana z 5 przebiegów): wydajność 99, dostępność, Best Practices
  i SEO po 100, LCP 1,6 s. PageSpeed Insights (symulacja) pokaże LCP ok. 2,7 s - dlaczego: [ADR-011](docs/ARCHITECTURE.md).

## Przed publikacją

Checklista z planu projektu: stawki i daty KSeF zweryfikowane (data w stopce), Lighthouse ≥ 95 na mobile dla
`/`, `/wycena`, `/ksef`, workflow n8n przetestowany end-to-end, Rich Results Test dla schema.org.
