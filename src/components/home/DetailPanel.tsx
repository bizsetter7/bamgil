'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  X, MapPin, Phone, Clock, ShieldCheck, Star, Check,
  ParkingCircle, Car, Navigation, Users, Building2,
  MessageSquare, ChevronLeft, ChevronRight, AlertCircle,
  Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import { maskName } from '@/lib/maskName';
import { formatPhone } from '@/lib/formatPhone';
import { getTodayHours } from '@/lib/businessHours';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천',
  busan: '부산', daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  chungnam: '충청남도', chungbuk: '충청북도', jeonnam: '전라남도', jeonbuk: '전라북도',
  gangwon: '강원도', gyeongnam: '경상남도', gyeongbuk: '경상북도', jeju: '제주도',
  other: '기타',
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

interface DaySchedule { open: string; close: string; is24h: boolean; isClosed: boolean; }

interface Business {
  id: string;
  name: string;
  category: string;
  region_code: string;
  address: string | null;
  address_detail: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  open_chat_url: string | null;
  cover_image_url: string | null;
  images: string[] | null;
  business_hours: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  room_count: number | null;
  age_range: string | null;
  has_parking: boolean | null;
  has_valet: boolean | null;
  has_pickup: boolean | null;
  opened_at: string | null;
  floor_area: string | null;
  description: string | null;
  menu_items: { name: string; price: number; note?: string }[] | null;
  extra_fees: { label: string; value: string; amount: number }[] | null;
  subscriptions: { status: string; plan: string }[] | null;
}

