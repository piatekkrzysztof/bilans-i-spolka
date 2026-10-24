import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'inverse' | 'outline-inverse' | 'text'

// Przyciski jak etykiety na panelu maszyny: mono, wersaliki, kąty proste, odwrócenie kolorów na hover.
const base = 'inline-flex items-center justify-center gap-3 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50'
const label = 'min-h-12 border-2 px-6 font-mono text-[0.8125rem] font-bold uppercase tracking-[0.08em]'

const variants: Record<Variant, string> = {
  'primary': `${label} border-ink bg-ink text-paper hover:bg-paper hover:text-ink`,
  'secondary': `${label} border-ink bg-transparent text-ink hover:bg-ink hover:text-paper`,
  // Na ciemnym tle (baner KSeF, końcowe CTA).
  'inverse': `${label} border-paper bg-paper text-ink hover:bg-transparent hover:text-paper`,
  'outline-inverse': `${label} border-paper bg-transparent text-paper hover:bg-paper hover:text-ink`,
  'text': 'min-h-11 text-sm font-medium text-ink link-underline',
}

export function buttonClass(variant: Variant = 'primary', className?: string) {
  return cn(base, variants[variant], className)
}

export function Button({ variant = 'primary', className, ...props }: ComponentProps<'button'> & { variant?: Variant }) {
  return <button type="button" className={buttonClass(variant, className)} {...props} />
}

export function LinkButton({
  variant = 'primary',
  className,
  children,
  arrow = false,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; arrow?: boolean; children: ReactNode }) {
  return (
    <Link className={buttonClass(variant, className)} {...props}>
      {children}
      {arrow && <span aria-hidden="true">→</span>}
    </Link>
  )
}
