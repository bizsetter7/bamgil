'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  X, MapPin, Phone, Clock, ShieldCheck, Star, Check,
  ParkingCircle, Car, Navigation, Users, Building2,
  MessageSquare, ChevronRight,
} from 'lucide-react';
import { maskName } from '@/lib/maskName';

const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱', karaoke_bar: '노래주점', bar: '유흥주점',
  night_club: '나이트', hostbar: '호스트바', general: '일반', other: '기타',
};

const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천',
  busan: '부산', daegu: '대구', other: '기타',
};

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

interface DetailPanelProps {
  businessId: string;
  onClose: () => void;
}

export default function DetailPanel({ businessId, onClose }: DetailPanelProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    setBusiness(null);

    supabase
      .from('businesses')
      .select('*, subscriptions(*)')
      .eq('id', businessId)
      .single()
      .then(({ data }) => {
        setBusiness(data);
        setLoading(false);
      });
  }, [businessId]);

  const logContact = (type: 'call' | 'chat') => {
    fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, contactType: type }),
    }).catch(() => {});
  };

  const subscription = business?.subscriptions?.[0];
  const isPremium = subscription?.status === 'active' && subscription.plan === 'premium';
  const isStandard = subscription?.status === 'active' && subscription.plan === 'standard';
  const images = business?.images ?? (business?.cover_image_url ? [business.cover_image_url] : []);
  const menuItems = business?.menu_items ?? [];
  const extraFees = business?.extra_fees ?? [];

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 overflow-hidden">
      {/* ── 상단 헤더 ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800 shrink-0">
        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">업소 상세</span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── 스크롤 영역 ── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !business ? (
          <div className="px-4 py-10 text-center text-zinc-600 text-sm">업소 정보를 불러올 수 없습니다.</div>
        ) : (
          <>
            {/* 이미지 */}
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[0]}
                alt={business.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-32 bg-zinc-900 flex items-center justify-center text-zinc-700">
                <Building2 size={32} />
              </div>
            )}

            {/* 검증 배지 */}
            <div className="px-4 pt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
              <ShieldCheck size={12} className="shrink-0" />
              <span>합법 검증 업소입니다.</span>
            </div>

            {/* 카테고리 + 배지 */}
            <div className="px-4 pt-2 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {CATEGORY_LABELS[business.category] ?? business.category}
              </span>
              {isPremium && (
                <span className="flex items-center gap-1 text-[9px] font-black text-white bg-amber-500 px-1.5 py-0.5 rounded-full">
                  <Star size={8} fill="white" /> 프리미엄
                </span>
              )}
              {isStandard && (
                <span className="flex items-center gap-1 text-[9px] font-black text-white bg-blue-600 px-1.5 py-0.5 rounded-full">
                  <Check size={8} /> 공식
                </span>
              )}
            </div>

            {/* 업소명 */}
            <div className="px-4 pt-1.5 pb-3 border-b border-zinc-800">
              <h2 className="text-xl font-black text-white leading-tight">
                {business.name}
                {business.manager_name && (
                  <span className="text-zinc-500 font-medium text-sm"> {maskName(business.manager_name)} 실장</span>
                )}
              </h2>

              <div className="mt-2 space-y-1.5">
                <div className="flex items-start gap-1.5 text-zinc-400 text-xs">
                  <MapPin size={12} className="shrink-0 mt-0.5 text-zinc-600" />
                  <span>{business.address ?? REGION_LABELS[business.region_code] ?? business.region_code}</span>
                </div>
                {business.business_hours && (
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                    <Clock size={12} className="shrink-0 text-zinc-600" />
                    <span>{business.business_hours}</span>
                  </div>
                )}
                {(business.manager_phone ?? business.phone) && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Phone size={12} className="shrink-0 text-zinc-600" />
                    <a
                      href={`tel:${business.manager_phone ?? business.phone}`}
                      className="text-amber-500 font-bold"
                      onClick={() => logContact('call')}
                    >
                      {business.manager_phone ?? business.phone} 전화
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 퀵 인포 */}
            {(business.room_count || business.age_range || business.has_parking ||
              business.has_valet || business.has_pickup) && (
              <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-zinc-800">
                {business.room_count && (
                  <div className="bg-zinc-900 rounded-xl p-2 text-center">
                    <Building2 size={14} className="mx-auto text-amber-500 mb-1" />
                    <p className="text-white font-black text-xs">{business.room_count}개</p>
                    <p className="text-zinc-600 text-[9px]">룸</p>
                  </div>
                )}
                {business.age_range && (
                  <div className="bg-zinc-900 rounded-xl p-2 text-center">
                    <Users size={14} className="mx-auto text-amber-500 mb-1" />
                    <p className="text-white font-black text-xs">{business.age_range}</p>
                    <p className="text-zinc-600 text-[9px]">연령대</p>
                  </div>
                )}
                {business.has_parking && (
                  <div className="bg-zinc-900 rounded-xl p-2 text-center">
                    <ParkingCircle size={14} className="mx-auto text-emerald-400 mb-1" />
                    <p className="text-white font-black text-xs">가능</p>
                    <p className="text-zinc-600 text-[9px]">주차</p>
                  </div>
                )}
                {business.has_valet && (
                  <div className="bg-zinc-900 rounded-xl p-2 text-center">
                    <Car size={14} className="mx-auto text-blue-400 mb-1" />
                    <p className="text-white font-black text-xs">가능</p>
                    <p className="text-zinc-600 text-[9px]">발렛</p>
                  </div>
                )}
                {business.has_pickup && (
                  <div className="bg-zinc-900 rounded-xl p-2 text-center">
                    <Navigation size={14} className="mx-auto text-purple-400 mb-1" />
                    <p className="text-white font-black text-xs">가능</p>
                    <p className="text-zinc-600 text-[9px]">픽업</p>
                  </div>
                )}
              </div>
            )}

            {/* 대표 메뉴 */}
            {menuItems.length > 0 && (
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">대표 메뉴</p>
                <div className="space-y-2">
                  {menuItems.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-zinc-300 text-xs font-bold">{item.name}</p>
                        {item.note && <p className="text-zinc-600 text-[10px]">{item.note}</p>}
                      </div>
                      <p className="text-amber-500 font-black text-xs shrink-0">
                        {item.price.toLocaleString()}원
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 별도 요금 */}
            {extraFees.length > 0 && (
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">별도 요금</p>
                <div className="space-y-1.5">
                  {extraFees.map((fee, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <p className="text-zinc-400 text-xs">{fee.label}</p>
                      <p className="text-white font-bold text-xs">
                        {fee.amount === 0 ? '없음' : `${fee.amount.toLocaleString()}원`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 상세 페이지 링크 */}
            <div className="px-4 py-3 border-b border-zinc-800">
              <a
                href={`/places/${business.id}`}
                className="flex items-center justify-between text-xs text-zinc-500 hover:text-white transition-colors group"
              >
                <span>전체 정보 보기 (지도, 길찾기 등)</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="h-4" />
          </>
        )}
      </div>

      {/* ── 하단 CTA ── */}
      {business && (
        <div className="shrink-0 border-t border-zinc-800 px-3 py-3 flex gap-2">
          {(business.manager_phone ?? business.phone) && (
            <a
              href={`tel:${business.manager_phone ?? business.phone}`}
              onClick={() => logContact('call')}
              className="flex-1 py-3 bg-amber-500 text-black font-black text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
            >
              <Phone size={15} fill="black" /> 전화 상담
            </a>
          )}
          {business.open_chat_url && (
            <a
              href={business.open_chat_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logContact('chat')}
              className="flex-1 py-3 bg-zinc-800 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              <MessageSquare size={15} /> 오픈톡
            </a>
          )}
        </div>
      )}
    </div>
  );
}
