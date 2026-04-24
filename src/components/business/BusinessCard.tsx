import Link from 'next/link';
import { MapPin, Phone, MessageSquare, Star, Building2 } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱',
  karaoke_bar: '노래방',
  bar: '바/주점',
  night_club: '나이트',
  hostbar: '호스트바',
  general: '일반',
  other: '기타',
};

const CATEGORY_COLORS: Record<string, string> = {
  room_salon: 'text-amber-500 bg-amber-500/10',
  karaoke_bar: 'text-purple-400 bg-purple-500/10',
  bar: 'text-blue-400 bg-blue-500/10',
  night_club: 'text-pink-400 bg-pink-500/10',
  hostbar: 'text-emerald-400 bg-emerald-500/10',
  general: 'text-zinc-400 bg-zinc-500/10',
  other: 'text-zinc-400 bg-zinc-500/10',
};

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    category: string;
    region_code?: string;
    address?: string | null;
    phone?: string | null;
    open_chat_url?: string | null;
    cover_image_url?: string | null;
  };
  compact?: boolean;
}

export default function BusinessCard({ business, compact = false }: BusinessCardProps) {
  const categoryColor =
    CATEGORY_COLORS[business.category] ?? 'text-zinc-400 bg-zinc-500/10';
  const categoryLabel = CATEGORY_LABELS[business.category] ?? business.category;

  /* ── 사이드패널 컴팩트 카드 ── */
  if (compact) {
    return (
      <Link href={`/places/${business.id}`}>
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-zinc-900 transition-colors group cursor-pointer">
          {/* 썸네일 */}
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-zinc-500 transition-colors">
            {business.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.cover_image_url}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 size={20} />
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${categoryColor}`}>
                {categoryLabel}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate group-hover:text-amber-500 transition-colors leading-tight">
              {business.name}
            </h3>
            <p className="text-xs text-zinc-500 truncate">
              {business.address ?? business.region_code}
            </p>
          </div>

          {/* 아이콘 */}
          <div className="shrink-0 flex gap-1.5 text-zinc-700 group-hover:text-zinc-500 transition-colors">
            {business.phone && <Phone size={11} />}
            {business.open_chat_url && <MessageSquare size={11} />}
          </div>
        </div>
      </Link>
    );
  }

  /* ── 기본 그리드 카드 ── */
  return (
    <Link href={`/places/${business.id}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all cursor-pointer group relative h-full flex flex-col">
        {/* 커버 이미지 */}
        {business.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.cover_image_url}
            alt={business.name}
            className="w-full h-36 object-cover"
          />
        ) : (
          <div className="w-full h-36 bg-zinc-800/50 flex items-center justify-center text-zinc-700 group-hover:text-zinc-600 transition-colors">
            <Building2 size={36} />
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="p-5 flex flex-col flex-grow relative overflow-hidden">
          {/* Glow */}
          <div className="absolute -right-8 -bottom-8 w-20 h-20 bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-all duration-500" />

          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${categoryColor}`}>
                {categoryLabel}
              </span>
              <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-amber-500 transition-colors leading-tight">
                {business.name}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 transition-all shrink-0">
              <Star size={16} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-auto">
            <MapPin size={12} />
            <span className="truncate">{business.address ?? business.region_code}</span>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center gap-2">
            {business.phone && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-800/50 px-2.5 py-1 rounded-full">
                <Phone size={10} /> 전화
              </div>
            )}
            {business.open_chat_url && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-800/50 px-2.5 py-1 rounded-full">
                <MessageSquare size={10} /> 오픈채팅
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
