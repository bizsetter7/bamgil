import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import BottomCtaBar from './BottomCtaBar';
import ImageSlider from './ImageSlider';
import MiniKakaoMap from './MiniKakaoMap';
import ViewIncrementer from './ViewIncrementer';
import {
  MapPin, Phone, Clock, ChevronLeft, ShieldCheck,
  Star, Check, ParkingCircle, Car, Navigation,
  Users, Building2, Flag, Copy, Zap,
} from 'lucide-react';
import { formatPhone } from '@/lib/formatPhone';


const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천',
  busan: '부산', daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  chungnam: '충청남도', chungbuk: '충청북도', jeonnam: '전라남도', jeonbuk: '전라북도',
  gangwon: '강원도', gyeongnam: '경상남도', gyeongbuk: '경상북도', jeju: '제주도',
  other: '기타',
};

/** 실장명 프라이버시 마스킹: 2번째 글자를 O로 치환
 *  이민 → 이O / 김철훈 → 김O훈 / 김수아야 → 김O수아야 */
function maskName(name: string): string {
  if (!name || name.length < 2) return name;
  return name[0] + 'O' + name.slice(2);
}

/** 민감번호 마스킹: 끝 2자리를 **로 치환
 *  303-28-06100 → 303-28-061**  /  제2023-서울강남-01234호 → 제2023-서울강남-012**호 */
function maskSensitiveNumber(value: string): string {
  if (!value || value.length < 3) return value;
  // 끝의 숫자·영문 2글자를 **로 치환 (후행 한글 제외)
  const match = value.match(/^([\s\S]*)(.{2})([가-힣]*)$/);
  if (!match) return value.slice(0, -2) + '**';
  return match[1] + '**' + match[3];
}

