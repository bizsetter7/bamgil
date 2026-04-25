'use client';

import { useState, useMemo } from 'react';
import { Map as MapIcon, Grid, Search, X, MapPin, Filter, ChevronDown, Check } from 'lucide-react';
import { REGIONS_MAP } from '@/lib/constants/regions';
import BusinessCard from '@/components/business/BusinessCard';
import KakaoMapClient from '@/components/map/KakaoMapClient';
import DetailPanel from './DetailPanel';
import { maskName } from '@/lib/maskName';

const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱', karaoke_bar: '노래방', bar: '바/나이트',
  night_club: '클럽', hostbar: '호스트바', general: '일반', other: '기타',
};
const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천',
  busan: '부산', daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  chungnam: '충청남도', chungbuk: '충청북도', jeonnam: '전라남도', jeonbuk: '전라북도',
  gangwon: '강원도', gyeongnam: '경상남도', gyeongbuk: '경상북도', jeju: '제주도',
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
  manager_name?: string | null;
  business_hours?: string | null;
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
  const [selectedSubRegions, setSelectedSubRegions] = useState<string[]>([]);
  const [showSubRegionSelector, setShowSubRegionSelector] = useState(false);

  const filtered = useMemo(() => {
    let result = businesses;
    
    // 1. 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) => b.name.toLowerCase().includes(q) || (b.address ?? '').toLowerCase().includes(q),
      );
    }

    // 2. 서브 지역 필터 (즉시 필터링)
    if (selectedSubRegions.length > 0) {
      result = result.filter((b) => 
        selectedSubRegions.some(sub => (b.address ?? '').includes(sub))
      );
    }

    return result;
  }, [businesses, searchQuery, selectedSubRegions]);

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
            <div className="flex items-center justify-between text-zinc-600">
              <div className="flex items-center gap-1.5">
                <MapPin size={10} />
                <span className="text-[9px] font-black uppercase tracking-widest">지역</span>
              </div>
              {region && (
                <button 
                  onClick={() => setShowSubRegionSelector(!showSubRegionSelector)}
                  className="text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-0.5"
                >
                  {REGION_LABELS[region]} 상세 {showSubRegionSelector ? <ChevronDown size={10} className="rotate-180" /> : <ChevronDown size={10} />}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              <a href={`/${category ? `?category=${category}` : ''}`}
                onClick={() => setSelectedSubRegions([])}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all
                  ${!region ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white'}`}>
                전체
              </a>
              {Object.entries(REGION_LABELS).map(([key, label]) => (
                <a key={key} href={`/?region=${key}${category ? `&category=${category}` : ''}`}
                  onClick={() => region !== key && setSelectedSubRegions([])}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all
                    ${region === key ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white'}`}>
                  {label}
                </a>
              ))}
            </div>

            {/* 서브 지역 선택기 (지역 선택 시 노출 가능) */}
            {region && showSubRegionSelector && (
              <div className="mt-2 p-2 bg-zinc-900 rounded-xl border border-zinc-800 grid grid-cols-3 gap-1">
                {(REGIONS_MAP[REGION_LABELS[region] === '경기' ? '경기도' : REGION_LABELS[region]] || []).map(sub => {
                  const isSelected = selectedSubRegions.includes(sub);
                  return (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedSubRegions(prev => 
                          prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
                        );
                      }}
                      className={`text-[10px] py-1 rounded-lg text-center transition-all ${
                        isSelected ? 'bg-amber-500 text-black font-black' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 선택된 서브 지역 칩 */}
            {selectedSubRegions.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedSubRegions.map(sub => (
                  <div key={sub} className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-black">
                    {sub}
                    <button onClick={() => setSelectedSubRegions(prev => prev.filter(s => s !== sub))}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setSelectedSubRegions([])}
                  className="text-[9px] text-zinc-600 hover:text-zinc-400 font-bold ml-1"
                >
                  초기화
                </button>
              </div>
            )}
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
                {filtered.map((biz) => {
                  const sub = biz.subscriptions?.[0];
                  const activePlan = sub?.status === 'active' ? sub.plan : null;
                  const isPremium = activePlan === 'premium' || activePlan === 'elite';
                  const isStandard = activePlan === 'standard';
                  const regionLabel = REGION_LABELS[biz.region_code] ?? biz.region_code;
                  const addressLine = biz.address ?? regionLabel;

                  return (
                    <a
                      key={biz.id}
                      href={`/places/${biz.id}`}
                      className="flex gap-3 px-4 py-3.5 active:bg-zinc-900/60 transition-colors"
                    >
                      {/* 썸네일 */}
                      <div className="shrink-0 w-[96px] h-[76px] rounded-xl overflow-hidden bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center relative">
                        {biz.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={biz.cover_image_url} alt={biz.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[11px] font-black text-zinc-400 leading-tight text-center">입점<br />문의</span>
                            <div className="w-8 h-px bg-zinc-600" />
                          </div>
                        )}
                        {/* 티어 배지 */}
                        {isPremium && (
                          <div className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">
                            프리미엄
                          </div>
                        )}
                        {isStandard && (
                          <div className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">
                            스탠다드
                          </div>
                        )}
                      </div>

                      {/* 텍스트 정보 */}
                      <div className="flex-1 min-w-0 py-0.5 space-y-0.5">
                        {/* 지역 + 카테고리 */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-500 font-medium">{regionLabel}</span>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {CATEGORY_LABELS[biz.category] ?? biz.category}
                          </span>
                        </div>
                        {/* 업소명 */}
                        <p className="text-white font-black text-[15px] leading-snug truncate">
                          {biz.name}
                        </p>
                        {/* 실장명 */}
                        {biz.manager_name && (
                          <p className="text-zinc-400 text-[11px]">{maskName(biz.manager_name)} 실장</p>
                        )}
                        {/* 영업시간 */}
                        {biz.business_hours && (
                          <p className="text-zinc-500 text-[10px] truncate">#{biz.business_hours}</p>
                        )}
                        {/* 주소 */}
                        {!biz.business_hours && (
                          <p className="text-zinc-500 text-[10px] truncate">{addressLine}</p>
                        )}
                      </div>
                    </a>
                  );
                })}
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
