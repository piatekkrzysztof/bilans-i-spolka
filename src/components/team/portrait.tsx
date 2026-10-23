import Image from 'next/image'
import type { SanityImage } from '@/content/types'
import { cn } from '@/lib/cn'

/**
 * Portret osoby z zespołu. Zdjęcie przychodzi z Sanity (jeden styl: to samo tło, naturalne światło);
 * bez zdjęcia pokazujemy monogram jak ekslibris - zamiast stockowego uśmiechu przy laptopie.
 */
export function Portrait({
  name,
  photo,
  size = 'md',
  className,
  priority = false,
}: {
  name: string
  photo?: SanityImage
  size?: 'sm' | 'md' | 'lg'
  className?: string
  priority?: boolean
}) {
  const initials = name.split(' ').map(part => part[0]).join('')
  const box = { sm: 'size-14', md: 'aspect-[4/5] w-full', lg: 'aspect-[4/5] w-full' }[size]

  if (photo) {
    return (
      <Image
        src={photo.url}
        alt={photo.alt || `Portret: ${name}`}
        width={photo.width}
        height={photo.height}
        priority={priority}
        sizes={size === 'sm' ? '56px' : '(min-width: 1024px) 280px, 50vw'}
        className={cn(box, 'object-cover grayscale-[15%]', className)}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={`Monogram: ${name} (portret przykładowy)`}
      className={cn(box, 'relative grid place-items-center overflow-hidden bg-[#f1ede3]', size !== 'sm' && 'border border-rule', className)}
    >
      {size !== 'sm' && (
        <>
          <span aria-hidden="true" className="absolute inset-3 border border-rule-strong/70" />
          <span aria-hidden="true" className="absolute inset-x-8 bottom-8 grid gap-[3px]">
            <span className="h-px bg-brass/70" />
            <span className="h-px bg-brass/70" />
          </span>
        </>
      )}
      <span className={cn('font-serif italic text-ledger', size === 'sm' ? 'text-lg' : 'text-[4.5rem] leading-none')} aria-hidden="true">
        {initials}
      </span>
    </div>
  )
}
