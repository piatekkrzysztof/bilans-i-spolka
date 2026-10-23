// Węzeł Code w n8n (pierwszy po Webhook): weryfikacja podpisu HMAC z /api/lead.
// Ten sam schemat co src/server/webhook.ts: sha256=HMAC(secret, `${timestamp}.${rawBody}`), tolerancja 5 minut.
// Webhook w n8n musi mieć włączone „Raw Body”, inaczej podpis nie zgodzi się z treścią.
const crypto = require('crypto')

const secret = $env.N8N_WEBHOOK_SECRET
const headers = $json.headers
const rawBody = Buffer.from($binary.data.data, 'base64').toString('utf8')
const timestamp = Number(headers['x-bs-timestamp'])
const received = String(headers['x-bs-signature'] ?? '')

if (!secret) throw new Error('Brak N8N_WEBHOOK_SECRET')
if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) throw new Error('Webhook: przeterminowany znacznik czasu')

const expected = `sha256=${crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`
const valid = expected.length === received.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
if (!valid) throw new Error('Webhook: nieprawidłowy podpis')

const event = JSON.parse(rawBody)
// Idempotency-Key = id wyceny; kolejny węzeł sprawdza go w Supabase (processed_webhooks) przed wysyłką maili.
return [{ json: { ...event, idempotencyKey: headers['idempotency-key'] } }]
