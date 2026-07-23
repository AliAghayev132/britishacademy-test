import { SITE_URL } from '@/lib/seo'

// Generates /robots.txt. The protected dashboard is disallowed from indexing.
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
