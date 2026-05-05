'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Tag, ToggleLeft, ToggleRight, Search, ExternalLink } from 'lucide-react';

export default function CouponsAdminPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bamgil_coupons')
      .select('*, businesses(name, region_code)')
      .order('created_at', { ascending: false })
      .limit(200);
    setCoupons(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    setToggling(id);
    await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    setToggling(null);
    fetchData();
  };

  const filtered = coupons.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.businesses?.name?.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={20} className="text-amber-500" />
          <h1 className="text-xl font-black text-gray-800">쿠폰 현황</h1>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{coupons.length}개</span>
        </div>
      </div>

      {/* 안내 배너 */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <ExternalLink size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-black text-amber-700">쿠폰 생성은 야사장 사장님 대시보드에서</p>
          <p className="text-amber-600/80 text-xs mt-0.5">
            쿠폰 발급 및 삭제는 야사장(yasajang.kr) 사장님 대시보드 → 쿠폰 관리에서 직접 진행합니다.
            이 화면에서는 활성/비활성 토글만 가능합니다.
          </p>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm"
          placeholder="업소명 또는 쿠폰 제목 검색"
        />
      </div>

      {/* 쿠폰 목록 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">쿠폰이 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className={`flex items-start gap-3 p-4 rounded-2xl border ${c.is_active ? 'border-amber-100 bg-white' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-gray-800">{c.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${c.is_active ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {c.discount_type === 'percent' ? `${c.discount_value}% 할인` : `${c.discount_value.toLocaleString()}원 할인`}
                  </span>
                  {!c.is_active && <span className="text-[10px] text-gray-400 font-bold">비활성</span>}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{c.businesses?.name || '—'} · 코드: {c.code}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  사용: {c.used_count}{c.max_uses ? `/${c.max_uses}명` : '명'}
                  {c.valid_until && ` · ~${new Date(c.valid_until).toLocaleDateString('ko-KR')}`}
                </div>
              </div>
              <button
                onClick={() => toggleActive(c.id, c.is_active)}
                disabled={toggling === c.id}
                className={`p-1.5 rounded-lg transition shrink-0 disabled:opacity-40 ${c.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
                title={c.is_active ? '비활성화' : '활성화'}
              >
                {c.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
