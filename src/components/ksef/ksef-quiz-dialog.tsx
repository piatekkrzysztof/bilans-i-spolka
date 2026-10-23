'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { ReadinessQuiz } from './readiness-quiz'

/** Treść dialogu testu KSeF - ładowana dopiero po kliknięciu przycisku (ksef-quiz-trigger.tsx). */
export default function KsefQuizDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/30" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-[6px] bg-paper p-6 text-ink shadow-2xl focus:outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[38rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[4px] sm:p-8"
        >
          <div className="mb-6 flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow">Test gotowości KSeF · 5 pytań</p>
              <Dialog.Title className="mt-2 font-serif text-2xl text-ink">Czy Twoja firma jest gotowa?</Dialog.Title>
            </div>
            <Dialog.Close className="grid size-11 shrink-0 place-items-center text-ink-muted hover:text-ink" aria-label="Zamknij">
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <ReadinessQuiz compact />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
