import Link from 'next/link';
import { Phone, MessageSquare } from 'lucide-react';

const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천',
  busan: '부산', daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  chungnam: '충청남도', chungbuk: '충청북도', jeonnam: '전라남도', jeonbuk: '전라북도',
  gangwon: '강원도', gyeongnam: '경상남도', gyeongbuk: '경상북도', jeju: '제주도',
  other: '기타',
};

const CATEGORY_COLORS: Record<string, string> = {
  룸살롱: 'text-amber-600 bg-amber-50',
  노래주점: 'text-purple-600 bg-purple-50',
  유흥주점: 'text-blue-600 bg-blue-50',
  나이트: 'text-pink-600 bg-pink-50',
  호스트바: 'text-emerald-600 bg-emerald-50',
  일반: 'text-gray-600 bg-gray-100',
  기타: 'text-gray-600 bg-gray-100',
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  룸살롱: 'from-amber-400 via-orange-500 to-amber-600',
  노래주점: 'from-purple-400 via-violet-500 to-purple-600',
  유흥주점: 'from-blue-400 via-indigo-500 to-blue-600',
  나이트: 'from-pink-400 via-rose-500 to-pink-600',
  호스트바: 'from-emerald-400 via-teal-500 to-emerald-600',
  일반: 'from-gray-300 via-gray-400 to-gray-500',
  기타: 'from-gray-300 via-gray-400 to-gray-500',
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
  const categoryColor = CATEGORY_COLORS[business.category] ?? 'text-gray-600 bg-gray-100';
  const categoryLabel = business.category;
  const categoryGradient = CATEGORY_GRADIENTS[business.category] ?? 'from-gray-300 via-gray-400 to-gray-500';
  const firstChar = business.name?.[0] ?? '?';

  /* ── 사이드패널 컴팩트 카드 ── */
  if (compact) {
    const regionLabel = business.region_code ? (REGION_LABELS[business.region_code] ?? business.region_code) : '';
    const subRegion = business.address ? (business.address.trim().split(/\s+/)[1] ?? '') : '';
    const locationText = subRegion
      ? `${regionLabel} ${subRegion} · ${business.category}`
      : regionLabel
      ? `${regionLabel} · ${business.category}`
      : business.category;

    const cardContent = (
      <div className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors group cursor-pointer
        ${selected
          ? 'bg-amber-50 border border-amber-200 shadow-sm'
          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}
      >
        {/* 썸네일 */}
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
          {business.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.cover_image_url} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryGradient} flex items-center justify-center relative overflow-hidden`}>
              <span className="absolute text-white/20 font-black text-3xl select-none leading-none">{firstChar}</span>
              <span className="relative text-white font-black text-base leading-none drop-shadow">{firstChar}</span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <h3 className={`text-sm font-bold truncate transition-colors leading-tight
            ${selected ? 'text-amber-600' : 'text-gray-900 group-hover:text-amber-600'}`}>
            {business.name}
          </h3>
          <p className="text-[10px] text-gray-500 font-medium truncate leading-tight">
            {locationText}
          </p>
          {business.address && (
            <p className="text-[10px] text-gray-400 truncate leading-tight">
              {business.address}
            </p>
          )}
        </div>

        {/* 아이콘 */}
        <div className="shrink-0 flex gap-1.5 text-gray-300 group-hover:text-gray-500 transition-colors">
          {business.phone && <Phone size={11} />}
          {business.open_chat_url && <MessageSquare size={11} />}
        </div>
      </div>
    );

    if (onSelect) return <div onClick={onSelect}>{cardContent}</div>;
    return <Link href={`/places/${business.id}`}>{cardContent}</Link>;
  }

  /* ── 기본 그리드 카드 ── */
  return (
    <Link href={`/places/${business.id}`}>
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer group relative h-full flex flex-col">
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
            <span className="absolute text-white/10 font-black select-none leading-none" style={{ fontSize: '6rem' }}>{firstChar}</span>
            <div className="relative z-10 text-center px-4">
              <p className="text-white/70 text-[9px] font-black uppercase tracking-widest mb-1">{categoryLabel}</p>
              <h3 className="text-white font-black text-lg leading-tight drop-shadow-lg line-clamp-2">{business.name}</h3>
            </div>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${categoryColor}`}>
                {categoryLabel}
              </span>
              <h3 className="font-bold text-gray-900 text-lg tracking-tight group-hover:text-amber-600 transition-colors leading-tight">
                {business.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-auto">
            <span className="truncate">{business.address ?? business.region_code}</span>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            {business.phone && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                <Phone size={10} /> 전화
              </div>
            )}
            {business.open_chat_url && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                <MessageSquare size={10} /> 오픈채팅
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
