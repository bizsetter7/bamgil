import { createClient } from '@/lib/supabase/server';
import BusinessCard from '@/components/business/BusinessCard';
import KakaoMap from '@/components/map/KakaoMap';
import { Filter, Map as MapIcon, Grid, MapPin } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱',
  karaoke_bar: '노래방',
  bar: '바/나이트',
  night_club: '클럽',
  hostbar: '호스트바',
  general: '일반',
  other: '기타',
};

const REGION_LABELS: Record<string, string> = {
  seoul: '서울',
  gyeonggi: '경기',
  incheon: '인천',
  busan: '부산',
  daegu: '대구',
  other: '기타',
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; category?: string }>;
}) {
  const { region, category } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from('businesses')
    .select('id, name, category, region_code, address, lat, lng, phone, open_chat_url, bamgil_contacts(count)')
    .eq('is_active', true)
    .eq('is_verified', true);

  if (region) query = query.eq('region_code', region);
  if (category) query = query.eq('category', category);

  const { data: businesses } = await query.limit(50);

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight">업소 탐색</h1>
          <p className="text-zinc-500 font-medium">내 주변의 안전하고 즐거운 공간을 찾아보세요.</p>
        </div>
        
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
          <button className="px-4 py-2 bg-amber-500 text-black font-bold rounded-xl flex items-center gap-2 text-sm">
            <MapIcon size={16} /> 지도 보기
          </button>
          <button className="px-4 py-2 text-zinc-500 font-bold rounded-xl flex items-center gap-2 text-sm hover:text-white transition-colors">
            <Grid size={16} /> 목록 보기
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {/* 지역 필터 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 px-3 text-zinc-500 shrink-0 border-r border-zinc-800 mr-2">
            <MapPin size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">지역</span>
          </div>
          <a
            href={`/${category ? `?category=${category}` : ''}`}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border shrink-0 transition-all
              ${!region 
                ? 'bg-zinc-100 text-black border-zinc-100' 
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'
              }`}
          >
            전체
          </a>
          {Object.entries(REGION_LABELS).map(([key, label]) => (
            <a
              key={key}
              href={`/?region=${key}${category ? `&category=${category}` : ''}`}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border shrink-0 transition-all
                ${region === key
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <a
            href={`/${region ? `?region=${region}` : ''}`}
            className={`px-5 py-2.5 rounded-full text-sm font-bold border shrink-0 transition-all
              ${!category 
                ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20' 
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'
              }`}
          >
            전체 카테고리
          </a>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <a
              key={key}
              href={`/?category=${key}${region ? `&region=${region}` : ''}`}
              className={`px-5 py-2.5 rounded-full text-sm font-bold border shrink-0 transition-all
                ${category === key
                  ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'
                }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* 지도 섹션 */}
      <section className="relative">
        <KakaoMap
          businesses={(businesses ?? []).filter(b => b.lat && b.lng)}
          onPinClick={(id) => {
            if (typeof window !== 'undefined') window.location.href = `/places/${id}`;
          }}
        />
      </section>

      {/* 업소 목록 */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            검증된 추천 업소 <span className="text-xs font-medium text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full">{(businesses ?? []).length}</span>
          </h2>
          <button className="text-sm font-bold text-amber-500 flex items-center gap-1 hover:underline">
            최신순 <Filter size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(businesses ?? []).map((biz) => (
            <BusinessCard key={biz.id} business={biz} />
          ))}
          {(!businesses || businesses.length === 0) && (
            <div className="col-span-full py-32 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[3rem]">
              <p className="text-zinc-600 font-medium">해당 조건에 맞는 업소가 없습니다.</p>
              <a href="/" className="text-amber-500 text-sm font-bold mt-2 inline-block hover:underline">필터 초기화</a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
