import { workflow, node, trigger, sticky, newCredential, ifElse, switchCase, expr } from '@n8n/workflow-sdk';

const supabase = { supabaseApi: newCredential('Supabase · Bilans') };
const resend = { httpBearerAuth: { id: '8u2A5AU70aomzyan', name: 'Bearer Auth account' } };

const webhookIn = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.2,
  config: {
    name: 'Webhook lead.created',
    parameters: { httpMethod: 'POST', path: 'bilans/lead-created', authentication: 'headerAuth', responseMode: 'responseNode', options: { rawBody: true } },
    credentials: { httpHeaderAuth: newCredential('Bilans · klucz webhooka') },
    position: [0, 0],
  },
  output: [{ headers: { 'x-bs-timestamp': '1792940000', 'x-bs-signature': 'sha256=abc', 'idempotency-key': '6f1c' }, body: {} }],
});

const fromRedelivery = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.3,
  config: { name: 'Z lead-redelivery', parameters: { inputSource: 'passthrough' }, position: [0, 400] },
  output: [{ id: '6f1c', intent: 'pdf', quote_input: {} }],
});

const verify = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Weryfikuj podpis', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: __VERIFY_SIGNATURE_JS__ }, position: [220, 0] },
  output: [{ valid: true, lead: { id: '6f1c', type: 'lead.created' } }],
});

const signatureOk = ifElse({
  version: 2.2,
  config: {
    name: 'Podpis poprawny?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $json.valid }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
    position: [440, 0],
  },
});

const respond401 = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Odpowiedz 401',
    parameters: { respondWith: 'json', responseBody: expr('{{ JSON.stringify({ error: "invalid signature", reason: $json.reason }) }}'), options: { responseCode: 401 } },
    position: [660, 160],
  },
  output: [{ valid: false, reason: 'invalid signature' }],
});

const reject = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: { name: 'Odrzuć żądanie', parameters: { errorType: 'errorMessage', errorMessage: expr('Odrzucony webhook lead.created: {{ $json.reason }}') }, position: [880, 160] },
});

const settings = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Konfiguracja',
    notes: 'Jawne ustawienia Bilans (plan bez Variables). Sekret webhooka NIE tutaj - jest w poświadczeniu Header Auth.',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [{
          id: 'bilans-config',
          name: 'config',
          type: 'object',
          value: "={{ {
  supabaseUrl: 'https://buvjolifagbjgouhmcxs.supabase.co',
  siteUrl: 'https://bilans-i-spolka.vercel.app',
  demo: true,
  testInbox: '',
  mailFrom: '',
  replyTo: '',
  telegramChatId: ''
} }}",
        }],
      },
      options: {},
    },
    position: [440, -200],
  },
  output: [{ valid: true, lead: { id: '6f1c' }, config: { supabaseUrl: 'https://buvjolifagbjgouhmcxs.supabase.co', testInbox: 'demo@example.com' } }],
});

const lead = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Lead', parameters: { mode: 'runOnceForEachItem', language: 'javaScript', jsCode: __LEAD_JS__ }, position: [660, -40] },
  output: [{
    id: '6f1c', number: 'BS-16D4JQ', source: 'webhook', demo: true, intent: 'pdf', temperature: 'hot', score: 7,
    recipient: 'test@example.com', documentUrl: 'https://bilans-i-spolka.vercel.app/wycena/dokument?forma=jdg', fileName: 'wycena-BS-16D4JQ.pdf',
    noteFacts: 'Forma: JDG', notifyOffice: true, sendSequence: false,
    emails: { pdf: { subject: 's', html: 'h' }, consultation: { subject: 's', html: 'h' }, sequence: [{ subject: 's', html: 'h' }, { subject: 's', html: 'h' }, { subject: 's', html: 'h' }] },
    telegram: 't',
  }],
});

const claim = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Przejmij lead',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.config.supabaseUrl }}/rest/v1/processed_webhooks'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Prefer', value: 'resolution=ignore-duplicates,return=representation' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ source: "n8n.lead-created", external_id: $json.id }) }}'),
      options: { response: { response: { fullResponse: true } } },
    },
    credentials: supabase,
    position: [880, -40],
  },
  output: [{ statusCode: 201, body: [{ source: 'n8n.lead-created', external_id: '6f1c' }] }],
});

