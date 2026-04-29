'use client';

import { useEffect, useState } from 'react';
import {
  X, MapPin, Phone, Clock, ShieldCheck, Star, Check, Heart,
  ParkingCircle, Car, Navigation, Users, Building2,
  MessageSquare, ChevronLeft, ChevronRight, AlertCircle,
  Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import { maskName } from '@/lib/maskName';
import { formatPhone } from '@/lib/formatPhone';
import { getTodayHours } from '@/lib/businessHours';
import { getActivePlanFromList } from '@/lib/subscriptionPlan';
import MiniMap from '@/components/map/MiniMap';

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
  manager_role: string | null;
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

interface GroupMember {
  id: string;
  manager_name?: string | null;
  manager_role?: string | null;
  subscriptions?: { plan: string; status: string }[] | null;
}

export default function DetailPanel({
  businessId,
  onClose,
  groupMembers = [],
  onSelectMember,
}: {
  businessId: string;
  onClose: () => void;
  groupMembers?: GroupMember[];
  onSelectMember?: (id: string) => void;
}) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [hoursOpen, setHoursOpen] = useState(false);

  // 잘못된 정보 제보 모달
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportContact, setReportContact] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  // 찜하기
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 리뷰
  interface ReviewItem {
    id: string; rating: number; content: string; created_at: string; user_id: string;
    bamgil_user_profiles: { nickname: string } | null;
  }
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewAvg, setReviewAvg] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myContent, setMyContent] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [myReviewId, setMyReviewId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setBusiness(null);
    setImgIdx(0);
    setFavorited(false);
    setReviews([]);
    setReviewAvg(0);
    setReviewCount(0);
    setShowReviewForm(false);
    setMyRating(0);
    setMyContent('');
    setMyReviewId(null);

    // ① 업소 정보 — 서버 API 경유 (Supabase quota 우회)
    fetch(`/api/businesses/detail?id=${businessId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setBusiness(d.business ?? null); setLoading(false); })
      .catch(() => { setBusiness(null); setLoading(false); });

    // ② 현재 유저 — 서버 API 경유
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const userId = d?.user?.id ?? null;
        setCurrentUserId(userId);
        if (userId) {
          fetch(`/api/favorites?businessId=${businessId}`)
            .then(r => r.ok ? r.json() : { favorited: false })
            .then(d => setFavorited(!!d.favorited))
            .catch(() => {});
        }
      })
      .catch(() => {});

    // ③ 리뷰
    fetch(`/api/reviews?businessId=${businessId}`)
      .then(r => r.ok ? r.json() : { reviews: [], average: 0, count: 0 })
      .then(d => {
        setReviews(d.reviews ?? []);
        setReviewAvg(d.average ?? 0);
        setReviewCount(d.count ?? 0);
        if (d.myReview) {
          setMyRating(d.myReview.rating);
          setMyContent(d.myReview.content ?? '');
          setMyReviewId(d.myReview.id);
        }
      })
      .catch(() => {});
  }, [businessId]);

  const handleToggleFavorite = async () => {
    if (!currentUserId) {
      alert('로그인 후 이용하실 수 있습니다.');
      return;
    }
    if (favLoading) return;
    setFavLoading(true);
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId }),
    });
    const d = await res.json();
    setFavorited(!!d.favorited);
    setFavLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!currentUserId) { alert('로그인 후 이용하실 수 있습니다.'); return; }
    if (myRating === 0) { alert('별점을 선택해주세요.'); return; }
    setReviewSubmitting(true);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, rating: myRating, content: myContent }),
    });
    if (res.ok) {
      // 리뷰 목록 갱신
      const d = await fetch(`/api/reviews?businessId=${businessId}`).then(r => r.json());
      setReviews(d.reviews ?? []);
      setReviewAvg(d.average ?? 0);
      setReviewCount(d.count ?? 0);
      if (d.myReview) setMyReviewId(d.myReview.id);
      setShowReviewForm(false);
    }
    setReviewSubmitting(false);
  };

  const logContact = (type: 'call' | 'chat') => {
    fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, contactType: type }),
    }).catch(() => {});
  };

  const handleReportSubmit = async () => {
    if (!reportReason) { alert('신고 사유를 선택해주세요.'); return; }
    if (!reportContent.trim()) { alert('제보 내용을 입력해주세요.'); return; }
    setReportSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          businessName: business?.name,
          reason: reportReason,
          content: reportContent,
          contact: reportContact,
        }),
      });
      if (res.ok) {
        setReportDone(true);
      } else {
        alert('제보 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    }
    setReportSubmitting(false);
  };

  const openReport = () => {
    setReportReason('');
    setReportContent('');
    setReportContact('');
    setReportDone(false);
    setReportOpen(true);
  };

  const activePlan = getActivePlanFromList(business?.subscriptions);
  const isPremium = activePlan === 'premium' || activePlan === 'elite';
  const isDeluxe = activePlan === 'deluxe';
  const isStandard = activePlan === 'standard';
  const isPopular = isPremium || isDeluxe;
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
        <span className="text-sm font-bold text-gray-700 truncate max-w-[70%]">
          {business?.name ?? '업소 상세'}
        </span>
        <div className="flex items-center gap-1">
          {/* 찜하기 버튼 */}
          <button
            onClick={handleToggleFavorite}
            disabled={favLoading}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label={favorited ? '찜 해제' : '찜하기'}
          >
            <Heart
              size={18}
              className={`transition-all ${favorited ? 'text-pink-500 fill-pink-500 scale-110' : 'text-gray-400'}`}
            />
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
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
              {/* 배지 행 — 가로 한 줄 (인기/프리미엄/공식파트너 + 카테고리) */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {isPopular && (
                  <span className="text-[10px] font-black text-white bg-orange-500 px-2 py-1 rounded-md leading-none">
                    🔥 인기
                  </span>
                )}
                {isPremium && (
                  <span className="flex items-center gap-0.5 text-[10px] font-black text-black bg-amber-400 px-2 py-1 rounded-md leading-none">
                    <Star size={8} fill="black" /> 프리미엄
                  </span>
                )}
                {isStandard && (
                  <span className="flex items-center gap-0.5 text-[10px] font-black text-white bg-blue-600 px-2 py-1 rounded-md leading-none">
                    <Check size={8} /> 공식파트너
                  </span>
                )}
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md leading-none">
                  {business.category}
                </span>
              </div>

              {/* 업소명 */}
              <h2 className="text-2xl font-black text-gray-900 leading-tight mb-3">
                {business.name}
                {business.manager_name && (
                  <span className="text-gray-500 font-medium text-base"> {maskName(business.manager_name)} {business.manager_role || '실장'}</span>
                )}
              </h2>

              {/* 영업진 리스트 (그룹 — 같은 사업자 다중 영업진) */}
              {groupMembers.length > 1 && (
                <div className="mb-3 pb-3 border-b border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    👥 영업진 {groupMembers.length}명 — 클릭하여 전환
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {groupMembers.map((m) => {
                      const memberPlan = getActivePlanFromList(m.subscriptions);
                      const isMemberPremium = memberPlan === 'premium' || memberPlan === 'elite';
                      const isMemberDeluxe = memberPlan === 'deluxe';
                      const isCurrent = m.id === businessId;
                      return (
                        <button
                          key={m.id}
                          onClick={() => !isCurrent && onSelectMember?.(m.id)}
                          disabled={isCurrent}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all
                            ${isCurrent
                              ? 'bg-amber-500 text-black cursor-default ring-2 ring-amber-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
                        >
                          {isMemberPremium && <span className="text-amber-600">★</span>}
                          {isMemberDeluxe && <span className="text-blue-600">◆</span>}
                          <span>{m.manager_name ? maskName(m.manager_name) : '담당자'}</span>
                          <span className="text-[10px] opacity-70">{m.manager_role || '실장'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

              {/* 전화 — 번호만 표시 (이름·직책은 위 헤더에 이미 노출) */}
              {(business.manager_phone ?? business.phone) && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="shrink-0 text-gray-400" />
                  <a href={`tel:${business.manager_phone ?? business.phone}`}
                    className="text-amber-600 font-bold hover:underline"
                    onClick={() => logContact('call')}>
                    {formatPhone(business.manager_phone ?? business.phone)}
                  </a>
                </div>
              )}
            </div>

            {/* ── 퀵 인포 2×3 그리드 ── */}
            <div className="bg-white px-4 py-4 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Building2, label: '룸', value: business.room_count ? `${business.room_count}개` : '-', color: business.room_count ? 'text-amber-500' : 'text-gray-300' },
                  { icon: Users, label: '집객원', value: '합법 업소', color: 'text-emerald-500' },
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
              <button onClick={openReport} className="w-full flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">잘못된 정보 제보</span>
                </div>
                <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
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
            {(business.address || (business.lat && business.lng)) && (
              <div className="bg-white px-4 py-4 mt-2 border-b border-gray-100">
                {/* 미니 카카오맵 — lat/lng 없으면 주소 geocoding */}
                <div className="mb-3">
                  <MiniMap
                    lat={business.lat}
                    lng={business.lng}
                    address={business.address}
                    name={business.name}
                  />
                </div>
                {/* 주소 + 복사 */}
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={13} className="text-gray-400 shrink-0" />
                  <p className="text-gray-600 text-xs flex-1">{business.address}{business.address_detail ? ` ${business.address_detail}` : ''}</p>
                  <button
                    onClick={() => navigator.clipboard?.writeText(business.address ?? '')}
                    className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-gray-700 shrink-0"
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

            {/* ── 리뷰 / 평점 섹션 ── */}
            <div className="bg-white mt-2 border-b border-gray-100">
              {/* 헤더 + 평균 */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="font-black text-gray-900 text-sm">리뷰</span>
                  {reviewCount > 0 && (
                    <span className="text-amber-500 font-black text-sm">{reviewAvg}</span>
                  )}
                  <span className="text-gray-400 text-xs">({reviewCount})</span>
                </div>
                {currentUserId ? (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
                  >
                    {myReviewId ? '내 리뷰 수정' : '리뷰 쓰기'}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">로그인 후 작성 가능</span>
                )}
              </div>

              {/* 리뷰 작성 폼 */}
              {showReviewForm && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  {/* 별점 선택 */}
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setMyRating(n)}
                        className="p-0.5"
                      >
                        <Star
                          size={28}
                          className={`transition-colors ${
                            n <= (hoverRating || myRating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200 fill-gray-200'
                          }`}
                        />
                      </button>
                    ))}
                    {myRating > 0 && (
                      <span className="text-sm font-black text-amber-500 ml-1">
                        {['', '별로예요', '그저 그래요', '괜찮아요', '좋아요', '최고예요'][myRating]}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={myContent}
                    onChange={e => setMyContent(e.target.value)}
                    placeholder="방문 후기를 남겨주세요. (선택)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 resize-none transition-colors"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowReviewForm(false)}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl">
                      취소
                    </button>
                    <button onClick={handleSubmitReview} disabled={reviewSubmitting || myRating === 0}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 text-black font-black text-sm rounded-xl transition-colors">
                      {reviewSubmitting ? '저장 중...' : '등록'}
                    </button>
                  </div>
                </div>
              )}

              {/* 리뷰 목록 */}
              {reviews.length === 0 ? (
                <div className="px-4 pb-5 text-center">
                  <p className="text-gray-400 text-xs">아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {reviews.map(r => {
                    const nick = r.bamgil_user_profiles?.nickname ?? '익명';
                    const isMe = r.user_id === currentUserId;
                    return (
                      <div key={r.id} className={`px-4 py-3 ${isMe ? 'bg-amber-50/50' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-black text-gray-600">
                              {nick[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-gray-700">
                              {nick}
                              {isMe && <span className="text-amber-500 ml-1">(나)</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={10}
                                className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                            ))}
                          </div>
                        </div>
                        {r.content && <p className="text-gray-600 text-xs leading-relaxed pl-8">{r.content}</p>}
                        <p className="text-gray-300 text-[10px] pl-8 mt-0.5">
                          {new Date(r.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-4" />
          </>
        )}
      </div>

      {/* ── 잘못된 정보 제보 모달 ── */}
      {reportOpen && business && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setReportOpen(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>

            {/* 헤더 */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400" />
                <span className="font-black text-gray-900">잘못된 정보 제보</span>
              </div>
              <button onClick={() => setReportOpen(false)} className="text-gray-400 hover:text-gray-700 p-1">
                <X size={18} />
              </button>
            </div>

            {reportDone ? (
              /* 완료 화면 */
              <div className="px-5 py-10 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-emerald-500" />
                </div>
                <p className="font-black text-gray-900 text-lg mb-2">제보가 접수되었습니다</p>
                <p className="text-gray-500 text-sm">빠르게 확인 후 처리하겠습니다.<br />소중한 제보 감사합니다.</p>
                <button
                  onClick={() => setReportOpen(false)}
                  className="mt-6 w-full py-3.5 bg-gray-900 text-white font-black rounded-2xl"
                >
                  닫기
                </button>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* 안내 */}
                <p className="text-xs text-gray-500 leading-relaxed">
                  광고 정보에 이상이 있다고 느끼셨나요?<br />
                  누구나 더 나은 정보를 볼 수 있도록 제보해 주세요.<br />
                  제보하신 내용은 외부에 공개되지 않으며, 신속히 확인 후 처리합니다.
                </p>

                {/* 제보 대상 업소 */}
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">제보 대상 업소</p>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-bold">
                    {business.name}
                  </div>
                </div>

                {/* 신고 사유 */}
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">신고 사유 <span className="text-red-400">*</span></p>
                  <div className="space-y-2">
                    {[
                      '주소 / 위치 오류',
                      '전화번호 오류',
                      '허위 / 과장 광고',
                      '비허가 / 불법 업소 의심',
                      '기타',
                    ].map(reason => (
                      <label key={reason} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          reportReason === reason
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-gray-300 group-hover:border-amber-300'
                        }`}>
                          {reportReason === reason && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <input type="radio" className="sr-only" name="report-reason" value={reason}
                          checked={reportReason === reason}
                          onChange={() => setReportReason(reason)} />
                        <span className="text-sm text-gray-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 제보 내용 */}
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">제보 내용 <span className="text-red-400">*</span></p>
                  <textarea
                    rows={4}
                    placeholder="어떤 점이 잘못되었는지 알려주세요."
                    value={reportContent}
                    onChange={e => setReportContent(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 resize-none transition-colors"
                  />
                </div>

                {/* 연락처 (선택) */}
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">연락처 <span className="text-gray-300">(선택)</span></p>
                  <input
                    type="tel"
                    placeholder="처리 결과 안내를 원하시면 연락처를 입력해주세요."
                    value={reportContact}
                    onChange={e => setReportContact(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* 버튼 */}
                <div className="grid grid-cols-2 gap-3 pt-2 pb-2">
                  <button
                    onClick={() => setReportOpen(false)}
                    className="py-3.5 bg-gray-100 text-gray-600 font-black rounded-2xl text-sm hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleReportSubmit}
                    disabled={reportSubmitting}
                    className="py-3.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {reportSubmitting
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 전송 중...</>
                      : '제보 내용 보내기'
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
