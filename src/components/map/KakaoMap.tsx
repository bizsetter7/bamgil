'use client';

import { useEffect, useRef } from 'react';
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

export default function KakaoMap({ businesses, fullscreen = false }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    const initMap = () => {
      // autoload=false 이므로 window.kakao 존재 여부만 체크 후 load() 호출
      if (!window.kakao) return;

      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 5,
        });

        const bounds = new window.kakao.maps.LatLngBounds();
        let hasValidPins = false;

        businesses.forEach((biz) => {
          if (!biz.lat || !biz.lng) return;

          hasValidPins = true;
          const position = new window.kakao.maps.LatLng(biz.lat, biz.lng);
          const marker = new window.kakao.maps.Marker({ map, position, title: biz.name });

          window.kakao.maps.event.addListener(marker, 'click', () => {
            router.push(`/places/${biz.id}`);
          });

          bounds.extend(position);
        });

        if (hasValidPins) map.setBounds(bounds);
      });
    };

    // kakao SDK 이미 로드된 경우
    if (window.kakao) {
      initMap();
      return;
    }

    // 아직 로드 안 됨 → script load 이벤트 대기
    const kakaoScript = document.querySelector(
      'script[src*="dapi.kakao.com"]',
    ) as HTMLScriptElement | null;

    if (kakaoScript) {
      kakaoScript.addEventListener('load', initMap);
      return () => kakaoScript.removeEventListener('load', initMap);
    }
  }, [businesses, router]);

  return (
    <div
      className={`relative w-full overflow-hidden ${
        fullscreen
          ? 'h-full'
          : 'h-[450px] rounded-[2.5rem] border border-zinc-800 shadow-2xl'
      }`}
    >
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 text-[10px] font-bold text-amber-500 uppercase tracking-widest shadow-lg pointer-events-none">
        실시간 위치 기반 탐색
      </div>
    </div>
  );
}