const isNew = ifElse({
  version: 2.2,
  config: {
    name: 'Nowy lead?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ Array.isArray($json.body) && $json.body.length > 0 }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
    position: [1100, -40],
  },
});

const respond202 = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Odpowiedz 202',
    parameters: { respondWith: 'json', responseBody: expr('{{ JSON.stringify({ status: "accepted", id: $("Lead").item.json.id }) }}'), options: { responseCode: 202 } },
    position: [1320, -40],
  },
  output: [{ statusCode: 201 }],
});

const respondDuplicate = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Odpowiedz 200 (duplikat)',
    parameters: { respondWith: 'json', responseBody: expr('{{ JSON.stringify({ status: "duplicate", id: $("Lead").item.json.id }) }}'), options: { responseCode: 200 } },
    position: [1320, 140],
  },
  output: [{ statusCode: 200 }],
});

const byIntent = switchCase({
  version: 3.2,
  config: {
    name: 'Wycena czy konsultacja?',
    parameters: {
      rules: {
        values: [
          { outputKey: 'pdf', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $("Lead").item.json.intent }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'pdf' }], combinator: 'and' } },
          { outputKey: 'konsultacja', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $("Lead").item.json.intent }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'consultation' }], combinator: 'and' } },
        ],
      },
    },
    position: [1540, -240],
  },
});

const note = node({
  type: '@n8n/n8n-nodes-langchain.anthropic',
  version: 1,
  config: {
    name: 'Notka od Claude',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'text',
      operation: 'message',
      modelId: { __rl: true, mode: 'id', value: 'claude-haiku-5-5' },
      messages: { values: [{ role: 'user', content: expr('Fakty o firmie:\n{{ $("Lead").item.json.noteFacts }}') }] },
      simplify: true,
      options: {
        system: 'Piszesz krótką notkę do wyceny biura rachunkowego Bilans & Spółka: 2-3 zdania po polsku, spokojnym tonem. Wskaż, na co ta konkretna firma powinna zwrócić uwagę w najbliższych miesiącach (np. KSeF, zmiana biura, kadry). Nie podawaj żadnych kwot, stawek ani terminów innych niż w faktach. Nie udzielaj porad podatkowych i nie rekomenduj formy opodatkowania. Pisz zwykłym tekstem, bez nagłówków i list. Jeśli nie masz nic konkretnego do dodania, napisz jedno zdanie zapraszające na bezpłatną konsultację.',
        maxTokens: 1024,
        includeMergedResponse: true,
      },
    },
    credentials: { anthropicApi: { id: 'RzD8pNaI6jALfZXe', name: 'Anthropic account' } },
    position: [1760, -340],
  },
  output: [{ merged_response: 'Od stycznia 2027 r. faktury dla firm przejdą przez KSeF - warto wcześniej nadać uprawnienia.' }],
});

const pdf = node({
  type: 'n8n-nodes-pdfco.PDFco Api',
  version: 1.1,
  config: {
    name: 'PDF z dokumentu wyceny',
    parameters: {
      authentication: 'apiKey',
      operation: 'URL/HTML to PDF',
      convertType: 'urlToPDF',
      url: expr('{{ $("Lead").item.json.documentUrl }}'),
      advancedOptions: { name: expr('{{ $("Lead").item.json.fileName }}'), paperSize: 'a4', mediaType: 'print', margins: '0mm', printBackground: true, expiration: 120 },
    },
    credentials: { pdfcoApi: newCredential('PDF.co') },
    position: [1980, -340],
  },
  output: [{ url: 'https://pdf-temp-files.s3.amazonaws.com/wycena-BS-16D4JQ.pdf', pageCount: 1, error: false }],
});

