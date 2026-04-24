'use client';

import { useState, useMemo } from 'react';
import { Map as MapIcon, Grid, Search, X, MapPin, Filter, Star, ChevronRight } from 'lucide-react';
import BusinessCard from '@/components/business/BusinessCard';
import KakaoMapClient from '@/components/map/KakaoMapClient';
import DetailPanel from './DetailPanel';

const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱', karaoke_bar: '노래방', bar: '바/나이트',
  night_club: '클럽', hostbar: '호스트바', general: '일반', other: '기타',
};
const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천',
  busan: '부산', daegu: '대구', other: '기타',
};

interface Business {
  id: string;
  name: string;
  category: string;
  region_code: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  open_chat_url: string | null;
  cover_image_url?: string | null;
}

interface HomeClientProps {
  businesses: Business[];
  region?: string;
  category?: string;
}

export default function HomeClient({ businesses, region, category }: HomeClientProps) {
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return businesses;
    const q = searchQuery.toLowerCase();
    return businesses.filter(
      (b) => b.name.toLowerCase().includes(q) || (b.address ?? '').toLowerCase().includes(q),
    );
  }, [businesses, searchQuery]);

  const mappable = filtered.filter((b) => b.lat && b.lng);

  // 모바일 섹션용
  const featured = useMemo(
    () => filtered.filter((b) => b.cover_image_url).slice(0, 6),
    [filtered],
  );
  const recent = useMemo(() => filtered.slice(0, 8), [filtered]);
  const popular = useMemo(() => [...filtered].reverse().slice(0, 8), [filtered]);

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

      {/* ── 모바일 탭 바 ── */}
      <div className="md:hidden flex border-b border-zinc-800 bg-zinc-950 shrink-0">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors
            ${mobileTab === 'map' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-500'}`}
        >
          <MapIcon size={16} /> 지도
        </button>
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors
            ${mobileTab === 'list' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-500'}`}
        >
          <Grid size={16} /> 목록{' '}
          <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </button>
      </div>

      {/* ── 메인 영역 ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── 좌측 사이드 패널 ─── */}
        <aside
          className={`
            flex-shrink-0 w-full md:w-72 xl:w-80
            flex flex-col border-r border-zinc-800 bg-zinc-950 overflow-hidden
            ${mobileTab === 'map' ? 'hidden md:flex' : 'flex'}
          `}
        >
          {/* 검색 */}
          <div className="p-3 border-b border-zinc-800 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="업소명 또는 주소 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-8 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* 지역 필터 */}
          <div className="px-3 pt-2.5 pb-2 border-b border-zinc-800 shrink-0 space-y-1.5">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <MapPin size={10} />
              <span className="text-[9px] font-black uppercase tracking-widest">지역</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <a href={`/${category ? `?category=${category}` : ''}`}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all
                  ${!region ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white'}`}>
                전체
              </a>
              {Object.entries(REGION_LABELS).map(([key, label]) => (
                <a key={key} href={`/?region=${key}${category ? `&category=${category}` : ''}`}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all
                    ${region === key ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white'}`}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="px-3 pt-2.5 pb-2.5 border-b border-zinc-800 shrink-0 space-y-1.5">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Filter size={10} />
              <span className="text-[9px] font-black uppercase tracking-widest">카테고리</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <a href={`/${region ? `?region=${region}` : ''}`}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all
                  ${!category ? 'bg-amber-500 text-black border-amber-500' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'}`}>
                전체
              </a>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <a key={key} href={`/?category=${key}${region ? `&region=${region}` : ''}`}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all
                    ${category === key ? 'bg-amber-500 text-black border-amber-500' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'}`}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* 업소 리스트 */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 pt-2.5 pb-1 flex items-center justify-between shrink-0">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                {filtered.length}개 업소
              </span>
              {searchQuery && (
                <span className="text-[9px] text-amber-500 font-bold">&ldquo;{searchQuery}&rdquo;</span>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center px-4">
                <p className="text-zinc-600 text-xs font-medium">검색 결과가 없습니다.</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-amber-500 text-xs font-bold mt-2 hover:underline">
                    초기화
                  </button>
                )}
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {filtered.map((biz) => (
                  <BusinessCard
                    key={biz.id}
                    business={biz}
                    compact
                    selected={selectedId === biz.id}
                    onSelect={() => handleSelect(biz.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ─── 지도 영역 (PC: flex-1 / 모바일: 전체) ─── */}
        <div
          className={`
            flex-1 relative min-w-0
            ${mobileTab === 'list' ? 'hidden md:block' : 'block'}
            transition-all duration-300
          `}
        >
          <KakaoMapClient businesses={mappable} fullscreen />
        </div>

        {/* ─── 우측 상세 패널 (PC only, 선택 시 표시) ─── */}
        <div
          className={`
            hidden md:flex flex-col
            border-l border-zinc-800 bg-zinc-950
            overflow-hidden
            transition-all duration-300 ease-in-out
            ${selectedId ? 'w-80 xl:w-96 opacity-100' : 'w-0 opacity-0'}
          `}
        >
          {selectedId && (
            <DetailPanel
              businessId={selectedId}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>

      {/* ─── 모바일 목록 탭: 섹션형 UI ─── */}
      {mobileTab === 'list' && (
        <div className="md:hidden absolute inset-x-0 top-[calc(4rem+2.75rem)] bottom-0 overflow-y-auto bg-zinc-950 z-10">

          {/* 추천 배너 (이미지 있는 업소) */}
          {featured.length > 0 && (
            <section className="pt-4 pb-2">
              <div className="px-4 flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Star size={14} className="text-amber-500" fill="currentColor" /> 추천 업소
                </h2>
                <button className="text-[10px] text-zinc-500 flex items-center gap-0.5 hover:text-white">
                  더보기 <ChevronRight size={10} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
                {featured.map((biz) => (
                  <a
                    key={biz.id}
                    href={`/places/${biz.id}`}
                    className="shrink-0 w-44 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 relative"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={biz.cover_image_url!}
                      alt={biz.name}
                      className="w-full h-28 object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide text-amber-500 bg-amber-500/20`}>
                        {CATEGORY_LABELS[biz.category] ?? biz.category}
                      </span>
                      <p className="text-white font-bold text-xs mt-0.5 truncate">{biz.name}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 신규 오픈 */}
          <section className="pt-3 pb-2 border-t border-zinc-800/50">
            <div className="px-4 flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-white">신규 오픈 🆕</h2>
              <button className="text-[10px] text-zinc-500 flex items-center gap-0.5 hover:text-white">
                더보기 <ChevronRight size={10} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
              {recent.map((biz) => (
                <a
                  key={biz.id}
                  href={`/places/${biz.id}`}
                  className="shrink-0 w-32"
                >
                  <div className="w-full h-24 rounded-2xl overflow-hidden bg-zinc-800 mb-1.5 flex items-center justify-center text-zinc-600 relative border border-zinc-700">
                    {biz.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={biz.cover_image_url} alt={biz.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🏢</span>
                    )}
                    <span className="absolute top-1.5 left-1.5 text-[8px] font-black text-white bg-amber-500 px-1.5 py-0.5 rounded-full">
                      신규
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[10px] truncate">{biz.address?.split(' ').slice(0,2).join(' ')}</p>
                  <p className="text-white font-bold text-xs truncate">{biz.name}</p>
                </a>
              ))}
            </div>
          </section>

          {/* 인기 순 */}
          <section className="pt-3 pb-2 border-t border-zinc-800/50">
            <div className="px-4 flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-white">인기 순 📈</h2>
              <button className="text-[10px] text-zinc-500 flex items-center gap-0.5 hover:text-white">
                더보기 <ChevronRight size={10} />
              </button>
            </div>
            <div className="px-4 space-y-1">
              {popular.map((biz, i) => (
                <a
                  key={biz.id}
                  href={`/places/${biz.id}`}
                  className="flex items-center gap-3 py-2.5 border-b border-zinc-800/50 last:border-0"
                >
                  <span className={`text-sm font-black w-5 text-center shrink-0
                    ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-700' : 'text-zinc-600'}`}>
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-600">
                    {biz.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={biz.cover_image_url} alt={biz.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base">🏢</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{biz.name}</p>
                    <p className="text-zinc-500 text-[11px] truncate">{biz.address ?? biz.region_code}</p>
                  </div>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0
                    ${CATEGORY_LABELS[biz.category] === '룸살롱' ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-400 bg-zinc-800'}`}>
                    {CATEGORY_LABELS[biz.category] ?? biz.category}
                  </span>
                </a>
              ))}
            </div>
          </section>

          <div className="h-6" />
        </div>
      )}
    </div>
  );
}
