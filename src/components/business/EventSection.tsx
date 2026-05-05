'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

interface BusinessEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
}

const TYPE_STYLES: Record<string, string> = {
  '이벤트': 'bg-amber-100 text-amber-700',
  '할인': 'bg-green-100 text-green-700',
  '신규': 'bg-blue-100 text-blue-700',
  '공지': 'bg-zinc-100 text-zinc-700',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
}

export function EventSection({ businessId }: { businessId: string }) {
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events?businessId=${businessId}`)
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading || events.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Calendar size={14} className="text-amber-500" />
        <h3 className="text-xs font-black text-gray-700 uppercase tracking-wide">이벤트 · 공지</h3>
      </div>
      <div className="space-y-2">
        {events.map(ev => (
          <div
            key={ev.id}
            className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl"
          >
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 mt-0.5 ${
                TYPE_STYLES[ev.event_type] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {ev.event_type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-800 leading-snug">{ev.title}</p>
              {ev.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ev.description}</p>
              )}
              <p className="text-[11px] text-gray-400 mt-1">
                {fmtDate(ev.starts_at)}{ev.ends_at ? ` ~ ${fmtDate(ev.ends_at)}` : ' ~'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