const sendPdf = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'E-mail z wyceną PDF',
    parameters: {
      method: 'POST',
      url: 'https://api.resend.com/emails',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Idempotency-Key', value: expr('quote-pdf/{{ $("Lead").item.json.id }}') }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ (() => { const lead = $("Lead").item.json; const text = String($("Notka od Claude").item.json.merged_response ?? "").trim(); const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); const block = safe ? `<p style="margin:24px 0 0;padding:16px 18px;border-left:3px solid #e61919;background:#f3f2ee;">${safe}</p>` : ""; return JSON.stringify({ from: lead.config.mailFrom, to: [lead.recipient], reply_to: lead.config.replyTo || undefined, subject: lead.emails.pdf.subject, html: lead.emails.pdf.html.replace("%%NOTE%%", block), attachments: [{ filename: lead.fileName, path: $json.url }] }); })() }}'),
      options: {},
    },
    credentials: resend,
    position: [2200, -340],
  },
  output: [{ id: 're_123' }],
});

const logPdf = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Zapisz quote_pdf.sent',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Lead").item.json.config.supabaseUrl }}/rest/v1/lead_events'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ lead_id: $("Lead").item.json.id, type: "n8n.quote_pdf.sent", payload: { email_id: $json.id ?? null, note: Boolean($("Notka od Claude").item.json.merged_response), source: $("Lead").item.json.source } }) }}'),
      options: {},
    },
    credentials: supabase,
    position: [2420, -340],
  },
  output: [{}],
});

const sendConsultation = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'E-mail: potwierdzenie konsultacji',
    parameters: {
      method: 'POST',
      url: 'https://api.resend.com/emails',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Idempotency-Key', value: expr('consultation/{{ $("Lead").item.json.id }}') }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ from: $("Lead").item.json.config.mailFrom, to: [$("Lead").item.json.recipient], reply_to: $("Lead").item.json.config.replyTo || undefined, subject: $("Lead").item.json.emails.consultation.subject, html: $("Lead").item.json.emails.consultation.html }) }}'),
      options: {},
    },
    credentials: resend,
    position: [1760, -140],
  },
  output: [{ id: 're_456' }],
});

const logConsultation = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Zapisz consultation.confirmed',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Lead").item.json.config.supabaseUrl }}/rest/v1/lead_events'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ lead_id: $("Lead").item.json.id, type: "n8n.consultation_confirmed.sent", payload: { email_id: $json.id ?? null, source: $("Lead").item.json.source } }) }}'),
      options: {},
    },
    credentials: supabase,
    position: [1980, -140],
  },
  output: [{}],
});

const notifyOffice = ifElse({
  version: 2.2,
  config: {
    name: 'Powiadomić biuro?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $("Lead").item.json.notifyOffice }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
    position: [1540, 40],
  },
});

const telegramOffice = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Telegram do biura',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr('{{ $("Lead").item.json.config.telegramChatId }}'),
      text: expr('{{ $("Lead").item.json.telegram }}'),
      additionalFields: { appendAttribution: false, disable_web_page_preview: true },
    },
    credentials: { telegramApi: { id: 'U1PTOapogFAXwIvH', name: 'Telegram account' } },
    position: [1760, 40],
  },
  output: [{ ok: true }],
});

const startSequence = ifElse({
  version: 2.2,
  config: {
    name: 'Sekwencja edukacyjna?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{ leftValue: expr('{{ $("Lead").item.json.sendSequence }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and',
      },
    },
    position: [1540, 240],
  },
});

const wait2 = node({ type: 'n8n-nodes-base.wait', version: 1.1, config: { name: 'Czekaj 2 dni', parameters: { resume: 'timeInterval', amount: 2, unit: 'days' }, position: [1760, 240] }, output: [{}] });
const wait3 = node({ type: 'n8n-nodes-base.wait', version: 1.1, config: { name: 'Czekaj 3 dni', parameters: { resume: 'timeInterval', amount: 3, unit: 'days' }, position: [2200, 240] }, output: [{}] });
const wait5 = node({ type: 'n8n-nodes-base.wait', version: 1.1, config: { name: 'Czekaj 5 dni', parameters: { resume: 'timeInterval', amount: 5, unit: 'days' }, position: [2640, 240] }, output: [{}] });

const sequenceMail1 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'E-mail edukacyjny 1 (KSeF)',
    parameters: {
      method: 'POST',
      url: 'https://api.resend.com/emails',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Idempotency-Key', value: expr('sequence-1/{{ $("Lead").item.json.id }}') }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ from: $("Lead").item.json.config.mailFrom, to: [$("Lead").item.json.recipient], subject: $("Lead").item.json.emails.sequence[0].subject, html: $("Lead").item.json.emails.sequence[0].html }) }}'),
      options: {},
    },
    credentials: resend,
    position: [1980, 240],
  },
  output: [{ id: 're_s1' }],
});

