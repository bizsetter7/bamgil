'use client';

import dynamic from 'next/dynamic';

// SSR 완전 비활성화 — window.kakao 접근 전 스크립트 로드 보장
const KakaoMap = dynamic(() => import('./KakaoMap'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full bg-zinc-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-xs font-bold">지도 로딩 중...</p>
      </div>
    </div>
  ),
});

interface Business {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  category: string;
  subscriptions?: { plan: string; status: string }[] | null;
}

export default function KakaoMapClient({
  businesses,
  fullscreen = false,
}: {
  businesses: Business[];
  fullscreen?: boolean;
}) {
  return <KakaoMap businesses={businesses} fullscreen={fullscreen} />;
}
