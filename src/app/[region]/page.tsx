import { SEO_REGIONS } from '@/lib/regions';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  return SEO_REGIONS.map(r => ({ region: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const found = SEO_REGIONS.find(r => r.slug === region);
  if (!found) return {};
  
  return {
    title: `${found.name} 룸살롱·유흥업소 목록 | 밤길`,
    description: `${found.name} 지역 룸살롱·유흥 업소 정보. 리뷰·별점·실시간 조회수로 업소를 찾아보세요.`,
    alternates: { canonical: `https://bamgil.kr/${region}` },
    openGraph: {
      title: `${found.name} 밤문화 업소 찾기 | 밤길`,
    },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const found = SEO_REGIONS.find(r => r.slug === region);
  if (!found) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, region, address, category, views')
    .ilike('region', `%${found.name}%`)
    .order('views', { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen bg-zinc-950 pb-24">
      <div className="bg-zinc-900 border-b border-zinc-800 pt-16 pb-8 px-4 text-center">
        <h1 className="text-3xl font-black text-white mb-2">{found.name} 룸살롱·유흥 업소 목록</h1>
        <p className="text-zinc-400 text-sm">{found.name} 지역의 인기 업소들을 실시간 조회수 순으로 확인하세요.</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid gap-4">
          {businesses?.map(biz => (
            <Link 
              key={biz.id} 
              href={`/places/${biz.id}`}
              className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col hover:border-pink-500/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white">{biz.name}</h3>
                <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg flex items-center gap-1">
                  👁 {biz.views || 0}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mb-3">{biz.address || biz.region}</p>
              {biz.category && (
                <p className="text-pink-400 font-bold text-sm mt-auto">업종: {biz.category}</p>
              )}
            </Link>
          ))}
          {(!businesses || businesses.length === 0) && (
            <div className="text-center py-12 text-zinc-500">
              해당 지역에 등록된 업소가 없습니다.
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-widest">다른 지역 찾아보기</h3>
          <div className="flex flex-wrap gap-2">
            {SEO_REGIONS.filter(r => r.slug !== region).map(r => (
              <Link 
                key={r.slug} 
                href={`/${r.slug}`}
                className="px-4 py-2 bg-zinc-900 text-zinc-400 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors text-sm"
              >
                {r.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {businesses?.map(biz => (
        <script 
          key={`schema-${biz.id}`}
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": biz.name,
            "address": { "@type": "PostalAddress", "addressLocality": found.name, "addressCountry": "KR" },
          }) }} 
        />
      ))}
    </main>
  );
}
