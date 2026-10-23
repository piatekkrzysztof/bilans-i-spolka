/**
 * Pomocniki do pisania Portable Text w lokalnych danych. W Sanity te same struktury powstają w edytorze.
 * Składnia w tekście: **pogrubienie** i [etykieta](/adres).
 */
import type { CalloutBlock, PortableBlock, PortableSpan } from '../types'

let counter = 0
const key = () => `k${(counter++).toString(36)}`

function spans(text: string): Pick<PortableBlock, 'children' | 'markDefs'> {
  const children: PortableSpan[] = []
  const markDefs: NonNullable<PortableBlock['markDefs']> = []
  const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g
  let last = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) children.push({ _type: 'span', text: text.slice(last, match.index) })
    if (match[1]) children.push({ _type: 'span', text: match[1], marks: ['strong'] })
    else {
      const linkKey = key()
      markDefs.push({ _key: linkKey, _type: 'link', href: match[3]! })
      children.push({ _type: 'span', text: match[2]!, marks: [linkKey] })
    }
    last = match.index + match[0].length
  }
  if (last < text.length) children.push({ _type: 'span', text: text.slice(last) })
  return { children, markDefs }
}

export const p = (text: string): PortableBlock => ({ _type: 'block', _key: key(), style: 'normal', ...spans(text) })
export const h2 = (text: string): PortableBlock => ({ _type: 'block', _key: key(), style: 'h2', ...spans(text) })
export const h3 = (text: string): PortableBlock => ({ _type: 'block', _key: key(), style: 'h3', ...spans(text) })
export const ul = (items: string[]): PortableBlock[] =>
  items.map(text => ({ _type: 'block', _key: key(), style: 'normal', listItem: 'bullet', ...spans(text) }))
export const ol = (items: string[]): PortableBlock[] =>
  items.map(text => ({ _type: 'block', _key: key(), style: 'normal', listItem: 'number', ...spans(text) }))
export const callout = (title: string, text: string, tone: CalloutBlock['tone'] = 'info'): CalloutBlock =>
  ({ _type: 'callout', _key: key(), tone, title, text })
