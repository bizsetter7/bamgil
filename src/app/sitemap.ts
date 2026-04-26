import { SEO_REGIONS } from '@/lib/regions';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://bamgil.kr';
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/rankings`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...SEO_REGIONS.map(r => ({
      url: `${base}/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
