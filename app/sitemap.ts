// app/sitemap.ts
import { MetadataRoute } from 'next'
import { SITE_URL } from '@/src/lib/site'
import { projects } from '@/src/content'

// Cached, so the build date is stamped once and the sitemap stays static
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    'use cache'
    const baseUrl = SITE_URL
    const now = new Date()

    return [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 1,
            images: [`${baseUrl}/og-image.png`],
        },
        ...projects.map(p => ({
            url: `${baseUrl}/projects/${p.slug}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
            ...(p.media ? { images: [new URL(p.media.src, baseUrl).toString()] } : {}),
        })),
        {
            url: `${baseUrl}/llms.txt`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ]
}
