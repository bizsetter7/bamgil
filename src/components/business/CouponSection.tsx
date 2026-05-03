'use client';

import { useEffect, useState } from 'react';
import { Tag, Gift, CheckCircle, Lock } from 'lucide-react';

interface Coupon {
  id: string;
  title: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_visit_count: number;
  valid_until: string | null;
  alreadyUsed: boolean;
  isFull: boolean;
}

export function CouponSection({ businessId }: { businessId: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [using, setUsing] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/coupons?businessId=${businessId}`)
      .then(r => r.json())
      .then(d => setCoupons(d.coupons ?? []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  const handleUse = async (couponId: string) => {
    if (using) return;
    setUsing(couponId);
    try {
      const res = await fetch('/api/coupons/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '쿠폰 사용 중 오류가 발생했습니다.');
        return;
      }
      // 로컬 상태 업데이트
      setCoupons(prev => prev.map(c =>
        c.id === couponId ? { ...c, alreadyUsed: true, used_count: c.used_count + 1 } : c
      ));
      alert('쿠폰이 적용되었습니다! 방문 시 직원에게 보여주세요.');
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setUsing(null);
    }
  };

  if (loading) return null;
  if (coupons.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Tag size={16} className="text-amber-500" />
        <h3 className="text-sm font-black text-gray-800">업소 쿠폰 {coupons.length}종</h3>
      </div>
      <div className="space-y-2">
        {coupons.map(coupon => {
          const discountLabel = coupon.discount_type === 'percent'
            ? `${coupon.discount_value}% 할인`
            : `${coupon.discount_value.toLocaleString()}원 할인`;
          const isDisabled = coupon.alreadyUsed || coupon.isFull;

          return (
            <div
              key={coupon.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isDisabled ? 'border-gray-100 bg-gray-50' : 'border-amber-100 bg-amber-50'}`}
            >
              <div className={`mt-0.5 shrink-0 ${isDisabled ? 'text-gray-300' : 'text-amber-500'}`}>
                <Gift size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-black ${isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>{coupon.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isDisabled ? 'bg-gray-100 text-gray-400' : 'bg-amber-500 text-white'}`}>
                    {discountLabel}
                  </span>
                </div>
                {coupon.description && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{coupon.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {coupon.min_visit_count > 0 && (
                    <span className="text-[10px] text-gray-400">방문 {coupon.min_visit_count}회 이상</span>
                  )}
                  {coupon.valid_until && (
                    <span className="text-[10px] text-gray-400">
                      ~{new Date(coupon.valid_until).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}까지
                    </span>
                  )}
                  {coupon.max_uses && (
                    <span className="text-[10px] text-gray-400">{coupon.used_count}/{coupon.max_uses}명 사용</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => !isDisabled && handleUse(coupon.id)}
                disabled={isDisabled || using === coupon.id}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${isDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : using === coupon.id
                    ? 'bg-amber-300 text-white cursor-wait'
                    : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                }`}
              >
                {coupon.alreadyUsed ? (
                  <span className="flex items-center gap-1"><CheckCircle size={12} /> 사용완료</span>
                ) : coupon.isFull ? (
                  <span className="flex items-center gap-1"><Lock size={12} /> 마감</span>
                ) : using === coupon.id ? '처리중' : '쿠폰받기'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
