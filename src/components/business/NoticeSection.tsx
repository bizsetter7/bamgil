'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Pin } from 'lucide-react';

interface BusinessNotice {
  id: string;
  title: string;
  content: string | null;
  is_pinned: boolean;
  created_at: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
}

export function NoticeSection({ businessId }: { businessId: string }) {
  const [notices, setNotices] = useState<BusinessNotice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/business-notices?businessId=${businessId}`)
      .then(r => r.json())
      .then(d => setNotices(d.notices ?? []))
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading || notices.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Megaphone size={14} className="text-amber-500" />
        <h3 className="text-xs font-black text-gray-700 uppercase tracking-wide">업소 공지</h3>
      </div>
      <div className="space-y-2">
        {notices.map(n => (
          <div
            key={n.id}
            className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-100 rounded-xl"
          >
            {n.is_pinned && <Pin size={12} className="text-amber-500 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-800 leading-snug">{n.title}</p>
              {n.content && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
              )}
              <p className="text-[11px] text-gray-400 mt-1">{fmtDate(n.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
