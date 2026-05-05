'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Building2, MapPin, Phone, Search, ExternalLink } from 'lucide-react';
import { formatPhone } from '@/lib/formatPhone';

const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천', busan: '부산',
  daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  chungnam: '충청남도', chungbuk: '충청북도', jeonnam: '전라남도',
  jeonbuk: '전라북도', gangwon: '강원', gyeongnam: '경상남도',
  gyeongbuk: '경상북도', jeju: '제주', other: '기타',
};

export default function BusinessesAdminPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    supabase
      .from('businesses')
      .select('id, name, category, region_code, address, phone, manager_name, status, created_at, lat, lng')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBusinesses(data || []);
        setFiltered(data || []);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let list = businesses;
    if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b => b.name?.toLowerCase().includes(q) || b.region_code?.includes(q));
    }
    setFiltered(list);
  }, [search, statusFilter, businesses]);

  const statusBadge: Record<string, string> = {
    active: 'bg-green-500/15 text-green-400',
    pending: 'bg-amber-500/15 text-amber-400',
    inactive: 'bg-zinc-700/50 text-zinc-500',
    rejected: 'bg-red-500/15 text-red-400',
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">업소 현황</h1>
          <p className="text-zinc-500 text-sm mt-1">
            등록된 전체 업소 조회 (읽기 전용 — 수정은{' '}
            <a href="https://www.yasajang.kr/admin" target="_blank" rel="noopener noreferrer"
              className="text-amber-400 hover:underline inline-flex items-center gap-0.5">
              야사장 어드민 <ExternalLink size={10} />
            </a>
            에서)
          </p>
        </div>
        <div className="flex gap-3">
          {['all', 'active', 'pending', 'inactive'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === s
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {s === 'all' ? '전체' : s === 'active' ? '활성' : s === 'pending' ? '대기' : '비활성'}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="업소명 또는 지역 검색..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500 outline-none transition-all"
        />
      </div>

      {/* 총 건수 */}
      {!loading && (
        <p className="text-xs text-zinc-600 font-bold">{filtered.length}개 업소</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">검색 결과 없음</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center gap-5 hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={22} className="text-zinc-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">{b.name}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusBadge[b.status] || ''}`}>
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1"><MapPin size={10} />{REGION_LABELS[b.region_code] || b.region_code}</span>
                  <span>{b.category}</span>
                  {b.phone && <span className="flex items-center gap-1"><Phone size={10} />{formatPhone(b.phone)}</span>}
                  {b.lat ? (
                    <span className="text-green-500">📍 좌표 있음</span>
                  ) : (
                    <span className="text-amber-500">⚠ 좌표 없음</span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-600 mt-0.5 truncate">
                  {b.address || '주소 미입력'}
                  {b.manager_name && ` · ${b.manager_name}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
