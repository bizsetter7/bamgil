'use client';

import { useState, useEffect } from 'react';
import { Bell, Pin, Moon, ChevronDown } from 'lucide-react';
import Link from 'next/link';

type Notice = {
  id: string;
  badge: string;
  title: string;
  content: string;
  is_pinned: boolean;
  published_at: string;
  platforms: string[];
};

const PLATFORM_LABELS: Record<string, string> = {
  yasajang: '야사장', bamgil: '밤길', cocoalba: '코코알바',
  waiterzone: '웨이터존', sunsuzone: '선수존',
};

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    fetch('/api/notices')
      .then(r => r.json())
      .then(json => { setNotices(json.notices || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#1e3a5f] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">공지사항</h1>
            <p className="text-blue-300/70 text-sm">밤길 서비스 공지 및 업데이트</p>
          </div>
          <Link href="/" className="ml-auto text-sm text-blue-300/50 hover:text-blue-300 transition-colors flex items-center gap-1">
            <Moon size={14} /> 홈으로
          </Link>
        </header>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !notices.length ? (
          <div className="text-center py-16 text-blue-300/50">등록된 공지사항이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {notices.map(n => {
              const isOpen = openIds.has(n.id);
              return (
                <div
                  key={n.id}
                  className={`rounded-2xl border overflow-hidden ${
                    n.is_pinned
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  {/* 헤더 — 항상 노출, 클릭으로 토글 */}
                  <button
                    onClick={() => toggle(n.id)}
                    className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {n.is_pinned && <Pin size={11} className="text-amber-400 shrink-0" />}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                        {n.badge || '공지'}
                      </span>
                      <h2 className="font-black text-white text-sm truncate">{n.title}</h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-blue-300/50">
                        {new Date(n.published_at).toLocaleDateString('ko-KR')}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-blue-300/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {/* 아코디언 본문 — grid-rows 트릭으로 부드러운 애니메이션 */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pt-1">
                        <p className="text-sm text-blue-100/70 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                        {n.platforms && n.platforms.length > 1 && (
                          <div className="flex gap-1 mt-3 flex-wrap">
                            {n.platforms.map((p: string) => (
                              <span key={p} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-blue-300/60">
                                {PLATFORM_LABELS[p] || p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
