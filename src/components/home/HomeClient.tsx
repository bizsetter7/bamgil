'use client';

import { useState, useMemo } from 'react';
import { Map as MapIcon, Grid, Search, X, MapPin, Filter } from 'lucide-react';
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
  subscriptions?: { plan: string; status: string }[] | null;
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

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">

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

          {/* ── PC 업소 리스트 ── */}
          <div className="hidden md:flex flex-col flex-1 overflow-hidden">
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
              <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
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

          {/* ── 모바일 밤맵 스타일 카드 리스트 ── */}
          <div className="md:hidden flex-1 overflow-y-auto">
            {/* 스티키 카운트 바 */}
            <div className="sticky top-0 z-10 px-4 py-2.5 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500">
                {filtered.length}개 업소
                {searchQuery && <span className="text-amber-500 ml-1.5">&ldquo;{searchQuery}&rdquo;</span>}
              </span>
              <span className="text-[10px] text-zinc-600 font-bold">등록순</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center px-4">
                <p className="text-zinc-600 text-sm font-medium">검색 결과가 없습니다.</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-amber-500 text-xs font-bold mt-2 hover:underline">
                    초기화
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {filtered.map((biz) => (
                  <a
                    key={biz.id}
                    href={`/places/${biz.id}`}
                    className="flex gap-3 px-4 py-4 active:bg-zinc-900/60 transition-colors"
                  >
                    {/* 썸네일 */}
                    <div className="shrink-0 w-[88px] h-[68px] rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center text-zinc-600 relative">
                      {biz.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={biz.cover_image_url} alt={biz.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">🏢</span>
                      )}
                    </div>

                    {/* 텍스트 정보 */}
                    <div className="flex-1 min-w-0 py-0.5">
                      {/* 지역 + 카테고리 */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {REGION_LABELS[biz.region_code] ?? biz.region_code}
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                          {CATEGORY_LABELS[biz.category] ?? biz.category}
                        </span>
                      </div>
                      {/* 업소명 */}
                      <p className="text-white font-black text-[15px] leading-snug truncate">
                        {biz.name}
                      </p>
                      {/* 주소 */}
                      <p className="text-zinc-500 text-xs mt-0.5 truncate">
                        {biz.address ?? biz.region_code}
                      </p>
                    </div>
                  </a>
                ))}
                <div className="h-6" />
              </div>
            )}
          </div>
        </aside>

        {/* ─── 지도 영역 (PC: flex-1 / 모바일: 전체) ─── */}
        <div
          className={`
            flex-1 relative min-w-0 h-full
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

    </div>
  );
}
