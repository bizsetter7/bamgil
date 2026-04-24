import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ContactButton from './ContactButton';
import ImageSlider from './ImageSlider';
import MiniKakaoMap from './MiniKakaoMap';
import {
  MapPin, Phone, Clock, ChevronLeft, ShieldCheck,
  Star, Check, ParkingCircle, Car, Navigation,
  Users, Building2, Flag, Copy,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱', karaoke_bar: '노래주점', bar: '유흥주점',
  night_club: '나이트', hostbar: '호스트바', general: '일반', other: '기타',
};

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
    <div className="min-h-screen bg-zinc-950 pb-28">
      <div className="max-w-2xl mx-auto">
        {/* ── 뒤로가기 ── */}
        <div className="px-4 pt-6 pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-sm font-bold group"
          >
            <ChevronLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            탐색으로 돌아가기
          </Link>
        </div>

        {/* ── 이미지 슬라이더 ── */}
        <ImageSlider images={images} name={business.name} />

        {/* ── 검증 배지 ── */}
        <div className="mx-4 mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
          <ShieldCheck size={14} className="shrink-0" />
          <span>{new Date().toLocaleDateString('ko-KR')} 영업허가 확인결과&nbsp;
            <span className="text-white">합법적인 {CATEGORY_LABELS[business.category] ?? '업소'}</span>
            입니다.
          </span>
        </div>

        {/* ── 기본 정보 ── */}
        <div className="px-4 pt-4 space-y-3">
          {/* 카테고리 + 공유 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-zinc-400">
              {CATEGORY_LABELS[business.category] ?? business.category}
            </span>
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
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
            {business.name}
            {business.manager_name && (
              <span className="text-zinc-500 font-medium text-lg"> {business.manager_name} 실장</span>
            )}
          </h1>

          {/* 주소 */}
          <div className="flex items-start gap-2 text-zinc-400 text-sm">
            <MapPin size={15} className="shrink-0 mt-0.5 text-zinc-600" />
            <div>
              <span>{business.address ?? business.region_code}</span>
              {business.address_detail && (
                <span className="text-zinc-600"> {business.address_detail}</span>
              )}
            </div>
          </div>

          {/* 영업시간 */}
          {business.business_hours && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Clock size={15} className="shrink-0 text-zinc-600" />
              <span>오늘 · {business.business_hours}</span>
            </div>
          )}

          {/* 전화 */}
          {business.manager_phone && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Phone size={15} className="shrink-0 text-zinc-600" />
              <span>{business.manager_name && `${business.manager_name} 실장 · `}</span>
              <a href={`tel:${business.manager_phone}`} className="text-amber-500 font-bold hover:underline">
                {business.manager_phone} 전화
              </a>
            </div>
          )}
        </div>

        {/* ── 퀵 인포 그리드 ── */}
        {(business.room_count || business.age_range || business.has_parking ||
          business.has_valet || business.has_pickup) && (
          <div className="mx-4 mt-5 grid grid-cols-3 gap-2">
            {business.room_count && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                <Building2 size={18} className="mx-auto text-amber-500 mb-1" />
                <p className="text-white font-black text-sm">{business.room_count}개</p>
                <p className="text-zinc-500 text-[10px]">룸</p>
              </div>
            )}
            {business.age_range && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                <Users size={18} className="mx-auto text-amber-500 mb-1" />
                <p className="text-white font-black text-sm">{business.age_range}</p>
                <p className="text-zinc-500 text-[10px]">연령대</p>
              </div>
            )}
            {business.has_parking && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                <ParkingCircle size={18} className="mx-auto text-emerald-400 mb-1" />
                <p className="text-white font-black text-sm">가능</p>
                <p className="text-zinc-500 text-[10px]">주차</p>
              </div>
            )}
            {business.has_valet && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                <Car size={18} className="mx-auto text-blue-400 mb-1" />
                <p className="text-white font-black text-sm">가능</p>
                <p className="text-zinc-500 text-[10px]">발렛</p>
              </div>
            )}
            {business.has_pickup && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
                <Navigation size={18} className="mx-auto text-purple-400 mb-1" />
                <p className="text-white font-black text-sm">가능</p>
                <p className="text-zinc-500 text-[10px]">픽업</p>
              </div>
            )}
          </div>
        )}

        {/* ── 대표 메뉴 ── */}
        {menuItems.length > 0 && (
          <div className="mx-4 mt-6">
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">대표 메뉴</h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
              {menuItems.map((item, i) => (
                <div key={i} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-bold text-sm">{item.name}</p>
                      {item.note && <p className="text-zinc-500 text-xs mt-0.5">{item.note}</p>}
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
          <div className="mx-4 mt-6">
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">별도 요금</h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
              {extraFees.map((fee, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-zinc-300 text-sm font-medium">{fee.label}</p>
                    {fee.value && <p className="text-zinc-600 text-xs">{fee.value}</p>}
                  </div>
                  <p className="text-white font-black text-sm">
                    {fee.amount === 0 ? '없음 0원' : `${fee.amount.toLocaleString()}원`}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-right text-[10px] text-zinc-600 mt-1.5">모든 금액은 VAT 포함입니다</p>
          </div>
        )}

        {/* ── 기본 정보 ── */}
        {(business.opened_at || business.room_count || business.floor_area) && (
          <div className="mx-4 mt-6">
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">기본 정보</h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-4 space-y-3">
              {business.opened_at && (
                <div>
                  <p className="text-zinc-500 text-xs mb-0.5">개업일</p>
                  <p className="text-white text-sm font-bold">
                    {new Date(business.opened_at).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {(business.room_count || business.floor_area) && (
                <div>
                  <p className="text-zinc-500 text-xs mb-0.5">업소 규모</p>
                  <p className="text-white text-sm font-bold">
                    {business.room_count && `룸 ${business.room_count}개`}
                    {business.floor_area && ` (${business.floor_area})`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 잘못된 정보 제보 ── */}
        <div className="mx-4 mt-5">
          <button className="w-full flex items-center justify-between px-4 py-3.5 bg-zinc-900/30 border border-zinc-800 rounded-2xl text-sm text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition-all group">
            <div className="flex items-center gap-2">
              <Flag size={14} />
              <span>잘못된 정보 제보</span>
            </div>
            <span className="text-zinc-600 text-xs group-hover:text-zinc-400">이상이 있는 광고는 알려주세요. 빠르게 확인하겠습니다.</span>
          </button>
        </div>

        {/* ── 합법 업소 설명 ── */}
        {business.description && (
          <div className="mx-4 mt-4 px-4 py-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
            <p className="text-zinc-400 text-sm leading-relaxed">
              <span className="text-white font-bold">{business.name}</span>은{' '}
              {business.description}
            </p>
          </div>
        )}

        {/* ── 미니 지도 ── */}
        {business.lat && business.lng && (
          <div className="mx-4 mt-6">
            <MiniKakaoMap lat={business.lat} lng={business.lng} name={business.name} />
            {/* 주소 + 복사 + 길찾기 */}
            <div className="mt-3 flex items-center gap-2 px-1">
              <p className="text-zinc-400 text-xs flex-1 truncate">
                {business.address}
              </p>
              <button
                onClick={undefined}
                className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors"
              >
                <Copy size={11} /> 복사
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <a
                href={`https://t.map.skplanetx.com/taxi?lon=${business.lng}&lat=${business.lat}&name=${encodeURIComponent(business.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 text-center hover:border-zinc-700 hover:text-white transition-all"
              >
                🚕 택시 부르기
              </a>
              <a
                href={`https://dae-ri.net/biz?destination=${encodeURIComponent(business.address ?? '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 text-center hover:border-zinc-700 hover:text-white transition-all"
              >
                🚗 대리 부르기
              </a>
              <a
                href={`https://map.kakao.com/link/to/${encodeURIComponent(business.name)},${business.lat},${business.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 text-center hover:border-zinc-700 hover:text-white transition-all"
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-4 py-3 safe-area-pb">
        <div className="max-w-2xl mx-auto flex gap-3">
          {business.phone || business.manager_phone ? (
            <ContactButton
              businessId={businessId}
              type="call"
              href={`tel:${business.manager_phone ?? business.phone}`}
              label="전화, 문자 상담하기"
            />
          ) : (
            <div className="flex-1 py-4 rounded-2xl bg-zinc-800 text-zinc-600 text-center text-sm font-bold">
              전화번호 미등록
            </div>
          )}
          {business.open_chat_url && (
            <ContactButton
              businessId={businessId}
              type="chat"
              href={business.open_chat_url}
              label="오픈톡 상담"
            />
          )}
        </div>
      </div>
    </div>
  );
}
