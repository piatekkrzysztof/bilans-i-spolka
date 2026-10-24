import Image from 'next/image'
import type { SanityImage } from '@/content/types'
import { cn } from '@/lib/cn'

/**
 * Portret osoby z zespołu. Zdjęcie przychodzi z Sanity (jeden styl: to samo tło, naturalne światło),
 * w druku technicznym pokazane w skali szarości. Bez zdjęcia: blok tuszu z inicjałami i kodem pozycji
 * jak karta katalogowa - zamiast stockowego uśmiechu przy laptopie.
 */
export function Portrait({
  name,
  photo,
  size = 'md',
  className,
  priority = false,
  code,
}: {
  name: string
  photo?: SanityImage
  size?: 'sm' | 'md' | 'lg'
  className?: string
  priority?: boolean
  /** Kod pozycji w karcie (np. K-01) - dekoracja. */
  code?: string
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
        sizes={size === 'sm' ? '56px' : '(min-width: 1024px) 320px, 50vw'}
        className={cn(box, 'object-cover contrast-125 grayscale', className)}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={`Monogram: ${name} (portret przykładowy)`}
      className={cn(box, 'relative grid place-items-center overflow-hidden bg-ink text-paper', className)}
    >
      {size !== 'sm' && (
        <>
          <span aria-hidden="true" className="absolute left-3 top-3 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-paper/70">
            {code ?? 'Zespół'}
          </span>
          <span aria-hidden="true" className="absolute right-3 top-3 size-2.5 bg-signal" />
          {/* Linie pomiarowe jak na rysunku technicznym. */}
          <span aria-hidden="true" className="absolute inset-x-3 bottom-3 flex items-end gap-[3px]">
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} className="w-px bg-paper/40" style={{ height: i % 4 === 0 ? 10 : 5 }} />
            ))}
          </span>
        </>
      )}
      <span aria-hidden="true" className={cn('font-display font-black uppercase leading-none tracking-[-0.06em]', size === 'sm' ? 'text-lg' : 'text-[5.5rem]')}>
        {initials}
      </span>
    </div>
  )
}
