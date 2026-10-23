import type { MetadataRoute } from 'next'
import { getArticles, getDistricts, getServices, getSiteSettings, getTeam } from '@/content/repository'
import { absoluteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, team, articles, districts, site] = await Promise.all([getServices(), getTeam(), getArticles(), getDistricts(), getSiteSettings()])
  const updated = site.contentVerifiedAt
  const page = (path: string, priority: number, lastModified = updated) => ({ url: absoluteUrl(path), lastModified, priority })

  return [
    page('/', 1),
    page('/wycena', 0.9),
    page('/porownywarka', 0.8),
    page('/ksef', 0.8),
    page('/zmiana-ksiegowej', 0.7),
    page('/uslugi', 0.7),
    ...services.map(s => page(`/uslugi/${s.slug}`, 0.7)),
    page('/zespol', 0.5),
    ...team.map(m => page(`/zespol/${m.slug}`, 0.4)),
    page('/wiedza', 0.6),
    ...articles.map(a => page(`/wiedza/${a.slug}`, 0.6, a.updatedAt)),
    ...districts.map(d => page(`/biuro-rachunkowe-${d.slug}`, 0.7)),
    page('/kontakt', 0.6),
  ]
}
