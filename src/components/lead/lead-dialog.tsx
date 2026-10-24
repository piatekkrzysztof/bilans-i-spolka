'use client'

/**
 * Formularz wyceny PDF / konsultacji w oknie dialogowym. Ładowany leniwie przy pierwszym otwarciu,
 * więc React Hook Form i Zod nie obciążają pierwszego wejścia na stronę.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useCallback, useId, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { buttonClass } from '@/components/ui/button'
import { formatPLN } from '@/domain/money'
import type { Quote } from '@/domain/pricing'
import { SITUATION_LABELS, SITUATIONS, START_WHEN, START_WHEN_LABELS } from '@/domain/scoring'
import { cn } from '@/lib/cn'
import { type LeadFormValues, type LeadIntent, type LeadResponse, leadFormSchema } from '@/lib/schemas/lead'
import { demoMode, turnstileSiteKey } from '@/lib/site'
import { Turnstile, type TurnstileState } from './turnstile'

/** Podpowiedź pod widżetem i komunikat przy próbie wysyłki bez tokenu - mówi, co zrobić, a nie tylko „czekaj”. */
const TURNSTILE_HINT: Record<Exclude<TurnstileState, 'ready'>, { hint: string; blocked: string }> = {
  checking: {
    hint: 'Cloudflare sprawdza w tle, czy nie jesteś botem - zwykle kilka sekund.',
    blocked: 'Weryfikacja antyspamowa trwa dłużej niż zwykle. Jeśli nad przyciskiem pojawi się pole Cloudflare, zaznacz je i wyślij ponownie.',
  },
  interactive: {
    hint: 'Zaznacz pole „Potwierdź, że jesteś człowiekiem” powyżej - bez tego formularz nie zostanie wysłany.',
    blocked: 'Zaznacz pole „Potwierdź, że jesteś człowiekiem” nad przyciskiem, a potem wyślij ponownie.',
  },
  failed: {
    hint: 'Weryfikacja Cloudflare nie zadziałała. Odśwież stronę albo napisz do nas ze strony kontaktu.',
    blocked: 'Weryfikacja Cloudflare nie zadziałała. Odśwież stronę albo napisz do nas ze strony kontaktu.',
  },
}

const COPY: Record<LeadIntent, { title: string; lead: string; submit: string }> = {
  pdf: {
    title: 'Wycena PDF na e-mail',
    lead: 'Wyślemy rozpisaną wycenę z notką o tym, na co zwrócić uwagę w Twojej firmie. Zwykle w ciągu minuty.',
    submit: 'Wyślij wycenę',
  },
  consultation: {
    title: 'Bezpłatna konsultacja, 20 minut',
    lead: 'Zostaw kontakt - dobierzemy księgową do Twojej formy działalności i podamy link do jej kalendarza.',
    submit: 'Umów konsultację',
  },
}

type Status = { kind: 'idle' } | { kind: 'error'; message: string } | { kind: 'done'; response: LeadResponse }

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: (id: string, describedBy?: string) => ReactNode }) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
      {hint && <p id={`${id}-hint`} className="text-xs text-ink-muted">{hint}</p>}
      <div className="mt-1.5">{children(id, describedBy)}</div>
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-alert">{error}</p>}
    </div>
  )
}

const inputClass = 'h-12 w-full rounded-[3px] border border-rule bg-surface px-3.5 text-base text-ink aria-[invalid=true]:border-alert'

const TURNSTILE_WAIT_MS = 15_000

function waitFor(done: () => boolean, timeoutMs: number): Promise<void> {
  return new Promise(resolve => {
    const started = Date.now()
    const tick = () => (done() || Date.now() - started > timeoutMs ? resolve() : setTimeout(tick, 100))
    tick()
  })
}

