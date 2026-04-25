'use client';

import { useEffect } from 'react';

export default function ViewIncrementer({ businessId }: { businessId: string }) {
  useEffect(() => {
    const increment = async () => {
      try {
        await fetch('/api/businesses/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId }),
        });
      } catch (err) {
        console.error('Failed to increment views:', err);
      }
    };

    // 로컬 스토리지 등을 이용해 중복 카운트 방지 로직을 추가할 수 있지만,
    // 여기서는 간단하게 매 로드 시 증가 (새로고침 시에도 증가)
    increment();
  }, [businessId]);

  return null;
}
