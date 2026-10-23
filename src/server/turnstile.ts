import 'server-only'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** Weryfikacja tokenu Turnstile po stronie serwera. Token jest jednorazowy i ważny 300 s. */
export async function verifyTurnstile(token: string, secret: string, remoteIp?: string): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token })
  if (remoteIp) body.set('remoteip', remoteIp)
  const response = await fetch(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(5_000) })
  if (!response.ok) return false
  const result = (await response.json()) as { success: boolean }
  return result.success
}
