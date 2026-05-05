'use client';

import { useState, useEffect } from 'react';
import { Bell, Pin, Moon } from 'lucide-react';
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
            {notices.map(n => (
              <div
                key={n.id}
                className={`rounded-2xl border p-5 ${
                  n.is_pinned
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {n.is_pinned && <Pin size={12} className="text-amber-400 shrink-0" />}
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    {n.badge || '공지'}
                  </span>
                  <span className="text-xs text-blue-300/50 ml-auto shrink-0">
                    {new Date(n.published_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <h2 className="font-black text-white mb-2">{n.title}</h2>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
