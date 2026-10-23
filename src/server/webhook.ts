import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Podpis webhooka w schemacie Stripe: HMAC-SHA256 z `${timestamp}.${rawBody}`.
 * Znacznik czasu w podpisie blokuje replay - odbiorca odrzuca żądania starsze niż 5 minut.
 * Ten sam kod weryfikuje podpis w n8n (automation/n8n/code/verify-signature.js).
 */
export function signPayload(secret: string, rawBody: string, timestamp: number): string {
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`
}

export function verifySignature(
  secret: string,
  rawBody: string,
  timestamp: number,
  signature: string,
  { toleranceSec = 300, now = Math.floor(Date.now() / 1000) } = {},
): boolean {
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > toleranceSec) return false
  const expected = Buffer.from(signPayload(secret, rawBody, timestamp))
  const received = Buffer.from(signature)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export interface DeliveryResult {
  ok: boolean
  status?: number
  error?: string
}

/**
 * Wysyła zdarzenie do n8n. Lead jest już zapisany w bazie, więc błąd tutaj nie gubi danych -
 * cron w n8n dociąga zdarzenia `pending_delivery` z outboxa. `Idempotency-Key` = id wyceny.
 */
export async function deliverWebhook(url: string, secret: string, idempotencyKey: string, payload: unknown): Promise<DeliveryResult> {
  const rawBody = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-bs-timestamp': String(timestamp),
        'x-bs-signature': signPayload(secret, rawBody, timestamp),
        'idempotency-key': idempotencyKey,
      },
      body: rawBody,
      signal: AbortSignal.timeout(4_000),
    })
    return { ok: response.ok, status: response.status }
  }
  catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
