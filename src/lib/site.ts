// lib/site.ts
// The site's public origin, used for canonical URLs, the sitemap, robots,
// JSON-LD and /llms.txt. Falls back to the production domain (not localhost)
// so a missing env var never ships localhost URLs to search engines.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://prichard.co.zw').replace(/\/+$/, '')
