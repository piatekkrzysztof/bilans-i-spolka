/**
 * Limiter okna przesuwnego w pamięci instancji - druga linia obrony za Turnstile.
 * Na serverless każda instancja ma własny licznik; przy większym ruchu przenieść do Upstash/KV (ADR-005).
 */
const buckets = new Map<string, number[]>()

export function hitRateLimit(key: string, { limit = 5, windowMs = 10 * 60_000, now = Date.now() } = {}) {
  const hits = (buckets.get(key) ?? []).filter(t => now - t < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return { limited: true, retryAfterSec: Math.ceil((windowMs - (now - hits[0]!)) / 1000) }
  }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 5_000) {
    for (const [k, v] of buckets) if (v.every(t => now - t >= windowMs)) buckets.delete(k)
  }
  return { limited: false, retryAfterSec: 0 }
}

export function resetRateLimit() {
  buckets.clear()
}
