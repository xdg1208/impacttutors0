import { MetadataRoute } from 'next'
import { COURSE_CATEGORIES } from '@/lib/courses'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://impacttutors.com'

  const routes = [
    '',
    '/about',
    '/how-it-works',
    '/contact',
    '/courses',
    // Course detail pages are derived from the single course catalog so the
    // sitemap can never drift out of sync with the actual routes again.
    ...COURSE_CATEGORIES.map((c) => `/courses/${c.slug}`),
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