export default function LeadDialog({ intent, quote, open, onOpenChange }: { intent: LeadIntent; quote: Quote; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [token, setToken] = useState('')
  const [turnstileState, setTurnstileState] = useState<TurnstileState>('checking')
  // Kopie w refach: wysyłka czeka na token w pętli, a stan Reacta wewnątrz handlera byłby nieaktualny.
  const tokenRef = useRef('')
  const turnstileStateRef = useRef<TurnstileState>('checking')
  const onToken = useCallback((value: string) => {
    tokenRef.current = value
    setToken(value)
  }, [])
  const onTurnstileState = useCallback((value: TurnstileState) => {
    turnstileStateRef.current = value
    setTurnstileState(value)
  }, [])
  const copy = COPY[intent]
  // Z kluczem Turnstile nie wysyłamy formularza bez tokenu - serwer i tak by go odrzucił (403).
  // Przycisk zostaje aktywny: zablokowany z napisem „weryfikacja…” nie mówił, że trzeba kliknąć pole Cloudflare.
  const turnstilePending = Boolean(turnstileSiteKey) && !token
  const pendingState = turnstileState === 'ready' ? 'checking' : turnstileState

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { name: '', email: '', phone: '', message: '', consentMarketing: false },
  })

  // handleSubmit wołany dopiero w zdarzeniu: wysyłka czyta refy, a tych nie wolno dotykać podczas renderu.
  const send = async (values: LeadFormValues) => {
    setStatus({ kind: 'idle' })
    if (turnstileSiteKey && !tokenRef.current) {
      // Sprawdzanie w tle zwykle kończy się w sekundę - czekamy na nie zamiast odsyłać z błędem.
      await waitFor(() => Boolean(tokenRef.current) || turnstileStateRef.current !== 'checking', TURNSTILE_WAIT_MS)
      if (!tokenRef.current) {
        const state = turnstileStateRef.current === 'ready' ? 'checking' : turnstileStateRef.current
        return setStatus({ kind: 'error', message: TURNSTILE_HINT[state].blocked })
      }
    }
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, intent, quote: quote.input, turnstileToken: tokenRef.current }),
      })
      if (response.status === 409) return setStatus({ kind: 'error', message: 'Ta wycena już do nas dotarła w ciągu ostatniej doby. Odezwiemy się - nie trzeba wysyłać jej ponownie.' })
      if (response.status === 403) return setStatus({ kind: 'error', message: 'Weryfikacja antyspamowa wygasła. Odśwież stronę i spróbuj ponownie.' })
      if (response.status === 429) return setStatus({ kind: 'error', message: 'Za dużo prób w krótkim czasie. Spróbuj za kilka minut albo zadzwoń.' })
      if (!response.ok) return setStatus({ kind: 'error', message: 'Nie udało się wysłać formularza. Sprawdź pola i spróbuj ponownie.' })
      setStatus({ kind: 'done', response: (await response.json()) as LeadResponse })
    }
    catch {
      setStatus({ kind: 'error', message: 'Brak połączenia. Twoje dane są w formularzu - spróbuj ponownie za chwilę.' })
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/30 data-[state=open]:animate-[fade-up_300ms_var(--ease-calm)]" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-[6px] bg-paper p-6 shadow-2xl focus:outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[34rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[4px] sm:p-8"
          aria-describedby={undefined}
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <Dialog.Title className="font-display text-2xl leading-tight text-ink uppercase tracking-[-0.02em]">{copy.title}</Dialog.Title>
              <p className="num mt-1 text-sm text-ink-muted">
                {quote.isFromPrice ? 'od ' : ''}{formatPLN(quote.monthlyNet)} netto miesięcznie
              </p>
            </div>
            <Dialog.Close className="grid size-11 shrink-0 place-items-center text-ink-muted hover:text-ink" aria-label="Zamknij">
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </Dialog.Close>
          </div>

          {status.kind === 'done' ? (
            <Success response={status.response} intent={intent} />
          ) : (
            <form onSubmit={event => void handleSubmit(send)(event)} noValidate className="mt-6 grid gap-5">
              <p className="text-sm text-ink-muted">{copy.lead}</p>
              {demoMode && (
                <p className="border-l-2 border-brass bg-surface px-4 py-3 text-sm text-ink">
                  <strong className="font-medium">Tryb demo.</strong> To projekt koncepcyjny - zgłoszenie trafi do testowej skrzynki SM-art, nie do prawdziwego biura.
                </p>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Imię" error={errors.name?.message}>
                  {(id, d) => <input id={id} autoComplete="given-name" aria-invalid={!!errors.name} aria-describedby={d} className={inputClass} {...register('name')} />}
                </Field>
                <Field label="E-mail" error={errors.email?.message}>
                  {(id, d) => <input id={id} type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={d} className={inputClass} {...register('email')} />}
                </Field>
              </div>
              <Field label="Telefon (opcjonalnie)" hint="Oddzwonimy tylko, jeśli o to poprosisz w wiadomości." error={errors.phone?.message}>
                {(id, d) => <input id={id} type="tel" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={d} className={inputClass} {...register('phone')} />}
              </Field>
              <fieldset>
                <legend className="text-sm font-medium text-ink">Twoja sytuacja</legend>
                <div className="mt-2 grid gap-2">
                  {SITUATIONS.map(value => (
                    <label key={value} className="flex min-h-11 items-center gap-3 rounded-[3px] border border-rule bg-surface px-3.5 text-sm has-[:checked]:border-ledger has-[:checked]:bg-ledger-soft">
                      <input type="radio" value={value} className="accent-ledger" {...register('situation')} />
                      {SITUATION_LABELS[value]}
                    </label>
                  ))}
                </div>
                {errors.situation && <p className="mt-1 text-xs text-alert">{errors.situation.message}</p>}
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium text-ink">Kiedy chcesz zacząć?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {START_WHEN.map(value => (
                    <label key={value} className="flex min-h-11 items-center gap-2.5 rounded-[3px] border border-rule bg-surface px-3.5 text-sm has-[:checked]:border-ledger has-[:checked]:bg-ledger-soft">
                      <input type="radio" value={value} className="accent-ledger" {...register('startWhen')} />
                      {START_WHEN_LABELS[value]}
                    </label>
                  ))}
                </div>
                {errors.startWhen && <p className="mt-1 text-xs text-alert">{errors.startWhen.message}</p>}
              </fieldset>
              <Field label="Wiadomość (opcjonalnie)" error={errors.message?.message}>
                {(id, d) => <textarea id={id} rows={3} aria-describedby={d} className={cn(inputClass, 'h-auto py-3')} {...register('message')} />}
              </Field>

              <div className="grid gap-3 border-t border-rule pt-5 text-sm">
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 size-4 shrink-0 accent-ledger" aria-invalid={!!errors.consentContact} {...register('consentContact')} />
                  <span>
                    Zgadzam się na kontakt w sprawie tej wyceny e-mailem lub telefonicznie. <span className="text-ink-muted">(wymagane)</span>
                    {errors.consentContact && <span className="mt-1 block text-xs text-alert">{errors.consentContact.message}</span>}
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 size-4 shrink-0 accent-ledger" {...register('consentMarketing')} />
                  <span>Chcę dostawać krótkie przypomnienia o zmianach w podatkach i KSeF (najwyżej raz w miesiącu).</span>
                </label>
                <p className="text-xs leading-relaxed text-ink-muted">
                  Administratorem danych jest Bilans &amp; Spółka (projekt koncepcyjny). Wycenę przechowujemy 12 miesięcy, potem
                  usuwamy ją automatycznie. Szczegóły: <Link href="/polityka-prywatnosci" className="link-underline">polityka prywatności</Link>.
                </p>
              </div>

              <div className="grid gap-2">
                <Turnstile onToken={onToken} onState={onTurnstileState} />
                {turnstilePending && status.kind !== 'error' && (
                  <p role="status" className={cn('flex items-start gap-2 text-xs leading-relaxed', pendingState === 'checking' ? 'text-ink-muted' : 'font-medium text-ink')}>
                    {pendingState !== 'checking' && <span aria-hidden="true" className="marker mt-1 shrink-0" />}
                    {TURNSTILE_HINT[pendingState].hint}
                  </p>
                )}
              </div>

              {status.kind === 'error' && <p role="alert" className="border-l-2 border-alert bg-surface px-4 py-3 text-sm text-alert">{status.message}</p>}

              <button type="submit" disabled={isSubmitting} className={buttonClass('primary', 'w-full')}>
                {isSubmitting ? 'Wysyłam…' : copy.submit}
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Success({ response, intent }: { response: LeadResponse; intent: LeadIntent }) {
  const calendarHref = response.advisor?.calLink ?? '/kontakt#konsultacja'
  return (
    <div className="mt-6 grid gap-5" role="status">
      <p className="font-display text-xl text-ledger tracking-[-0.02em]">
        {intent === 'pdf' ? 'Wycena jest w drodze.' : 'Dziękujemy - konsultacja jest prawie umówiona.'}
      </p>
      {response.demo && (
        <p className="text-sm text-ink-muted">Tryb demo: wiadomość trafiła do testowej skrzynki SM-art. Dokument możesz obejrzeć poniżej.</p>
      )}
      {response.advisor && (
        <div className="border-y border-rule py-4 text-sm">
          <p className="eyebrow">Twoja opiekunka</p>
          <p className="mt-1 font-display text-lg uppercase tracking-[-0.02em]">{response.advisor.name}</p>
          <p className="text-ink-muted">
            {response.temperature === 'hot'
              ? 'Odezwie się dziś. Możesz też od razu wybrać termin w jej kalendarzu.'
              : 'Wyślemy jeszcze krótką ściągę o formach opodatkowania i KSeF. Termin możesz wybrać, kiedy chcesz.'}
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <a href={response.documentUrl} target="_blank" rel="noopener" className={buttonClass('secondary')}>Podgląd dokumentu wyceny</a>
        <a href={calendarHref} className={buttonClass('primary')}>Wybierz termin konsultacji</a>
      </div>
      <p className="num text-xs text-ink-muted">Numer zgłoszenia: {response.id.slice(0, 8).toUpperCase()}</p>
    </div>
  )
}
