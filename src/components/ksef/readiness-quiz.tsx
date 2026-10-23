'use client'

/** Test „Czy Twoja firma jest gotowa na KSeF?” - 5 pytań, wynik od razu, bez e-maila. */
import Link from 'next/link'
import { useState } from 'react'
import { buttonClass } from '@/components/ui/button'
import { type Answer, evaluateReadiness, READINESS_QUESTIONS } from '@/domain/ksef-readiness'
import { cn } from '@/lib/cn'

const ANSWERS: { value: Answer; label: string }[] = [
  { value: 'yes', label: 'Tak' },
  { value: 'no', label: 'Nie' },
  { value: 'unsure', label: 'Nie wiem' },
]

const LEVEL_COPY = {
  'ready': { title: 'Jesteś gotowy.', text: 'Wszystkie najważniejsze elementy są na miejscu. Zostaje pilnować, żeby faktury trafiały do KSeF od pierwszego dnia stycznia.' },
  'almost': { title: 'Prawie gotowe.', text: 'Brakuje kilku rzeczy - każdą da się załatwić w tydzień.' },
  'not-ready': { title: 'Warto zacząć teraz.', text: 'Bez uprawnień i połączonego programu od stycznia nie wystawisz poprawnej faktury dla firmy.' },
} as const

export function ReadinessQuiz({ compact = false }: { compact?: boolean }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [submitted, setSubmitted] = useState(false)
  const answeredAll = READINESS_QUESTIONS.every(q => answers[q.id])
  const result = evaluateReadiness(answers)

  if (submitted) {
    const copy = LEVEL_COPY[result.level]
    return (
      <div role="status" className="grid gap-6">
        <div className="flex items-end justify-between gap-6 border-b border-ink/70 pb-4">
          <p className="font-serif text-2xl text-ink">{copy.title}</p>
          <p className="num font-serif text-3xl leading-none text-ledger">{result.score}<span className="text-base text-ink-muted">/100</span></p>
        </div>
        <p className="text-ink-muted">{copy.text}</p>
        {result.gaps.length > 0 && (
          <div>
            <p className="eyebrow">Do zrobienia</p>
            <ol className="mt-3 grid gap-3">
              {result.gaps.map((gap, i) => (
                <li key={gap.id} className="grid grid-cols-[2rem_1fr] gap-2 border-b border-rule pb-3 text-sm">
                  <span className="num font-serif text-ledger">{i + 1}.</span>
                  <span className="text-ink">{gap.gap}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Link href="/wycena?dodatki=ksef" className={buttonClass('primary')}>Wdrożenie KSeF w wycenie</Link>
          <button type="button" className={buttonClass('text')} onClick={() => { setAnswers({}); setSubmitted(false) }}>
            Wypełnij jeszcze raz
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        setSubmitted(true)
      }}
      className="grid gap-6"
    >
      <ol className="grid gap-6">
        {READINESS_QUESTIONS.map((q, index) => (
          <li key={q.id}>
            <fieldset>
              <legend className="grid grid-cols-[2rem_1fr] gap-2 text-ink">
                <span aria-hidden="true" className="num font-serif text-ledger">{index + 1}.</span>
                <span className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>{q.question}</span>
              </legend>
              {!compact && <p className="ml-10 mt-1 text-sm text-ink-muted">{q.hint}</p>}
              <div className="ml-10 mt-3 flex flex-wrap gap-2">
                {ANSWERS.map(answer => (
                  <label
                    key={answer.value}
                    className="flex min-h-10 cursor-pointer items-center gap-2 rounded-[3px] border border-rule bg-surface px-3.5 text-sm text-ink-muted transition-colors has-[:checked]:border-ledger has-[:checked]:bg-ledger-soft has-[:checked]:text-ledger-deep has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ledger"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={answer.value}
                      checked={answers[q.id] === answer.value}
                      onChange={() => setAnswers(prev => ({ ...prev, [q.id]: answer.value }))}
                      className="sr-only"
                    />
                    {answer.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      <button type="submit" disabled={!answeredAll} className={buttonClass('primary', 'justify-self-start')}>
        {answeredAll ? 'Pokaż wynik' : `Odpowiedz na ${READINESS_QUESTIONS.length - Object.keys(answers).length} pyt.`}
      </button>
    </form>
  )
}
