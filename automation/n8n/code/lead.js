// n8n: workflow „Bilans · lead-created”, węzeł „Lead” (Code, Run Once for Each Item).
// Plik jest źródłem prawdy - automation/n8n/build.py wpisuje go do workflow.
//
// Jeden kształt leada dla obu wejść: payload z webhooka (po weryfikacji podpisu) i wiersz tabeli `leads`
// z workflow „Bilans · lead-redelivery”. Węzeł dokłada adresata, etykiety i gotowe treści maili oraz powiadomienia,
// więc dalsze węzły tylko wysyłają. Kwoty pochodzą wyłącznie z `quote` policzonego w API (src/domain/pricing.ts),
// nigdy z modelu językowego.

/* Etykiety z src/domain/quote.ts i src/domain/scoring.ts. */
const LEGAL = { 'zakladam': 'Zakładam firmę', 'jdg': 'JDG', 'spolka-zoo': 'Spółka z o.o.', 'spolka-osobowa': 'Spółka osobowa' }
const TAX = { ryczalt: 'Ryczałt', skala: 'Skala', liniowy: 'Liniowy', cit: 'CIT' }
const DOCS = { '1-10': '1–10', '11-20': '11–20', '21-40': '21–40', '41-100': '41–100', '100+': 'ponad 100' }
const SITUATION = { 'switching': 'Zmienia biuro rachunkowe', 'starting': 'Zakłada firmę', 'first-office': 'Szuka pierwszego biura' }
const START_WHEN = { 'next-month': 'od przyszłego miesiąca', 'quarter': 'w ciągu 3 miesięcy', 'someday': 'jeszcze nie wie' }
/* Zespół z src/content/fixtures/team.ts - potrzebny tylko przy ponownej wysyłce, gdy w wierszu jest sam slug. */
const ADVISORS = {
  'anna-bielecka': 'Anna Bielecka',
  'marta-zajac': 'Marta Zając',
  'piotr-nowicki': 'Piotr Nowicki',
  'katarzyna-wrobel': 'Katarzyna Wróbel',
}

/* Kolory z tokenów @theme (src/app/globals.css) - klienci poczty nie czytają zmiennych CSS. */
const C = { paper: '#f3f2ee', surface: '#fafaf7', ink: '#0d0d0d', muted: '#474743', rule: '#c7c5bd', signal: '#e61919' }
const MONO = `'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace`
const SANS = `Inter, -apple-system, 'Segoe UI', Arial, sans-serif`

const siteUrl = ($vars.BILANS_SITE_URL || 'https://bilans-i-spolka.vercel.app').replace(/\/$/, '')

/*
 * Ten sam zapis co serializeQuoteParams w src/domain/quote-params.ts. Sandbox n8n nie ma URLSearchParams,
 * więc składamy ręcznie - encodeURIComponent koduje przecinek w `dodatki` tak samo (%2C), a spacji w wartościach nie ma.
 */
function quoteQuery(input) {
  const params = [
    ['forma', input.legalForm],
    ['podatek', input.taxForm],
    ['dok', input.docs],
    ['vat', input.vat ? '1' : '0'],
    input.foreign && ['zagr', '1'],
    input.employees > 0 && ['prac', String(input.employees)],
    input.contracts > 0 && ['umowy', String(input.contracts)],
    input.addons?.length && ['dodatki', [...input.addons].sort().join(',')],
  ]
  return params.filter(Boolean).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
}

/* Ten sam numer co na dokumencie wyceny (quoteNumber w src/domain/quote-params.ts). */
function quoteNumber(query) {
  let hash = 0
  for (const char of query) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return `BS-${hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`
}

function pln(grosze) {
  const digits = grosze % 100 === 0 ? 0 : 2
  const formatted = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(grosze / 100)
  return `${formatted.replace(/\s/g, ' ')} zł`
}

