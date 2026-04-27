'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageSquare, UserCheck, Heart, Settings } from 'lucide-react';
import Link from 'next/link';

interface BottomCtaBarProps {
  business: {
    id: string;
    phone: string | null;
    manager_phone: string | null;
    kakao_url: string | null;
  };
  isOwner: boolean;
}

export default function BottomCtaBar({ business, isOwner }: BottomCtaBarProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`bookmark_${business.id}`);
    if (saved === 'true') {
      setIsBookmarked(true);
    }
  }, [business.id]);

  const handleBookmark = () => {
    const newValue = !isBookmarked;
    setIsBookmarked(newValue);
    if (newValue) {
      localStorage.setItem(`bookmark_${business.id}`, 'true');
    } else {
      localStorage.removeItem(`bookmark_${business.id}`);
    }
  };

  const handleApply = () => {
    const phone = business.manager_phone || business.phone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else if (business.kakao_url) {
      window.open(business.kakao_url, '_blank');
    } else {
      alert('연락처 정보가 없습니다.');
    }
  };

  const displayPhone = business.manager_phone || business.phone;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 pb-safe shadow-lg">
      <div className="flex gap-2 max-w-xl mx-auto">

        {/* 1. 통화 */}
        <a
          href={displayPhone ? `tel:${displayPhone}` : '#'}
          onClick={(e) => { if (!displayPhone) { e.preventDefault(); alert('전화번호가 없습니다.'); } }}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700 transition-colors"
        >
          <Phone size={18} /> 통화
        </a>

        {/* 2. 상담톡 */}
        {business.kakao_url && (
          <a
            href={business.kakao_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border border-yellow-200 text-sm font-bold transition-colors"
          >
            <MessageSquare size={18} /> 상담톡
          </a>
        )}

        {/* 3. 입소신청 */}
        <button
          onClick={handleApply}
          className="flex-[1.5] flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-sm font-bold text-white transition-colors shadow-md shadow-pink-200"
        >
          <UserCheck size={18} /> 입소신청
        </button>

        {/* 4. 찜하기 */}
        <button
          onClick={handleBookmark}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold transition-colors"
        >
          <Heart size={18} className={isBookmarked ? 'fill-pink-500 text-pink-500' : 'text-gray-400'} />
          <span className={isBookmarked ? 'text-pink-500' : 'text-gray-500'}>찜하기</span>
        </button>

        {/* 5. 관리자 */}
        {isOwner && (
          <Link
            href={`/dashboard/businesses/${business.id}`}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-sm font-bold transition-colors"
          >
            <Settings size={18} /> 관리자
          </Link>
        )}
        
      </div>
    </div>
  );
}
