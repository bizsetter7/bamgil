'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Building2, MapPin, Phone, Search, CheckCircle2, XCircle, Edit3, Save, X } from 'lucide-react';
import { formatPhone } from '@/lib/formatPhone';

const REGION_LABELS: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천', busan: '부산',
  daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  chungnam: '충청남도', chungbuk: '충청북도', jeonnam: '전라남도',
  jeonbuk: '전라북도', gangwon: '강원', gyeongnam: '경상남도',
  gyeongbuk: '경상북도', jeju: '제주', other: '기타',
};

const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱', karaoke_bar: '노래주점', bar: '유흥주점',
  night_club: '나이트', hostbar: '호스트바', general: '일반', other: '기타',
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
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const fetchBusinesses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('businesses')
      .select('id, name, category, region_code, address, address_detail, phone, manager_name, manager_phone, status, created_at, lat, lng')
      .order('created_at', { ascending: false });
    setBusinesses(data || []);
    setFiltered(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBusinesses(); }, []);

  useEffect(() => {
    let list = businesses;
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.name?.toLowerCase().includes(q) || b.region_code?.includes(q));
    }
    setFiltered(list);
  }, [search, statusFilter, businesses]);

  const openEdit = (b: any) => {
    setEditTarget(b);
    setEditForm({
      address: b.address || '',
      address_detail: b.address_detail || '',
      phone: b.phone || '',
      manager_name: b.manager_name || '',
      manager_phone: b.manager_phone || '',
      lat: b.lat || '',
      lng: b.lng || '',
      status: b.status || 'pending',
    });
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    const res = await fetch('/api/admin/update-business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editTarget.id, ...editForm }),
    });
    setSaving(false);
    if (res.ok) {
      setEditTarget(null);
      fetchBusinesses();
    } else {
      alert('저장 실패');
    }
  };

  const handleStatusToggle = async (id: string, current: string) => {
    const next = current === 'active' ? 'inactive' : 'active';
    await fetch('/api/admin/update-business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    fetchBusinesses();
  };

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
          <h1 className="text-3xl font-black text-white tracking-tight">업소 관리</h1>
          <p className="text-zinc-500 text-sm mt-1">등록된 전체 업소를 조회하고 수정합니다.</p>
        </div>
        <div className="flex gap-3">
          {['all', 'active', 'pending', 'inactive'].map((s) => (
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

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="업소명 또는 지역 검색..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">검색 결과 없음</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
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
                  <span>{CATEGORY_LABELS[b.category] || b.category}</span>
                  {b.phone && <span className="flex items-center gap-1"><Phone size={10} />{formatPhone(b.phone)}</span>}
                  {b.lat && <span className="text-green-500">📍 좌표 있음</span>}
                  {!b.lat && <span className="text-amber-500">⚠ 좌표 없음</span>}
                </div>
                <div className="text-[11px] text-zinc-600 mt-0.5 truncate">
                  {b.address ? `${b.address} ${b.address_detail || ''}` : '주소 미입력'}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleStatusToggle(b.id, b.status)}
                  className={`p-2 rounded-xl transition-all ${
                    b.status === 'active'
                      ? 'text-green-500 hover:bg-green-500/10'
                      : 'text-zinc-600 hover:bg-zinc-800'
                  }`}
                  title={b.status === 'active' ? '비활성화' : '활성화'}
                >
                  {b.status === 'active' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="p-2 rounded-xl text-zinc-600 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                  title="수정"
                >
                  <Edit3 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <h2 className="text-lg font-black text-white">{editTarget.name} — 정보 수정</h2>
              <button onClick={() => setEditTarget(null)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {[
                { key: 'address', label: '주소' },
                { key: 'address_detail', label: '상세주소' },
                { key: 'phone', label: '업소 전화번호' },
                { key: 'manager_name', label: '담당자명' },
                { key: 'manager_phone', label: '담당자 전화번호' },
                { key: 'lat', label: '위도 (lat)' },
                { key: 'lng', label: '경도 (lng)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">{label}</label>
                  <input
                    value={editForm[key]}
                    onChange={(e) => setEditForm((f: any) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none transition-all"
                    placeholder={label}
                  />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">상태</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f: any) => ({ ...f, status: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                >
                  <option value="active">active</option>
                  <option value="pending">pending</option>
                  <option value="inactive">inactive</option>
                  <option value="rejected">rejected</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-900 flex gap-3">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-800 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={16} /> {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
