import Image from 'next/image'
import type { ArchiveImage } from '@/content/archive'
import { cn } from '@/lib/cn'

/**
 * Rycina jak plansza w instrukcji technicznej: obraz w ramce tuszu, pod nim numer ryciny, opis i źródło.
 * mix-blend-multiply wtapia biel skanu w papier strony - rycina wygląda na wydrukowaną, nie wklejoną.
 */
export function ArchivePlate({
  image,
  figure,
  sizes,
  className,
  imageClassName,
}: {
  image: ArchiveImage
  figure: number
  sizes: string
  className?: string
  imageClassName?: string
}) {
  return (
    <figure className={cn('grid content-start gap-3', className)} data-reveal>
      <div className="overflow-hidden border-2 border-ink bg-paper">
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt={image.alt}
          sizes={sizes}
          className={cn('h-auto w-full mix-blend-multiply', imageClassName)}
        />
      </div>
      <figcaption className="grid gap-1 font-mono text-xs leading-snug text-ink">
        <span><span className="font-bold text-alert">Ryc. {figure}</span> · {image.caption}</span>
        <a href={image.sourceUrl} className="text-ink-muted underline decoration-rule underline-offset-2 hover:text-ink" rel="noopener">
          {image.source}
        </a>
      </figcaption>
    </figure>
  )
}
