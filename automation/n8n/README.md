# Automatyzacja n8n: od wyceny do podpisanej umowy

Stan: **zaprojektowane, kontrakt po stronie aplikacji gotowy i przetestowany** (webhook z podpisem HMAC,
outbox w Supabase, scoring i przydział opiekunki w kodzie). Eksporty workflow (`workflows/*.json`)
powstają w fazie „Automatyzacja” (tygodnie 4-5 harmonogramu) na instancji self-hosted.

```
Konfigurator ──► POST /api/lead ──► Supabase (lead + zdarzenie outbox, jedna transakcja)
                    │  Zod, Turnstile, rate limit,
                    │  cena liczona od nowa z cennika
                    ▼
              webhook n8n  (HMAC-SHA256, Idempotency-Key = id wyceny)
                    │
        ┌───────────┴────────────┐   (równolegle z jednego webhooka)
        ▼                        ▼
   Wycena PDF w minutę       Rozgałęzienie po score.temperature
   Claude API: notka          ├─ hot  → powiadomienie do opiekunki + link do JEJ kalendarza Cal.com
   Gotenberg: URL → PDF       └─ cold → 3 maile: KSeF, formy opodatkowania, zmiana biura (dzień 2, 5, 10)
   Resend: e-mail z PDF                    │
                    └──────────┬───────────┘
                               ▼
                 Konsultacja w Cal.com (przypomnienie e-mail i SMS, link do wideo)
                               │ webhook BOOKING_COMPLETED
                               ▼
                 Documenso: umowa do podpisu online
                               │ webhook DOCUMENT_COMPLETED
                               ▼
                 Lista dokumentów do przekazania + wpis do CRM
```

## Kontrakt zdarzenia `lead.created`

Wysyłane przez `src/server/lead-intake.ts`. Nagłówki: `x-bs-timestamp`, `x-bs-signature`, `idempotency-key`.

| Pole | Opis |
| --- | --- |
| `id` | UUID leada - klucz idempotencji w całym obiegu |
| `intent` | `pdf` albo `consultation` |
| `quote` | pełna wycena z serwera (pozycje, sumy w groszach, `priceListVersion`) |
| `documentUrl` | adres `/wycena/dokument?...` - Gotenberg renderuje z niego PDF (route `/forms/chromium/convert/url`) |
| `score` | `{ score, temperature, matched[] }` - reguły w `src/domain/scoring.ts` |
| `advisor` | opiekunka dobrana przez `src/domain/advisor.ts` (`slug`, `name`, `calLink`) |
| `contact`, `situation`, `startWhen`, `consents` | dane z formularza |
| `demo` | `true` = wysyłka tylko do skrzynki testowej SM-art |

## Workflow

| Plik | Wyzwalacz | Co robi |
| --- | --- | --- |
| `lead-created` | Webhook (Raw Body) | `code/verify-signature.js` → sprawdzenie `processed_webhooks` → równolegle: PDF (Claude → Gotenberg → Resend) i rozgałęzienie hot/cold |
| `lead-redelivery` | Cron co 10 min | dociąga leady `pending_delivery` z Supabase (awaria n8n nie gubi zgłoszeń) |
| `cal-booking` | Webhook Cal.com | `advance_lead(..., 'consultation_booked', 'cal', bookingUid)`; po `BOOKING_COMPLETED` wysyła umowę w Documenso |
| `contract-signed` | Webhook Documenso | `advance_lead(..., 'contract_signed', 'documenso', documentId)`, lista dokumentów, wpis do CRM |
| `retention` | Cron codziennie 3:00 | `purge_expired_leads()` - RODO, 12 miesięcy |
| `error-handler` | Error Trigger | alert do SM-art z nazwą workflow, węzłem i id leada |

## Zasady

- **Kwoty nigdy z modelu.** Claude pisze tylko notkę (`code/quote-note-prompt.js`), PDF bierze liczby z `quote`.
  Do modelu nie trafiają dane osobowe.
- **Idempotencja.** Każde zdarzenie zewnętrzne zapisuje `(source, external_id)` w `processed_webhooks` -
  ponowiony webhook Cal.com czy Documenso nie wyśle drugiej umowy.
- **Tryb demo.** Gdy `demo: true`, węzeł Resend podmienia adresata na skrzynkę testową.
- **Scenariusze testowe przed publikacją:** lead gorący, zimny, duplikat (409 z API), rezygnacja z konsultacji
  (`BOOKING_CANCELLED` → status `lost` po 14 dniach bez nowego terminu).
