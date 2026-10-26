// app/robots.ts
import { MetadataRoute } from 'next'
import { SITE_URL } from '@/src/lib/site'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = SITE_URL

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    }
}