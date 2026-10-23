'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV } from '@/lib/site'
import { cn } from '@/lib/cn'

export function NavLinks({ variant }: { variant: 'bar' | 'sheet' }) {
  const pathname = usePathname()
  return (
    <ul className={variant === 'bar' ? 'flex items-center gap-7' : 'grid gap-1'}>
      {NAV.map(item => {
        const active = pathname.startsWith(item.match)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'text-sm transition-colors duration-300',
                variant === 'bar' ? 'py-2' : 'block border-b border-rule py-3.5 font-serif text-xl',
                active ? 'text-ledger' : 'text-ink hover:text-ledger',
                active && variant === 'bar' && 'underline decoration-brass decoration-1 underline-offset-[0.5em]',
              )}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
