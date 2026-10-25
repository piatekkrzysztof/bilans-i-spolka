# Automatyzacja n8n: od wyceny do podpisanej umowy

Stan: **zbudowane na n8n Cloud** (`sm-art.app.n8n.cloud`, folder „Bilans & Spółka”): obieg leada, ponowna
wysyłka z outboxa, retencja RODO i alerty o błędach. Etap Cal.com → Documenso → CRM jest zaprojektowany niżej,
ale wymaga kont w tych usługach i nie jest jeszcze zbudowany.

```
Konfigurator ──► POST /api/lead ──► Supabase (lead + zdarzenie outbox, jedna transakcja)
                    │  Zod, Turnstile, rate limit,
                    │  cena liczona od nowa z cennika
                    ▼
              webhook n8n  (HMAC-SHA256, Idempotency-Key = id leada)        ◄── lead-redelivery (co 10 min,
                    │  202 w ułamku sekundy, idempotencja w processed_webhooks        leady pending_delivery)
        ┌───────────┼────────────────────────────┐
        ▼           ▼                            ▼
   intent=pdf    intent=consultation       hot albo konsultacja → Telegram do biura
   Claude: notka   Resend: potwierdzenie   cold + zgoda marketingowa → 3 maile (dzień 2, 5, 10)
   PDF.co: URL→PDF  z linkiem do kalendarza
   Resend: mail z PDF
        │
        ▼
   lead_events: n8n.quote_pdf.sent / n8n.consultation_confirmed.sent

   ─ ─ ─ następny etap (zaprojektowany) ─ ─ ─
   Cal.com BOOKING_COMPLETED → advance_lead(..., 'consultation_booked') → Documenso: umowa
   Documenso DOCUMENT_COMPLETED → advance_lead(..., 'contract_signed') → lista dokumentów + CRM
```

## Workflow

| Workflow | Wyzwalacz | Co robi |
| --- | --- | --- |
| `Bilans · lead-created` | Webhook `POST /webhook/bilans/lead-created` (Raw Body) albo wywołanie z redelivery | podpis HMAC (`code/verify-signature.js`) → jeden kształt leada (`code/lead.js`) → wpis do `processed_webhooks` → 202 → PDF albo potwierdzenie konsultacji, Telegram, sekwencja |
| `Bilans · lead-redelivery` | co 10 minut | do 20 leadów `pending_delivery` starszych niż 2 min → `lead-created` → `mark_lead_delivery` |
| `Bilans · retention` | codziennie 3:00 | `purge_expired_leads()` - RODO, 12 miesięcy; raport na Telegram, gdy coś usunięto |
| `Bilans · error-handler` | Error Trigger | alert na Telegram: workflow, węzeł, komunikat, link do wykonania - bez danych z formularza |

Kod węzłów Code żyje w `code/*.js`, a szkielety workflow (n8n Workflow SDK) w `sdk/*.ts`.
`python automation/n8n/build.py lead-created` składa jedno z drugim. `tests/unit/n8n-code.test.ts` uruchamia kod
węzłów tak jak sandbox n8n (bez `URL` i `URLSearchParams`) i sprawdza zgodność z domeną: numer wyceny, adres
dokumentu, podpis.

## Konfiguracja

**Zmienne n8n** (Settings > Variables) - workflow nie zawierają żadnych sekretów ani adresów:

| Zmienna | Wartość |
| --- | --- |
| `BILANS_WEBHOOK_SECRET` | ta sama co `N8N_WEBHOOK_SECRET` w Vercelu (64 znaki hex) |
| `BILANS_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `BILANS_TEST_INBOX` | skrzynka SM-art - w trybie demo wszystkie maile idą tylko tutaj |
| `BILANS_MAIL_FROM` | nadawca ze zweryfikowanej domeny w Resend, np. `Bilans & Spółka <wyceny@…>` |
| `BILANS_TELEGRAM_CHAT_ID` | czat biura na powiadomienia i alerty |
| `BILANS_REPLY_TO`, `BILANS_SITE_URL`, `BILANS_DEMO` | opcjonalne; `BILANS_DEMO=false` dopiero przy prawdziwym biurze |

**Poświadczenia:** `Supabase · Bilans` (host + klucz `service_role`), Resend jako Bearer Auth, Anthropic,
Telegram. PDF.co działa na kredytach n8n Cloud.

**Vercel (produkcja):** `N8N_WEBHOOK_URL` i `N8N_WEBHOOK_SECRET`. Lokalnie adresu webhooka nie ustawiamy -
e2e na lokalnym buildzie nie może wysyłać leadów do produkcyjnego n8n.

## Kontrakt zdarzenia `lead.created`

Wysyłane przez `src/server/lead-intake.ts`. Nagłówki: `x-bs-timestamp`, `x-bs-signature`, `idempotency-key`.

| Pole | Opis |
| --- | --- |
| `id` | UUID leada - klucz idempotencji w całym obiegu |
| `intent` | `pdf` albo `consultation` |
| `quote` | pełna wycena z serwera (pozycje, sumy w groszach, `priceListVersion`) |
| `documentUrl` | adres `/wycena/dokument?...` - PDF.co renderuje z niego PDF (media `print`) |
| `score` | `{ score, temperature, matched[] }` - reguły w `src/domain/scoring.ts` |
| `advisor` | opiekunka dobrana przez `src/domain/advisor.ts` (`slug`, `name`, `calLink`) |
| `contact`, `situation`, `startWhen`, `consents` | dane z formularza |
| `demo` | `true` = wysyłka tylko do skrzynki testowej SM-art |

## Zasady

- **Kwoty nigdy z modelu.** Claude pisze tylko notkę (2-3 zdania, bez liczb), PDF i mail biorą kwoty z `quote`.
  Do modelu nie trafiają dane osobowe - tylko parametry wyceny (`noteFacts` w `code/lead.js`).
  Gdy Claude nie odpowie, mail idzie bez notki.
- **Idempotencja.** `lead-created` zapisuje `(n8n.lead-created, id)` w `processed_webhooks` przed wysyłką -
  ponowiony webhook albo redelivery tego samego leada kończy się odpowiedzią 200 „duplicate”. Resend dostaje
  `Idempotency-Key` per mail. Ten sam mechanizm (`advance_lead`) obsłuży webhooki Cal.com i Documenso.
- **Szybka odpowiedź.** API czeka na webhook 4 s, więc n8n odpowiada 202 zaraz po weryfikacji i idempotencji,
  a PDF i maile robi już po odpowiedzi.
- **Tryb demo.** Gdy `demo: true`, adresatem każdego maila jest `BILANS_TEST_INBOX`, nigdy osoba z formularza.
- **Zgody.** Sekwencja edukacyjna tylko przy zgodzie marketingowej; każdy mail ma „odpowiedz stop”.
- **Scenariusze testowe przed publikacją:** lead gorący, zimny ze zgodą i bez, duplikat (ten sam webhook dwa
  razy), zły podpis (401 i alert), n8n niedostępny (lead czeka jako `pending_delivery`, redelivery go dociąga).
