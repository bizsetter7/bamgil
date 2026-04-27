'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  name: string;
  category?: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  room_salon: 'from-amber-800 via-orange-900 to-zinc-950',
  karaoke_bar: 'from-purple-800 via-violet-900 to-zinc-950',
  bar: 'from-blue-800 via-indigo-900 to-zinc-950',
  night_club: 'from-pink-800 via-rose-900 to-zinc-950',
  hostbar: 'from-emerald-800 via-teal-900 to-zinc-950',
  general: 'from-zinc-700 via-zinc-800 to-zinc-950',
  other: 'from-zinc-700 via-zinc-800 to-zinc-950',
};

export default function ImageSlider({ images, name, category }: ImageSliderProps) {
  const [current, setCurrent] = useState(0);
  const gradient = CATEGORY_GRADIENTS[category ?? ''] ?? 'from-zinc-700 via-zinc-800 to-zinc-950';
  const firstChar = name?.[0] ?? '?';

  // 이미지 없으면 텍스트 플레이스홀더
  if (images.length === 0) {
    return (
      <div className={`w-full h-72 bg-gradient-to-b ${gradient} relative overflow-hidden flex items-center justify-center`}>
        {/* 배경 첫 글자 워터마크 */}
        <span
          className="absolute inset-0 flex items-center justify-center text-white/5 font-black select-none leading-none pointer-events-none"
          style={{ fontSize: '14rem' }}
        >
          {firstChar}
        </span>
        {/* 중앙 텍스트 (검증 배지와 겹치지 않도록 상단 1/3 위치) */}
        <div className="relative z-10 text-center px-6 -mt-8">
          <p className="text-white font-black text-2xl leading-tight drop-shadow-lg">{name}</p>
          <p className="text-white/50 text-xs font-bold mt-1.5 tracking-wide">사진을 준비 중입니다</p>
        </div>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="relative w-full h-72 overflow-hidden bg-zinc-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[current]}
        alt={`${name} ${current + 1}`}
        className="w-full h-full object-cover"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-xs font-bold">
            {current + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}
