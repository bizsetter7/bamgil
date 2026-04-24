'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  name: string;
}

export default function ImageSlider({ images, name }: ImageSliderProps) {
  const [current, setCurrent] = useState(0);

  // 이미지 없으면 플레이스홀더
  if (images.length === 0) {
    return (
      <div className="w-full h-72 bg-zinc-900 flex items-center justify-center text-zinc-700">
        <div className="flex flex-col items-center gap-2">
          <Building2 size={48} />
          <p className="text-xs text-zinc-600">사진 없음</p>
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
