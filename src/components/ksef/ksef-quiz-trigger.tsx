'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { buttonClass } from '@/components/ui/button'

// Dialog (Radix) i test ładują się dopiero po pierwszym kliknięciu - strona główna nie płaci za nie z góry.
const KsefQuizDialog = dynamic(() => import('./ksef-quiz-dialog'), { ssr: false })

export function KsefQuizTrigger({ variant = 'secondary' }: { variant?: Parameters<typeof buttonClass>[0] }) {
  const [state, setState] = useState<'idle' | 'open' | 'closed'>('idle')
  return (
    <>
      <button type="button" aria-haspopup="dialog" className={buttonClass(variant)} onClick={() => setState('open')}>
        Czy Twoja firma jest gotowa?
      </button>
      {state !== 'idle' && <KsefQuizDialog open={state === 'open'} onOpenChange={open => setState(open ? 'open' : 'closed')} />}
    </>
  )
}
