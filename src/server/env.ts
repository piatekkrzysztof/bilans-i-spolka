/**
 * Zmienne środowiskowe serwera - jedno miejsce, walidowane przy pierwszym użyciu.
 * Nic stąd nie może trafić do przeglądarki (`server-only`).
 */
import 'server-only'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_URL: z.url().optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  /** `memory` - jawna zgoda na leady w pamięci poza `next dev` (e2e, podglądy). Nigdy na produkcji. */
  LEAD_STORE: z.enum(['memory', '']).optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  N8N_WEBHOOK_URL: z.url().optional().or(z.literal('')),
  N8N_WEBHOOK_SECRET: z.string().optional(),
  SANITY_REVALIDATE_SECRET: z.string().optional(),
})

export type ServerEnv = z.infer<typeof schema>

let cached: ServerEnv | undefined

export function serverEnv(): ServerEnv {
  cached ??= schema.parse(process.env)
  return cached
}

export const isProduction = () => serverEnv().NODE_ENV === 'production'