const sequenceMail2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'E-mail edukacyjny 2 (formy opodatkowania)',
    parameters: {
      method: 'POST',
      url: 'https://api.resend.com/emails',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Idempotency-Key', value: expr('sequence-2/{{ $("Lead").item.json.id }}') }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ from: $("Lead").item.json.config.mailFrom, to: [$("Lead").item.json.recipient], subject: $("Lead").item.json.emails.sequence[1].subject, html: $("Lead").item.json.emails.sequence[1].html }) }}'),
      options: {},
    },
    credentials: resend,
    position: [2420, 240],
  },
  output: [{ id: 're_s2' }],
});

const sequenceMail3 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'E-mail edukacyjny 3 (zmiana biura)',
    parameters: {
      method: 'POST',
      url: 'https://api.resend.com/emails',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Idempotency-Key', value: expr('sequence-3/{{ $("Lead").item.json.id }}') }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ from: $("Lead").item.json.config.mailFrom, to: [$("Lead").item.json.recipient], subject: $("Lead").item.json.emails.sequence[2].subject, html: $("Lead").item.json.emails.sequence[2].html }) }}'),
      options: {},
    },
    credentials: resend,
    position: [2860, 240],
  },
  output: [{ id: 're_s3' }],
});

const intro = sticky(
  '## Bilans · lead-created\nWebhook z `/api/lead` (src/server/lead-intake.ts) albo wywołanie z **Bilans · lead-redelivery**.\n\n1. HMAC-SHA256 z surowego body, okno 5 min. Zły podpis = 401 i alert.\n2. Idempotencja: wpis do `processed_webhooks` (source `n8n.lead-created`). Duplikat = 200, nic się nie wysyła.\n3. Odpowiedź 202 w ułamku sekundy, reszta asynchronicznie.\n4. PDF: notka od Claude (bez danych osobowych, bez kwot) → PDF.co z `/wycena/dokument` → Resend.\n5. Gorący lead albo konsultacja → Telegram do biura. Zimny ze zgodą marketingową → 3 maile (dzień 2, 5, 10).\n\nTryb demo: maile tylko na `testInbox`. Ustawienia w węźle **Konfiguracja**, klucz webhooka w poświadczeniu Header Auth.',
  [verify, signatureOk, lead, claim, isNew],
  { color: 7 },
);

export default workflow('bilans-lead-created', 'Bilans · lead-created')
  .add(webhookIn)
  .to(verify)
  .to(signatureOk
    .onTrue(settings.to(lead).to(claim).to(isNew
      .onTrue(respond202)
      .onFalse(respondDuplicate)))
    .onFalse(respond401.to(reject)))
  .add(fromRedelivery)
  .to(settings)
  .add(respond202)
  .to(byIntent
    .onCase(0, note.to(pdf).to(sendPdf).to(logPdf))
    .onCase(1, sendConsultation.to(logConsultation)))
  .add(respond202)
  .to(notifyOffice.onTrue(telegramOffice))
  .add(respond202)
  .to(startSequence.onTrue(wait2.to(sequenceMail1).to(wait3).to(sequenceMail2).to(wait5).to(sequenceMail3)))
  .add(intro)
  .group('Lead i idempotencja', [lead, claim, isNew], { description: 'Jeden kształt leada z webhooka i z bazy, wpis do processed_webhooks - ten sam lead nie wyśle maili dwa razy.' })
  .group('Wycena PDF', [note, pdf, sendPdf, logPdf], { description: 'Claude pisze notkę bez kwot, PDF.co renderuje dokument wyceny, Resend wysyła mail z załącznikiem.' })
  .group('Sekwencja dla zimnych leadów', [wait2, sequenceMail1, wait3, sequenceMail2, wait5, sequenceMail3], { description: 'Tylko ze zgodą marketingową: KSeF, formy opodatkowania, zmiana biura - dzień 2, 5 i 10.' });
