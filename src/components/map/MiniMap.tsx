'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window { kakao: any; }
}

interface MiniMapProps {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  name: string;
  className?: string;
}

export default function MiniMap({
  lat, lng, address, name,
  className = 'w-full h-48 rounded-2xl overflow-hidden border border-gray-200',
}: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    const placeMarker = (mapEl: HTMLDivElement, position: any) => {
      const map = new window.kakao.maps.Map(mapEl, { center: position, level: 3 });
      new window.kakao.maps.Marker({ map, position, title: name });
    };

    const tryInit = () => {
      if (cancelled || !mapRef.current) return;
      if (!window.kakao) { setTimeout(tryInit, 300); return; }
      window.kakao.maps.load(() => {
        if (cancelled || !mapRef.current) return;

        if (lat && lng) {
          // ① 좌표로 바로 표시
          placeMarker(mapRef.current, new window.kakao.maps.LatLng(lat, lng));
        } else if (address) {
          // ② 주소 geocoding 후 표시
          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(address, (result: any[], status: string) => {
            if (cancelled || !mapRef.current) return;
            if (status === window.kakao.maps.services.Status.OK && result[0]) {
              const pos = new window.kakao.maps.LatLng(
                parseFloat(result[0].y),
                parseFloat(result[0].x),
              );
              placeMarker(mapRef.current!, pos);
            }
          });
        }
      });
    };

    tryInit();
    return () => { cancelled = true; };
  }, [lat, lng, address, name]);

  return <div ref={mapRef} className={className} />;
}