const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function fromRow(row) {
  const query = quoteQuery(row.quote.input)
  return {
    type: 'lead.created',
    id: row.id,
    createdAt: row.created_at,
    demo: $vars.BILANS_DEMO !== 'false',
    intent: row.intent,
    quote: row.quote,
    documentUrl: `${siteUrl}/wycena/dokument?${query}`,
    score: { score: row.score, temperature: row.temperature, matched: [] },
    advisor: row.advisor_slug ? { slug: row.advisor_slug, name: ADVISORS[row.advisor_slug] ?? row.advisor_slug, calLink: null } : null,
    contact: { name: row.name, email: row.email, phone: row.phone ?? null },
    situation: row.situation,
    startWhen: row.start_when,
    message: row.message ?? null,
    consents: { contact: row.consent_contact, marketing: row.consent_marketing },
  }
}

/* ── Szablon maila: druk techniczny, tabele zamiast flexa (Outlook) ─────────────────────────── */
function layout({ eyebrow, title, body }) {
  return `<!doctype html><html lang="pl"><body style="margin:0;background:${C.paper};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.surface};border:2px solid ${C.ink};">
<tr><td style="background:${C.ink};padding:12px 24px;font:500 11px/1.4 ${MONO};letter-spacing:.08em;text-transform:uppercase;color:${C.paper};">[ Bilans &amp; Spółka ] &nbsp; ${escape(eyebrow)}</td></tr>
<tr><td style="padding:32px 24px 8px;font:900 28px/1.05 ${SANS};letter-spacing:-.02em;text-transform:uppercase;color:${C.ink};">${title}</td></tr>
<tr><td style="padding:0 24px;"><div style="height:2px;background:${C.signal};margin:12px 0 2px;"></div><div style="height:2px;background:${C.signal};"></div></td></tr>
<tr><td style="padding:24px;font:400 15px/1.6 ${SANS};color:${C.ink};">${body}</td></tr>
<tr><td style="border-top:2px solid ${C.ink};padding:16px 24px;font:400 11px/1.5 ${MONO};letter-spacing:.04em;color:${C.muted};">
Bilans &amp; Spółka · ul. Przykładowa 12/4, 30-000 Kraków · projekt koncepcyjny SM-art, dane przykładowe.<br>
Odpowiedz na tego maila, jeśli masz pytanie - trafi prosto do Twojej księgowej.</td></tr>
</table></td></tr></table></body></html>`
}

const button = (href, label) =>
  `<a href="${escape(href)}" style="display:inline-block;background:${C.ink};color:${C.paper};padding:14px 22px;font:700 12px/1 ${MONO};letter-spacing:.08em;text-transform:uppercase;text-decoration:none;">${escape(label)} →</a>`

