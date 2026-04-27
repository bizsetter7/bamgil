import Link from 'next/link';
import { MapPin, Phone, MessageSquare, Star } from 'lucide-react';

const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천',
  busan: '부산', daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  chungnam: '충청남도', chungbuk: '충청북도', jeonnam: '전라남도', jeonbuk: '전라북도',
  gangwon: '강원도', gyeongnam: '경상남도', gyeongbuk: '경상북도', jeju: '제주도',
  other: '기타',
};

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

const CATEGORY_GRADIENTS: Record<string, string> = {
  room_salon: 'from-amber-800 via-orange-900 to-zinc-950',
  karaoke_bar: 'from-purple-800 via-violet-900 to-zinc-950',
  bar: 'from-blue-800 via-indigo-900 to-zinc-950',
  night_club: 'from-pink-800 via-rose-900 to-zinc-950',
  hostbar: 'from-emerald-800 via-teal-900 to-zinc-950',
  general: 'from-zinc-700 via-zinc-800 to-zinc-950',
  other: 'from-zinc-700 via-zinc-800 to-zinc-950',
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
  selected?: boolean;
  onSelect?: () => void;
}

export default function BusinessCard({ business, compact = false, selected = false, onSelect }: BusinessCardProps) {
  const categoryColor =
    CATEGORY_COLORS[business.category] ?? 'text-zinc-400 bg-zinc-500/10';
  const categoryLabel = CATEGORY_LABELS[business.category] ?? business.category;
  const categoryGradient =
    CATEGORY_GRADIENTS[business.category] ?? 'from-zinc-700 via-zinc-800 to-zinc-950';
  const firstChar = business.name?.[0] ?? '?';

  /* ── 사이드패널 컴팩트 카드 ── */
  if (compact) {
    const cardContent = (
      <div className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors group cursor-pointer
        ${selected ? 'bg-zinc-800 border border-zinc-700' : 'hover:bg-zinc-900 border border-transparent'}`}
      >
        {/* 썸네일 */}
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center transition-colors">
          {business.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.cover_image_url} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryGradient} flex items-center justify-center relative overflow-hidden`}>
              <span className="absolute text-white/10 font-black text-3xl select-none leading-none">{firstChar}</span>
              <span className="relative text-white font-black text-base leading-none">{firstChar}</span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${categoryColor}`}>
            {categoryLabel}
          </span>
          <h3 className={`text-sm font-bold truncate transition-colors leading-tight
            ${selected ? 'text-amber-500' : 'text-white group-hover:text-amber-500'}`}>
            {business.name}
          </h3>
          <p className="text-[11px] text-zinc-500 truncate">
            {business.address ?? (business.region_code ? REGION_LABELS[business.region_code] ?? business.region_code : '')}
          </p>
        </div>

        {/* 아이콘 */}
        <div className="shrink-0 flex gap-1.5 text-zinc-700 group-hover:text-zinc-500 transition-colors">
          {business.phone && <Phone size={11} />}
          {business.open_chat_url && <MessageSquare size={11} />}
        </div>
      </div>
    );

    // onSelect 있으면 패널 열기, 없으면 페이지 이동
    if (onSelect) {
      return <div onClick={onSelect}>{cardContent}</div>;
    }
    return <Link href={`/places/${business.id}`}>{cardContent}</Link>;
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
          <div className={`w-full h-36 bg-gradient-to-br ${categoryGradient} relative overflow-hidden flex items-center justify-center`}>
            <span className="absolute text-white/5 font-black select-none leading-none" style={{ fontSize: '6rem' }}>{firstChar}</span>
            <div className="relative z-10 text-center px-4">
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">{categoryLabel}</p>
              <h3 className="text-white font-black text-lg leading-tight drop-shadow-lg line-clamp-2">{business.name}</h3>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/30 to-transparent" />
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
