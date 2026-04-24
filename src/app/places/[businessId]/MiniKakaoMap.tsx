'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MiniKakaoMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    const tryInit = () => {
      if (cancelled || !mapRef.current) return;
      if (!window.kakao) { setTimeout(tryInit, 200); return; }

      window.kakao.maps.load(() => {
        if (cancelled || !mapRef.current) return;
        const position = new window.kakao.maps.LatLng(lat, lng);
        const map = new window.kakao.maps.Map(mapRef.current, { center: position, level: 3 });
        new window.kakao.maps.Marker({ map, position, title: name });
      });
    };

    tryInit();
    return () => { cancelled = true; };
  }, [lat, lng, name]);

  return <div ref={mapRef} className="w-full h-56 rounded-2xl overflow-hidden border border-zinc-800" />;
}
