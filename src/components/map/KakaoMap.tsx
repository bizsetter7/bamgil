'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Business {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  category: string;
}

interface KakaoMapProps {
  businesses: Business[];
  fullscreen?: boolean;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.9780;

export default function KakaoMap({ businesses, fullscreen = false }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    // 지도 초기화 (center = 서울 기본값, 이후 geolocation으로 이동)
    const initMap = (userLat: number, userLng: number) => {
      if (cancelled || !mapRef.current || !window.kakao) return;

      try {
        window.kakao.maps.load(() => {
          if (cancelled || !mapRef.current) return;

          const center = new window.kakao.maps.LatLng(userLat, userLng);
          const map = new window.kakao.maps.Map(mapRef.current, {
            center,
            level: 5,
          });

          setStatus('ready');

          // 현재 위치 마커
          if (userLat !== DEFAULT_LAT || userLng !== DEFAULT_LNG) {
            new window.kakao.maps.CustomOverlay({
              map,
              position: new window.kakao.maps.LatLng(userLat, userLng),
              content: `<div style="
                width:16px;height:16px;
                background:#f59e0b;border:3px solid #fff;
                border-radius:50%;box-shadow:0 0 0 4px rgba(245,158,11,0.3);
              "></div>`,
              zIndex: 10,
            });
          }

          // 업소 마커
          const bounds = new window.kakao.maps.LatLngBounds();
          let hasValidPins = false;

          businesses.forEach((biz) => {
            if (!biz.lat || !biz.lng) return;
            hasValidPins = true;

            const position = new window.kakao.maps.LatLng(biz.lat, biz.lng);
            const marker = new window.kakao.maps.Marker({
              map,
              position,
              title: biz.name,
            });

            window.kakao.maps.event.addListener(marker, 'click', () => {
              router.push(`/places/${biz.id}`);
            });

            bounds.extend(position);
          });

          // 업소 있으면 업소 중심으로, 없으면 현재 위치 중심 유지
          if (hasValidPins) map.setBounds(bounds);
        });
      } catch (e) {
        if (!cancelled) setStatus('error');
      }
    };

    // kakao SDK 로드 대기 (polling)
    let retryCount = 0;
    const tryInit = (userLat: number, userLng: number) => {
      if (cancelled) return;

      if (window.kakao) {
        initMap(userLat, userLng);
        return;
      }

      retryCount++;
      if (retryCount > 25) { // 5초 후 포기
        if (!cancelled) setStatus('error');
        return;
      }
      setTimeout(() => tryInit(userLat, userLng), 200);
    };

    // 현재 위치 → 없으면 서울 기본값
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => tryInit(pos.coords.latitude, pos.coords.longitude),
        () => tryInit(DEFAULT_LAT, DEFAULT_LNG),
        { timeout: 3000, maximumAge: 60000 },
      );
    } else {
      tryInit(DEFAULT_LAT, DEFAULT_LNG);
    }

    return () => { cancelled = true; };
  }, [businesses, router]);

  return (
    <div
      className={`relative w-full overflow-hidden ${
        fullscreen ? 'h-full' : 'h-[450px] rounded-[2.5rem] border border-zinc-800 shadow-2xl'
      }`}
    >
      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* 로딩 오버레이 */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-xs font-bold">지도 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 에러 오버레이 */}
      {status === 'error' && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <div className="text-center space-y-2 px-6">
            <p className="text-zinc-400 text-sm font-bold">지도를 불러올 수 없습니다</p>
            <p className="text-zinc-600 text-xs">카카오 지도 키 또는 도메인 설정을 확인해주세요</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-amber-500 text-black text-xs font-black rounded-xl"
            >
              새로고침
            </button>
          </div>
        </div>
      )}

      {/* 뱃지 */}
      {status === 'ready' && (
        <div className="absolute top-4 left-4 z-10 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 text-[10px] font-bold text-amber-500 uppercase tracking-widest shadow-lg pointer-events-none">
          실시간 위치 기반 탐색
        </div>
      )}
    </div>
  );
}
