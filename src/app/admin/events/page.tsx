'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, ToggleLeft, ToggleRight, Search, ExternalLink, RefreshCw } from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  event: '이벤트',
  discount: '할인',
  new: '신규',
  notice: '공지',
};
const TYPE_COLOR: Record<string, string> = {
  event: 'bg-amber-500/15 text-amber-600',
  discount: 'bg-green-500/15 text-green-600',
  new: 'bg-blue-500/15 text-blue-600',
  notice: 'bg-zinc-200 text-zinc-600',
};

interface EventRow {
  id: string;
  business_id: string;
  business_name: string | null;
  type: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
}

export default function EventsAdminPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/events');
    const json = await res.json();
    setEvents(json.events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleActive = async (id: string, current: boolean) => {
    setToggling(id);
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    setToggling(null);
    fetchData();
  };

  const filtered = events.filter(e => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.business_name ?? '').includes(search);
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    return matchSearch && matchType;
  });

  const activeCount = events.filter(e => e.is_active).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="text-amber-500" size={22} />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">이벤트 현황</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              전체 {events.length}건 · 활성 {activeCount}건
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 rounded-xl">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 안내 */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
        <ExternalLink size={15} className="text-amber-500 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-black text-amber-400">이벤트 등록은 야사장 사장님 대시보드에서</p>
          <p className="text-zinc-500 text-xs mt-0.5">
            이벤트 생성·삭제는 yasajang.kr 사장님 대시보드 → 이벤트 관리에서 진행합니다.
            이 화면에서는 활성/비활성 토글만 가능합니다.
          </p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'event', 'discount', 'new', 'notice'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === t
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {t === 'all' ? '전체' : TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-zinc-600 transition-all"
          placeholder="업소명 또는 이벤트 제목 검색"
        />
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-zinc-600 text-sm">이벤트가 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ev => {
            const isExpired = ev.ends_at ? new Date(ev.ends_at) < new Date() : false;
            return (
              <div
                key={ev.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors ${
                  ev.is_active && !isExpired
                    ? 'border-zinc-800 bg-zinc-900/40'
                    : 'border-zinc-800/50 bg-zinc-950/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${TYPE_COLOR[ev.type] ?? TYPE_COLOR.notice}`}>
                      {TYPE_LABEL[ev.type] ?? ev.type}
                    </span>
                    <span className="text-sm font-bold text-white truncate">{ev.title}</span>
                    {isExpired && (
                      <span className="text-[10px] text-red-400 font-bold">만료</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {ev.business_name ?? '—'} · {fmtDate(ev.starts_at)}
                    {ev.ends_at ? ` ~ ${fmtDate(ev.ends_at)}` : ''}
                  </p>
                  {ev.description && (
                    <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-1">{ev.description}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleActive(ev.id, ev.is_active)}
                  disabled={toggling === ev.id}
                  className={`p-1.5 rounded-lg transition shrink-0 disabled:opacity-40 ${
                    ev.is_active ? 'text-amber-500 hover:bg-amber-500/10' : 'text-zinc-600 hover:bg-zinc-800'
                  }`}
                  title={ev.is_active ? '비활성화' : '활성화'}
                >
                  {ev.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
