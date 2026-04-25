import { ChevronLeft } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-28 animate-pulse">
      <div className="max-w-2xl mx-auto">
        {/* Hero Skeleton */}
        <div className="relative aspect-video bg-zinc-900 overflow-hidden">
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-transparent text-xs px-3 py-1.5 rounded-full">
            <ChevronLeft size={14} className="text-zinc-700" />
            뒤로
          </div>
        </div>

        {/* Basic Info Skeleton */}
        <div className="px-4 pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-20 bg-zinc-900 rounded" />
            <div className="h-5 w-24 bg-zinc-900 rounded-full" />
          </div>
          <div className="h-10 w-3/4 bg-zinc-900 rounded-xl" />
          <div className="h-4 w-1/2 bg-zinc-900 rounded" />
          <div className="h-4 w-1/3 bg-zinc-900 rounded" />
        </div>

        {/* Grid Skeleton */}
        <div className="mx-4 mt-8 grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-900 rounded-2xl border border-zinc-800/50" />
          ))}
        </div>

        {/* List Skeleton */}
        <div className="mx-4 mt-8 space-y-4">
          <div className="h-4 w-24 bg-zinc-900 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-900 rounded-2xl border border-zinc-800/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
