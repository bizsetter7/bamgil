'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ZoomToFn, GeocodedInfo } from '@/components/map/KakaoMap';
import { Map as MapIcon, Grid, Home, Search, X, MapPin, Filter, ChevronDown, Navigation } from 'lucide-react';
import { PROVINCES, DISTRICTS } from '@/lib/regions';
import BusinessCard from '@/components/business/BusinessCard';
import KakaoMapClient from '@/components/map/KakaoMapClient';
import DetailPanel from './DetailPanel';
import { maskName } from '@/lib/maskName';
import { getTodayHours, getTodayHoursHashtag } from '@/lib/businessHours';
import { getActivePlanFromList } from '@/lib/subscriptionPlan';
import Link from 'next/link';

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
  created_at?: string | null;
  subscriptions?: { plan: string; status: string }[] | null;
}

interface HomeClientProps {
  businesses: Business[];
  region?: string;
  category?: string;
}

export default function HomeClient({ businesses, region, category }: HomeClientProps) {
  const [mobileTab, setMobileTab] = useState<'home' | 'list' | 'map'>('home');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 오버레이 및 필터 상태
  const [regionOverlayOpen, setRegionOverlayOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedSubRegions, setSelectedSubRegions] = useState<string[]>([]);
  const [nearMeActive, setNearMeActive] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const zoomFnRef = useRef<ZoomToFn | null>(null);

  // 사용자 위치 (거리 표시용 — 자동 1회 시도, 권한 거절 시 거리 미표시)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* 권한 거부 — 거리 미표시 */ },
      { timeout: 5000, maximumAge: 60000 },
    );
  }, []);

  // KakaoMap geocoding 결과 수신 (lat/lng + region 정보)
  const [geocoded, setGeocoded] = useState<Map<string, GeocodedInfo>>(new Map());
  const handleGeocoded = useCallback((data: Map<string, GeocodedInfo>) => {
    setGeocoded(new Map(data));
  }, []);

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

  // lat/lng 있거나, address만 있어도 KakaoMap geocoder가 핀 추가 가능
  // useMemo 필수 — 매 렌더 새 배열 시 KakaoMap useEffect 재실행되어 지도 깜빡임
  const mappable = useMemo(
    () => filtered.filter((b) => (b.lat && b.lng) || !!b.address),
    [filtered],
  );

  // ── 홈 탭 섹션용 computed ──
  const bannerBusinesses = useMemo(() =>
    businesses.filter(b => {
      const plan = getActivePlanFromList(b.subscriptions);
      return (plan === 'premium' || plan === 'elite') && b.cover_image_url;
    }).slice(0, 5), [businesses]);

  const newBusinesses = useMemo(() =>
    businesses.slice(0, 12), [businesses]); // already ordered by created_at desc

  const popularBusinesses = useMemo(() =>
    [...businesses].sort((a, b) => {
      const tiers: Record<string, number> = { elite: 5, premium: 4, deluxe: 3, special: 2, standard: 1, basic: 0 };
      const aPlan = getActivePlanFromList(a.subscriptions);
      const bPlan = getActivePlanFromList(b.subscriptions);
      const aT = aPlan ? (tiers[aPlan] ?? 0) : 0;
      const bT = bPlan ? (tiers[bPlan] ?? 0) : 0;
      return bT - aT;
    }).slice(0, 12), [businesses]);

  const handleSelect = useCallback((id: string) => {
    const newId = selectedId === id ? null : id;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (!newId) {
      setSelectedId(null);
      return;
    }

    if (isMobile && mobileTab === 'map') {
      // ── 모바일 지도탭 ──
      // zoom 즉시 → 300ms 후 패널 오픈 (zoom 잠깐 보임)
      zoomFnRef.current?.(newId);
      setTimeout(() => setSelectedId(newId), 300);
    } else if (!isMobile) {
      // ── PC ──
      // 패널 먼저 열고(300ms 애니) → 350ms 후 relayout + zoom
      setSelectedId(newId);
      setTimeout(() => {
        zoomFnRef.current?.(newId); // zoomTo 내부에서 relayout 포함
      }, 350);
    } else {
      // ── 모바일 홈/목록탭 ──
      // 패널만 오픈 (맵은 안 보임)
      setSelectedId(newId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, mobileTab]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── 모바일 탭 바 (3탭) ── */}
      <div className="md:hidden flex border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => setMobileTab('home')}
          className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-bold transition-colors
            ${mobileTab === 'home' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-400'}`}
        >
          <Home size={16} /> 홈
        </button>
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-bold transition-colors
            ${mobileTab === 'list' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-400'}`}
        >
          <Grid size={16} /> 목록{' '}
          <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </button>
        <button
          onClick={() => {
            setMobileTab('map');
            // display:none 없이 opacity로 관리하지만, 혹시 모를 렌더 이슈 대비 relayout
            setTimeout(() => mapInstanceRef.current?.relayout?.(), 100);
          }}
          className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-bold transition-colors
            ${mobileTab === 'map' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-400'}`}
        >
          <MapIcon size={16} /> 지도
        </button>
      </div>

      {/* ── 메인 영역 ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ─── 모바일 홈 탭 ─── */}
        <div className={`md:hidden absolute inset-0 z-10 overflow-y-auto bg-white flex flex-col ${mobileTab === 'home' ? 'flex' : 'hidden'}`}>
          {/* 배너 슬라이더 */}
          {bannerBusinesses.length > 0 ? (
            <button
              className="relative h-52 bg-gray-900 shrink-0 w-full text-left"
              onClick={() => { if (bannerBusinesses[bannerIdx]) handleSelect(bannerBusinesses[bannerIdx].id); }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerBusinesses[bannerIdx]?.cover_image_url ?? ''} alt="" className="w-full h-full object-cover opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded-full">AD</span>
                <p className="text-white font-black text-xl mt-1 truncate">{bannerBusinesses[bannerIdx]?.name}</p>
                <p className="text-white/70 text-xs">{bannerBusinesses[bannerIdx]?.category} · {REGION_LABELS[bannerBusinesses[bannerIdx]?.region_code ?? ''] ?? ''}</p>
              </div>
              {bannerBusinesses.length > 1 && (
                <div className="absolute top-3 right-4 flex gap-1">
                  {bannerBusinesses.map((_, i) => (
                    <span key={i} className={`block w-1.5 h-1.5 rounded-full transition-colors ${i === bannerIdx ? 'bg-amber-500' : 'bg-white/40'}`} />
                  ))}
                </div>
              )}
            </button>
          ) : (
            <div className="h-52 shrink-0 bg-gradient-to-br from-gray-900 to-gray-700 flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">🌙</span>
              <p className="text-white font-black text-lg">BAMGIL</p>
              <p className="text-white/60 text-xs mt-1">검증된 업소 탐색 플랫폼</p>
            </div>
          )}

          {/* 검색 + 카테고리 */}
          <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0 space-y-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="업소명 또는 주소 검색..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setMobileTab('list'); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-0.5">
              <a href={`/${region ? `?region=${region}` : ''}`}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all ${!category ? 'bg-amber-500 text-black border-amber-500' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                전체
              </a>
              {['룸살롱', '노래주점', '유흥주점', '나이트', '호스트바', '홀덤펍'].map(cat => (
                <a key={cat} href={`/?category=${encodeURIComponent(cat)}${region ? `&region=${region}` : ''}`}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all ${category === cat ? 'bg-amber-500 text-black border-amber-500' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {cat}
                </a>
              ))}
            </div>
          </div>

          {/* ─ 신규오픈 섹션 ─ */}
          <div className="pt-5 pb-4 bg-white border-b border-gray-100">
            <div className="px-4 mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">🆕 신규오픈</h3>
              <button onClick={() => setMobileTab('list')} className="text-xs text-amber-500 font-bold">전체보기 →</button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
              {newBusinesses.map(biz => {
                const regionLabel = REGION_LABELS[biz.region_code] ?? biz.region_code;
                const activePlan = getActivePlanFromList(biz.subscriptions);
                const isPremiumTier = activePlan === 'premium' || activePlan === 'elite';
                const isDeluxe = activePlan === 'deluxe';
                const isPopular = isPremiumTier || isDeluxe;
                return (
                  <button key={biz.id} onClick={() => handleSelect(biz.id)}
                    className="shrink-0 w-36 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm text-left active:scale-95 transition-transform">
                    <div className="h-24 bg-gray-100 overflow-hidden relative">
                      {biz.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={biz.cover_image_url} alt={biz.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <span className="text-gray-400 text-xs font-bold">사진없음</span>
                        </div>
                      )}
                      {isPopular && (
                        <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                          🔥 인기
                        </div>
                      )}
                      {isPremiumTier && (
                        <div className="absolute top-[22px] left-1.5 bg-amber-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                          ✓ 프리미엄
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 space-y-0.5">
                      <p className="text-[10px] text-gray-400 font-medium">{regionLabel}</p>
                      <p className="text-sm font-black text-gray-900 truncate leading-tight">{biz.name}</p>
                      <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">{biz.category}</span>
                    </div>
                  </button>
                );
              })}
              {newBusinesses.length === 0 && (
                <p className="text-gray-400 text-sm py-4">업소가 없습니다.</p>
              )}
            </div>
          </div>

          {/* ─ 인기 업소 섹션 ─ */}
          <div className="pt-5 pb-4 bg-white border-b border-gray-100">
            <div className="px-4 mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">🔥 인기 업소</h3>
              <button onClick={() => setMobileTab('list')} className="text-xs text-amber-500 font-bold">전체보기 →</button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
              {popularBusinesses.map(biz => {
                const regionLabel = REGION_LABELS[biz.region_code] ?? biz.region_code;
                const activePlan = getActivePlanFromList(biz.subscriptions);
                const isPremiumTier = activePlan === 'premium' || activePlan === 'elite';
                const isDeluxe = activePlan === 'deluxe';
                const isPopular = isPremiumTier || isDeluxe;
                return (
                  <button key={biz.id} onClick={() => handleSelect(biz.id)}
                    className="shrink-0 w-36 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm text-left active:scale-95 transition-transform">
                    <div className="h-24 bg-gray-100 overflow-hidden relative">
                      {biz.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={biz.cover_image_url} alt={biz.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <span className="text-gray-400 text-xs font-bold">사진없음</span>
                        </div>
                      )}
                      {isPopular && (
                        <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                          🔥 인기
                        </div>
                      )}
                      {isPremiumTier && (
                        <div className="absolute top-[22px] left-1.5 bg-amber-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                          ✓ 프리미엄
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 space-y-0.5">
                      <p className="text-[10px] text-gray-400 font-medium">{regionLabel}</p>
                      <p className="text-sm font-black text-gray-900 truncate leading-tight">{biz.name}</p>
                      <span className="inline-block text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{biz.category}</span>
                    </div>
                  </button>
                );
              })}
              {popularBusinesses.length === 0 && (
                <p className="text-gray-400 text-sm py-4">업소가 없습니다.</p>
              )}
            </div>
          </div>

          {/* ─ 신규입점 섹션 ─ */}
          <div className="pt-5 pb-4 bg-white">
            <div className="px-4 mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">⭐ 신규입점</h3>
              <a href="https://www.yasajang.kr/register" target="_blank" rel="noopener noreferrer"
                className="text-xs text-amber-500 font-bold">입점신청 →</a>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 [&::-webkit-scrollbar]:hidden">
              {newBusinesses.slice(0, 8).map(biz => {
                const regionLabel = REGION_LABELS[biz.region_code] ?? biz.region_code;
                const activePlan = getActivePlanFromList(biz.subscriptions);
                const isPremiumTier = activePlan === 'premium' || activePlan === 'elite';
                const isDeluxe = activePlan === 'deluxe';
                const isPopular = isPremiumTier || isDeluxe;
                return (
                  <button key={biz.id} onClick={() => handleSelect(biz.id)}
                    className="shrink-0 w-36 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm text-left active:scale-95 transition-transform">
                    <div className="h-24 bg-gray-100 overflow-hidden relative">
                      {biz.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={biz.cover_image_url} alt={biz.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <span className="text-gray-400 text-xs font-bold">사진없음</span>
                        </div>
                      )}
                      {isPopular && (
                        <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                          🔥 인기
                        </div>
                      )}
                      {isPremiumTier && (
                        <div className="absolute top-[22px] left-1.5 bg-amber-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                          ✓ 프리미엄
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 space-y-0.5">
                      <p className="text-[10px] text-gray-400 font-medium">{regionLabel}</p>
                      <p className="text-sm font-black text-gray-900 truncate leading-tight">{biz.name}</p>
                      <span className="inline-block text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{biz.category}</span>
                    </div>
                  </button>
                );
              })}
              {newBusinesses.length === 0 && (
                <p className="text-gray-400 text-sm py-4">업소가 없습니다.</p>
              )}
            </div>
          </div>
          <div className="h-8 bg-gray-50 shrink-0" />
        </div>

        {/* ─── 좌측 사이드 패널 ─── */}
        <aside
          className={`
            flex-shrink-0 w-full md:w-72 xl:w-80
            flex flex-col border-r border-gray-200 bg-white overflow-hidden
            ${mobileTab === 'list' ? 'flex' : 'hidden'} md:flex
          `}
        >
          {/* 검색 */}
          <div className="p-3 border-b border-gray-200 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="업소명 또는 주소 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-8 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* 지역 필터 및 내 주변 */}
          <div className="px-3 pt-2.5 pb-2 border-b border-gray-200 shrink-0 space-y-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-gray-400 mr-1">
                <MapPin size={10} />
                <span className="text-[9px] font-black uppercase tracking-widest">지역</span>
              </div>
              <button
                onClick={() => setRegionOverlayOpen(true)}
                className="text-[11px] font-bold bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1 text-gray-700"
              >
                {region ? (REGION_LABELS[region] || region) : '전체 지역'}
                {selectedSubRegions.length > 0 && <span className="text-amber-500">+{selectedSubRegions.length}</span>}
                <ChevronDown size={12} className="text-gray-400 ml-1" />
              </button>
            </div>
            <button
              onClick={handleNearMe}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors shrink-0
                ${nearMeActive ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 text-gray-500 hover:border-pink-400 hover:text-pink-500'}`}
            >
              <Navigation size={12} /> 내 주변
            </button>
          </div>

          {/* 선택된 서브 지역 칩 */}
          {selectedSubRegions.length > 0 && (
            <div className="px-3 pb-2 border-b border-gray-200 shrink-0 flex flex-wrap gap-1 pt-1">
              {selectedSubRegions.map(sub => (
                <div key={sub} className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[9px] font-black">
                  {sub}
                  <button onClick={() => setSelectedSubRegions(prev => prev.filter(s => s !== sub))}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSelectedSubRegions([])}
                className="text-[9px] text-gray-400 hover:text-gray-600 font-bold ml-1"
              >
                초기화
              </button>
            </div>
          )}

          {/* 카테고리 필터 */}
          <div className="px-3 pt-2.5 pb-2.5 border-b border-gray-200 shrink-0 space-y-1.5">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Filter size={10} />
              <span className="text-[9px] font-black uppercase tracking-widest">카테고리</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <a href={`/${region ? `?region=${region}` : ''}`}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all
                  ${!category ? 'bg-amber-500 text-black border-amber-500' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800'}`}>
                전체
              </a>
              {['룸살롱', '노래주점', '유흥주점', '나이트', '호스트바', '홀덤펍', '일반', '기타'].map((cat) => (
                <a key={cat} href={`/?category=${encodeURIComponent(cat)}${region ? `&region=${region}` : ''}`}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all
                    ${category === cat ? 'bg-amber-500 text-black border-amber-500' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800'}`}>
                  {cat}
                </a>
              ))}
            </div>
          </div>

          {/* ── PC 업소 리스트 ── */}
          <div className="hidden md:flex flex-col flex-1 overflow-hidden">
            <div className="px-3 pt-2.5 pb-1 flex items-center justify-between shrink-0">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                {filtered.length}개 업소
              </span>
              {searchQuery && (
                <span className="text-[9px] text-amber-500 font-bold">&ldquo;{searchQuery}&rdquo;</span>
              )}
            </div>
            {filtered.length === 0 ? (
              <div className="py-12 text-center px-4">
                <p className="text-gray-400 text-xs font-medium">검색 결과가 없습니다.</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-amber-500 text-xs font-bold mt-2 hover:underline">
                    초기화
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3">
                {filtered.map((biz) => (
                  <BusinessCard
                    key={biz.id}
                    business={biz}
                    compact
                    selected={selectedId === biz.id}
                    onSelect={() => handleSelect(biz.id)}
                    userPos={userPos}
                    geocoded={geocoded.get(biz.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── 모바일 밤맵 스타일 카드 리스트 ── */}
          <div className="md:hidden flex-1 overflow-y-auto">
            {/* 스티키 카운트 바 */}
            <div className="sticky top-0 z-10 px-4 py-2.5 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">
                {filtered.length}개 업소
                {searchQuery && <span className="text-amber-500 ml-1.5">&ldquo;{searchQuery}&rdquo;</span>}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">등록순</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center px-4">
                <p className="text-gray-400 text-sm font-medium">검색 결과가 없습니다.</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-amber-500 text-xs font-bold mt-2 hover:underline">
                    초기화
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((biz) => {
                  const activePlan = getActivePlanFromList(biz.subscriptions);
                  const isPremiumTier = activePlan === 'premium' || activePlan === 'elite';
                  const isDeluxe = activePlan === 'deluxe';
                  const isPopular = isPremiumTier || isDeluxe;
                  const regionLabel = REGION_LABELS[biz.region_code] ?? biz.region_code;
                  // address에서 두번째 단어(시/군/구) 추출 → "경기 수원시" 형태
                  const subRegion = biz.address ? (biz.address.trim().split(/\s+/)[1] ?? null) : null;
                  const locationLabel = subRegion ? `${regionLabel} ${subRegion}` : regionLabel;
                  const addressLine = biz.address ?? regionLabel;
                  const hoursHashtag = getTodayHoursHashtag(biz.business_hours);
                  const todayHours = getTodayHours(biz.business_hours);

                  return (
                    <a
                      key={biz.id}
                      href={`/places/${biz.id}`}
                      onClick={(e) => { e.preventDefault(); handleSelect(biz.id); }}
                      className="flex gap-3.5 px-4 py-4 active:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {/* 썸네일 — 밤맵 스타일: 크고 선명한 이미지 */}
                      <div className="shrink-0 w-[150px] h-[120px] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center relative">
                        {biz.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={biz.cover_image_url} alt={biz.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-1">
                            <span className="text-xs font-black text-gray-400 leading-tight text-center">사진<br />없음</span>
                          </div>
                        )}
                        {/* 티어 배지 */}
                        {isPopular && (
                          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full leading-none shadow-sm">
                            🔥 인기
                          </div>
                        )}
                        {isPremiumTier && (
                          <div className="absolute top-[26px] left-2 bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full leading-none shadow-sm">
                            ✓ 프리미엄
                          </div>
                        )}
                      </div>

                      {/* 텍스트 정보 */}
                      <div className="flex-1 min-w-0 py-1 space-y-1.5">
                        {/* 지역(+상세) + 카테고리 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-gray-400 font-medium">{locationLabel}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {biz.category}
                          </span>
                        </div>
                        {/* 업소명 */}
                        <p className="text-gray-900 font-black text-base leading-snug line-clamp-2">
                          {biz.name}
                        </p>
                        {/* 실장명 */}
                        {biz.manager_name && (
                          <p className="text-gray-500 text-[12px]">{maskName(biz.manager_name)} 실장</p>
                        )}
                        {/* 영업시간 해시태그 형식 */}
                        {hoursHashtag && (
                          <p className="text-amber-600 text-[11px] font-bold truncate">{hoursHashtag}</p>
                        )}
                        {/* 주소 (시간 없을 때만) */}
                        {!hoursHashtag && !todayHours && (
                          <p className="text-gray-400 text-[11px] truncate">{addressLine}</p>
                        )}
                        {/* 시간 텍스트 (해시태그 없고 일반 텍스트 있을 때) */}
                        {!hoursHashtag && todayHours && (
                          <p className="text-gray-400 text-[11px] truncate">{todayHours}</p>
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

        {/* ─── 지도 영역 ─── */}
        {/* 모바일: absolute inset-0으로 항상 풀사이즈 렌더 (display:none이면 Kakao Maps 0x0 초기화 버그) */}
        {/* PC: 일반 flex-1 레이아웃 */}
        <div
          className={`
            transition-opacity duration-200
            md:relative md:flex-1 md:min-w-0 md:h-full md:opacity-100 md:pointer-events-auto md:z-0
            ${mobileTab === 'map'
              ? 'absolute inset-0 z-10 opacity-100 pointer-events-auto'
              : 'absolute inset-0 -z-10 opacity-0 pointer-events-none'}
          `}
        >
          <KakaoMapClient
            businesses={mappable}
            fullscreen
            onLoad={(map, zoomTo) => { mapInstanceRef.current = map; zoomFnRef.current = zoomTo; }}
            onMarkerClick={(id) => handleSelect(id)}
            onGeocoded={handleGeocoded}
          />
        </div>

        {/* ─── 우측 상세 패널 (PC only, 선택 시 표시) ─── */}
        <div
          className={`
            hidden md:flex flex-col
            border-l border-gray-200 bg-white
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

        {/* ─── 모바일 상세 패널 (전체화면 슬라이드-인) ─── */}
        <div
          className={`
            md:hidden fixed inset-0 z-[100] bg-white
            transition-transform duration-300 ease-in-out
            ${selectedId ? 'translate-x-0' : 'translate-x-full'}
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setRegionOverlayOpen(false)}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">지역 선택</h3>
              <button onClick={() => setRegionOverlayOpen(false)} className="text-gray-400 hover:text-gray-700">
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
                    className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700 transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            ) : (
              // 2단계: 구/군 선택
              <div>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => setSelectedProvince(null)}
                    className="text-sm font-bold text-gray-500 flex items-center gap-1 hover:text-gray-900"
                  >
                    <ChevronDown size={14} className="rotate-90" />
                    {PROVINCES.find(p => p.key === selectedProvince)?.name}
                  </button>
                  <a
                    href={`/?region=${selectedProvince}${category ? `&category=${category}` : ''}`}
                    onClick={() => { setRegionOverlayOpen(false); setSelectedSubRegions([]); }}
                    className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full"
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
                          if (region === selectedProvince) {
                            setSelectedSubRegions(prev =>
                              prev.includes(d) ? prev.filter(s => s !== d) : [...prev, d]
                            );
                          } else {
                            window.location.href = `/?region=${selectedProvince}${category ? `&category=${category}` : ''}`;
                          }
                        }}
                        className={`py-2 px-2 rounded-xl text-sm font-bold transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-black'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
