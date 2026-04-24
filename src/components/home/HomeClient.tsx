'use client';

import { useState, useMemo } from 'react';
import { Map as MapIcon, Grid, Search, X, MapPin, Filter } from 'lucide-react';
import BusinessCard from '@/components/business/BusinessCard';
import KakaoMapClient from '@/components/map/KakaoMapClient';

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

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return businesses;
    const q = searchQuery.toLowerCase();
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.address ?? '').toLowerCase().includes(q),
    );
  }, [businesses, searchQuery]);

  const mappable = filtered.filter((b) => b.lat && b.lng);

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
            flex-shrink-0 w-full md:w-80 xl:w-96
            flex flex-col
            border-r border-zinc-800 bg-zinc-950
            overflow-hidden
            ${mobileTab === 'map' ? 'hidden md:flex' : 'flex'}
          `}
        >
          {/* 검색 */}
          <div className="p-3 border-b border-zinc-800 shrink-0">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder="업소명 또는 주소 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* 지역 필터 */}
          <div className="px-3 pt-3 pb-2 border-b border-zinc-800 shrink-0 space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <MapPin size={11} />
              <span className="text-[10px] font-black uppercase tracking-widest">지역</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <a
                href={`/${category ? `?category=${category}` : ''}`}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all
                  ${!region
                    ? 'bg-zinc-100 text-black border-zinc-100'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white'
                  }`}
              >
                전체
              </a>
              {Object.entries(REGION_LABELS).map(([key, label]) => (
                <a
                  key={key}
                  href={`/?region=${key}${category ? `&category=${category}` : ''}`}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all
                    ${region === key
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white'
                    }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="px-3 pt-3 pb-3 border-b border-zinc-800 shrink-0 space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Filter size={11} />
              <span className="text-[10px] font-black uppercase tracking-widest">카테고리</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <a
                href={`/${region ? `?region=${region}` : ''}`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                  ${!category
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'
                  }`}
              >
                전체
              </a>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <a
                  key={key}
                  href={`/?category=${key}${region ? `&region=${region}` : ''}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                    ${category === key
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* 업소 리스트 */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 pt-3 pb-1 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                {filtered.length}개 업소
              </span>
              {searchQuery && (
                <span className="text-[10px] text-amber-500 font-bold">
                  &ldquo;{searchQuery}&rdquo; 검색 중
                </span>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center px-4">
                <p className="text-zinc-600 text-sm font-medium">검색 결과가 없습니다.</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-amber-500 text-xs font-bold mt-2 hover:underline"
                  >
                    검색 초기화
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {filtered.map((biz) => (
                  <BusinessCard key={biz.id} business={biz} compact />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ─── 우측 지도 ─── */}
        <div
          className={`
            flex-1 relative
            ${mobileTab === 'list' ? 'hidden md:block' : 'block'}
          `}
        >
          <KakaoMapClient businesses={mappable} fullscreen />
        </div>
      </div>
    </div>
  );
}
