'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';

export default function CouponsAdminPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [coupons, setCoupons] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    business_id: '',
    title: '',
    description: '',
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: '',
    max_uses: '',
    min_visit_count: '0',
    valid_until: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: cData }, { data: bData }] = await Promise.all([
      supabase
        .from('bamgil_coupons')
        .select('*, businesses(name, region_code)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('businesses').select('id, name').eq('is_active', true).order('name'),
    ]);
    setCoupons(cData ?? []);
    setBusinesses(bData ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.business_id || !form.title || !form.discount_value) {
      alert('업소, 제목, 할인값은 필수입니다.');
      return;
    }
    setSaving(true);
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { error } = await supabase.from('bamgil_coupons').insert({
      business_id: form.business_id,
      code,
      title: form.title,
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      min_visit_count: Number(form.min_visit_count) || 0,
      valid_until: form.valid_until || null,
      is_active: true,
    });
    setSaving(false);
    if (error) { alert(`오류: ${error.message}`); return; }
    setShowForm(false);
    setForm({ business_id: '', title: '', description: '', discount_type: 'percent', discount_value: '', max_uses: '', min_visit_count: '0', valid_until: '' });
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('bamgil_coupons').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('쿠폰을 삭제하시겠습니까?')) return;
    await supabase.from('bamgil_coupons').delete().eq('id', id);
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
          <h1 className="text-xl font-black text-gray-800">쿠폰 관리</h1>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{coupons.length}개</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-black rounded-xl hover:bg-amber-600 transition"
        >
          <Plus size={16} /> 쿠폰 발급
        </button>
      </div>

      {/* 발급 폼 */}
      {showForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-black text-amber-700">새 쿠폰 발급</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">업소 선택 *</label>
              <select value={form.business_id} onChange={e => setForm(f => ({ ...f, business_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                <option value="">선택하세요</option>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">쿠폰 제목 *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="예: 첫방문 10% 할인" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">할인 유형 *</label>
              <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percent' | 'fixed' }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                <option value="percent">% 할인</option>
                <option value="fixed">정액 할인 (원)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">할인 값 *</label>
              <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder={form.discount_type === 'percent' ? '10 (10%)' : '5000'} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">최대 사용 수 (비워두면 무제한)</label>
              <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="예: 100" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">최소 방문 횟수 조건</label>
              <input type="number" value={form.min_visit_count} onChange={e => setForm(f => ({ ...f, min_visit_count: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">만료일 (비워두면 무기한)</label>
              <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">설명</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="쿠폰 상세 안내" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">취소</button>
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 text-sm font-black text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-50">
              {saving ? '발급중...' : '발급'}
            </button>
          </div>
        </div>
      )}

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
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(c.id, c.is_active)}
                  className={`p-1.5 rounded-lg transition ${c.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
                  title={c.is_active ? '비활성화' : '활성화'}>
                  {c.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
