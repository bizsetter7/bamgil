'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window { kakao: any; }
}

interface MiniMapProps {
  lat: number;
  lng: number;
  name: string;
  className?: string;
}

export default function MiniMap({ lat, lng, name, className = 'w-full h-48 rounded-2xl overflow-hidden border border-gray-200' }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    const tryInit = () => {
      if (cancelled || !mapRef.current) return;
      if (!window.kakao) { setTimeout(tryInit, 300); return; }
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

  return <div ref={mapRef} className={className} />;
}
