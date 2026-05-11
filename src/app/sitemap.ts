import { SEO_REGIONS } from '@/lib/regions';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.bamgil.kr';
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...SEO_REGIONS.map(r => ({
      url: `${base}/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
