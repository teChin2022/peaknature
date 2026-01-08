import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://peaksnature.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/*/dashboard/',
          '/*/settings/',
          '/*/my-bookings/',
          '/*/booking/',
          '/host/',
          '/upload/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}