export default function DetailPanel({ businessId, onClose }: { businessId: string; onClose: () => void }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [hoursOpen, setHoursOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    setBusiness(null);
    setImgIdx(0);
    supabase.from('businesses').select('*, subscriptions(*)').eq('id', businessId).single()
      .then(({ data }) => { setBusiness(data); setLoading(false); });
  }, [businessId]);

  const logContact = (type: 'call' | 'chat') => {
    fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, contactType: type }),
    }).catch(() => {});
  };

  const sub = business?.subscriptions?.[0];
  const isPremium = sub?.status === 'active' && sub.plan === 'premium';
  const isStandard = sub?.status === 'active' && sub.plan === 'standard';
  const images = business?.images?.length ? business.images : (business?.cover_image_url ? [business.cover_image_url] : []);
  const menuItems = business?.menu_items ?? [];
  const extraFees = business?.extra_fees ?? [];
  const todayHours = business ? getTodayHours(business.business_hours) : '';

  /* 요일별 전체 시간표 */
  let weekSchedule: DaySchedule[] | null = null;
  try {
    if (business?.business_hours) weekSchedule = JSON.parse(business.business_hours);
  } catch { /* noop */ }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200 shrink-0 bg-white">
        <span className="text-sm font-bold text-gray-700 truncate max-w-[80%]">
          {business?.name ?? '업소 상세'}
        </span>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
          <X size={18} />
        </button>
      </div>

      {/* ── 스크롤 영역 ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !business ? (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">업소 정보를 불러올 수 없습니다.</div>
        ) : (
          <>
            {/* ── 이미지 슬라이더 ── */}
            <div className="relative bg-gray-100">
              {images.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[imgIdx]} alt={business.name} className="w-full h-48 object-cover" />
                  {/* 검증 배지 오버레이 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <ShieldCheck size={12} className="shrink-0" />
                      <span>영업허가 확인 · 합법적인 인증업체</span>
                    </div>
                  </div>
                  {/* 이미지 내비 */}
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white">
                        <ChevronLeft size={16} />
                      </button>
                      <button onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white">
                        <ChevronRight size={16} />
                      </button>
                      <div className="absolute top-2 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {imgIdx + 1}/{images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className={`w-full h-40 bg-gradient-to-br ${CATEGORY_GRADIENTS[business.category] ?? 'from-gray-300 to-gray-500'} flex items-center justify-center relative`}>
                  <span className="text-white/20 font-black select-none" style={{ fontSize: '6rem' }}>{business.name[0]}</span>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <ShieldCheck size={12} /> <span>영업허가 확인 · 합법적인 인증업체</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── 기본 정보 카드 ── */}
            <div className="bg-white px-4 pt-3 pb-4 border-b border-gray-100">
              {/* 배지 행 */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {isPremium && (
                  <span className="flex items-center gap-0.5 text-[10px] font-black text-white bg-amber-500 px-2 py-0.5 rounded-full">
                    <Star size={8} fill="white" /> 프리미엄
                  </span>
                )}
                {isStandard && (
                  <span className="flex items-center gap-0.5 text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-full">
                    <Check size={8} /> 공식파트너
                  </span>
                )}
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {business.category}
                </span>
              </div>

              {/* 업소명 */}
              <h2 className="text-2xl font-black text-gray-900 leading-tight mb-3">
                {business.name}
                {business.manager_name && (
                  <span className="text-gray-500 font-medium text-base"> {maskName(business.manager_name)} 실장</span>
                )}
              </h2>

              {/* 주소 */}
              <div className="flex items-start gap-2 text-sm text-gray-700 mb-2">
                <MapPin size={14} className="shrink-0 mt-0.5 text-gray-400" />
                <span>
                  {business.address ?? REGION_LABELS[business.region_code] ?? business.region_code}
                  {business.address_detail && <span className="text-gray-500"> {business.address_detail}</span>}
                </span>
              </div>

              {/* 영업시간 */}
              {todayHours && (
                <div className="mb-2">
                  <button
                    onClick={() => setHoursOpen(o => !o)}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Clock size={14} className="shrink-0 text-gray-400" />
                    <span className="font-medium">{todayHours}</span>
                    {weekSchedule && (hoursOpen ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />)}
                  </button>
                  {hoursOpen && weekSchedule && (
                    <div className="mt-2 ml-5 space-y-1 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      {weekSchedule.map((day, i) => (
                        <div key={i} className={`flex items-center gap-2 ${i === new Date().getDay() ? 'font-bold text-amber-600' : ''}`}>
                          <span className="w-4 shrink-0">{DAY_NAMES[i]}</span>
                          <span>
                            {day.isClosed ? '휴무' : day.is24h ? '24시간' : `${day.open} ~ ${day.close}`}
                          </span>
                          {i === new Date().getDay() && <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 rounded-full font-black">오늘</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 전화 */}
              {(business.manager_phone ?? business.phone) && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="shrink-0 text-gray-400" />
                  <span className="text-gray-600">
                    {business.manager_name && <span>{maskName(business.manager_name)} 사장 · </span>}
                    <a href={`tel:${business.manager_phone ?? business.phone}`}
                      className="text-amber-600 font-bold hover:underline"
                      onClick={() => logContact('call')}>
                      {formatPhone(business.manager_phone ?? business.phone)} 전화
                    </a>
                  </span>
                </div>
              )}
            </div>

            {/* ── 퀵 인포 2×3 그리드 ── */}
            <div className="bg-white px-4 py-4 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Building2, label: '룸', value: business.room_count ? `${business.room_count}개` : '-', color: business.room_count ? 'text-amber-500' : 'text-gray-300' },
                  { icon: Users, label: '집객원', value: '합법 입소', color: 'text-emerald-500' },
                  { icon: Users, label: '연령대', value: business.age_range ?? '-', color: business.age_range ? 'text-amber-500' : 'text-gray-300' },
                  { icon: ParkingCircle, label: '주차', value: business.has_parking ? '가능' : '불가', color: business.has_parking ? 'text-emerald-500' : 'text-gray-300' },
                  { icon: Car, label: '발렛', value: business.has_valet ? '가능' : '불가', color: business.has_valet ? 'text-blue-500' : 'text-gray-300' },
                  { icon: Navigation, label: '픽업', value: business.has_pickup ? '가능' : '불가', color: business.has_pickup ? 'text-purple-500' : 'text-gray-300' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="border border-gray-100 rounded-2xl p-3 text-center bg-white shadow-sm">
                    <Icon size={18} className={`mx-auto mb-1 ${color}`} />
                    <p className={`font-black text-sm leading-tight ${value === '-' || value === '불가' ? 'text-gray-400' : 'text-gray-900'}`}>{value}</p>
                    <p className="text-gray-400 text-[9px] mt-0.5 font-bold">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 대표 메뉴 ── */}
            {menuItems.length > 0 && (
              <div className="bg-white px-4 py-4 mt-2 border-b border-gray-100">
                <h3 className="text-sm font-black text-gray-800 mb-3">대표 메뉴</h3>
                <div className="space-y-3">
                  {menuItems.map((item, i) => (
                    <div key={i}>
                      <p className="text-gray-900 font-bold text-sm">{item.name}</p>
                      {item.note && <p className="text-gray-400 text-xs mt-0.5">{item.note}</p>}
                      <p className="text-amber-600 font-black text-base mt-1">{item.price.toLocaleString()} 원</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 별도 요금 ── */}
            {extraFees.length > 0 && (
              <div className="bg-white px-4 py-4 mt-2 border-b border-gray-100">
                <h3 className="text-sm font-black text-gray-800 mb-3">별도 요금</h3>
                <div className="space-y-2">
                  {extraFees.map((fee, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-700 text-sm">{fee.label}</span>
                        {fee.value && <span className="text-gray-400 text-xs ml-2">{fee.value}</span>}
                      </div>
                      <span className="text-gray-900 font-black text-sm">
                        {fee.amount === 0 ? '없음' : `${fee.amount.toLocaleString()}원`}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-right text-[10px] text-gray-400 mt-2">모든 금액은 VAT 포함 입니다</p>
              </div>
            )}

            {/* ── 기본 정보 ── */}
            {(business.opened_at || business.room_count || business.floor_area) && (
              <div className="bg-white px-4 py-4 mt-2 border-b border-gray-100">
                <h3 className="text-sm font-black text-gray-800 mb-3">기본 정보</h3>
                <div className="space-y-3">
                  {business.opened_at && (
                    <div>
                      <p className="text-gray-500 text-xs font-bold">개업일</p>
                      <p className="text-gray-900 text-sm font-bold mt-0.5">
                        {new Date(business.opened_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {(business.room_count || business.floor_area) && (
                    <div>
                      <p className="text-gray-500 text-xs font-bold">업소 규모</p>
                      <p className="text-gray-900 text-sm font-bold mt-0.5">
                        {[business.room_count && `룸 ${business.room_count}개`, business.floor_area].filter(Boolean).join(' (')}
                        {business.floor_area && business.room_count ? ')' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 사진 그리드 ── */}
            {images.length > 1 && (
              <div className="bg-white px-4 py-4 mt-2 border-b border-gray-100">
                <div className="grid grid-cols-3 gap-1.5">
                  {images.slice(0, 6).map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                      onClick={() => setImgIdx(i)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
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

            {/* ── 잘못된 정보 제보 ── */}
            <div className="bg-white px-4 py-3 mt-2 border-b border-gray-100">
              <button className="w-full flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">잘못된 정보 제보</span>
                </div>
                <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500" />
              </button>
              <p className="text-xs text-gray-400 mt-1 pl-6">이상이 있는 광고는 알려주세요. 빠르게 확인하겠습니다.</p>
            </div>

            {/* ── 업소 소개 ── */}
            {business.description && (
              <div className="bg-white px-4 py-4 mt-2 border-b border-gray-100">
                <p className="text-gray-700 text-sm leading-relaxed">
                  <span className="font-bold text-gray-900">{business.name}</span>은{' '}
                  {business.description}
                </p>
              </div>
            )}

            {/* ── 지도 + 길찾기 ── */}
            {business.address && (
              <div className="bg-white px-4 py-4 mt-2 border-b border-gray-100">
                {/* 주소 + 복사 */}
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={13} className="text-gray-400 shrink-0" />
                  <p className="text-gray-600 text-xs flex-1 truncate">{business.address}{business.address_detail ? ` ${business.address_detail}` : ''}</p>
                  <button
                    onClick={() => navigator.clipboard?.writeText(business.address ?? '')}
                    className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-700"
                  >
                    <Copy size={11} /> 복사
                  </button>
                </div>
                {/* 길찾기 버튼 */}
                {business.lat && business.lng && (
                  <div className="grid grid-cols-3 gap-2">
                    <a href={`https://t.map.skplanetx.com/taxi?lon=${business.lng}&lat=${business.lat}&name=${encodeURIComponent(business.name)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 text-center hover:bg-gray-100 transition-all">
                      🚕 택시 부르기
                    </a>
                    <a href={`https://dae-ri.net/biz?destination=${encodeURIComponent(business.address ?? '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 text-center hover:bg-gray-100 transition-all">
                      🚗 대리 부르기
                    </a>
                    <a href={`https://map.kakao.com/link/to/${encodeURIComponent(business.name)},${business.lat},${business.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 text-center hover:bg-gray-100 transition-all">
                      🚶 도보 길찾기
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="h-4" />
          </>
        )}
      </div>

      {/* ── 하단 CTA ── */}
      {business && (
        <div className="shrink-0 border-t border-gray-200 px-3 py-3 flex gap-2 bg-white">
          {(business.manager_phone ?? business.phone) && (
            <a href={`tel:${business.manager_phone ?? business.phone}`}
              onClick={() => logContact('call')}
              className="flex-1 py-3.5 bg-amber-500 text-black font-black text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors shadow-sm active:scale-95">
              <Phone size={15} fill="black" /> 전화, 문자상담하기
            </a>
          )}
          {business.open_chat_url && (
            <a href={business.open_chat_url}
              target="_blank" rel="noopener noreferrer"
              onClick={() => logContact('chat')}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-black text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors border border-gray-200 active:scale-95">
              <MessageSquare size={15} /> 오픈톡 상담하기
            </a>
          )}
        </div>
      )}
    </div>
  );
}
