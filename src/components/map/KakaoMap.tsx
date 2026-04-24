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
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMap({ businesses }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!mapRef.current) return;

    window.kakao.maps.load(() => {
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 기본
        level: 5,
      };

      const map = new window.kakao.maps.Map(mapRef.current, options);

      // 클러스터러나 마커 관리 로직 추가 가능
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

      if (hasValidPins) {
        map.setBounds(bounds);
      }
    });
  }, [businesses, router]);

  return (
    <div className="relative w-full h-[450px] rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-6 left-6 z-10 bg-zinc-950/90 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800 text-[10px] font-bold text-amber-500 uppercase tracking-widest shadow-lg">
        실시간 위치 기반 탐색
      </div>
    </div>
  );
}
