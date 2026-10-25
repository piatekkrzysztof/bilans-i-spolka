// n8n: workflow „Bilans · lead-created”, węzeł „Weryfikuj podpis” (Code, Run Once for All Items).
// Plik jest źródłem prawdy - automation/n8n/build.py wpisuje go do workflow.
//
// Ten sam schemat co src/server/webhook.ts: sha256=HMAC(secret, `${timestamp}.${rawBody}`), okno 5 minut.
// Webhook ma włączone „Raw Body” - podpis liczymy z surowych bajtów, nie z przeparsowanego JSON-a.
// Zły podpis nie rzuca wyjątku: zwracamy { valid: false, reason }, workflow odpowiada 401 i kończy się błędem
// (alert z „Bilans · error-handler”). Sekret jest w zmiennej n8n BILANS_WEBHOOK_SECRET (Settings > Variables).
const crypto = require('crypto')

const TOLERANCE_SEC = 300

const secret = $vars.BILANS_WEBHOOK_SECRET
if (!secret) throw new Error('Brak zmiennej BILANS_WEBHOOK_SECRET w n8n (Settings > Variables)')

const item = $input.first()
const headers = item.json.headers ?? {}
const reject = reason => [{ json: { valid: false, reason } }]

if (!item.binary?.data) return reject('missing raw body')
const raw = (await this.helpers.getBinaryDataBuffer(0, 'data')).toString('utf8')

const timestamp = Number(headers['x-bs-timestamp'])
if (!Number.isInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SEC) {
  return reject('stale or missing timestamp')
}

const expected = Buffer.from(`sha256=${crypto.createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex')}`)
const received = Buffer.from(String(headers['x-bs-signature'] ?? ''))
if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
  return reject('invalid signature')
}

let lead
try {
  lead = JSON.parse(raw)
}
catch {
  return reject('invalid json')
}

if (lead?.type !== 'lead.created' || typeof lead.id !== 'string') return reject('unexpected payload')
// API wysyła Idempotency-Key = lead.id - niezgodność oznacza, że ktoś składa żądanie z cudzych części.
const idempotencyKey = headers['idempotency-key']
if (idempotencyKey && idempotencyKey !== lead.id) return reject('idempotency key mismatch')

return [{ json: { valid: true, lead } }]
