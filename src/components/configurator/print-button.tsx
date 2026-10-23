'use client'

import { buttonClass } from '@/components/ui/button'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass('secondary', 'mt-8 print:hidden')}>
      Zapisz jako PDF
    </button>
  )
}
