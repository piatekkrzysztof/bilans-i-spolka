'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV } from '@/lib/site'
import { cn } from '@/lib/cn'

export function NavLinks({ variant }: { variant: 'bar' | 'sheet' }) {
  const pathname = usePathname()
  return (
    <ul className={variant === 'bar' ? 'flex items-stretch' : 'grid border-t-2 border-ink'}>
      {NAV.map((item, index) => {
        const active = pathname.startsWith(item.match)
        return (
          <li key={item.href} className={variant === 'bar' ? 'border-l border-ink last:border-r' : 'border-b border-ink'}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-full items-center gap-2 font-mono uppercase tracking-[0.08em] transition-colors duration-150',
                variant === 'bar' ? 'px-4 text-[0.75rem]' : 'justify-between py-4 text-base',
                active ? 'bg-ink text-paper' : 'text-ink hover:bg-ink hover:text-paper',
              )}
            >
              {variant === 'sheet' && <span aria-hidden="true" className="text-xs text-ink-muted">0{index + 1}</span>}
              <span className={variant === 'sheet' ? 'mr-auto' : undefined}>{item.label}</span>
              {variant === 'sheet' && <span aria-hidden="true">→</span>}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
