import Link from 'next/link';
import { Phone, MessageSquare } from 'lucide-react';
import { getActivePlanFromList } from '@/lib/subscriptionPlan';
import { haversineKm, formatDistance } from '@/lib/geo';

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
    subscriptions?: { plan: string; status: string }[] | null;
  };
  compact?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  // 거리/구동 배지용 (compact 카드에서만 사용)
  userPos?: { lat: number; lng: number } | null;
  geocoded?: { lat: number; lng: number; region2?: string; region3?: string } | null;
}

export default function BusinessCard({ business, compact = false, selected = false, onSelect, userPos, geocoded }: BusinessCardProps) {
  const categoryColor = CATEGORY_COLORS[business.category] ?? 'text-gray-600 bg-gray-100';
  const categoryLabel = business.category;
  const categoryGradient = CATEGORY_GRADIENTS[business.category] ?? 'from-gray-300 via-gray-400 to-gray-500';
  const firstChar = business.name?.[0] ?? '?';

  const activePlan = getActivePlanFromList(business.subscriptions);
  const isPremiumTier = activePlan === 'premium' || activePlan === 'elite';
  const isDeluxe = activePlan === 'deluxe';
  const isPopular = isPremiumTier || isDeluxe;

  /* ── 사이드패널 컴팩트 카드 (밤맵 스타일 가로 레이아웃) ── */
  if (compact) {
    const regionLabel = business.region_code ? (REGION_LABELS[business.region_code] ?? business.region_code) : '';
    // 1) 우선 geocoded.region2(시군구) 사용 — 예: "천안시 서북구"
    // 2) 없으면 address에서 두 번째 토큰
    const subRegion = geocoded?.region2 || (business.address ? (business.address.trim().split(/\s+/)[1] ?? '') : '');
    const locationLabel = subRegion ? `${regionLabel} ${subRegion}` : regionLabel;
    // 구주소 동(법정동) — 예: "백석동"
    const dongLabel = geocoded?.region3 ?? null;
    // 사용자 위치 ↔ 업소 거리
    const distanceLabel = userPos && geocoded
      ? formatDistance(haversineKm(userPos, { lat: geocoded.lat, lng: geocoded.lng }))
      : null;

    const cardContent = (
      <div className={`flex gap-3 p-2.5 rounded-2xl transition-all group cursor-pointer mb-2
        ${selected
          ? 'bg-amber-50 border border-amber-300 shadow-sm'
          : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200'}`}
      >
        {/* 썸네일 — 가로 120x115 (세로폭 확대) */}
        <div className="relative shrink-0 w-[120px] h-[115px] rounded-xl overflow-hidden bg-gray-100">
          {business.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.cover_image_url} alt={business.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryGradient} flex items-center justify-center relative overflow-hidden`}>
              <span className="absolute text-white/15 font-black text-6xl select-none leading-none">{firstChar}</span>
              <span className="relative text-white font-black text-3xl leading-none drop-shadow">{firstChar}</span>
            </div>
          )}
          {/* 좌상단 배지 (인기 + 프리미엄 가로 2열 — 이미지 가림 최소화) */}
          {(isPopular || isPremiumTier) && (
            <div className="absolute top-1.5 left-1.5 right-1.5 flex gap-1 flex-wrap">
              {isPopular && (
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-md leading-none shadow-sm">
                  🔥 인기
                </span>
              )}
              {isPremiumTier && (
                <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-1 rounded-md leading-none shadow-sm">
                  ✓ 프리미엄
                </span>
              )}
            </div>
          )}
        </div>

        {/* 텍스트 정보 */}
        <div className="flex-1 min-w-0 py-0.5 flex flex-col gap-1">
          {/* 지역 + 카테고리 */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] text-gray-400 font-medium">{locationLabel}</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 leading-none">
              {categoryLabel}
            </span>
          </div>
          {/* 업소명 */}
          <h3 className={`text-sm font-black truncate transition-colors leading-tight
            ${selected ? 'text-amber-600' : 'text-gray-900 group-hover:text-amber-600'}`}>
            {business.name}
          </h3>
          {/* 거리 + 구주소 동 배지 (한 줄) */}
          {(distanceLabel || dongLabel) && (
            <div className="flex items-center gap-1 flex-wrap">
              {distanceLabel && (
                <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md leading-none border border-amber-200">
                  {distanceLabel}
                </span>
              )}
              {dongLabel && (
                <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md leading-none">
                  {dongLabel}
                </span>
              )}
            </div>
          )}
          {/* 연락 아이콘 */}
          <div className="flex gap-2 text-gray-300 group-hover:text-gray-500 transition-colors mt-auto">
            {business.phone && <Phone size={12} />}
            {business.open_chat_url && <MessageSquare size={12} />}
          </div>
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
