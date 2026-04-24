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
    if (!mapRef.current) return;
    let cancelled = false;

    // window.kakao가 로드될 때까지 200ms마다 재시도
    // (afterInteractive 스크립트 inject 타이밍 대응)
    const tryInit = () => {
      if (cancelled || !mapRef.current) return;

      if (!window.kakao) {
        setTimeout(tryInit, 200);
        return;
      }

      window.kakao.maps.load(() => {
        if (cancelled || !mapRef.current) return;

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

    tryInit();
    return () => { cancelled = true; };
  }, [businesses, router]);

  return (
    <div
      className={`relative w-full overflow-hidden ${
        fullscreen ? 'h-full' : 'h-[450px] rounded-[2.5rem] border border-zinc-800 shadow-2xl'
      }`}
    >
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10 bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 text-[10px] font-bold text-amber-500 uppercase tracking-widest shadow-lg pointer-events-none">
        실시간 위치 기반 탐색
      </div>
    </div>
  );
}
