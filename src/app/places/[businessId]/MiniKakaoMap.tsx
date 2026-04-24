'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface MiniKakaoMapProps {
  lat: number;
  lng: number;
  name: string;
}

export default function MiniKakaoMap({ lat, lng, name }: MiniKakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    const initMap = () => {
      if (!window.kakao) return;

      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const position = new window.kakao.maps.LatLng(lat, lng);
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: position,
          level: 3,
        });

        new window.kakao.maps.Marker({ map, position, title: name });
      });
    };

    if (window.kakao) {
      initMap();
    } else {
      const script = document.querySelector(
        'script[src*="dapi.kakao.com"]',
      ) as HTMLScriptElement | null;
      if (script) {
        script.addEventListener('load', initMap);
        return () => script.removeEventListener('load', initMap);
      }
    }
  }, [lat, lng, name]);

  return (
    <div
      ref={mapRef}
      className="w-full h-40 rounded-2xl overflow-hidden border border-zinc-800"
    />
  );
}
