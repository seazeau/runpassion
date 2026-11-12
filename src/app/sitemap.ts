import type { MetadataRoute } from 'next'
import { getSortedArticlesData } from '@/lib/articles'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://runpassion.fr'
  const articles = getSortedArticlesData()

  const articleEntries: MetadataRoute.Sitemap = articles
    .filter((art) => !art.slug.includes('coach-'))
    .map((art) => ({
      url: `${baseUrl}/${art.slug}`,
      lastModified: art.date ? new Date(art.date) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/chaussures`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...articleEntries,
  ]
}
