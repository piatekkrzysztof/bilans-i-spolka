import Link from 'next/link'
import type { ReactNode } from 'react'
import type { PortableBlock, PortableSpan, RichText as RichTextValue } from '@/content/types'

/**
 * Minimalny renderer Portable Text (akapity, nagłówki, listy, wyróżnienia, linki, ramki).
 * Własny zamiast @portabletext/react - obsługujemy tylko to, na co pozwala schemat w Studio.
 */
function renderSpans(block: PortableBlock): ReactNode[] {
  return block.children.map((span: PortableSpan, index) => {
    let node: ReactNode = span.text
    for (const mark of span.marks ?? []) {
      if (mark === 'strong') node = <strong className="font-medium text-ink">{node}</strong>
      else if (mark === 'em') node = <em>{node}</em>
      else {
        const def = block.markDefs?.find(d => d._key === mark)
        if (def?.href) {
          node = def.href.startsWith('/')
            ? <Link href={def.href} className="link-underline text-ledger">{node}</Link>
            : <a href={def.href} className="link-underline text-ledger" rel="noopener">{node}</a>
        }
      }
    }
    return <span key={index}>{node}</span>
  })
}

export function RichText({ value }: { value: RichTextValue }) {
  const out: ReactNode[] = []
  for (let i = 0; i < value.length; i++) {
    const block = value[i]!
    if (block._type === 'callout') {
      out.push(
        <aside key={block._key} className={`my-8 border-l-2 bg-surface px-6 py-5 ${block.tone === 'warning' ? 'border-brass' : 'border-ledger'}`}>
          <p className="font-serif text-lg text-ink">{block.title}</p>
          <p className="mt-1.5 text-ink-muted">{block.text}</p>
        </aside>,
      )
      continue
    }
    if (block.listItem) {
      const kind = block.listItem
      const items: PortableBlock[] = []
      while (i < value.length) {
        const next = value[i]!
        if (next._type !== 'block' || next.listItem !== kind) break
        items.push(next)
        i++
      }
      i--
      const List = kind === 'number' ? 'ol' : 'ul'
      out.push(
        <List key={block._key} className={`my-5 grid gap-2 pl-6 ${kind === 'number' ? 'list-decimal marker:font-serif marker:text-ledger' : 'list-[square] marker:text-brass'}`}>
          {items.map(item => <li key={item._key} className="pl-1">{renderSpans(item)}</li>)}
        </List>,
      )
      continue
    }
    if (block.style === 'h2') out.push(<h2 key={block._key} className="mt-12 mb-4 text-[1.75rem] leading-tight text-ink">{renderSpans(block)}</h2>)
    else if (block.style === 'h3') out.push(<h3 key={block._key} className="mt-8 mb-3 text-xl text-ink">{renderSpans(block)}</h3>)
    else if (block.style === 'blockquote') out.push(<blockquote key={block._key} className="my-6 font-serif text-xl text-ink">{renderSpans(block)}</blockquote>)
    else out.push(<p key={block._key} className="my-4">{renderSpans(block)}</p>)
  }
  return <div className="text-[1.0625rem] leading-[1.75] text-ink/90">{out}</div>
}
