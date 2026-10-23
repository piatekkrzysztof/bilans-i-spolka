import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'text'

const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-300 ease-[var(--ease-calm)] disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<Variant, string> = {
  primary: 'min-h-12 rounded-[3px] bg-ledger px-6 text-sm text-paper hover:bg-ledger-deep',
  secondary: 'min-h-12 rounded-[3px] border border-ledger/30 bg-surface px-6 text-sm text-ledger hover:border-ledger',
  text: 'min-h-11 text-sm text-ledger link-underline',
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
