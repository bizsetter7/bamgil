'use client';

import { useState, useMemo, useRef } from 'react';
import { Map as MapIcon, Grid, Search, X, MapPin, Filter, ChevronDown, Check, Navigation } from 'lucide-react';
import { PROVINCES, DISTRICTS } from '@/lib/regions';
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
  
  // 오버레이 및 필터 상태
  const [regionOverlayOpen, setRegionOverlayOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedSubRegions, setSelectedSubRegions] = useState<string[]>([]);
  const [nearMeActive, setNearMeActive] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(latitude, longitude));
          mapInstanceRef.current.setLevel(4);
        }
        setNearMeActive(true);
      },
      () => alert('위치 정보를 가져올 수 없습니다.')
    );
  };

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

          {/* 지역 필터 및 내 주변 */}
          <div className="px-3 pt-2.5 pb-2 border-b border-zinc-800 shrink-0 space-y-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-zinc-600 mr-1">
                <MapPin size={10} />
                <span className="text-[9px] font-black uppercase tracking-widest">지역</span>
              </div>
              <button 
                onClick={() => setRegionOverlayOpen(true)}
                className="text-[11px] font-bold bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-full hover:bg-zinc-800 transition-colors flex items-center gap-1 text-white"
              >
                {region ? (REGION_LABELS[region] || region) : '전체 지역'} 
                {selectedSubRegions.length > 0 && <span className="text-amber-500">+{selectedSubRegions.length}</span>}
                <ChevronDown size={12} className="text-zinc-500 ml-1" />
              </button>
            </div>
            <button 
              onClick={handleNearMe}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors shrink-0
                ${nearMeActive ? 'bg-pink-600 border-pink-600 text-white' : 'border-zinc-700 text-zinc-400 hover:border-pink-500 hover:text-white'}`}
            >
              <Navigation size={12} /> 내 주변
            </button>
          </div>

          {/* 선택된 서브 지역 칩 */}
          {selectedSubRegions.length > 0 && (
            <div className="px-3 pb-2 border-b border-zinc-800 shrink-0 flex flex-wrap gap-1 pt-1">
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
          <KakaoMapClient businesses={mappable} fullscreen onLoad={(map) => { mapInstanceRef.current = map; }} />
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

      {/* ── 지역 선택 풀스크린 오버레이 ── */}
      {regionOverlayOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setRegionOverlayOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-white">지역 선택</h3>
              <button onClick={() => setRegionOverlayOpen(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* 1단계: 시/도 선택 */}
            {!selectedProvince ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                <a 
                  href={`/${category ? `?category=${category}` : ''}`}
                  onClick={() => { setRegionOverlayOpen(false); setSelectedSubRegions([]); }}
                  className="py-2 px-2 text-center rounded-xl bg-amber-500 text-black font-bold text-sm"
                >
                  전체
                </a>
                {PROVINCES.map(p => (
                  <button 
                    key={p.key} 
                    onClick={() => setSelectedProvince(p.key)}
                    className="py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-bold text-zinc-300 transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            ) : (
              // 2단계: 구/군 선택
              <div>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
                  <button 
                    onClick={() => setSelectedProvince(null)} 
                    className="text-sm font-bold text-zinc-400 flex items-center gap-1 hover:text-white"
                  >
                    <ChevronDown size={14} className="rotate-90" /> 
                    {PROVINCES.find(p => p.key === selectedProvince)?.name}
                  </button>
                  <a 
                    href={`/?region=${selectedProvince}${category ? `&category=${category}` : ''}`}
                    onClick={() => { setRegionOverlayOpen(false); setSelectedSubRegions([]); }}
                    className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full"
                  >
                    전체 선택
                  </a>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {(DISTRICTS[selectedProvince] || []).map(d => {
                    const isSelected = selectedSubRegions.includes(d);
                    return (
                      <button 
                        key={d} 
                        onClick={() => {
                          // 오버레이에서는 선택 시 페이지 이동 (단순화: 해당 region에 서브지역 선택을 localStorage나 state로 관리)
                          // 밤맵 방식: 시/도 선택 -> 페이지 이동하면서 해당 지역 띄움. 구/군 클릭 -> 해당 구/군만 필터링.
                          // 현재 구조상 URL 파라미터는 시/도 (region). 서브필터는 state.
                          // 따라서 시/도로 먼저 이동하고 서브필터 셋팅.
                          // 여기서는 간단히 window.location.href 로 시/도 이동 + 서브필터 state 업데이트 (하지만 새로고침되므로 서브필터는 초기화됨).
                          // UX 개선을 위해: 시/도가 이미 현재 region이면 바로 state만 업데이트. 아니면 이동?
                          // 가장 좋은 건 쿼리파라미터로 서브지역을 넣는 것이지만, 현재 HomeClient 구조상 selectedSubRegions state 사용.
                          
                          if (region === selectedProvince) {
                            setSelectedSubRegions(prev => 
                              prev.includes(d) ? prev.filter(s => s !== d) : [...prev, d]
                            );
                          } else {
                            // 지역이 다르면 먼저 해당 지역으로 이동해야 함
                            window.location.href = `/?region=${selectedProvince}${category ? `&category=${category}` : ''}`;
                            // 단, 이동 시 서브지역을 잃어버리게 되므로, 이 구현에서는 오버레이를 닫고 현재 region 내 필터링만 적용하는 것으로 간소화
                            // 만약 지역이 같다면 필터 토글
                          }
                        }}
                        className={`py-2 px-2 rounded-xl text-sm font-bold transition-colors ${
                          isSelected || (region !== selectedProvince && false)
                            ? 'bg-amber-500 text-black'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