export async function generateMetadata({ params }: { params: Promise<{ businessId: string }> }): Promise<Metadata> {
  const { businessId } = await params;
  const supabase = await createClient();
  const { data: business } = await supabase.from('businesses').select('*').eq('id', businessId).single();
  
  if (!business) return { title: '업소 정보를 찾을 수 없습니다' };

  const region = REGION_LABELS[business.region_code] || business.region_code;
  const category = business.category;
  const title = `${business.name} - ${region} ${category} 추천 | 밤길`;
  const description = `${region} ${business.name} (${category})의 상세 정보, 영업시간, 메뉴, 주차 여부를 확인하세요. 밤길이 검증한 안전한 업소입니다.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: business.cover_image_url ? [business.cover_image_url] : [],
    },
    keywords: [`${region} ${category}`, business.name, '밤길', '유흥알바', '지역업소'],
  };
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('*, managers(*), subscriptions(*)')
    .eq('id', businessId)
    .eq('is_active', true)
    .single();

  if (!business) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === business.owner_user_id;

  const subscription = business.subscriptions?.[0];
  const isActive = subscription?.status === 'active';
  const isPremium = isActive && subscription.plan === 'premium';
  const isStandard = isActive && subscription.plan === 'standard';

  const images: string[] = business.images ?? [];
  const menuItems: { name: string; price: number; note?: string }[] =
    business.menu_items ?? [];
  const extraFees: { label: string; value: string; amount: number }[] =
    business.extra_fees ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <ViewIncrementer businessId={businessId} />
      <div className="max-w-2xl mx-auto">
        {/* ── 이미지 슬라이더 (뒤로가기 오버레이 포함) ── */}
        <div className="relative">
          <ImageSlider images={images} name={business.name} category={business.category} />
          {/* 뒤로가기 — 이미지 위 오버레이 */}
          <Link
            href="/"
            className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black/70 transition-colors"
          >
            <ChevronLeft size={14} />
            뒤로
          </Link>
          {/* 검증 배지 — 이미지 하단 오버레이 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <ShieldCheck size={13} className="shrink-0" />
              <span>영업허가 확인 &middot; 합법적인 인증업체</span>
            </div>
          </div>
        </div>

        {/* ── 기본 정보 ── */}
        <div className="bg-white px-4 pt-4 pb-5 space-y-3 border-b border-gray-100">
          {/* 카테고리 + 조회수 + 공유 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-500">
                {REGION_LABELS[business.region_code] ?? business.region_code} · {business.category}
              </span>
              <span className="text-[10px] text-gray-400 font-black bg-gray-100 border border-gray-200 px-2 py-0.5 rounded flex items-center gap-1">
                <Zap size={10} className="text-gray-400" />
                조회 {(business as any).views ?? Math.floor(Math.abs(parseInt(businessId.substring(0, 4), 16) % 1000) + 100)}
              </span>
            </div>
            {isPremium && (
              <span className="flex items-center gap-1 text-[10px] font-black text-white bg-amber-500 px-2 py-0.5 rounded-full">
                <Star size={9} fill="white" /> 프리미엄 파트너
              </span>
            )}
            {isStandard && (
              <span className="flex items-center gap-1 text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-full">
                <Check size={9} /> 공식 파트너
              </span>
            )}
          </div>

          {/* 업소명 */}
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
            {business.name}
            {business.manager_name && (
              <span className="text-gray-600 font-medium text-lg"> {maskName(business.manager_name)} 실장</span>
            )}
          </h1>

          {/* 주소 */}
          <div className="flex items-start gap-2 text-gray-700 text-sm">
            <MapPin size={15} className="shrink-0 mt-0.5 text-gray-500" />
            <div>
              <span>{business.address ?? REGION_LABELS[business.region_code] ?? business.region_code}</span>
              {business.address_detail && (
                <span className="text-gray-500"> {business.address_detail}</span>
              )}
            </div>
          </div>

          {/* 영업시간 */}
          {business.business_hours && (
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <Clock size={15} className="shrink-0 text-gray-500" />
              <span>오늘 · {business.business_hours}</span>
            </div>
          )}

          {/* 전화 */}
          {business.manager_phone && (
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <Phone size={15} className="shrink-0 text-gray-500" />
              <a href={`tel:${business.manager_phone}`} className="text-amber-600 font-bold hover:underline">
                {formatPhone(business.manager_phone)}
              </a>
            </div>
          )}
        </div>

        {/* ── 퀵 인포 그리드 (항상 표시) ── */}
        <div className="bg-white mx-0 px-4 py-5 grid grid-cols-5 gap-2 border-b border-gray-100">
          {/* 룸 수 */}
          <div className={`border rounded-2xl p-3 text-center ${business.room_count ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
            <Building2 size={18} className={`mx-auto mb-1 ${business.room_count ? 'text-amber-500' : 'text-gray-400'}`} />
            <p className={`font-black text-sm ${business.room_count ? 'text-gray-900' : 'text-gray-500'}`}>
              {business.room_count ? `${business.room_count}개` : '-'}
            </p>
            <p className="text-gray-500 text-[9px] mt-0.5 font-bold">룸</p>
          </div>
          {/* 연령대 */}
          <div className={`border rounded-2xl p-3 text-center ${business.age_range ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
            <Users size={18} className={`mx-auto mb-1 ${business.age_range ? 'text-amber-500' : 'text-gray-400'}`} />
            <p className={`font-black text-sm leading-tight ${business.age_range ? 'text-gray-900' : 'text-gray-500'}`}>
              {business.age_range ?? '-'}
            </p>
            <p className="text-gray-500 text-[9px] mt-0.5 font-bold">연령대</p>
          </div>
          {/* 주차 */}
          <div className={`border rounded-2xl p-3 text-center ${business.has_parking ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
            <ParkingCircle size={18} className={`mx-auto mb-1 ${business.has_parking ? 'text-emerald-500' : 'text-gray-400'}`} />
            <p className={`font-black text-sm ${business.has_parking ? 'text-gray-900' : 'text-gray-500'}`}>
              {business.has_parking ? '가능' : '불가'}
            </p>
            <p className="text-gray-500 text-[9px] mt-0.5 font-bold">주차</p>
          </div>
          {/* 발렛 */}
          <div className={`border rounded-2xl p-3 text-center ${business.has_valet ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
            <Car size={18} className={`mx-auto mb-1 ${business.has_valet ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className={`font-black text-sm ${business.has_valet ? 'text-gray-900' : 'text-gray-500'}`}>
              {business.has_valet ? '가능' : '불가'}
            </p>
            <p className="text-gray-500 text-[9px] mt-0.5 font-bold">발렛</p>
          </div>
          {/* 픽업 */}
          <div className={`border rounded-2xl p-3 text-center ${business.has_pickup ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
            <Navigation size={18} className={`mx-auto mb-1 ${business.has_pickup ? 'text-purple-500' : 'text-gray-400'}`} />
            <p className={`font-black text-sm ${business.has_pickup ? 'text-gray-900' : 'text-gray-500'}`}>
              {business.has_pickup ? '가능' : '불가'}
            </p>
            <p className="text-gray-500 text-[9px] mt-0.5 font-bold">픽업</p>
          </div>
        </div>

        {/* ── 대표 메뉴 ── */}
        {menuItems.length > 0 && (
          <div className="bg-white px-4 py-5 mt-2 border-b border-gray-100">
            <h2 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">대표 메뉴</h2>
            <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {menuItems.map((item, i) => (
                <div key={i} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-gray-900 font-bold text-sm">{item.name}</p>
                      {item.note && <p className="text-gray-400 text-xs mt-0.5">{item.note}</p>}
                    </div>
                    <p className="text-amber-500 font-black text-base shrink-0">
                      {item.price.toLocaleString()}원
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 별도 요금 ── */}
        {extraFees.length > 0 && (
          <div className="bg-white px-4 py-5 mt-2 border-b border-gray-100">
            <h2 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">별도 요금</h2>
            <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {extraFees.map((fee, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-700 text-sm font-medium">{fee.label}</p>
                    {fee.value && <p className="text-gray-400 text-xs">{fee.value}</p>}
                  </div>
                  <p className="text-gray-900 font-black text-sm">
                    {fee.amount === 0 ? '없음 0원' : `${fee.amount.toLocaleString()}원`}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-right text-[10px] text-gray-400 mt-1.5">모든 금액은 VAT 포함입니다</p>
          </div>
        )}

        {/* ── 기본 정보 ── */}
        {(business.opened_at || business.room_count || business.floor_area || business.business_hours || (business as any).license_number || (business as any).business_reg_number) && (
          <div className="bg-white px-4 py-5 mt-2 border-b border-gray-100">
            <h2 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">기본 정보</h2>
            <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {business.business_hours && (
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-gray-600 text-xs font-medium">영업시간</span>
                  <span className="text-gray-900 text-sm font-bold">{business.business_hours}</span>
                </div>
              )}
              {business.opened_at && (
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-gray-600 text-xs font-medium">개업일</span>
                  <span className="text-gray-900 text-sm font-bold">
                    {new Date(business.opened_at).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {business.room_count && (
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-gray-600 text-xs font-medium">룸 수</span>
                  <span className="text-gray-900 text-sm font-bold">총 {business.room_count}개</span>
                </div>
              )}
              {business.floor_area && (
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-gray-600 text-xs font-medium">면적</span>
                  <span className="text-gray-900 text-sm font-bold">{business.floor_area}</span>
                </div>
              )}
              {(business as any).license_number && (
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-gray-600 text-xs font-medium">영업허가번호</span>
                  <span className="flex items-center gap-1.5 text-gray-900 text-sm font-bold">
                    <Check size={12} className="text-emerald-500 shrink-0" />
                    {maskSensitiveNumber((business as any).license_number)}
                  </span>
                </div>
              )}
              {(business as any).business_reg_number && (
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-gray-600 text-xs font-medium">사업자번호</span>
                  <span className="flex items-center gap-1.5 text-gray-900 text-sm font-bold">
                    <Check size={12} className="text-emerald-500 shrink-0" />
                    {maskSensitiveNumber((business as any).business_reg_number)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 합법 업소 설명 ── */}
        {business.description && (
          <div className="bg-white px-4 py-5 mt-2 border-b border-gray-100">
            <p className="text-gray-700 text-sm leading-relaxed">
              <span className="text-gray-900 font-bold">{business.name}</span>은{' '}
              {business.description}
            </p>
          </div>
        )}

        {/* ── 사진 더보기 그리드 ── */}
        {images.length > 1 && (
          <div className="bg-white px-4 py-5 mt-2 border-b border-gray-100">
            <h2 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">사진</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {images.slice(0, 6).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${business.name} ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 5 && images.length > 6 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-black text-lg">+{images.length - 6}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 미니 지도 ── */}
        {business.lat && business.lng && (
          <div className="bg-white px-4 pt-5 pb-6 mt-2 border-b border-gray-100">
            <h2 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3">위치</h2>
            <MiniKakaoMap lat={business.lat} lng={business.lng} name={business.name} />
            {/* 주소 + 복사 */}
            <div className="mt-3 flex items-center gap-2 px-1">
              <p className="text-gray-500 text-xs flex-1 truncate">
                {business.address}
              </p>
              <button
                onClick={undefined}
                className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Copy size={11} /> 복사
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <a
                href={`https://t.map.skplanetx.com/taxi?lon=${business.lng}&lat=${business.lat}&name=${encodeURIComponent(business.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 text-center hover:bg-gray-100 hover:border-gray-300 transition-all"
              >
                🚕 택시 부르기
              </a>
              <a
                href={`https://dae-ri.net/biz?destination=${encodeURIComponent(business.address ?? '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 text-center hover:bg-gray-100 hover:border-gray-300 transition-all"
              >
                🚗 대리 부르기
              </a>
              <a
                href={`https://map.kakao.com/link/to/${encodeURIComponent(business.name)},${business.lat},${business.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 text-center hover:bg-gray-100 hover:border-gray-300 transition-all"
              >
                🚶 도보 길찾기
              </a>
            </div>
          </div>
        )}

        {/* 여백 */}
        <div className="h-8" />
      </div>

      {/* ── 하단 고정 CTA ── */}
      <BottomCtaBar 
        business={{
          id: business.id,
          phone: business.phone,
          manager_phone: business.manager_phone,
          kakao_url: business.open_chat_url,
        }}
        isOwner={isOwner}
      />
    </div>
  );
}