function linesTable(quote) {
  const rows = quote.monthly.map(line => `<tr>
<td style="padding:10px 0;border-bottom:1px dashed ${C.rule};font:400 14px/1.4 ${SANS};color:${C.ink};">${escape(line.label)}${line.detail ? ` <span style="color:${C.muted};font-family:${MONO};font-size:12px;">${escape(line.detail)}</span>` : ''}</td>
<td align="right" style="padding:10px 0;border-bottom:1px dashed ${C.rule};font:500 14px/1.4 ${MONO};color:${C.ink};white-space:nowrap;">${pln(line.amount)}</td></tr>`).join('')
  const oneOff = quote.oneOff.length
    ? `<tr><td colspan="2" style="padding:16px 0 4px;font:500 11px/1.4 ${MONO};letter-spacing:.08em;text-transform:uppercase;color:${C.muted};">Jednorazowo</td></tr>${quote.oneOff.map(line => `<tr><td style="padding:8px 0;font:400 14px/1.4 ${SANS};">${escape(line.label)}</td><td align="right" style="padding:8px 0;font:500 14px/1.4 ${MONO};white-space:nowrap;">${pln(line.amount)}</td></tr>`).join('')}`
    : ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
<tr><td style="padding:16px 0 0;font:700 11px/1.4 ${MONO};letter-spacing:.08em;text-transform:uppercase;">Razem netto / mies.</td>
<td align="right" style="padding:16px 0 0;font:700 26px/1 ${MONO};letter-spacing:-.03em;white-space:nowrap;">${quote.isFromPrice ? 'od ' : ''}${pln(quote.monthlyNet)}</td></tr>
<tr><td></td><td align="right" style="padding:4px 0 0;font:400 12px/1.4 ${MONO};color:${C.muted};">${pln(quote.monthlyGross)} brutto</td></tr>${oneOff}</table>`
}

/* ── Dane wejściowe ─────────────────────────────────────────────────────────────────────── */
const input = $json.lead ?? $json
const lead = input.quote_input ? fromRow(input) : input
const source = input.quote_input ? 'redelivery' : 'webhook'
const query = lead.documentUrl.split('?')[1] ?? ''
const number = quoteNumber(query)
const q = lead.quote
const firstName = String(lead.contact.name).trim().split(/\s+/)[0]
const advisorName = lead.advisor?.name ?? 'Twoja księgowa'
const bookingUrl = lead.advisor?.calLink || `${siteUrl}/kontakt#konsultacja`
const summary = `${LEGAL[q.input.legalForm]}, ${TAX[q.input.taxForm]}, ${DOCS[q.input.docs]} dok./mies.${q.input.vat ? ', VAT' : ''}`

// Tryb demo: maile idą wyłącznie na skrzynkę testową SM-art, nigdy do osoby z formularza.
const recipient = lead.demo ? $vars.BILANS_TEST_INBOX : lead.contact.email
if (!recipient) throw new Error('Brak adresata: ustaw zmienną BILANS_TEST_INBOX w n8n')

/* Fakty dla Claude - bez imienia, e-maila i telefonu (RODO). */
const noteFacts = [
  `Forma: ${LEGAL[q.input.legalForm]}, podatek: ${TAX[q.input.taxForm]}.`,
  `Dokumenty miesięcznie: ${DOCS[q.input.docs]}. VAT: ${q.input.vat ? 'tak' : 'nie'}. Transakcje zagraniczne: ${q.input.foreign ? 'tak' : 'nie'}.`,
  `Pracownicy: ${q.input.employees}, umowy cywilnoprawne: ${q.input.contracts}.`,
  `Sytuacja: ${SITUATION[lead.situation] ?? lead.situation}, start ${START_WHEN[lead.startWhen] ?? lead.startWhen}.`,
  'KSeF jest obowiązkowy dla wszystkich firm od 1 stycznia 2027 r.',
].join('\n')

const pdfEmail = {
  subject: `Wycena księgowości ${number} - ${pln(q.monthlyNet)} netto miesięcznie`,
  // %%NOTE%% podmienia węzeł wysyłki na notkę od Claude (albo usuwa, gdy model nie odpowiedział).
  html: layout({
    eyebrow: `Wycena ${number}`,
    title: `${escape(firstName)}, oto Twoja wycena<span style="color:${C.signal};">.</span>`,
    body: `<p style="margin:0 0 20px;">${escape(summary)}. Cennik ${escape(q.priceListVersion)}. PDF jest w załączniku.</p>
${linesTable(q)}
%%NOTE%%
<p style="margin:24px 0 8px;">Wyceną zajmie się <strong>${escape(advisorName)}</strong>. Cena jest ostateczna po krótkiej, bezpłatnej konsultacji - bez ukrytych opłat.</p>
<p style="margin:20px 0 0;">${button(bookingUrl, 'Umów 20 minut')}</p>
<p style="margin:16px 0 0;font:400 12px/1.5 ${MONO};color:${C.muted};"><a href="${escape(lead.documentUrl)}" style="color:${C.ink};">Dokument wyceny online</a> · ważny 30 dni</p>`,
  }),
}

const consultationEmail = {
  subject: `Konsultacja ${number}: ${advisorName} odezwie się wkrótce`,
  html: layout({
    eyebrow: 'Bezpłatna konsultacja · 20 min',
    title: `Dziękujemy, ${escape(firstName)}<span style="color:${C.signal};">.</span>`,
    body: `<p style="margin:0 0 16px;"><strong>${escape(advisorName)}</strong> prowadzi firmy takie jak Twoja (${escape(summary)}). Wybierz termin w kalendarzu - link do spotkania wideo przyjdzie w potwierdzeniu.</p>
<p style="margin:20px 0;">${button(bookingUrl, 'Wybierz termin')}</p>
<p style="margin:0 0 20px;">Do rozmowy przyda się wycena, którą właśnie policzyłeś:</p>
${linesTable(q)}
<p style="margin:16px 0 0;font:400 12px/1.5 ${MONO};color:${C.muted};"><a href="${escape(lead.documentUrl)}" style="color:${C.ink};">Dokument wyceny online</a></p>`,
  }),
}

/* Sekwencja dla zimnych leadów ze zgodą marketingową: dzień 2, 5 i 10. Linki do bazy wiedzy, bez sprzedaży na siłę. */
const article = (slug, title, lead) => ({ slug, title, lead })
const sequence = [
  article('ksef-2027-mala-firma', 'KSeF od 1 stycznia 2027: co musi zrobić mała firma', 'Od stycznia każda faktura dla firmy przechodzi przez Krajowy System e-Faktur. Sprawdź, czego potrzebujesz - test zajmuje dwie minuty.'),
  article('jaka-forma-opodatkowania-2026', 'Skala, liniowy czy ryczałt w 2026 roku', 'Forma opodatkowania potrafi zmienić wynik o kilka tysięcy złotych rocznie. Porównaj je na swoich liczbach.'),
  article('jak-zmienic-biuro-rachunkowe', 'Jak zmienić biuro rachunkowe bez przestoju', 'Zmiana biura to głównie przekazanie dokumentów i upoważnień. Robimy to za Ciebie - zwykle w jeden miesiąc.'),
].map((item, index) => ({
  subject: item.title,
  html: layout({
    eyebrow: `Krótko i na temat · ${index + 1}/3`,
    title: escape(item.title),
    body: `<p style="margin:0 0 20px;">${escape(item.lead)}</p>
<p style="margin:0 0 24px;">${button(`${siteUrl}/wiedza/${item.slug}`, 'Czytaj')}</p>
<p style="margin:0;font:400 13px/1.5 ${SANS};color:${C.muted};">Twoja wycena ${number} (${pln(q.monthlyNet)} netto / mies.) czeka - <a href="${escape(lead.documentUrl)}" style="color:${C.ink};">otwórz dokument</a>. Nie chcesz takich wiadomości? Odpowiedz „stop”.</p>`,
  }),
}))

const hot = lead.score.temperature === 'hot'
const telegram = [
  `${hot ? '🔴 Gorący lead' : '◻️ Lead'} ${number}${lead.demo ? ' · DEMO' : ''}`,
  `${lead.intent === 'consultation' ? 'Chce konsultacji' : 'Pobrał wycenę PDF'} · ${summary}`,
  `${q.isFromPrice ? 'od ' : ''}${pln(q.monthlyNet)} netto / mies. · score ${lead.score.score}`,
  `Opiekunka: ${advisorName}`,
  `${lead.contact.name} · ${lead.contact.email}${lead.contact.phone ? ` · ${lead.contact.phone}` : ''}`,
  `${SITUATION[lead.situation] ?? lead.situation}, start ${START_WHEN[lead.startWhen] ?? lead.startWhen}`,
  lead.message ? `„${lead.message}”` : null,
  lead.documentUrl,
].filter(Boolean).join('\n')

return {
  json: {
    id: lead.id,
    number,
    source,
    demo: lead.demo,
    intent: lead.intent,
    temperature: lead.score.temperature,
    score: lead.score.score,
    recipient,
    documentUrl: lead.documentUrl,
    fileName: `wycena-${number}.pdf`,
    noteFacts,
    notifyOffice: hot || lead.intent === 'consultation',
    sendSequence: !hot && Boolean(lead.consents?.marketing),
    emails: { pdf: pdfEmail, consultation: consultationEmail, sequence },
    telegram,
  },
}
